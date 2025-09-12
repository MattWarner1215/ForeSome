'use client'

import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faLocationDot, faBullseye, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface GolfCourse {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  website?: string
  type?: string
  holes?: number
  rating?: number
  slope?: number
  par?: number
  yards?: number
  latitude?: number
  longitude?: number
  features?: string
}

interface CourseSearchProps {
  onSelect: (course: GolfCourse) => void
  placeholder?: string
  initialValue?: string
  zipCode?: string
}

export function CourseSearch({ onSelect, placeholder = "Search for a golf course...", initialValue, zipCode }: CourseSearchProps) {
  const [query, setQuery] = useState(initialValue || '')
  const [results, setResults] = useState<GolfCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchCourses = async (searchQuery: string) => {
    if (searchQuery.trim().length < 1) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      // Build search parameters
      const params = new URLSearchParams()
      params.set('q', searchQuery)
      if (zipCode) {
        params.set('zipCode', zipCode)
      }
      params.set('limit', '10')

      // Search using database API
      const response = await fetch(`/api/golf-courses/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search courses')
      }
      
      const data = await response.json()
      const courses = data.courses || []
      
      setResults(courses)
      setShowResults(true)
      
      if (courses.length === 0) {
        console.log(`No golf courses found matching "${searchQuery}"`)
      }
    } catch (error) {
      console.error('Error searching golf courses:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchCourses(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleSelectCourse = (course: GolfCourse) => {
    setQuery(course.name)
    setShowResults(false)
    onSelect(course)
  }

  const handleInputFocus = () => {
    if (query.trim().length >= 1 && results.length > 0) {
      setShowResults(true)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
        />
        {loading && (
          <FontAwesomeIcon icon={faSpinner} spin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((course) => (
              <div
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="flex items-start p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {course.name}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {course.address}
                      {course.city && `, ${course.city}`}
                      {course.state && `, ${course.state}`}
                      {course.zipCode && ` ${course.zipCode}`}
                    </span>
                  </div>
                  {course.rating && (
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-green-600 font-medium">
                        Rating: {course.rating}
                      </span>
                      {course.slope && (
                        <span className="text-xs text-gray-500 ml-2">
                          Slope: {course.slope}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && query.length >= 1 && results.length === 0 && !loading && (
        <Card className="absolute z-50 w-full mt-1 bg-white shadow-lg border border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-gray-500 text-sm">
              <FontAwesomeIcon icon={faBullseye} className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              No golf courses found for "{query}"
              {zipCode && (
                <div className="text-xs mt-1">
                  Searching near {zipCode}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}