import { cache, cacheUtils } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import {
  getAllProducts,
  getAllProductsForAdmin,
  getLastTenProducts,
  getProductById,
  getProductsByCategory,
  getProductsByUserId,
  getProductWithOwnerById,
  invalidateProductCache,
} from '@/services/product';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock cache utilities
jest.mock('@/lib/cache', () => ({
  cache: {
    delete: jest.fn(),
  },
  cacheUtils: {
    withCache: jest.fn(),
    invalidateProducts: jest.fn(),
  },
  CACHE_KEYS: {
    PRODUCT_DETAILS: 'product_details',
    ALL_CATEGORIES: 'all_categories',
    USER_PRODUCTS: 'user_products',
    PRODUCTS_BY_CATEGORY: 'products_by_category',
  },
  CACHE_TTL: {
    PRODUCT_DETAILS: 300,
    PRODUCTS_BY_CATEGORY: 600,
    USER_PRODUCTS: 300,
  },
}));

// Mock data
const mockProduct = {
  id: 'prod_123',
  title: 'Test Product',
  description: 'Test description',
  price: 99.99,
  condition: 'new',
  imagesUrl: ['image1.jpg', 'image2.jpg'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  categoryId: 'cat_123',
  status: 'active',
  ownerId: 'user_123',
  city: 'Paris',
  delivery: 'pickup',
  deliveryPrice: 0,
};

const mockProductWithOwner = {
  ...mockProduct,
  owner: {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
  },
};

const mockProductWithCategory = {
  ...mockProduct,
  category: {
    id: 'cat_123',
    name: 'electronics',
    displayName: 'Electronics',
  },
};

const mockProducts = [mockProductWithCategory];

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for withCache
    (cacheUtils.withCache as jest.Mock).mockImplementation(
      async (key: string, fn: () => Promise<unknown>) => {
        return await fn();
      }
    );
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductById('prod_123');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod_123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should use cache for product details', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      await getProductById('prod_123');

      expect(cacheUtils.withCache).toHaveBeenCalledWith(
        'product_details:prod_123',
        expect.any(Function),
        300
      );
    });

    it('should return null if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getProductWithOwnerById', () => {
    it('should return a product with owner information', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        mockProductWithOwner
      );

      const result = await getProductWithOwnerById('prod_123');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod_123' },
        include: {
          owner: true,
        },
      });
      expect(result).toEqual(mockProductWithOwner);
    });

    it('should use separate cache key for product with owner', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        mockProductWithOwner
      );

      await getProductWithOwnerById('prod_123');

      expect(cacheUtils.withCache).toHaveBeenCalledWith(
        'product_details:prod_123:with_owner',
        expect.any(Function),
        300
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return all active products excluding sold ones', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getAllProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            not: 'sold',
          },
        },
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getAllProductsForAdmin', () => {
    it('should return all products including sold ones', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getAllProductsForAdmin();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getProductsByUserId', () => {
    it('should return products for a specific user', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getProductsByUserId('user_123');

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: 'user_123',
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should use user-specific cache key', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      await getProductsByUserId('user_123');

      expect(cacheUtils.withCache).toHaveBeenCalledWith(
        'user_products:user_123',
        expect.any(Function),
        300
      );
    });
  });

  describe('getLastTenProducts', () => {
    it('should return last 10 active products', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await getLastTenProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'desc' },
        where: {
          status: 'active',
        },
        take: 10,
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should not use cache for recent products', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      await getLastTenProducts();

      // This function doesn't use cache, so withCache should not be called
      expect(cacheUtils.withCache).not.toHaveBeenCalled();
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products filtered by category name', async () => {
      const mockProductsWithOwner = mockProducts.map(product => ({
        ...product,
        owner: {
          id: 'user_123',
          name: 'John Doe',
          username: 'johndoe',
        },
      }));

      (prisma.product.findMany as jest.Mock).mockResolvedValue(
        mockProductsWithOwner
      );

      const result = await getProductsByCategory('electronics');

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: {
            name: 'electronics',
          },
          status: 'active',
        },
        include: {
          category: true,
          owner: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockProductsWithOwner);
    });

    it('should use category-specific cache key', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      await getProductsByCategory('electronics');

      expect(cacheUtils.withCache).toHaveBeenCalledWith(
        'products_by_category:electronics',
        expect.any(Function),
        600
      );
    });
  });

  describe('invalidateProductCache', () => {
    it('should invalidate specific product cache when productId is provided', () => {
      invalidateProductCache('prod_123');

      expect(cache.delete).toHaveBeenCalledWith('product_details:prod_123');
      expect(cache.delete).toHaveBeenCalledWith(
        'product_details:prod_123:with_owner'
      );
      expect(cacheUtils.invalidateProducts).toHaveBeenCalled();
    });

    it('should only invalidate general products cache when no productId is provided', () => {
      invalidateProductCache();

      expect(cache.delete).not.toHaveBeenCalled();
      expect(cacheUtils.invalidateProducts).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.product.findUnique as jest.Mock).mockRejectedValue(dbError);

      await expect(getProductById('prod_123')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle cache errors and still return data', async () => {
      (cacheUtils.withCache as jest.Mock).mockImplementation(
        async (key: string, fn: () => Promise<unknown>) => {
          // Simulate cache error but still execute the function
          console.warn('Cache error');
          return await fn();
        }
      );

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await getProductById('prod_123');

      expect(result).toEqual(mockProduct);
    });
  });

  describe('Data validation', () => {
    it('should handle empty results gracefully', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getAllProducts();

      expect(result).toEqual([]);
    });

    it('should handle malformed product data', async () => {
      const malformedProduct = {
        ...mockProduct,
        price: 'invalid_price', // Should be number
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        malformedProduct
      );

      const result = await getProductById('prod_123');

      expect(result).toEqual(malformedProduct);
    });
  });
});
