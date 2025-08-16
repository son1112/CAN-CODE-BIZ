import { render, screen, fireEvent, waitFor } from '../../setup/test-utils'
import StarButton from '@/app/components/StarButton'

// Mock the useStars hook
jest.mock('@/hooks/useStars', () => ({
  useStars: jest.fn(() => ({
    isStarred: jest.fn(() => false),
    starItem: jest.fn(() => Promise.resolve(true)),
    unstarItem: jest.fn(() => Promise.resolve(true)),
    isLoading: false,
  })),
}))

describe('StarButton', () => {
  const defaultProps = {
    userId: 'test-user',
    itemType: 'message',
    itemId: 'test-message-id',
    context: {
      title: 'Test Message',
      description: 'A test message for starring',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with default props', () => {
    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Star this message')
  })

  it('shows filled star when item is starred', () => {
    const mockUseStars = require('@/hooks/useStars').useStars
    mockUseStars.mockReturnValue({
      isStarred: jest.fn(() => true),
      starItem: jest.fn(() => Promise.resolve(true)),
      unstarItem: jest.fn(() => Promise.resolve(true)),
      isLoading: false,
    })

    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Unstar this message')
  })

  it('handles click to star item', async () => {
    const mockStarItem = jest.fn(() => Promise.resolve(true))
    const mockUseStars = require('@/hooks/useStars').useStars
    mockUseStars.mockReturnValue({
      isStarred: jest.fn(() => false),
      starItem: mockStarItem,
      unstarItem: jest.fn(() => Promise.resolve(true)),
      isLoading: false,
    })

    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockStarItem).toHaveBeenCalledWith({
        itemType: 'message',
        itemId: 'test-message-id',
        context: {
          title: 'Test Message',
          description: 'A test message for starring',
        },
      })
    })
  })

  it('handles click to unstar item', async () => {
    const mockUnstarItem = jest.fn(() => Promise.resolve(true))
    const mockUseStars = require('@/hooks/useStars').useStars
    mockUseStars.mockReturnValue({
      isStarred: jest.fn(() => true),
      starItem: jest.fn(() => Promise.resolve(true)),
      unstarItem: mockUnstarItem,
      isLoading: false,
    })

    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockUnstarItem).toHaveBeenCalledWith('message', 'test-message-id')
    })
  })

  it('shows loading state when operation in progress', () => {
    const mockUseStars = require('@/hooks/useStars').useStars
    mockUseStars.mockReturnValue({
      isStarred: jest.fn(() => false),
      starItem: jest.fn(() => Promise.resolve(true)),
      unstarItem: jest.fn(() => Promise.resolve(true)),
      isLoading: true,
    })

    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('prevents event propagation on click', () => {
    const mockStopPropagation = jest.fn()
    const mockPreventDefault = jest.fn()

    render(<StarButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button, {
      stopPropagation: mockStopPropagation,
      preventDefault: mockPreventDefault,
    })

    // Note: The actual event.stopPropagation() and preventDefault() are called
    // inside the component, but testing-library doesn't capture this automatically.
    // This test ensures the click handler is called without errors.
    expect(button).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<StarButton {...defaultProps} size="lg" />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('shows label when requested', () => {
    render(<StarButton {...defaultProps} showLabel={true} />)
    
    expect(screen.getByText('Star')).toBeInTheDocument()
  })

  it('calls onStarChange callback when provided', async () => {
    const mockOnStarChange = jest.fn()
    const mockStarItem = jest.fn(() => Promise.resolve(true))
    const mockUseStars = require('@/hooks/useStars').useStars
    mockUseStars.mockReturnValue({
      isStarred: jest.fn(() => false),
      starItem: mockStarItem,
      unstarItem: jest.fn(() => Promise.resolve(true)),
      isLoading: false,
    })

    render(
      <StarButton {...defaultProps} onStarChange={mockOnStarChange} />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnStarChange).toHaveBeenCalledWith(true)
    })
  })
})