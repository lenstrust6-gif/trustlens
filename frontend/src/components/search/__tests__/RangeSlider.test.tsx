import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import RangeSlider from '../RangeSlider'

describe('RangeSlider', () => {
  it('renders slider with default labels', () => {
    const mockOnChange = jest.fn()
    const { container } = render(
      <RangeSlider
        min={0}
        max={10}
        step={0.1}
        value={[5]}
        onChange={mockOnChange}
      />
    )

    expect(container.querySelector('input[type="range"]')).toBeInTheDocument()
  })

  it('displays correct labels', () => {
    const mockOnChange = jest.fn()
    render(
      <RangeSlider
        min={0}
        max={100}
        step={5}
        value={[50]}
        onChange={mockOnChange}
        labels={['Low', 'High']}
      />
    )

    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('calls onChange when slider value changes', () => {
    const mockOnChange = jest.fn()
    const { container } = render(
      <RangeSlider
        min={0}
        max={10}
        step={0.1}
        value={[5]}
        onChange={mockOnChange}
      />
    )

    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    if (slider) {
      fireEvent.change(slider, { target: { value: '7.5' } })
      expect(mockOnChange).toHaveBeenCalledWith(7.5)
    }
  })

  it('handles range sliders with two values', () => {
    const mockOnChange = jest.fn()
    const { container } = render(
      <RangeSlider
        min={0}
        max={10}
        step={0.1}
        value={[3, 8]}
        onChange={mockOnChange}
      />
    )

    const sliders = container.querySelectorAll('input[type="range"]')
    expect(sliders.length).toBe(2)
  })

  it('displays current value', () => {
    const mockOnChange = jest.fn()
    const { container } = render(
      <RangeSlider
        min={0}
        max={10}
        step={0.1}
        value={[5.5]}
        onChange={mockOnChange}
      />
    )

    expect(screen.getByText(/5.5/)).toBeInTheDocument()
  })

  it('respects min and max boundaries', () => {
    const mockOnChange = jest.fn()
    render(
      <RangeSlider
        min={0}
        max={100}
        step={1}
        value={[50]}
        onChange={mockOnChange}
      />
    )

    // The slider should have min and max attributes
    const slider = screen.getAllByRole('slider')[0] as HTMLInputElement
    expect(slider.min).toBe('0')
    expect(slider.max).toBe('100')
  })
})
