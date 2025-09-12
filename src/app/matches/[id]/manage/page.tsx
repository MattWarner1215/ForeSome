'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faUsers, faCalendarDays, faLocationDot, faClock, faCheck, faTimes, faUser } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

interface RoundRequest {
  id: string
  status: string
  player: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
}

interface Round {
  id: string
  title: string
  description: string | null
  course: string
  address: string
  date: string
  time: string
  maxPlayers: number
  creatorId: string
  creator: {
    id: string
    name: string | null
    email: string
  }
  players: {
    player: {
      id: string
      name: string | null
      email: string
      handicap: number | null
    }
  }[]
  _count: {
    players: number
  }
  pendingRequests?: RoundRequest[]
}

export default function ManageRoundPage() {
  const { data: session } = useSession()
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: round, isLoading } = useQuery<Round>({
    queryKey: ['round', id],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${id}`)
      if (!response.ok) throw new Error('Failed to fetch round')
      return response.json()
    },
    enabled: !!session && !!id
  })

  const handleRequest = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' }) => {
      const response = await fetch(`/api/matches/${id}/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${action} request`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', id] })
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading round...</div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Round not found</div>
      </div>
    )
  }

  if (round.creatorId !== session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">You don't have permission to manage this round</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost">
                <Link href="/matches">
                  <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
                  Back to Rounds
                </Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Manage Round</h2>
            <p className="text-gray-600 mt-2">Handle join requests and view round details</p>
          </div>

          <div className="space-y-6">
            {/* Round Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{round.title}</CardTitle>
                <CardDescription className="text-lg">{round.course}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(round.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400" />
                    <span>{formatTime(round.time)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-gray-400" />
                    <span>{round._count.players + 1}/{round.maxPlayers} players</span>
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-1">
                    <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-gray-400" />
                    <span>{round.address}</span>
                  </div>
                </div>
                {round.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600">{round.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                  <span>Current Players ({round._count.players + 1})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Creator */}
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{round.creator.name || round.creator.email}</p>
                      <p className="text-sm text-green-600">Round Creator</p>
                    </div>
                  </div>
                  
                  {/* Other Players */}
                  {round.players.map((player) => (
                    <div key={player.player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-700">
                          {(player.player.name || player.player.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{player.player.name || player.player.email}</p>
                        {player.player.handicap && (
                          <p className="text-sm text-gray-500">Handicap: {player.player.handicap}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {round.pendingRequests && round.pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />
                    <span>Pending Requests ({round.pendingRequests.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Players requesting to join this round
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {round.pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-yellow-700">
                              {(request.player.name || request.player.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{request.player.name || request.player.email}</p>
                            {request.player.handicap && (
                              <p className="text-sm text-gray-500">Handicap: {request.player.handicap}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequest.mutate({ requestId: request.id, action: 'accept' })}
                            disabled={handleRequest.isPending || (round._count.players + 1) >= round.maxPlayers}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FontAwesomeIcon icon={faCheck} className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequest.mutate({ requestId: request.id, action: 'decline' })}
                            disabled={handleRequest.isPending}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <FontAwesomeIcon icon={faTimes} className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!round.pendingRequests || round.pendingRequests.length === 0) && (
              <Card>
                <CardContent className="text-center py-8">
                  <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No pending requests at this time</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}