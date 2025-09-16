"use client"

import * as React from "react"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-auto ${className || ''}`}
        style={{
          scrollBehavior: 'smooth',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          ...style
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollArea.displayName = "ScrollArea"

export { ScrollArea }