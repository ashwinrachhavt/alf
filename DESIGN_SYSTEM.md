# ALF Design System

A minimal, accessible design system built with shadcn/ui components and Tailwind CSS.

## Design Principles

1. **Minimal & Clean**: Black and white color palette with subtle grays
2. **Accessible**: WCAG 2.1 AA compliant with proper contrast ratios
3. **Consistent**: Reusable components with predictable behavior
4. **Responsive**: Mobile-first design that scales elegantly
5. **Theme-aware**: Seamless light and dark mode support

## Color Palette

### Light Mode
- **Background**: `#ffffff` - Pure white for main background
- **Surface**: `#fafafa` - Subtle gray for elevated surfaces
- **Border**: `#e5e5e5` - Light gray for borders
- **Accent**: `#f4f4f5` - Hover and active states
- **Foreground**: `#0a0a0a` - Primary text color
- **Muted**: `#737373` - Secondary text color (meets WCAG AA at 4.54:1)

### Dark Mode
- **Background**: `#0a0a0a` - Near black for main background
- **Surface**: `#171717` - Slightly lighter for elevated surfaces
- **Border**: `#262626` - Subtle borders
- **Accent**: `#1a1a1a` - Hover and active states
- **Foreground**: `#fafafa` - Primary text color
- **Muted**: `#a3a3a3` - Secondary text color (meets WCAG AA)

## Typography

### Font Families
- **Sans**: System font stack for optimal performance
  - `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Mono**: For code and technical content
  - `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Type Scale
- **3xl**: `1.875rem (30px)` - Page titles
- **2xl**: `1.5rem (24px)` - Section headings
- **xl**: `1.25rem (20px)` - Card titles
- **lg**: `1.125rem (18px)` - Emphasized text
- **base**: `1rem (16px)` - Body text
- **sm**: `0.875rem (14px)` - Secondary text
- **xs**: `0.75rem (12px)` - Captions and labels

## Spacing Scale

Uses Tailwind's default spacing scale (4px base unit):
- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **12**: 3rem (48px)

## Components

### Button

**Variants:**
- **Primary**: `bg-black dark:bg-white text-white dark:text-black`
  - Use for primary actions (Save, Submit, Create)
- **Secondary**: `border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800`
  - Use for secondary actions (Cancel, Back)
- **Ghost**: `hover:bg-neutral-100 dark:hover:bg-neutral-800`
  - Use for tertiary actions (Icons, navigation)
- **Destructive**: `bg-red-600 dark:bg-red-500 text-white`
  - Use for delete/remove actions

**Sizes:**
- **sm**: `h-8 px-3 text-sm`
- **md**: `h-10 px-4 text-base` (default)
- **lg**: `h-12 px-6 text-lg`

### Card

Elevated surface for grouping related content:
```tsx
<div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-sm">
  {/* Content */}
</div>
```

### Input

Form inputs with consistent styling:
```tsx
<input className="h-10 w-full border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100" />
```

### Badge

Status indicators and labels:
- **Default**: `bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100`
- **Success**: `bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400`
- **Error**: `bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400`
- **Warning**: `bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400`

## Layout Patterns

### Container
```tsx
<div className="mx-auto max-w-7xl px-4 md:px-6">
  {/* Content */}
</div>
```

### Two-Column Layout (Sidebar + Main)
```tsx
<div className="grid gap-4 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
  <aside>{/* Sidebar */}</aside>
  <main>{/* Main content */}</main>
</div>
```

### Card Grid
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

## Accessibility Guidelines

1. **Contrast Ratios**:
   - Body text: Minimum 4.5:1 (WCAG AA)
   - Large text (18px+): Minimum 3:1 (WCAG AA)
   - Interactive elements: Minimum 3:1 for borders/icons

2. **Focus States**:
   - Always provide visible focus indicators
   - Use `focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100`

3. **Touch Targets**:
   - Minimum height of 44px (or 40px for dense UIs)
   - Adequate spacing between interactive elements

4. **Semantic HTML**:
   - Use proper heading hierarchy (h1 → h2 → h3)
   - Use `<button>` for actions, `<a>` for navigation
   - Include aria-labels for icon-only buttons

## Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
```tsx
{/* Mobile: full width, Desktop: 2 columns */}
<div className="grid gap-4 md:grid-cols-2">

{/* Mobile: hidden, Desktop: visible */}
<div className="hidden md:block">

{/* Mobile: text-sm, Desktop: text-base */}
<p className="text-sm md:text-base">
```

## Animation & Transitions

Use subtle transitions for better UX:
```css
transition-colors /* For background/color changes */
transition-opacity /* For fade effects */
transition-all /* Use sparingly */
```

Duration: Keep under 300ms for snappy feel

## Shadows

- **sm**: `0 1px 2px rgba(0,0,0,0.05)` - Subtle elevation
- **DEFAULT**: `0 2px 8px rgba(0,0,0,0.08)` - Cards
- **md**: `0 4px 12px rgba(0,0,0,0.12)` - Modals

## Usage in Components

### Import Pattern
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
```

### Composition
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-neutral-600 dark:text-neutral-400">Content</p>
  </CardContent>
</Card>
```

## Best Practices

1. **Use semantic color names**: Prefer `text-neutral-600` over specific colors
2. **Mobile-first**: Write mobile styles first, then add breakpoints
3. **Consistent spacing**: Use the spacing scale, avoid arbitrary values
4. **Theme awareness**: Always provide dark mode variants
5. **Component composition**: Build complex UIs from simple primitives
6. **Accessibility first**: Test with keyboard navigation and screen readers

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
