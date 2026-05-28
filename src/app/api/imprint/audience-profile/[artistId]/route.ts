// /api/imprint/audience-profile/[artistId]
//
// Aggregates the artist's verified-fan listening data into an AudienceProfile
// that Odu's recommend layer consumes. Replaces the stub profiles in
// odu/src/lib/audience.ts once an artist passes ?audience=imprint:<artistId>.
//
// Returned shape matches Odu's AudienceProfile interface verbatim:
//   { top_regions: string[], top_categories: string[], resonance_tags: string[],
//     fan_count: number, source: "imprint" }
//
// Auth: x-imprint-api-key header against ApiKey table. Public endpoint that
// any partner (Odu, Crucibla, Oryx) can call with a valid key.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const HIGH_TIER = ["DIE_HARD", "SUPERFAN", "REGULAR"];

// Map ISO-2 / country names to Odu's region codes (3-letter ISO-3 or
// continent slugs). Add as needed.
const COUNTRY_TO_REGION: Record<string, string> = {
  "NG": "NGA", "Nigeria": "NGA",
  "GH": "GHA", "Ghana": "GHA",
  "ZA": "ZAF", "South Africa": "ZAF",
  "KE": "KEN", "Kenya": "KEN",
  "EG": "EGY", "Egypt": "EGY",
  "MA": "MAR", "Morocco": "MAR",
  "ET": "ETH", "Ethiopia": "ETH",
  "US": "USA", "United States": "USA",
  "GB": "GBR", "United Kingdom": "GBR", "UK": "GBR",
  "CA": "CAN", "Canada": "CAN",
  "FR": "FRA", "France": "FRA",
  "DE": "DEU", "Germany": "DEU",
  "JM": "JAM", "Jamaica": "JAM",
  "BR": "BRA", "Brazil": "BRA",
  "IN": "IND", "India": "IND",
  "JP": "JPN", "Japan": "JPN",
  "KR": "KOR", "Korea": "KOR",
};

function regionFor(country: string | null): string | null {
  if (!country) return null;
  return COUNTRY_TO_REGION[country] ?? country.toUpperCase().slice(0, 3);
}

async function authenticate(req: NextRequest): Promise<boolean> {
  const key = req.headers.get("x-imprint-api-key");
  if (!key) return false;
  const row = await prisma.apiKey.findUnique({ where: { key } });
  if (!row || row.revokedAt) return false;
  await prisma.apiKey.update({
    where: { id: row.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const ok = await authenticate(req);
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { artistId } = await params;

  // Resolve fans-of-this-artist either via ManagerArtistLink (artist is a
  // User in Imprint, manager scopes fan data) or via FanUserArtistLink
  // (fan-side declared link). Aggregate over both.
  //
  // For the country distribution we pull from the Fan model, which carries
  // the manager-uploaded country, joined to FanUserArtistLink so we only
  // count fans actually linked to this artist.

  const links = await prisma.fanUserArtistLink.findMany({
    where: { artistId, tier: { in: HIGH_TIER as never } },
    select: {
      fanRecordId: true,
      tier: true,
      stanScore: true,
    },
    take: 5000,
  });

  const fanRecordIds = links.map((l) => l.fanRecordId).filter((x): x is string => Boolean(x));
  const fans = fanRecordIds.length > 0
    ? await prisma.fan.findMany({
        where: { id: { in: fanRecordIds } },
        select: { country: true, city: true, tier: true, stanScore: true },
      })
    : [];

  const countryCounts = new Map<string, number>();
  for (const f of fans) {
    const r = regionFor(f.country);
    if (!r) continue;
    countryCounts.set(r, (countryCounts.get(r) ?? 0) + 1);
  }
  const topRegions = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([r]) => r);

  // Top categories · heuristic from regional distribution. With no
  // category-tagged listening events today, we infer:
  //   - if >30% of high-tier fans are outside the artist's home region,
  //     add "diaspora_return"
  //   - festival is the universal default
  //   - civic_holiday lights up where regional clustering is strong
  //     (top region has >40% share)
  const total = fans.length;
  const topShare = total > 0 && topRegions.length > 0
    ? (countryCounts.get(topRegions[0]) ?? 0) / total
    : 0;
  const homeRegion = topRegions[0];
  const offHomeShare = total > 0 && homeRegion
    ? 1 - topShare
    : 0;

  const topCategories: string[] = ["festival"];
  if (offHomeShare > 0.30) topCategories.push("diaspora_return");
  if (topShare > 0.40) topCategories.push("civic_holiday");
  if (topRegions.some((r) => ["USA", "GBR", "FRA", "DEU"].includes(r))) {
    topCategories.push("fashion_week");
  }

  return NextResponse.json({
    artist_id: artistId,
    top_regions: topRegions,
    top_categories: topCategories,
    resonance_tags: [], // populated when fan-side cultural tagging ships
    fan_count: total,
    fan_count_high_tier: links.length,
    source: "imprint",
    computed_at: new Date().toISOString(),
  });
}
