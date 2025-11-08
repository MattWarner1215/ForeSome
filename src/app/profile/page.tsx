'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar, faUser, faLocationDot, faPhone, faEnvelope, faEdit, faArrowLeft, faChartLine } from '@fortawesome/free-solid-svg-icons'
import AvatarUpload from '@/components/ui/avatar-upload'
import UserStats from '@/components/ui/user-stats'
import { LOGO_IMAGES } from '@/lib/images'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  handicap: number | null
  zipCode: string | null
  bio: string | null
  phoneNumber: string | null
  averageRating: number
  totalRatings: number
  createdAt: string
}

interface Rating {
  id: string
  value: number
  comment: string | null
  ratedBy: {
    name: string | null
    email: string
  }
  createdAt: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: '',
    handicap: '',
    zipCode: '',
    bio: '',
    phoneNumber: ''
  })

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
    enabled: !!session
  })

  const { data: ratings } = useQuery<Rating[]>({
    queryKey: ['profile-ratings'],
    queryFn: async () => {
      const response = await fetch('/api/profile/ratings')
      if (!response.ok) throw new Error('Failed to fetch ratings')
      return response.json()
    },
    enabled: !!session
  })

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setIsEditing(false)
    }
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        handicap: profile.handicap?.toString() || '',
        zipCode: profile.zipCode || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || ''
      })
    }
  }, [profile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-green-700">Loading your profile...</div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 mb-4">Profile not found</div>
          <Button onClick={() => window.history.back()} className="bg-green-600 hover:bg-green-700">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FontAwesomeIcon
        key={i}
        icon={faStar}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: "url('/images/golf_back_profile.jpeg')" }}
        ></div>
        <div className="absolute inset-0 bg-white bg-opacity-40"></div>
      </div>
      
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 h-20 relative">
        <div className="container mx-auto px-4 h-full flex items-center justify-between overflow-visible">
          <div className="flex items-center">
            <img
              src={LOGO_IMAGES.foresum_logo}
              alt="ForeSum Golf Logo"
              className="h-[300px] w-[300px] object-contain"
            />
          </div>
          <Button 
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <AvatarUpload 
            currentAvatar={profile.image} 
            size="xl" 
            className="mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile.name || 'Golf Player'}</h2>
          <p className="text-gray-600">
            Member since {(() => {
              if (!profile.createdAt) return 'Unknown';
              const date = new Date(profile.createdAt);
              if (isNaN(date.getTime())) return 'Unknown';
              return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            })()}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-green-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'stats' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
              <span>Statistics & Achievements</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">Profile Information</CardTitle>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className={isEditing ? "border-green-300 text-green-700 hover:bg-green-50" : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"}
                >
                  <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-2 text-green-600" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handicap" className="text-sm font-semibold text-gray-700">Handicap</Label>
                    <Input
                      id="handicap"
                      name="handicap"
                      type="number"
                      step="0.1"
                      value={formData.handicap}
                      onChange={handleInputChange}
                      placeholder="e.g., 18.5"
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700 flex items-center">
                      <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 mr-2 text-green-600" />
                      Zip Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="e.g., 90210"
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="h-4 w-4 mr-2 text-green-600" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., (555) 123-4567"
                      className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell other golfers about yourself..."
                      rows={3}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    />
                  </div>
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      disabled={updateProfile.isPending}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      {updateProfile.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Changes...</span>
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200">
                    <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      <p className="font-semibold text-gray-800">{profile.name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="font-semibold text-gray-800">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">H</span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Handicap</Label>
                      <p className="font-semibold text-gray-800">{profile.handicap || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-gray-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Zip Code</Label>
                      <p className="font-semibold text-gray-800">{profile.zipCode || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-gray-600" />
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                      <p className="font-semibold text-gray-800">{profile.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <Label className="text-sm font-medium text-gray-600">Bio</Label>
                    <p className="mt-2 text-gray-800 leading-relaxed">{profile.bio || 'No bio provided'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-b border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faStar} className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800">Player Rating</CardTitle>
                  <CardDescription className="text-gray-600">
                    Based on {profile.totalRatings} rating{profile.totalRatings !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {profile.totalRatings > 0 ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-lg border border-yellow-200">
                    <div className="flex justify-center items-center space-x-3 mb-2">
                      <div className="flex">
                        {renderStars(Math.round(profile.averageRating))}
                      </div>
                      <span className="text-2xl font-bold text-gray-800">
                        {profile.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-green-600" />
                      </div>
                      Recent Reviews
                    </h4>
                    {ratings?.slice(0, 3).map((rating) => (
                      <div key={rating.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">
                            {renderStars(rating.value)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            by {rating.ratedBy.name || rating.ratedBy.email.split('@')[0]}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-700 mb-2 italic">"{rating.comment}"</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(rating.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faStar} className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No ratings yet</p>
                  <p className="text-sm text-gray-500">Play some rounds to get rated by other golfers!</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <UserStats compact={false} showAchievements={true} />
        )}
      </div>
    </div>
  )
}