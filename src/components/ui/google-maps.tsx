'use client'

import { useState, useEffect, useRef } from 'react'
import { Wrapper } from '@googlemaps/react-wrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faRoute, faMapMarkerAlt, faClock, faUsers } from '@fortawesome/free-solid-svg-icons'

interface Round {
  id: string
  title: string
  course: string
  address: string
  zipCode: string
  date: string
  time: string
  maxPlayers: number
  creator: {
    name: string | null
    email: string
  }
  _count: {
    players: number
  }
  courseLatitude?: number
  courseLongitude?: number
  distance?: number
}

interface GoogleMapsCardProps {
  rounds: Round[]
  className?: string
}

interface MapProps {
  rounds: Round[]
  userLocation: { lat: number; lng: number } | null
  onRoundSelect: (round: Round) => void
  selectedRound: Round | null
}

function Map({ rounds, userLocation, onRoundSelect, selectedRound }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || !window.google) return

    // Initialize map
    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 10,
      center: userLocation || { lat: 39.9612, lng: -82.9988 }, // Default to Columbus, OH
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    setMap(newMap)

    return () => {
      // Cleanup markers
      markers.forEach(marker => marker.setMap(null))
    }
  }, [mapRef.current, window.google])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
          scaledSize: new google.maps.Size(24, 24)
        }
      })
      newMarkers.push(userMarker)
    }

    // Add round markers
    rounds.forEach(round => {
      if (round.courseLatitude && round.courseLongitude) {
        const marker = new google.maps.Marker({
          position: { lat: round.courseLatitude, lng: round.courseLongitude },
          map,
          title: `${round.course} - ${round.title}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
            scaledSize: new google.maps.Size(24, 24)
          }
        })

        // Add click listener
        marker.addListener('click', () => onRoundSelect(round))
        newMarkers.push(marker)
      }
    })

    setMarkers(newMarkers)

    // Adjust map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position)
      })
      map.fitBounds(bounds)
    }
  }, [map, rounds, userLocation])

  return <div ref={mapRef} className="w-full h-full" />
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function GoogleMapsCard({ rounds, className = '' }: GoogleMapsCardProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Calculate distances and sort rounds
  const roundsWithDistances = rounds.map(round => {
    if (userLocation && round.courseLatitude && round.courseLongitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        round.courseLatitude,
        round.courseLongitude
      )
      return { ...round, distance }
    }
    return round
  }).sort((a, b) => {
    if (a.distance && b.distance) return a.distance - b.distance
    if (a.distance) return -1
    if (b.distance) return 1
    return 0
  })

  const getUserLocation = () => {
    setIsLoadingLocation(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        let message = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Note: Location access requires HTTPS (not available on HTTP deployments). Map will show all rounds without distance sorting.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable'
            break
          case error.TIMEOUT:
            message = 'Location request timed out'
            break
        }
        setLocationError(message)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const handleRoundSelect = (round: Round) => {
    setSelectedRound(round)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <Card className={`overflow-hidden bg-white shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-green-500 p-2.5 rounded-xl shadow-sm">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
                Round Locations
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Discover nearby rounds with interactive maps
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isLoadingLocation && (
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent mr-2"></div>
                <span className="font-medium">Locating...</span>
              </div>
            )}
            {!userLocation && !isLoadingLocation && (
              <Button
                onClick={getUserLocation}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2"
              >
                <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 mr-2" />
                Get Location
              </Button>
            )}
          </div>
        </div>

        {locationError && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3 text-orange-600" />
              </div>
              <p className="text-orange-800 text-sm font-medium">{locationError}</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Map Container */}
        <div className="px-6 py-4">
          <div className="h-80 w-full bg-gray-50 rounded-lg overflow-hidden">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <Map
                  rounds={roundsWithDistances}
                  userLocation={userLocation}
                  onRoundSelect={handleRoundSelect}
                  selectedRound={selectedRound}
                />
              </Wrapper>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 inline-block">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Map Unavailable</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Google Maps API key required to display locations</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Round Details */}
        {roundsWithDistances.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <FontAwesomeIcon icon={faRoute} className="h-3 w-3 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Nearby Rounds</h3>
              </div>
              {userLocation && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Sorted by distance
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {roundsWithDistances.slice(0, 5).map((round) => (
                <div
                  key={round.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedRound?.id === round.id
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                  onClick={() => handleRoundSelect(round)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate mb-1">
                        {round.title}
                      </h4>
                      <p className="text-sm text-gray-600 truncate mb-2">{round.course}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
                          {formatDate(round.date)}
                        </span>
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
                          {formatTime(round.time)}
                        </span>
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-1" />
                          {round._count.players + 1}/{round.maxPlayers}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {round.distance && (
                        <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          {round.distance.toFixed(1)} mi
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        by {round.creator.name || round.creator.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {roundsWithDistances.length > 5 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                <p className="text-sm text-blue-700 font-medium">
                  + {roundsWithDistances.length - 5} more rounds available on map
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}