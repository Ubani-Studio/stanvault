export interface ParsedEmailSubscriber {
  email: string
  firstName?: string
  lastName?: string
  displayName: string
  subscribedAt?: Date
  phoneNumber?: string
  smsConsent?: 'SUBSCRIBED' | 'PENDING' | 'UNSUBSCRIBED'
  smsOptInAt?: Date
  // Email engagement metrics
  emailsReceived?: number
  emailsOpened?: number
  emailsClicked?: number
  tags?: string[]
  // Additional fields
  location?: string
  country?: string
  city?: string
}

interface CSVParseResult {
  subscribers: ParsedEmailSubscriber[]
  errors: string[]
  skipped: number
}

// Common column name mappings for different email providers
const EMAIL_COLUMN_ALIASES = ['email', 'email_address', 'email address', 'subscriber_email', 'e-mail']
const FIRST_NAME_ALIASES = ['first_name', 'firstname', 'first name', 'fname', 'given_name']
const LAST_NAME_ALIASES = ['last_name', 'lastname', 'last name', 'lname', 'surname', 'family_name']
const NAME_ALIASES = ['name', 'full_name', 'fullname', 'subscriber_name']
const SUBSCRIBED_AT_ALIASES = ['subscribed_at', 'created_at', 'date_added', 'optin_time', 'confirm_time', 'created', 'joined']
const OPENS_ALIASES = ['opens', 'email_opens', 'total_opens', 'open_count', 'times_opened']
const CLICKS_ALIASES = ['clicks', 'email_clicks', 'total_clicks', 'click_count', 'times_clicked']
const LOCATION_ALIASES = ['location', 'address', 'city_state', 'region']
const COUNTRY_ALIASES = ['country', 'country_code']
const CITY_ALIASES = ['city']
const TAGS_ALIASES = ['tags', 'groups', 'segments', 'lists']
const PHONE_ALIASES = ['phone', 'phone_number', 'phone number', 'mobile', 'mobile_number', 'sms_phone']
const SMS_CONSENT_ALIASES = ['sms_opt_in', 'sms_consent', 'sms_subscribed', 'text_opt_in', 'text_consent', 'sms_marketing_consent']
const SMS_OPT_IN_AT_ALIASES = ['sms_opt_in_at', 'sms_subscribed_at', 'text_opt_in_at', 'sms_consent_at']

/**
 * Parse CSV content into email subscribers
 */
