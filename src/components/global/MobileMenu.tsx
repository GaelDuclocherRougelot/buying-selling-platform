'use client';

import { useSession } from '@/lib/auth-client';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import CategorySVG from '../svg/Category';
import DashboardSVG from '../svg/Dashboard';
import Heart from '../svg/Heart';
import Person from '../svg/Person';
import Tchat from '../svg/Tchat';
import { Button } from '../ui/button';
import Logo from '../svg/Logo';
import { SearchBar } from './SearchBar';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const user = useSession().data?.user;
  const pathname = usePathname();

  // Fermer le menu quand on change de page
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay sombre */}
      {isOpen && (
        <div
          className='fixed top-0 left-0 w-full h-full inset-0 backdrop-blur-md bg-opacity-50 z-40 md:hidden'
          onClick={onClose}
        />
      )}

      {/* Menu mobile */}
      <div
        className={`fixed md:hidden top-0 right-0 h-full w-screen bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header du menu */}
        <div className='flex items-center justify-between py-5 px-4 border-b'>
          <h2 className='text-xl font-bold' aria-label='Menu mobile'><Logo /></h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        {/* Contenu du menu */}
        <nav className='p-4 flex flex-col gap-4'>
          <SearchBar />
          <ul className='space-y-4'>
            {/* Lien vers les catégories */}
            <li>
              <Link
                href='/categories'
                className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors'
                onClick={onClose}
              >
                <CategorySVG />
                <span>Catégories</span>
              </Link>
            </li>

            {/* Menu admin si utilisateur est admin */}
            {user?.role === 'admin' && (
              <li>
                <Link
                  href='/admin'
                  className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors'
                  onClick={onClose}
                >
                  <DashboardSVG />
                  <span>Administration</span>
                </Link>
              </li>
            )}

            {/* Menu utilisateur connecté */}
            {user ? (
              <>
                <li>
                  <Link
                    href='/auth/favorites'
                    className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors'
                    onClick={onClose}
                  >
                    <Heart />
                    <span>Mes favoris</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href='/auth/messages'
                    className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors'
                    onClick={onClose}
                  >
                    <Tchat />
                    <span>Messages</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href='/auth/profile'
                    className='flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors'
                    onClick={onClose}
                  >
                    <Person />
                    <span>Mon profil</span>
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href='/auth/login'
                  className='flex items-center justify-center w-full'
                  onClick={onClose}
                >
                  <Button variant='outline' className='w-full'>
                    Se connecter
                  </Button>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
