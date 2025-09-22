'use client'

import React from 'react'
import XGolfRoundCard from '@/components/demo/XGolfRoundCard'

export default function XGolfCardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            X-Golf Round Card Demo
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See how X-Golf locations are beautifully branded in round cards with the official logo
            and styling that emphasizes the indoor simulator experience.
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <XGolfRoundCard
            title="Virtual Golf Championship"
            course="X-Golf Columbus"
            date="October 15, 2025"
            time="7:00 PM"
            players={2}
            maxPlayers={4}
            creator="Mike Johnson"
            description="Join us for an exciting virtual golf tournament featuring world-famous courses!"
          />

          <XGolfRoundCard
            title="Ladies Night Golf"
            course="X-Golf Cincinnati"
            date="October 18, 2025"
            time="6:30 PM"
            players={3}
            maxPlayers={6}
            creator="Sarah Williams"
            description="Ladies night special! Practice your swing on Pebble Beach and St. Andrews in climate-controlled comfort."
          />

          <XGolfRoundCard
            title="Corporate Team Building"
            course="X-Golf Broadview Heights"
            date="October 20, 2025"
            time="5:00 PM"
            players={1}
            maxPlayers={8}
            creator="David Chen"
            description="Corporate team building event with drinks, food, and friendly competition on famous golf courses."
          />
        </div>

        {/* Feature Highlights */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">X-Golf Card Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">🏌️</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Official Branding</h3>
              <p className="text-gray-400 text-sm">Official X-Golf logo as subtle background watermark</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Simulator Badge</h3>
              <p className="text-gray-400 text-sm">Clear "Indoor Simulator" badge to distinguish from outdoor courses</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">🎨</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Premium Styling</h3>
              <p className="text-gray-400 text-sm">Dark theme with blue accents matching X-Golf's brand colors</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold">📱</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Responsive Design</h3>
              <p className="text-gray-400 text-sm">Optimized for mobile and desktop viewing</p>
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <span>←</span>
            Back to ForeSome App
          </a>
        </div>
      </div>
    </div>
  )
}