'use client'

import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faLocationDot, faBullseye, faSpinner, faClock, faStar, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
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
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentGolfCourseSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to parse recent searches from localStorage')
      }
    }
  }, [])

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
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      // Build search parameters with enhanced options
      const params = new URLSearchParams()
      params.set('q', searchQuery.trim())
      if (zipCode) {
        params.set('zipCode', zipCode)
        params.set('sortByDistance', 'true') // Sort by distance if zip code provided
      }
      params.set('limit', '15') // Increased limit for better results
      params.set('fuzzy', 'true') // Enable fuzzy matching

      // Search using database API
      const response = await fetch(`/api/golf-courses/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to search courses')
      }

      const data = await response.json()
      const courses = data.courses || []

      setResults(courses)
      setShowResults(true)

      // Extract search suggestions from results
      if (courses.length > 0) {
        const suggestions = courses.slice(0, 5).map((course: GolfCourse) => course.name)
        setSearchSuggestions(suggestions)
      }

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

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce search with improved timing
    debounceRef.current = setTimeout(() => {
      searchCourses(value)
    }, 250) // Reduced delay for faster response
  }

  const handleSelectCourse = (course: GolfCourse) => {
    setQuery(course.name)
    setShowResults(false)

    // Save to recent searches
    const updatedRecents = [course.name, ...recentSearches.filter(search => search !== course.name)].slice(0, 5)
    setRecentSearches(updatedRecents)
    localStorage.setItem('recentGolfCourseSearches', JSON.stringify(updatedRecents))

    onSelect(course)
  }

  const handleInputFocus = () => {
    if (query.trim().length >= 2 && results.length > 0) {
      setShowResults(true)
    } else if (query.trim().length === 0 && recentSearches.length > 0) {
      // Show recent searches when input is focused and empty
      setShowResults(true)
    }
  }

  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
    searchCourses(searchTerm)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 md:h-14 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 rounded-xl shadow-sm"
          autoComplete="off"
          spellCheck="false"
        />
        {loading && (
          <FontAwesomeIcon icon={faSpinner} spin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4 z-10" />
        )}
        {!loading && query.length > 0 && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 h-4 w-4 z-10"
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <Card className="absolute z-50 w-full mt-1 bg-white shadow-xl border border-gray-200 rounded-xl overflow-hidden">
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {/* Recent searches when input is empty */}
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-gray-400 mr-2" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Searches</span>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <>
                {query.trim().length > 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faSearch} className="h-3 w-3 text-gray-400 mr-2" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {results.length} Course{results.length !== 1 ? 's' : ''} Found
                      </span>
                    </div>
                  </div>
                )}
                {results.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className="flex items-start p-4 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mr-3">
                      <FontAwesomeIcon icon={faBullseye} className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {course.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400" />
                        <span className="truncate">
                          {course.address}
                          {course.city && `, ${course.city}`}
                          {course.state && `, ${course.state}`}
                          {course.zipCode && ` ${course.zipCode}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
                        {course.holes && (
                          <span className="text-blue-600 font-medium">
                            {course.holes} holes
                          </span>
                        )}
                        {course.type && (
                          <span className="text-gray-500">
                            {course.type}
                          </span>
                        )}
                        {course.features && (
                          <span className="text-purple-600 font-medium">
                            ★ Features
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <Card className="absolute z-50 w-full mt-1 bg-white shadow-xl border border-gray-200 rounded-xl overflow-hidden">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faBullseye} className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No courses found</h3>
              <p className="text-xs text-gray-500 mb-3">
                No golf courses found for "{query}"
                {zipCode && ` near ${zipCode}`}
              </p>
              <div className="text-xs text-gray-400">
                <p>Try searching for:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Course name or partial name</li>
                  <li>• City or area name</li>
                  <li>• Different spelling variations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}