export function parseEmailCSV(csvContent: string): CSVParseResult {
  const result: CSVParseResult = {
    subscribers: [],
    errors: [],
    skipped: 0,
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())

  if (lines.length < 2) {
    result.errors.push('CSV must have a header row and at least one data row')
    return result
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

  // Find column indices
  const emailIndex = findColumnIndex(headers, EMAIL_COLUMN_ALIASES)
  if (emailIndex === -1) {
    result.errors.push('Could not find email column. Expected: ' + EMAIL_COLUMN_ALIASES.join(', '))
    return result
  }

  const firstNameIndex = findColumnIndex(headers, FIRST_NAME_ALIASES)
  const lastNameIndex = findColumnIndex(headers, LAST_NAME_ALIASES)
  const nameIndex = findColumnIndex(headers, NAME_ALIASES)
  const subscribedAtIndex = findColumnIndex(headers, SUBSCRIBED_AT_ALIASES)
  const opensIndex = findColumnIndex(headers, OPENS_ALIASES)
  const clicksIndex = findColumnIndex(headers, CLICKS_ALIASES)
  const locationIndex = findColumnIndex(headers, LOCATION_ALIASES)
  const countryIndex = findColumnIndex(headers, COUNTRY_ALIASES)
  const cityIndex = findColumnIndex(headers, CITY_ALIASES)
  const tagsIndex = findColumnIndex(headers, TAGS_ALIASES)
  const phoneIndex = findColumnIndex(headers, PHONE_ALIASES)
  const smsConsentIndex = findColumnIndex(headers, SMS_CONSENT_ALIASES)
  const smsOptInAtIndex = findColumnIndex(headers, SMS_OPT_IN_AT_ALIASES)

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      const email = values[emailIndex]?.trim()

      // Skip invalid emails
      if (!email || !isValidEmail(email)) {
        result.skipped++
        continue
      }

      // Build display name
      let displayName = ''
      const firstName = firstNameIndex >= 0 ? values[firstNameIndex]?.trim() : undefined
      const lastName = lastNameIndex >= 0 ? values[lastNameIndex]?.trim() : undefined
      const fullName = nameIndex >= 0 ? values[nameIndex]?.trim() : undefined

      if (fullName) {
        displayName = fullName
      } else if (firstName || lastName) {
        displayName = [firstName, lastName].filter(Boolean).join(' ')
      } else {
        // Use email prefix as display name
        displayName = email.split('@')[0]
      }

      // Parse subscribed date
      let subscribedAt: Date | undefined
      if (subscribedAtIndex >= 0 && values[subscribedAtIndex]) {
        const parsed = parseDate(values[subscribedAtIndex])
        if (parsed) subscribedAt = parsed
      }

      // Parse engagement metrics
      const emailsOpened = opensIndex >= 0 ? parseInt(values[opensIndex]) || 0 : undefined
      const emailsClicked = clicksIndex >= 0 ? parseInt(values[clicksIndex]) || 0 : undefined

      // Parse location
      const location = locationIndex >= 0 ? values[locationIndex]?.trim() : undefined
      const country = countryIndex >= 0 ? values[countryIndex]?.trim() : undefined
      const city = cityIndex >= 0 ? values[cityIndex]?.trim() : undefined
      const phoneNumber = phoneIndex >= 0 ? values[phoneIndex]?.trim() : undefined
      const smsConsent = parseSmsConsent(
        smsConsentIndex >= 0 ? values[smsConsentIndex] : undefined,
        phoneNumber
      )
      const smsOptInAt =
        smsOptInAtIndex >= 0 && values[smsOptInAtIndex]
          ? parseDate(values[smsOptInAtIndex])
          : undefined

      // Parse tags
      let tags: string[] | undefined
      if (tagsIndex >= 0 && values[tagsIndex]) {
        tags = values[tagsIndex].split(/[,;]/).map(t => t.trim()).filter(Boolean)
      }

      result.subscribers.push({
        email,
        firstName,
        lastName,
        displayName,
        subscribedAt,
        phoneNumber,
        smsConsent,
        smsOptInAt,
        emailsOpened,
        emailsClicked,
        location,
        country,
        city,
        tags,
      })
    } catch (error) {
      result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
    }
  }

  return result
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = headers.indexOf(alias)
    if (index >= 0) return index
  }
  return -1
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function parseDate(value: string): Date | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  // Try various date formats
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date
  }

  // Try MM/DD/YYYY format
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Try YYYY-MM-DD format
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  return undefined
}

function parseSmsConsent(
  value: string | undefined,
  phoneNumber: string | undefined
): 'SUBSCRIBED' | 'PENDING' | 'UNSUBSCRIBED' | undefined {
  const normalized = value?.trim().toLowerCase()

  if (!normalized) return phoneNumber ? 'PENDING' : undefined
  if (['true', 'yes', 'y', '1', 'subscribed', 'opted in', 'opted_in', 'consented'].includes(normalized)) {
    return 'SUBSCRIBED'
  }
  if (['false', 'no', 'n', '0', 'unsubscribed', 'opted out', 'opted_out', 'revoked'].includes(normalized)) {
    return 'UNSUBSCRIBED'
  }

  return phoneNumber ? 'PENDING' : undefined
}

/**
 * Detect the email provider from CSV content
 */
export function detectEmailProvider(csvContent: string): string {
  const firstLine = csvContent.split(/\r?\n/)[0]?.toLowerCase() || ''

  if (firstLine.includes('mailchimp')) return 'Mailchimp'
  if (firstLine.includes('convertkit') || firstLine.includes('creator_id')) return 'ConvertKit'
  if (firstLine.includes('klaviyo')) return 'Klaviyo'
  if (firstLine.includes('constant_contact')) return 'Constant Contact'
  if (firstLine.includes('activecampaign')) return 'ActiveCampaign'
  if (firstLine.includes('drip')) return 'Drip'
  if (firstLine.includes('hubspot')) return 'HubSpot'

  // Check for common Mailchimp columns
  if (firstLine.includes('email address') && firstLine.includes('optin_time')) {
    return 'Mailchimp'
  }

  return 'Unknown'
}
