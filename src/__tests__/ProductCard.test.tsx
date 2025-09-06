import { render, screen } from '@testing-library/react'
import { Category } from '@prisma/client'
import ProductCard from '@/features/product/ProductCard'

// Mock FavoriteButton component
jest.mock('@/components/ui/FavoriteButton', () => {
  return function MockFavoriteButton({ productId }: { productId: string }) {
    return <button data-testid="favorite-button" data-product-id={productId}>♥</button>
  }
})

describe('ProductCard', () => {
  const mockCategory: Category = {
    id: 'cat-1',
    name: 'electronics',
    displayName: 'Électronique',
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const defaultProps = {
    title: 'Test Product',
    description: 'This is a test product description',
    price: 99.99,
    imageUrl: 'https://example.com/product.jpg',
    category: mockCategory,
    productId: 'prod-123',
  }

  it('should render the product card with all required information', () => {
    render(<ProductCard {...defaultProps} />)

    // Check if title is rendered
    expect(screen.getByText('Test Product')).toBeInTheDocument()

    // Check if description is rendered
    expect(screen.getByText('This is a test product description')).toBeInTheDocument()

    // Check if price is rendered with correct format
    expect(screen.getByText('99.99€')).toBeInTheDocument()

    // Check if image is rendered with correct attributes
    const image = screen.getByRole('img', { name: 'Test Product' })
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/product.jpg')
    expect(image).toHaveAttribute('alt', 'Test Product')
  })

  it('should render favorite button with correct product ID', () => {
    render(<ProductCard {...defaultProps} />)

    const favoriteButton = screen.getByTestId('favorite-button')
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveAttribute('data-product-id', 'prod-123')
  })

  it('should create correct link to product page', () => {
    render(<ProductCard {...defaultProps} />)

    const productLink = screen.getByRole('link')
    expect(productLink).toBeInTheDocument()
    expect(productLink).toHaveAttribute('href', '/products/cat-1/prod-123')
  })

  it('should render with default image when imageUrl is not provided', () => {
    const {...propsWithoutImage } = defaultProps

    render(<ProductCard {...propsWithoutImage} />)

    const image = screen.getByRole('img', { name: 'Test Product' })
    expect(image).toHaveAttribute('src', '/images/product_default.webp')
  })

  it('should render when description is null', () => {
    const propsWithNullDescription = {
      ...defaultProps,
      description: null,
    }

    render(<ProductCard {...propsWithNullDescription} />)

    // Title should still be rendered
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    
    // Price should still be rendered
    expect(screen.getByText('99.99€')).toBeInTheDocument()

    // Description should not be in the document
    expect(screen.queryByText('This is a test product description')).not.toBeInTheDocument()
  })

  it('should handle category fallback when category id is missing', () => {
    const propsWithInvalidCategory = {
      ...defaultProps,
      category: {
        ...mockCategory,
        id: '',
      },
    }

    render(<ProductCard {...propsWithInvalidCategory} />)

    const productLink = screen.getByRole('link')
    expect(productLink).toHaveAttribute('href', '/products/uncategorized/prod-123')
  })

  it('should format price as integer when it is a whole number', () => {
    const propsWithWholePrice = {
      ...defaultProps,
      price: 100,
    }

    render(<ProductCard {...propsWithWholePrice} />)

    expect(screen.getByText('100€')).toBeInTheDocument()
  })

  it('should handle very long titles gracefully', () => {
    const propsWithLongTitle = {
      ...defaultProps,
      title: 'This is a very long product title that should be handled gracefully by the component',
    }

    render(<ProductCard {...propsWithLongTitle} />)

    expect(screen.getByText('This is a very long product title that should be handled gracefully by the component')).toBeInTheDocument()
  })

  it('should apply correct CSS classes for styling', () => {
    const { container } = render(<ProductCard {...defaultProps} />)

    // Check if the main card has the expected classes
    const card = container.querySelector('.w-full.max-w-\\[18rem\\]')
    expect(card).toBeInTheDocument()

    // Check if the image container has correct height
    const imageContainer = container.querySelector('.h-72')
    expect(imageContainer).toBeInTheDocument()
  })

  it('should render all card components (Card, CardHeader, CardContent, CardTitle, CardDescription)', () => {
    render(<ProductCard {...defaultProps} />)

    // Check for title (using CardTitle) - it renders as a div with specific classes
    const title = screen.getByText('Test Product')
    expect(title).toBeInTheDocument()
    expect(title).toHaveClass('text-2xl', 'font-bold')

    // Check for description (using CardDescription)
    const description = screen.getByText('This is a test product description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-muted-foreground', 'text-sm')

    // Check for price
    expect(screen.getByText('99.99€')).toBeInTheDocument()
  })
})
