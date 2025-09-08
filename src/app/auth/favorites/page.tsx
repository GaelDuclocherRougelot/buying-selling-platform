'use client';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { Eye, Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    condition: string;
    imagesUrl: string[];
    status: string;
    category: {
      id: string;
      displayName: string;
    };
    owner: {
      id: string;
      name: string;
      username: string | null;
    };
  };
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await apiFetch(
        `/api/favorites?userId=${session?.user?.id}`,
        { method: 'GET' }
      );
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        console.error('Error fetching favorites');
        toast.error('Erreur lors du chargement des favoris');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFavorites();
    }
  }, [session?.user?.id, fetchFavorites]);

  const removeFavorite = async (productId: string) => {
    try {
      const response = await apiFetch(`/api/favorites/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
        toast.success('Produit retiré des favoris');
      } else {
        console.error('Error removing favorite');
        toast.error('Erreur lors de la suppression du favori');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Erreur lors de la suppression du favori');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const translateCondition = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
      case 'neuf':
        return 'Neuf';
      case 'good':
        return 'Bon état';
      case 'mid':
        return 'État moyen';
      case 'used':
        return 'Mauvais état';
      default:
        return condition;
    }
  };

  if (loading) {
    return (
      <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-screen'>
        <div className='text-center'>
          <p className='mt-4 text-gray-600'>Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <section className='max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6 bg-white h-screen'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
          Mes Favoris
        </h1>
        <p className='mt-2 text-gray-600'>
          {favorites.length} produit
          {favorites.length !== 1 ? 's' : ''} dans vos favoris
        </p>

        {favorites.length === 0 ? (
          <div className='text-center py-12 mx-auto w-fit'>
            <Heart className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucun favori pour le moment
            </h3>
            <p className='text-gray-600 mb-6'>
              Ajoutez des produits à vos favoris pour les retrouver facilement
              ici.
            </p>
            <Link href='/'>
              <Button>Découvrir des produits</Button>
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {favorites.map(favorite => (
              <div
                key={favorite.id}
                className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300'
              >
                <div className='relative h-32 bg-gray-200'>
                  <Image
                    src={favorite.product.imagesUrl[0]}
                    alt={favorite.product.title}
                    width={300}
                    height={300}
                    className='object-cover w-full h-full'
                  />
                </div>

                <div className='p-4'>
                  <div className='flex items-start justify-between mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>
                      {favorite.product.title}
                    </h3>
                  </div>

                  <p className='text-2xl font-bold text-blue-600 mb-2'>
                    {formatPrice(favorite.product.price)}
                  </p>

                  {favorite.product.description && (
                    <p className='text-gray-600 text-sm mb-3 line-clamp-2'>
                      {favorite.product.description}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500 mb-3'>
                    <span>
                      Catégorie: {favorite.product.category.displayName}
                    </span>
                    <span>
                      État: {translateCondition(favorite.product.condition)}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-500'>
                      Par{' '}
                      <Link
                        href={`/profile/${favorite.product.owner.id}`}
                        className='hover:text-blue-600 transition-colors'
                      >
                        {favorite.product.owner.username ||
                          favorite.product.owner.name}
                      </Link>
                    </div>
                    <div className='flex gap-2 mt-2'>
                      <Link
                        href={`/products/${favorite.product.category.id}/${favorite.product.id}`}
                      >
                        <Button
                          size='sm'
                          variant='outline'
                          className='cursor-pointer'
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                      </Link>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='cursor-pointer'
                        onClick={() => removeFavorite(favorite.product.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
