import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard } from '@/components/dashboard/stat-card'
import { Users } from 'lucide-react'

describe('StatCard Component', () => {
  it('renders label, value, and icon correctly', () => {
    render(
      <StatCard 
        label="Total Students" 
        value={120} 
        icon={Users} 
        color="text-blue-500" 
        bgColor="bg-blue-100" 
      />
    )
    
    expect(screen.getByText('Total Students')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    
    // SVG icon is rendered
    const svgElement = document.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('text-blue-500')
  })
})
