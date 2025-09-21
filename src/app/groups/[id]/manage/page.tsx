'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faUsers, faTrash, faUserTimes, faEnvelope, faCrown, faEdit, faUserPlus, faSearch } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

interface GroupMember {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
}

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
  members: GroupMember[]
  _count: {
    members: number
    groupMatches: number
  }
}

export default function ManageGroupPage() {
  const { data: session } = useSession()
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    description: ''
  })
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { data: group, isLoading } = useQuery<Group>({
    queryKey: ['group', id],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${id}`)
      if (!response.ok) throw new Error('Failed to fetch group')
      const data = await response.json()
      setEditData({
        name: data.name,
        description: data.description || ''
      })
      return data
    },
    enabled: !!session && !!id
  })

  const updateGroup = useMutation({
    mutationFn: async (data: typeof editData) => {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      setIsEditing(false)
    }
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/groups/${id}/members/${memberId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove member')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    }
  })

  const deleteGroup = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete group')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      router.push('/groups')
    }
  })

  const addMember = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add member')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      setShowAddMember(false)
      setSearchEmail('')
      setSearchResults([])
    }
  })

  const searchUsers = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const users = await response.json()
        // Filter out users already in the group
        const filteredUsers = users.filter((user: any) => 
          !group?.members.some(member => member.user.id === user.id) && user.id !== group?.creatorId
        )
        setSearchResults(filteredUsers)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateGroup.mutate(editData)
  }

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      deleteGroup.mutate()
    }
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Remove ${memberName} from the group?`)) {
      removeMember.mutate(memberId)
    }
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: `url('/images/golf_manage_back.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/60"></div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-lg">Loading group...</div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: `url('/images/golf_manage_back.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/60"></div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-lg">Group not found</div>
        </div>
      </div>
    )
  }

  // Check if user is the group creator
  if (group.creatorId !== session?.user?.id) {
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: `url('/images/golf_manage_back.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/60"></div>
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-lg">You don't have permission to manage this group</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('/images/golf_manage_back.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/60"></div>
      
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/groups">
                  <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
                  Back to Groups
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0">
                <Link href="/">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Manage Group</h2>
              <p className="text-gray-600 mt-2">
                Manage members and settings for "{group.name}"
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Group Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                    <span>Group Details</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Group Name</Label>
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={updateGroup.isPending}>
                        {updateGroup.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Group Name</Label>
                      <p className="text-lg font-medium">{group.name}</p>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <p className="text-gray-600">{group.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <Label>Privacy</Label>
                      <p className="text-gray-600">{group.isPrivate ? 'Private Group' : 'Public Group'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members Management */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                      <span>Members ({group.members.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Manage group members and their roles
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddMember(!showAddMember)}
                    size="sm"
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddMember && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-3 flex items-center space-x-2">
                      <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />
                      <span>Add New Member</span>
                    </h4>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Search by email address..."
                          value={searchEmail}
                          onChange={(e) => {
                            setSearchEmail(e.target.value)
                            searchUsers(e.target.value)
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowAddMember(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      {isSearching && (
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                          <span>Searching...</span>
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Search Results:</p>
                          {searchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-green-700">
                                    {(user.name || user.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{user.name || user.email}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addMember.mutate(user.id)}
                                disabled={addMember.isPending}
                              >
                                {addMember.isPending ? 'Adding...' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {searchEmail && !isSearching && searchResults.length === 0 && (
                        <p className="text-sm text-gray-500">No users found with that email address.</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-green-700">
                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user.name || member.user.email}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3" />
                            <span>{member.user.email}</span>
                            {member.user.id === group.creatorId && (
                              <>
                                <FontAwesomeIcon icon={faCrown} className="h-3 w-3 text-yellow-500" />
                                <span className="text-yellow-600">Creator</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {member.user.id !== group.creatorId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                          disabled={removeMember.isPending}
                        >
                          <FontAwesomeIcon icon={faUserTimes} className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
                <CardDescription>
                  Permanently delete this group and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleDeleteGroup}
                  disabled={deleteGroup.isPending}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-4 w-4 mr-2" />
                  {deleteGroup.isPending ? 'Deleting...' : 'Delete Group'}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone. All group rounds and member associations will be removed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}