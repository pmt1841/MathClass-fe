import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter username" />)
    const input = screen.getByPlaceholderText('Enter username')
    expect(input).toBeInTheDocument()
  })

  it('allows user to type', () => {
    render(<Input placeholder="Search..." />)
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement
    
    fireEvent.change(input, { target: { value: 'testing 123' } })
    expect(input.value).toBe('testing 123')
  })

  it('handles disabled state', () => {
    render(<Input placeholder="Disabled" disabled />)
    const input = screen.getByPlaceholderText('Disabled')
    
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed disabled:opacity-50')
  })
})
