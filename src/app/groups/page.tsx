'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faPlus, faCog, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import UserSearch from '@/components/ui/user-search'

interface Group {
  id: string
  name: string
  description: string | null
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

interface User {
  id: string
  name: string | null
  email: string
  handicap: number | null
}

export default function GroupsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true
  })
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      return response.json()
    },
    enabled: !!session
  })

  const createGroup = useMutation({
    mutationFn: async (data: typeof formData & { memberIds: string[] }) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      setShowCreateForm(false)
      setFormData({ name: '', description: '', isPrivate: true })
      setSelectedMembers([])
    }
  })

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to leave group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    const memberIds = selectedMembers.map(member => member.id)
    createGroup.mutate({ ...formData, memberIds })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const isUserCreator = (group: Group) => {
    return group.creatorId === session?.user?.id
  }

  const getUserRole = (group: Group) => {
    const membership = group.members.find(m => m.user.id === session?.user?.id)
    return membership?.role
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading groups...</div>
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
            <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md shadow-2xl border-0 rounded-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-green-800">My Groups</h2>
                <p className="text-green-600 mt-2 font-medium">
                  Create private groups to share rounds with your favorite golf buddies
                </p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                <span>Create Group</span>
              </Button>
            </div>

          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Group</CardTitle>
                <CardDescription>
                  Create a private group to share rounds with specific players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Weekend Warriors"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="groupDescription">Description</Label>
                    <Textarea
                      id="groupDescription"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your group..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Add Members</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Search by email to add members to your group. You can also add members later.
                    </p>
                    <UserSearch
                      selectedUsers={selectedMembers}
                      onUsersChange={setSelectedMembers}
                      placeholder="Search by name or email to add members..."
                    />
                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={formData.isPrivate}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isPrivate">Private group (invite only)</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false)
                          setFormData({ name: '', description: '', isPrivate: true })
                          setSelectedMembers([])
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createGroup.isPending}>
                        {createGroup.isPending ? 'Creating...' : 'Create Group'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

            {groups && groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>
                          {group.isPrivate ? 'Private Group' : 'Public Group'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
                        <span>{group._count.members} members</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {group.description && (
                        <p className="text-gray-600 text-sm">{group.description}</p>
                      )}
                      
                      <div className="text-sm">
                        <p className="text-gray-500">
                          Created by {group.creator.name || group.creator.email}
                        </p>
                        <p className="text-gray-500">
                          {group._count.groupMatches} shared rounds
                        </p>
                      </div>

                      {/* Member badges */}
                      {group.members && group.members.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-medium">Members:</p>
                          <div className="flex flex-wrap gap-1">
                            {group.members.slice(0, 6).map((member) => (
                              <span
                                key={member.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                                style={{ 
                                  backgroundColor: '#dcfce7', 
                                  color: '#166534', 
                                  border: '1px solid #bbf7d0' 
                                }}
                              >
                                <FontAwesomeIcon icon={faUser} className="h-2 w-2 mr-1" style={{ color: '#059669' }} />
                                {member.user.name || member.user.email.split('@')[0]}
                              </span>
                            ))}
                            {group.members.length > 6 && (
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                                style={{ 
                                  backgroundColor: '#dbeafe', 
                                  color: '#1e40af', 
                                  border: '1px solid #93c5fd' 
                                }}
                              >
                                +{group.members.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        {isUserCreator(group) ? (
                          <>
                            <Button asChild size="sm" className="flex-1">
                              <Link href={`/groups/${group.id}/manage`}>
                                <FontAwesomeIcon icon={faCog} className="h-4 w-4 mr-1" />
                                Manage
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/groups/${group.id}`}>
                                View
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => leaveGroup.mutate(group.id)}
                              disabled={leaveGroup.isPending}
                            >
                              Leave
                            </Button>
                          </>
                        )}
                      </div>

                      {getUserRole(group) && (
                        <div className="text-xs text-gray-500 pt-1">
                          Your role: {getUserRole(group)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-green-400 mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">
                    No groups yet
                  </h3>
                  <p className="text-green-600 mb-4">
                    Create your first group to start sharing private rounds with friends
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-2" />
                    Create Your First Group
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}