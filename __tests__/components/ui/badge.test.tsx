import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  it('renders correctly with default variant', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    // Default variant has bg-primary
    expect(badge).toHaveClass('bg-primary text-primary-foreground')
  })

  it('renders correctly with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    const badge = screen.getByText('Outline Badge')
    expect(badge).toHaveClass('text-foreground')
  })

  it('renders correctly with destructive variant', () => {
    render(<Badge variant="destructive">Error Badge</Badge>)
    const badge = screen.getByText('Error Badge')
    expect(badge).toHaveClass('bg-destructive text-white')
  })
})
