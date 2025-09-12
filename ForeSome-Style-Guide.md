# ForeSome Style Guide

## Overview
This comprehensive style guide defines the design system, UI patterns, and technical specifications for ForeSome, the premier golf round-making application. This guide ensures consistency across all interfaces and provides clear implementation guidelines for developers and designers.

## Brand Colors & Palette

### Primary Colors
- **Green Primary**: `#059669` (green-600)
- **Green Secondary**: `#047857` (green-700) 
- **Green Accent**: `#10b981` (green-500)
- **Green Light**: `#34d399` (green-400)

### Supporting Colors
- **Blue Primary**: `#2563eb` (blue-600)
- **Blue Secondary**: `#1d4ed8` (blue-700)
- **Orange Primary**: `#ea580c` (orange-600)
- **Orange Secondary**: `#c2410c` (orange-700)
- **Purple Primary**: `#9333ea` (purple-600)
- **Yellow/Gold**: `#fbbf24` (yellow-400) - Used for ownership badges

### Neutral Colors
- **Background White**: `#ffffff` with opacity variations (`white/95`, `white/90`, `white/80`)
- **Card Backgrounds**: `white/95` with backdrop-blur effects
- **Text Primary**: `#111827` (gray-900)
- **Text Secondary**: `#6b7280` (gray-500)
- **Text Muted**: `#9ca3af` (gray-400)
- **Border Colors**: `green-200/30`, `blue-200/30` with transparency

### Status Colors
- **Success**: `#10b981` (green-500)
- **Warning**: `#f59e0b` (amber-500)
- **Error/Alert**: `#ef4444` (red-500)
- **Info**: `#3b82f6` (blue-500)

## Typography

### Font Family
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: system fonts (sans-serif)
- **Implementation**: Applied via Next.js font optimization

### Font Sizes & Weights
- **Headings**:
  - H1: `text-3xl` (30px) - `font-bold`
  - H2: `text-2xl` (24px) - `font-bold` 
  - H3: `text-xl` (20px) - `font-bold`
  - H4: `text-lg` (18px) - `font-semibold`

- **Body Text**:
  - Large: `text-lg` (18px) - `font-medium`
  - Default: `text-base` (16px) - `font-normal`
  - Small: `text-sm` (14px) - `font-normal`
  - Extra Small: `text-xs` (12px) - `font-medium`

## Component Design System

### Cards
- **Base Style**: `rounded-2xl` or `rounded-3xl` for large cards
- **Background**: `bg-gradient-to-br from-white/95 to-[color]-50/80`
- **Shadow**: `shadow-xl` with `hover:shadow-2xl`
- **Border**: `border border-[color]-200/30`
- **Backdrop**: `backdrop-blur-md` or `backdrop-blur-xl`
- **Hover Effects**: `hover:scale-[1.01] hover:-translate-y-1`

### Buttons

#### Primary Buttons
```css
bg-gradient-to-r from-green-600 to-green-700 
hover:from-green-700 hover:to-green-800
shadow-lg
```

#### Secondary Buttons (Outline)
```css
border-green-300 text-green-700 
hover:bg-green-50 
shadow-lg
```

#### Size Variants
- **Small**: `h-8` or `h-9` with `px-3`
- **Default**: `h-10` with `px-4`
- **Large**: `h-11` with `px-8`

### Icons
- **Library**: FontAwesome (free-solid-svg-icons)
- **Sizes**: 
  - Small: `h-3 w-3` or `h-4 w-4`
  - Medium: `h-5 w-5`
  - Large: `h-6 w-6` or `h-8 w-8`

#### Common Icons
- **Calendar**: `faCalendarDays`
- **Location**: `faLocationDot` 
- **Users**: `faUsers`
- **Search**: `faSearch`
- **Plus**: `faPlus`
- **Globe** (Public): `faGlobe`
- **Lock** (Private): `faLock`
- **Star** (Features): `faStar`
- **Toggle**: `faToggleOn` / `faToggleOff`

### Color-Coded Icon Containers
```css
/* Green Icons */
bg-green-100 text-green-600

/* Blue Icons */  
bg-blue-100 text-blue-600

/* Orange Icons */
bg-orange-100 text-orange-600

/* Purple Icons */
bg-purple-100 text-purple-600
```

## Layout Patterns

### Grid System
- **Main Layout**: `grid lg:grid-cols-3 gap-8`
- **Content Area**: `lg:col-span-2`
- **Sidebar**: Single column with `space-y-6`

### Container & Spacing
- **Container**: `container mx-auto px-4 py-8`
- **Card Padding**: `p-4` (compact), `p-6` (standard), `p-8` (large)
- **Section Spacing**: `space-y-6` or `space-y-8`

### Navigation
- **Header Height**: `h-20`
- **Sticky Navigation**: `sticky top-0 z-50`
- **Background**: `bg-white/95 backdrop-blur-sm`
- **Logo Size**: `h-[150px] w-[150px]` (oversized for brand prominence)

