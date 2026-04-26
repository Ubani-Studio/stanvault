'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui'
import { Bell, Search } from 'lucide-react'
import { useProfileImage } from '@/hooks/use-profile-image'

export function Header() {
  const { data: session } = useSession()
  const { profileImage } = useProfileImage()

  return (
    <header className="h-16 bg-black border-b border-[#1a1a1a] flex items-center px-6">
      {/* Search */}
      <div className="relative w-96 flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search fans, insights..."
          className="w-full h-10 pl-10 pr-4 bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder:text-gray-500 focus:outline-none focus:border-[#333] transition-all duration-200"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notifications */}
        <button className="relative flex items-center justify-center w-10 h-10 text-gray-500 hover:text-white transition-colors hover:bg-[#111]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <Avatar
            src={profileImage}
            name={session?.user?.name || 'User'}
            size="md"
          />
          <span className="text-sm font-medium text-white">
            {session?.user?.artistName || session?.user?.name || 'Artist'}
          </span>
        </div>
      </div>
    </header>
  )
}
