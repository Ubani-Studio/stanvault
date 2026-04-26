import { useQuery, useQueryClient } from '@tanstack/react-query'

const PROFILE_IMAGE_KEY = ['profile', 'image']

export function useProfileImage() {
  const queryClient = useQueryClient()

  const { data: profileImage = null } = useQuery<string | null>({
    queryKey: PROFILE_IMAGE_KEY,
    queryFn: async () => {
      const res = await fetch('/api/settings/profile/image', { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      return data.image ?? null
    },
    staleTime: Infinity, // Only refetch on explicit invalidation
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: PROFILE_IMAGE_KEY })
  }

  const setOptimistic = (image: string) => {
    queryClient.setQueryData(PROFILE_IMAGE_KEY, image)
  }

  return { profileImage, invalidate, setOptimistic }
}