## Background System

### Primary Backgrounds
- **Homepage**: `golf_public_background.jpg`
- **Authentication**: `golf-course-bg.jpg`
- **Groups**: `golf_Back_groups.jpg`
- **Profile**: `golf_back_profile.jpeg`
- **Management**: `golf_manage_back.jpg`

### Background Implementation
```css
background-size: cover
background-position: center
background-repeat: no-repeat
```

### Overlay System
```css
/* Light overlay */
bg-gradient-to-br from-white/70 via-white/50 to-white/60

/* Dark overlay (for text readability) */
bg-gradient-to-br from-black/50 via-black/30 to-black/50
```

## Interactive States

### Hover Effects
- **Cards**: Scale `hover:scale-[1.01]` with `hover:-translate-y-1`
- **Buttons**: Color transitions with `transition-all duration-300`
- **Icons**: Scale `hover:scale-110` with `transition-all duration-300`

### Focus States
- **Inputs**: `focus:border-green-500 focus:ring-green-500`
- **Buttons**: `focus-visible:ring-2 focus-visible:ring-ring`

### Loading States
- **Animations**: `animate-pulse`, `animate-bounce`
- **Loading Text**: "Loading..." with appropriate context

## Component-Specific Styles

### Match/Round Cards
- **Gradient Backgrounds**: Color-coded by type (green, blue, orange)
- **Course Features**: Bottom placement with star icon
- **Player Count**: Pill-shaped with appropriate colors
- **Status Indicators**: Color-coded badges (Public/Private)

### User Statistics
- **Achievement Badges**: Circular with icon and progress
- **Progress Bars**: Color-coded with smooth animations
- **Leaderboard**: Trophy icons with rank-based colors

### Forms
- **Input Fields**: `border-green-200` with `focus:border-green-500`
- **Labels**: `text-sm font-medium text-gray-700`
- **Validation**: Red for errors, green for success

## Responsive Design

### Breakpoints (Tailwind CSS)
- **Mobile**: `<640px` (default)
- **Tablet**: `sm:` `640px+`
- **Laptop**: `md:` `768px+`
- **Desktop**: `lg:` `1024px+`
- **Large**: `xl:` `1280px+`

### Mobile-First Approach
- Start with mobile layouts
- Progressive enhancement for larger screens
- Hide non-essential elements on mobile with `hidden lg:block`

## Animation & Transitions

### Standard Transitions
- **Duration**: `transition-all duration-300`
- **Easing**: Default CSS easing or `ease-in-out`
- **Hover Delays**: None (immediate response)

### Special Animations
- **Carousel**: Smooth transitions with `transition-opacity duration-1000`
- **Menu Toggles**: `animate-in slide-in-from-top-2`
- **Loading States**: `animate-pulse` for placeholders

## Accessibility Guidelines

### Color Contrast
- Ensure WCAG AA compliance (4.5:1 ratio)
- Never rely solely on color for information
- Use icons alongside color coding

### Focus Management
- Visible focus indicators
- Logical tab order
- Skip links where appropriate

### Screen Reader Support
- Meaningful alt text for images
- ARIA labels for interactive elements
- Semantic HTML structure

## Code Implementation

### CSS Custom Properties
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --border-radius: 0.5rem;
}
```

### Utility Classes Pattern
- Use Tailwind CSS utility classes
- Create component variants with `cva` (class-variance-authority)
- Consistent naming conventions

### Component Structure
```jsx
// Standard card component structure
<Card className="bg-gradient-to-br from-white/95 to-green-50/80 backdrop-blur-md shadow-xl border border-green-200/30 hover:shadow-2xl transition-all duration-300 rounded-2xl">
  <CardHeader>
    <CardTitle className="flex items-center space-x-2 text-green-800">
      <div className="p-2 bg-green-100 rounded-lg">
        <FontAwesomeIcon icon={iconName} className="h-5 w-5 text-green-600" />
      </div>
      <span>Title</span>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Performance Guidelines

### Image Optimization
- Use Next.js Image component when possible
- WebP format preferred
- Appropriate sizes for different viewports

### CSS Performance
- Minimize custom CSS
- Leverage Tailwind's purging
- Use backdrop-blur sparingly (performance intensive)

### Animation Performance
- Prefer transform and opacity changes
- Use `will-change` property cautiously
- Avoid animating expensive properties (width, height)

## Quality Assurance

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari and Chrome Mobile
- Graceful degradation for older browsers

### Testing Guidelines
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
- Performance benchmarks

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component prop validation

## Maintenance & Updates

### Versioning
- Follow semantic versioning for style updates
- Document breaking changes
- Provide migration guides

### Documentation Updates
- Keep style guide current with implementation
- Include examples and code snippets
- Regular review and refinement

### Style Guide Evolution
- Quarterly reviews
- User feedback integration
- Performance optimization updates
- New component additions

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: ForeSome Development Team