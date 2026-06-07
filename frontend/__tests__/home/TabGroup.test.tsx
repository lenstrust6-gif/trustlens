import { render, screen, fireEvent } from '@testing-library/react'
import TabGroup from '@/components/shared/TabGroup'

describe('TabGroup Component', () => {
  const mockTabs = [
    { id: 'earbuds', label: '🎧 Earbuds' },
    { id: 'headphones', label: '🎧 Headphones' },
    { id: 'smartwatches', label: '⌚ Smartwatches' },
  ]

  const mockOnTabChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all tabs', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    mockTabs.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument()
    })
  })

  it('marks active tab with selected state', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="headphones"
        onTabChange={mockOnTabChange}
      />
    )

    const headphonesTab = screen.getByText('🎧 Headphones').closest('button')
    expect(headphonesTab).toHaveAttribute('aria-selected', 'true')

    const earbudsTab = screen.getByText('🎧 Earbuds').closest('button')
    expect(earbudsTab).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onTabChange when tab is clicked', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const smartwatchesTab = screen.getByText('⌚ Smartwatches')
    fireEvent.click(smartwatchesTab)

    expect(mockOnTabChange).toHaveBeenCalledWith('smartwatches')
  })

  it('calls onTabChange with correct tab id', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const headphonesTab = screen.getByText('🎧 Headphones')
    fireEvent.click(headphonesTab)

    expect(mockOnTabChange).toHaveBeenCalledWith('headphones')
    expect(mockOnTabChange).toHaveBeenCalledTimes(1)
  })

  it('updates active state when activeTab prop changes', () => {
    const { rerender } = render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    let earbudsTab = screen.getByText('🎧 Earbuds').closest('button')
    expect(earbudsTab).toHaveAttribute('aria-selected', 'true')

    rerender(
      <TabGroup
        tabs={mockTabs}
        activeTab="smartwatches"
        onTabChange={mockOnTabChange}
      />
    )

    earbudsTab = screen.getByText('🎧 Earbuds').closest('button')
    expect(earbudsTab).toHaveAttribute('aria-selected', 'false')

    const smartwatchesTab = screen.getByText('⌚ Smartwatches').closest('button')
    expect(smartwatchesTab).toHaveAttribute('aria-selected', 'true')
  })

  it('has correct ARIA roles', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('renders single tab', () => {
    const singleTab = [{ id: 'only', label: 'Only Tab' }]

    render(
      <TabGroup tabs={singleTab} activeTab="only" onTabChange={mockOnTabChange} />
    )

    expect(screen.getByText('Only Tab')).toBeInTheDocument()
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'true')
  })

  it('renders many tabs', () => {
    const manyTabs = Array.from({ length: 10 }, (_, i) => ({
      id: `tab-${i}`,
      label: `Tab ${i}`,
    }))

    render(
      <TabGroup
        tabs={manyTabs}
        activeTab="tab-0"
        onTabChange={mockOnTabChange}
      />
    )

    expect(screen.getAllByRole('tab')).toHaveLength(10)
  })

  it('handles tab with icon prop', () => {
    const tabsWithIcons = [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ]

    render(
      <TabGroup
        tabs={tabsWithIcons}
        activeTab="home"
        onTabChange={mockOnTabChange}
      />
    )

    expect(screen.getByText('🏠')).toBeInTheDocument()
    expect(screen.getByText('⚙️')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    const { container } = render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
        className="custom-tabs"
      />
    )

    expect(container.firstChild).toHaveClass('custom-tabs')
  })

  it('focuses tab on click', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const headphonesTab = screen.getByText('🎧 Headphones') as HTMLButtonElement
    fireEvent.click(headphonesTab)

    // Tab should be focusable
    expect(headphonesTab).toHaveAttribute('type', 'button')
  })

  it('does not call onTabChange when already active tab is clicked', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const earbudsTab = screen.getByText('🎧 Earbuds')
    fireEvent.click(earbudsTab)

    // Should still call onTabChange even for active tab
    expect(mockOnTabChange).toHaveBeenCalledWith('earbuds')
  })

  it('renders with white-space: nowrap on tabs', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const tabs = screen.getAllByRole('tab')
    tabs.forEach((tab) => {
      expect(tab).toHaveStyle({ whiteSpace: 'nowrap' })
    })
  })

  it('handles rapid tab changes', () => {
    render(
      <TabGroup
        tabs={mockTabs}
        activeTab="earbuds"
        onTabChange={mockOnTabChange}
      />
    )

    const headphonesTab = screen.getByText('🎧 Headphones')
    const smartwatchesTab = screen.getByText('⌚ Smartwatches')

    fireEvent.click(headphonesTab)
    fireEvent.click(smartwatchesTab)
    fireEvent.click(headphonesTab)

    expect(mockOnTabChange).toHaveBeenCalledTimes(3)
    expect(mockOnTabChange).toHaveBeenNthCalledWith(1, 'headphones')
    expect(mockOnTabChange).toHaveBeenNthCalledWith(2, 'smartwatches')
    expect(mockOnTabChange).toHaveBeenNthCalledWith(3, 'headphones')
  })
})
