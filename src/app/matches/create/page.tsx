'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLocationDot, faClock, faUsers, faGlobe, faLock, faBullseye } from '@fortawesome/free-solid-svg-icons'
import { CourseSearch } from '@/components/ui/course-search'
import { GolfCourse } from '@/data/golf-courses'
import { LOGO_IMAGES } from '@/lib/images'

export default function CreateRoundPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    address: '',
    zipCode: '',
    date: '',
    time: '',
    maxPlayers: '4',
    isPublic: 'true'
  })
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Ensure form is visible on page load
  useEffect(() => {
    // Scroll to top on component mount to show form properly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Fetch user's groups
  const { data: userGroups } = useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      return response.json()
    },
    enabled: !!session
  })

  const createRound = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        selectedGroups: formData.isPublic === 'false' ? selectedGroups : []
      }
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create round')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
      router.push('/matches')
    },
    onError: (error: Error) => {
      setErrors({ general: error.message })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.course.trim()) newErrors.course = 'Course name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time) newErrors.time = 'Time is required'

    // Check if date is in the future
    const selectedDate = new Date(formData.date + 'T' + formData.time)
    if (selectedDate <= new Date()) {
      newErrors.date = 'Round date must be in the future'
    }

    // Validate private round group selection
    if (formData.isPublic === 'false' && selectedGroups.length === 0) {
      newErrors.groups = 'Private rounds must be shared with at least one group'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createRound.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear selected groups when switching to public
    if (name === 'isPublic' && value === 'true') {
      setSelectedGroups([])
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCourseSelect = (course: GolfCourse) => {
    setFormData(prev => ({
      ...prev,
      course: course.name,
      address: course.address || prev.address,
      zipCode: course.zipCode || prev.zipCode
    }))
    // Clear course-related errors
    setErrors(prev => ({ 
      ...prev, 
      course: '',
      address: course.address ? '' : prev.address,
      zipCode: course.zipCode ? '' : prev.zipCode
    }))
  }

  return (
    <div className="min-h-screen relative overflow-auto">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: "url('/images/clubs_back.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-white bg-opacity-40"></div>
      </div>
      
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 h-16 md:h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between overflow-visible">
          <div className="flex items-center">
            <img
              src="/images/foresum_logo.png"
              alt="Foresum Logo"
              className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] object-contain"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl relative">
        <Card className="bg-white/90 backdrop-blur-md shadow-2xl border-0 hover:shadow-3xl transition-all duration-300 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 via-green-50/80 to-green-100/50 border-b border-green-200/50 py-4 md:py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faBullseye} className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl text-gray-800 font-bold">Create New Round</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {errors.general && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center">
                  <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 mr-2 text-green-600" />
                  Round Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Saturday Morning Round"
                  className={`h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.title && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.title}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell players what to expect from this round..."
                  rows={4}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <Label htmlFor="course" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 mr-2 text-green-600" />
                    Golf Course *
                  </Label>
                  <CourseSearch
                    onSelect={handleCourseSelect}
                    placeholder="Search for a golf course..."
                    initialValue={formData.course}
                    zipCode={formData.zipCode}
                  />
                  {errors.course && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.course}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 mr-2 text-green-600" />
                    Zip Code *
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 90210"
                    className={`h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl ${errors.zipCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.zipCode && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.zipCode}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center">
                  <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 mr-2 text-green-600" />
                  Course Address *
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 1700 17-Mile Drive, Pebble Beach, CA"
                  className={`h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.address && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700 flex items-center">
                    <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className="h-4 w-4 mr-2" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl ${errors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.date && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.date}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faClock} className="h-4 w-4 mr-2 text-green-600" />
                    Tee Time *
                  </Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className={`h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl ${errors.time ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.time && <p className="text-sm text-red-600 flex items-center mt-1"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>{errors.time}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <Label htmlFor="maxPlayers" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-2 text-green-600" />
                    Maximum Players
                  </Label>
                  <Select
                    value={formData.maxPlayers}
                    onValueChange={(value) => handleSelectChange('maxPlayers', value)}
                  >
                    <SelectTrigger className="h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="3">3 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="5">5 Players</SelectItem>
                      <SelectItem value="6">6 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="isPublic" className="text-sm font-semibold text-gray-700 flex items-center">
                    {formData.isPublic === 'true' ? <FontAwesomeIcon icon={faGlobe} className="h-4 w-4 mr-2 text-green-600" /> : <FontAwesomeIcon icon={faLock} className="h-4 w-4 mr-2 text-green-600" />}
                    Visibility
                  </Label>
                  <Select
                    value={formData.isPublic}
                    onValueChange={(value) => handleSelectChange('isPublic', value)}
                  >
                    <SelectTrigger className="h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">🌐 Public - Visible to all (requires your approval)</SelectItem>
                      <SelectItem value="false">🔒 Private - Visible to groups only (requires your approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Group Selection - Only show for private rounds */}
                {formData.isPublic === 'false' && (
                  <div className="lg:col-span-2 space-y-3 mt-4 p-4 md:p-6 bg-gradient-to-r from-orange-50 to-orange-50/80 rounded-xl border border-orange-200/50 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="h-4 w-4 mr-2 text-orange-600" />
                      Select Groups (Private Round)
                    </Label>
                    <p className="text-xs text-gray-600">Choose which of your groups can see this private round</p>
                    
                    {userGroups && userGroups.length > 0 ? (
                      <div className="space-y-2">
                        {userGroups.map((group: any) => (
                          <div key={group.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`group-${group.id}`}
                              checked={selectedGroups.includes(group.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, group.id])
                                } else {
                                  setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                                }
                                // Clear groups error when selection changes
                                if (errors.groups) {
                                  setErrors(prev => ({ ...prev, groups: '' }))
                                }
                              }}
                              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <label 
                              htmlFor={`group-${group.id}`}
                              className="text-sm font-medium text-gray-700 cursor-pointer flex-1"
                            >
                              {group.name}
                              <span className="text-xs text-gray-500 ml-2">
                                ({group._count?.members || 0} members)
                              </span>
                            </label>
                          </div>
                        ))}
                        
                        {selectedGroups.length === 0 && (
                          <p className="text-xs text-orange-600 italic">
                            ⚠️ Select at least one group to make this round visible to group members
                          </p>
                        )}
                        {errors.groups && (
                          <p className="text-xs text-red-600 font-medium">
                            {errors.groups}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600">
                          You haven't joined any groups yet. 
                          <button 
                            type="button"
                            onClick={() => router.push('/groups')}
                            className="text-orange-600 hover:text-orange-700 underline ml-1"
                          >
                            Create or join groups
                          </button> 
                          to share private rounds.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 h-12 md:h-14 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200 rounded-xl font-medium"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRound.isPending}
                  className="flex-1 h-12 md:h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none rounded-xl"
                >
                  {createRound.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Round...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={faBullseye} className="h-4 w-4" />
                      <span>Create Round</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}