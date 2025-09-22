'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, MapPin, Zap } from 'lucide-react'

interface XGolfRoundCardProps {
  title?: string
  course?: string
  date?: string
  time?: string
  players?: number
  maxPlayers?: number
  creator?: string
  description?: string
}

export default function XGolfRoundCard({
  title = "Virtual Golf Championship",
  course = "X-Golf Columbus",
  date = "October 15, 2025",
  time = "7:00 PM",
  players = 2,
  maxPlayers = 4,
  creator = "Mike Johnson",
  description = "Join us for an exciting virtual golf tournament featuring world-famous courses!"
}: XGolfRoundCardProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* X-Golf Logo Background */}
        <div
          className="absolute inset-0 opacity-10 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/logos/xgolf-logo.png')`
          }}
        />

        {/* X-Golf Hero Background (Subtle) */}
        <div
          className="absolute inset-0 opacity-5 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/backgrounds/xgolf-hero.webp')`
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        <CardContent className="relative z-10 p-6 text-white">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 text-white group-hover:text-blue-300 transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">{course}</span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-600/80 text-white border-blue-400/50 backdrop-blur-sm"
            >
              Indoor Simulator
            </Badge>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{players}/{maxPlayers} players</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">Grandview Heights</span>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Created by <span className="text-blue-300 font-medium">{creator}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Available</span>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
            Join Round
          </button>
        </CardContent>

        {/* Subtle X-Golf Branding Corner */}
        <div className="absolute top-2 right-2 w-8 h-8 opacity-20 bg-contain bg-no-repeat bg-center"
             style={{
               backgroundImage: `url('https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/logos/xgolf-logo.png')`
             }}>
        </div>
      </Card>
    </div>
  )
}