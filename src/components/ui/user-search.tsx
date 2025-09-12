'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faUser, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons'

interface User {
  id: string
  name: string | null
  email: string
  handicap: number | null
}

interface UserSearchProps {
  selectedUsers: User[]
  onUsersChange: (users: User[]) => void
  placeholder?: string
  className?: string
}

export default function UserSearch({ 
  selectedUsers, 
  onUsersChange, 
  placeholder = "Search by name or email to add members...",
  className = ""
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Search users query
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ['user-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
        return []
      }
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedSearchTerm)}`)
      if (!response.ok) {
        throw new Error('Failed to search users')
      }
      return response.json()
    },
    enabled: debouncedSearchTerm.length >= 2
  })

  // Filter out already selected users
  const availableUsers = searchResults.filter(
    user => !selectedUsers.some(selected => selected.id === user.id)
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addUser = (user: User) => {
    if (!selectedUsers.some(selected => selected.id === user.id)) {
      onUsersChange([...selectedUsers, user])
    }
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user.id !== userId))
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-sm"
            >
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-green-600" />
              </div>
              <span className="font-medium text-green-900">
                {user.name || user.email}
              </span>
              {user.handicap && (
                <span className="text-green-600 text-xs">
                  ({user.handicap} HCP)
                </span>
              )}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="ml-1 text-green-600 hover:text-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-10 pr-4"
          />
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
          />
        </div>

        {/* Dropdown */}
        {isOpen && debouncedSearchTerm.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {availableUsers.length > 0 ? (
              <div className="py-1">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {user.name || 'No name'}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.handicap && (
                        <p className="text-xs text-gray-500">
                          Handicap: {user.handicap}
                        </p>
                      )}
                    </div>
                    <FontAwesomeIcon 
                      icon={faPlus} 
                      className="h-4 w-4 text-green-600" 
                    />
                  </button>
                ))}
              </div>
            ) : searchResults.length === 0 && debouncedSearchTerm.length >= 2 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No users found matching "{debouncedSearchTerm}"
              </div>
            ) : null}
          </div>
        )}

        {/* Instructions */}
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="px-4 py-3 text-gray-500 text-sm">
              Type at least 2 characters to search
            </div>
          </div>
        )}
      </div>
    </div>
  )
}