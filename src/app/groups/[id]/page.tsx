'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faUser, faCrown, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { LOGO_IMAGES } from '@/lib/images'

interface Group {
  id: string
  name: string
  description: string | null
  icon: string | null
  isPrivate: boolean
  creatorId: string
  creator: {
    id: string
    name: string | null
    email: string
  }
  members: {
    id: string
    role: string
    user: {
      id: string
      name: string | null
      email: string
      handicap: number | null
    }
  }[]
  _count: {
    members: number
    groupMatches: number
  }
}

export default function GroupDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const groupId = params?.id as string

  const { data: group, isLoading, error } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch group')
      }
      return response.json()
    },
    enabled: !!session && !!groupId
  })

  const isCreator = group?.creatorId === session?.user?.id
  const userMembership = group?.members.find(m => m.user.id === session?.user?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading group details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Group Not Found</h1>
          <p className="text-gray-600 mb-6">The group you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Group Not Found</h1>
          <Button asChild>
            <Link href="/groups">Back to Groups</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: "url('/images/golf_Back_groups.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-white bg-opacity-40"></div>
      </div>
      
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 h-20 relative">
        <div className="container mx-auto px-4 h-full flex items-center justify-between overflow-visible">
          <div className="flex items-center">
            <img 
              src="/images/foresum_logo.png" 
              alt="ForeSum Logo" 
              className="h-[150px] w-[150px] object-contain"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/groups">Back to Groups</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Group Header */}
          <div className="bg-white/90 backdrop-blur-md shadow-2xl border-0 rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">{group.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
                    <span>{group._count.members} members</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <img src={LOGO_IMAGES.myrounds_icon} alt="Rounds" className="h-4 w-4" />
                    <span>{group._count.groupMatches} shared rounds</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.isPrivate 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {group.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
              {isCreator && (
                <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                  <Link href={`/groups/${group.id}/manage`}>
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-2" />
                    Manage Group
                  </Link>
                </Button>
              )}
            </div>

            {group.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-green-800 mb-2">Description</h3>
                <p className="text-gray-700">{group.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-medium text-green-800 mb-2">Created by</h3>
              <div className="flex items-center space-x-2 text-gray-700">
                <FontAwesomeIcon icon={faCrown} className="h-4 w-4 text-yellow-500" />
                <span>{group.creator.name || group.creator.email}</span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white/90 backdrop-blur-md shadow-2xl border-0 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-800">Group Members</h2>
              <span className="text-gray-600">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
            </div>

            {group.members.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No members in this group yet</p>
                {isCreator && (
                  <p className="text-gray-500 text-sm mt-2">
                    Use the "Manage Group" button to invite members
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.members.map((member) => (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                          {member.user.name || member.user.email ? (
                            <span className="text-lg">
                              {(member.user.name || member.user.email)?.charAt(0)?.toUpperCase()}
                            </span>
                          ) : (
                            <FontAwesomeIcon icon={faUser} className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-green-900 truncate">
                              {member.user.name || 'No name'}
                            </p>
                            {member.role === 'admin' && (
                              <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3" />
                            <span className="truncate">{member.user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                            <img src={LOGO_IMAGES.myrounds_icon} alt="Handicap" className="h-3 w-3" />
                            <span>
                              Handicap: {member.user.handicap !== null ? member.user.handicap : 'Not set'}
                            </span>
                          </div>
                          {member.role && (
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                member.role === 'admin' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {userMembership && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  <span className="font-medium">Your role in this group: </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userMembership.role === 'admin' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {userMembership.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}