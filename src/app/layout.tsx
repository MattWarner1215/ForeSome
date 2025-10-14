import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

// Prevent FontAwesome from automatically adding its CSS
config.autoAddCss = false

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '4some - Golf Round Maker',
  description: 'Find and create golf rounds at local courses',
}

// Force all routes to be dynamic (no static generation during build)
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}