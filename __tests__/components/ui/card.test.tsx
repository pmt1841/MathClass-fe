import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card Component Structure', () => {
  it('renders nested structure correctly', () => {
    render(
      <Card data-testid="main-card">
        <CardHeader>
          <CardTitle>Main Title</CardTitle>
          <CardDescription>Sub description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">
          <p>Body content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Submit</button>
        </CardFooter>
      </Card>
    )

    expect(screen.getByTestId('main-card')).toBeInTheDocument()
    expect(screen.getByText('Main Title')).toBeInTheDocument()
    expect(screen.getByText('Sub description')).toBeInTheDocument()
    expect(screen.getByText('Body content goes here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })
})
