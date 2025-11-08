'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faUsers, faCalendar, faTrophy } from '@fortawesome/free-solid-svg-icons'
import { LOGO_IMAGES } from '@/lib/images'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          subject: 'ForeSum - New Email Signup',
          message: `New email signup for ForeSum from: ${email}`
        })
      })

      if (response.ok) {
        setMessageType('success')
        setMessage('🎉 Thanks! We\'ll notify you when ForeSum launches.')
        setEmail('')
      } else {
        throw new Error('Failed to submit')
      }
    } catch (error) {
      // Fallback: Store in localStorage for development
      localStorage.setItem('foresum_signup_' + Date.now(), email)
      setMessageType('success')
      setMessage('🎉 Thanks! Your email has been saved. We\'ll notify you when ForeSum launches.')
      setEmail('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-auto">
      {/* Modern gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 z-[-3]" />

      {/* Subtle golf course overlay */}
      <div
        className="fixed inset-0 opacity-15 z-[-2]"
        style={{
          backgroundImage: "url('/images/golf-course-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Radial gradient overlay */}
      <div className="fixed inset-0 bg-radial-gradient from-green-500/10 via-transparent to-transparent z-[-1]" />

      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        {/* Logo with glow effect */}
        <div className="text-center mb-8">
          <img
            src={LOGO_IMAGES.foresum_logo}
            alt="ForeSum Golf Logo"
            className="w-96 h-96 md:w-112 md:h-112 object-contain mx-auto mb-8 filter drop-shadow-2xl brightness-110 hover:scale-105 transition-all duration-300"
          />
        </div>

        {/* Main content card */}
        <div className="relative max-w-2xl w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-green-500/20 rounded-3xl p-8 md:p-12 shadow-2xl hover:shadow-green-500/10 transition-all duration-500 relative overflow-hidden">

            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent -translate-x-full animate-shimmer" />

            {/* Content */}
            <div className="relative z-10">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-green-600 mb-4 text-center animate-pulse-slow">
                ForeSum Golf
              </h1>

              <h2 className="text-2xl md:text-3xl font-light text-slate-200 mb-6 text-center opacity-90">
                Coming Soon
              </h2>

              <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 text-center font-medium">
                The ultimate golf companion app is almost here! Connect with fellow golfers,
                organize rounds, and elevate your game. Be the first to know when we launch.
              </p>

              {/* Message display */}
              {message && (
                <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
                  messageType === 'success'
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : 'bg-red-500/15 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {message}
                  </div>
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-6 py-4 bg-slate-800/60 border-2 border-slate-600/30 rounded-xl text-slate-100 placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-300 backdrop-blur-sm text-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                      Notify Me When It's Ready
                    </>
                  )}
                </button>
              </form>

              {/* Features grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:bg-slate-800/60">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FontAwesomeIcon icon={faUsers} className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Connect</h3>
                  <p className="text-slate-400 text-sm">Find and connect with golfers in your area</p>
                </div>

                <div className="text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:bg-slate-800/60">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FontAwesomeIcon icon={faCalendar} className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Organize</h3>
                  <p className="text-slate-400 text-sm">Create and manage golf rounds effortlessly</p>
                </div>

                <div className="text-center p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-green-500/30 transition-all duration-300 hover:bg-slate-800/60">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FontAwesomeIcon icon={faTrophy} className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Compete</h3>
                  <p className="text-slate-400 text-sm">Track scores and compete with friends</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s infinite;
        }

        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 50%, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  )
}