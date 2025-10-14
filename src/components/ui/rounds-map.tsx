'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Wrapper } from '@googlemaps/react-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faClock, faRoute } from '@fortawesome/free-solid-svg-icons'

interface Round {
  id: string
  title: string
  course: string
  address: string
  zipCode: string
  date: string
  time: string
  maxPlayers: number
  _count: {
    players: number
  }
}

interface RoundsMapProps {
  rounds: Round[]
  apiKey: string
}

interface UserLocation {
  lat: number
  lng: number
}

// Map component that renders the actual Google Map
function MapComponent({
  rounds,
  userLocation,
  onDistanceCalculated
}: {
  rounds: Round[]
  userLocation: UserLocation | null
  onDistanceCalculated: (roundId: string, distance: number) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const directionsService = useRef<google.maps.DirectionsService | null>(null)
  const markers = useRef<google.maps.Marker[]>([])

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.log('Google Maps not loaded yet')
      return
    }

    try {
      // Initialize geocoder and directions service
      geocoder.current = new google.maps.Geocoder()
      directionsService.current = new google.maps.DirectionsService()

    // Default center (Ohio)
    const defaultCenter = { lat: 39.9612, lng: -82.9988 }
    const center = userLocation || defaultCenter

    // Create map
    map.current = new google.maps.Map(mapRef.current, {
      zoom: userLocation ? 12 : 8,
      center,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    // Add user location marker if available
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map: map.current,
        title: "Your Location",
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      })
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null))
    markers.current = []

    // Add markers for each round
    rounds.forEach((round, index) => {
      if (!geocoder.current || !window.google || !window.google.maps) return

      geocoder.current.geocode({ address: round.address }, (results, status) => {
        if (status === 'OK' && results && results[0] && map.current) {
          const position = results[0].geometry.location

          // Create marker
          const marker = new google.maps.Marker({
            position,
            map: map.current,
            title: `${round.course} - ${round.title}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#10B981"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                  <text x="16" y="20" text-anchor="middle" fill="#10B981" font-size="8" font-weight="bold">${index + 1}</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40)
            }
          })

          markers.current.push(marker)

          // Calculate distance if user location is available
          if (userLocation && directionsService.current && window.google && window.google.maps) {
            directionsService.current.route({
              origin: userLocation,
              destination: position,
              travelMode: google.maps.TravelMode.DRIVING,
            }, (result, status) => {
              if (status === 'OK' && result) {
                const distance = result.routes[0].legs[0].distance
                if (distance) {
                  // Convert to miles if in meters
                  const distanceInMiles = distance.value * 0.000621371
                  onDistanceCalculated(round.id, distanceInMiles)
                }
              }
            })
          }

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${round.course}</h3>
                <p style="margin: 0 0 4px 0; color: #4b5563;">${round.title}</p>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">${round.address}</p>
                <div style="display: flex; gap: 16px; font-size: 12px; color: #6b7280;">
                  <span>👥 ${round._count.players + 1}/${round.maxPlayers}</span>
                  <span>📅 ${new Date(round.date).toLocaleDateString()}</span>
                  <span>🕐 ${new Date(`2000-01-01T${round.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
            `
          })

          marker.addListener('click', () => {
            infoWindow.open(map.current, marker)
          })
        }
      })
    })
    } catch (error) {
      console.error('Error initializing Google Maps:', error)
    }
  }, [rounds, userLocation, onDistanceCalculated])

  useEffect(() => {
    // Add a small delay to ensure Google Maps API is fully loaded
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [initializeMap])

  // Retry initialization if Google Maps loads later
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps)
          initializeMap()
        }
      }, 500)

      // Clear interval after 10 seconds to avoid infinite checking
      const timeout = setTimeout(() => {
        clearInterval(checkGoogleMaps)
      }, 10000)

      return () => {
        clearInterval(checkGoogleMaps)
        clearTimeout(timeout)
      }
    }
  }, [initializeMap])

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />
}

export function RoundsMap({ rounds, apiKey }: RoundsMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [distances, setDistances] = useState<Record<string, number>>({})
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleDistanceCalculated = useCallback((roundId: string, distance: number) => {
    setDistances(prev => ({ ...prev, [roundId]: distance }))
  }, [])

  const getUserLocation = useCallback(() => {
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setLocationError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    )
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const formatDistance = (distance: number) => {
    return distance < 1
      ? `${(distance * 5280).toFixed(0)} ft`
      : `${distance.toFixed(1)} mi`
  }

  // Sort rounds by distance if available
  const sortedRounds = [...rounds].sort((a, b) => {
    const distanceA = distances[a.id] || Infinity
    const distanceB = distances[b.id] || Infinity
    return distanceA - distanceB
  })

  if (!apiKey || apiKey.trim() === '') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-green-600" />
            <span>Round Locations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <FontAwesomeIcon icon={faLocationDot} className="h-12 w-12 text-gray-300 mb-2" />
            </div>
            <p className="font-medium mb-2">Map Unavailable</p>
            <p className="text-sm mb-4">Google Maps API key not configured or invalid</p>

            {/* Show rounds list even without map */}
            {rounds.length > 0 && (
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Available Rounds</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rounds.map((round, index) => (
                    <div
                      key={round.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{round.course}</p>
                          <p className="text-xs text-gray-600">{round.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                          <span>{round._count.players + 1}/{round.maxPlayers}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                          <span>{formatDate(round.date)} {formatTime(round.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-green-600" />
            <span>Round Locations</span>
          </CardTitle>
          <Button
            size="sm"
            onClick={getUserLocation}
            className={`${userLocation ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${userLocation ? 'animate-pulse' : ''}`}
          >
            <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 mr-2" />
            {userLocation ? 'Location Found' : 'Find My Location'}
          </Button>
        </div>
        {locationError && (
          <p className="text-sm text-red-600 mt-2">{locationError}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="w-full h-[400px] rounded-lg overflow-hidden border">
          <Wrapper
            apiKey={apiKey}
            render={(status) => {
              switch (status) {
                case 'LOADING':
                  return (
                    <div className="w-full h-[400px] rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="font-medium mb-1">Loading Map</p>
                        <p className="text-sm">Please wait...</p>
                      </div>
                    </div>
                  )
                case 'FAILURE':
                  return (
                    <div className="w-full h-[400px] rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <FontAwesomeIcon icon={faLocationDot} className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="font-medium mb-1">Google Maps Error</p>
                        <p className="text-sm">Invalid API key or service unavailable</p>
                      </div>
                    </div>
                  )
                case 'SUCCESS':
                  return (
                    <MapComponent
                      rounds={rounds}
                      userLocation={userLocation}
                      onDistanceCalculated={handleDistanceCalculated}
                    />
                  )
                default:
                  return (
                    <div className="w-full h-[400px] rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <p className="font-medium">Initializing...</p>
                      </div>
                    </div>
                  )
              }
            }}
          />
        </div>

        {/* Round List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <FontAwesomeIcon icon={faRoute} className="h-4 w-4 text-blue-600" />
              <span>Nearby Rounds</span>
            </h3>
            {!userLocation && (
              <p className="text-xs text-orange-600 font-medium">
                Click "Find My Location" for distances
              </p>
            )}
          </div>

          {rounds.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No rounds available</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedRounds.map((round, index) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{round.course}</p>
                      <p className="text-xs text-gray-600">{round.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
                          <span>{round._count.players + 1}/{round.maxPlayers}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                          <span>{formatDate(round.date)} {formatTime(round.time)}</span>
                        </div>
                      </div>
                      {distances[round.id] ? (
                        <div className="bg-blue-100 px-2 py-1 rounded-full">
                          <div className="flex items-center space-x-1 text-blue-700 font-bold text-xs">
                            <FontAwesomeIcon icon={faRoute} className="h-3 w-3" />
                            <span>{formatDistance(distances[round.id])}</span>
                          </div>
                        </div>
                      ) : userLocation ? (
                        <div className="bg-gray-100 px-2 py-1 rounded-full">
                          <span className="text-gray-500 text-xs">Calculating...</span>
                        </div>
                      ) : (
                        <div className="bg-yellow-100 px-2 py-1 rounded-full">
                          <span className="text-yellow-700 text-xs font-medium">Enable location</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}