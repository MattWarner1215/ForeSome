'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faCheck, faTimes, faUserPlus, faClock } from '@fortawesome/free-solid-svg-icons'

interface GroupInvitation {
  id: string
  groupId: string
  inviterId: string
  inviteeId: string
  status: string
  createdAt: string
  group: {
    id: string
    name: string
    description: string | null
    icon: string | null
    isPrivate: boolean
    creator: {
      id: string
      name: string | null
      email: string
    }
    _count: {
      members: number
    }
  }
  inviter: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export function GroupInvitations() {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Fetch pending invitations
  const { data: invitations, isLoading } = useQuery<GroupInvitation[]>({
    queryKey: ['group-invitations'],
    queryFn: async () => {
      const response = await fetch('/api/groups/invitations')
      if (!response.ok) throw new Error('Failed to fetch invitations')
      return response.json()
    }
  })

  // Mutation for accepting/declining invitations
  const respondMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'decline' }) => {
      const response = await fetch(`/api/groups/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (!response.ok) throw new Error('Failed to respond to invitation')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setProcessingId(null)
    },
    onError: (error) => {
      console.error('Error responding to invitation:', error)
      setProcessingId(null)
    }
  })

  const handleAccept = (id: string) => {
    setProcessingId(id)
    respondMutation.mutate({ id, action: 'accept' })
  }

  const handleDecline = (id: string) => {
    setProcessingId(id)
    respondMutation.mutate({ id, action: 'decline' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 text-green-600" />
            Group Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading invitations...</div>
        </CardContent>
      </Card>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 text-green-600" />
            Group Invitations
          </CardTitle>
          <CardDescription>You have no pending group invitations</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 text-green-600" />
          Group Invitations
          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            {invitations.length}
          </span>
        </CardTitle>
        <CardDescription>Pending invitations to join groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* Group Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 shadow-md flex items-center justify-center bg-green-50">
                      {invitation.group.icon ? (
                        <img
                          src={invitation.group.icon}
                          alt={invitation.group.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                  </div>

                  {/* Invitation Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {invitation.group.name}
                    </h3>
                    {invitation.group.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {invitation.group.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUserPlus} className="h-3 w-3" />
                        Invited by {invitation.inviter.name || invitation.inviter.email.split('@')[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                        {invitation.group._count.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                        {formatDate(invitation.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    {processingId === invitation.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                        <span>Accept</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-3 w-3 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
