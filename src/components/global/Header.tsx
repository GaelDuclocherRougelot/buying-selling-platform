'use client';

import { useSession } from '@/lib/auth-client';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import CategorySVG from '../svg/Category';
import DashboardSVG from '../svg/Dashboard';
import Heart from '../svg/Heart';
import Logo from '../svg/Logo';
import Person from '../svg/Person';
import Tchat from '../svg/Tchat';
import { Button } from '../ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu';
import MobileMenu from './MobileMenu';
import { SearchBar } from './SearchBar';

/**
 * Header component for the main navigation bar.
 * Shows navigation links and user actions.
 *
 * @component
 * @returns {JSX.Element}
 */
const Header = (): JSX.Element => {
  const user = useSession().data?.user;
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleLinkToPublish = () => {
    if (!user) {
      handleError('Veuillez vous connecter pour déposer une annonce', {
        showToast: true,
        logToConsole: true,
      });
      router.push('/auth/login');
      return;
    }
    if (!user?.emailVerified) {
      handleError('Veuillez vérifier votre email pour déposer une annonce', {
        showToast: true,
        logToConsole: true,
      });
      router.push('/auth/profile/edit');
      return;
    }
    router.push('/auth/publish');
  };

  return (
    <>
      <header className='flex flex-row items-center h-20 border sticky top-0 bg-background z-50 shadow-sm'>
        <div className='max-w-[85rem] mx-auto py-4 px-4 lg:px-10 w-full flex justify-between md:justify-normal items-center'>
          <div className='flex items-center w-fit'>
            <Link href='/' className='text-2xl font-extrabold'>
              <Logo />
            </Link>
          </div>

          <div className='hidden md:flex flex-1 justify-center px-4'>
            <div className='w-full max-w-2xl flex items-center gap-4'>
              <SearchBar />
            </div>
          </div>

          <div className='flex items-center gap-4 w-fit'>
            <Button
              onClick={handleLinkToPublish}
              className='py-5 whitespace-nowrap hidden md:flex'
              aria-label='Déposer une annonce'
              role='link'
            >
              Déposer une annonce
            </Button>

            {/* Navigation desktop */}
            <NavigationMenu className='hidden md:flex' viewport={false}>
              <NavigationMenuList>
                {user?.role === 'admin' && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href='/admin'
                        className='flex flex-col items-center gap-2'
                      >
                        <DashboardSVG />
                        <span className='text-sm'>Admin</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href='/categories'
                      className='flex flex-col items-center gap-2'
                    >
                      <CategorySVG />
                      <span className='text-sm'>Catégories</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {user ? (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger>
                        <div className='flex flex-col items-center gap-2'>
                          <Person />
                          <span className='text-sm font-normal'>
                            Mon compte
                          </span>
                        </div>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className='absolute top-full right-0 mt-2 z-[100] rounded-md shadow-lg bg-popover'>
                        <div className='flex flex-col gap-1'>
                          <NavigationMenuLink asChild>
                            <Link
                              href='/auth/profile'
                              className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                            >
                              <Person />
                              <span>Profil</span>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              href='/auth/favorites'
                              className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                            >
                              <Heart />
                              <span>Favoris</span>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              href='/auth/messages'
                              className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                            >
                              <Tchat />
                              <span>Messages</span>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              href='/auth/orders'
                              className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                            >
                              <DashboardSVG />
                              <span>Commandes</span>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              href='/auth/publish'
                              className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                            >
                              <DashboardSVG />
                              <span>Publier</span>
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </>
                ) : (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href='/auth/login'
                          className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                        >
                          <Person />
                          <span>Connexion</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href='/auth/register'
                          className='flex items-center gap-2 p-2 hover:bg-accent rounded'
                        >
                          <Person />
                          <span>Inscription</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden'
              aria-label='Menu mobile'
              onClick={() => {
                console.log(
                  'Menu button clicked, current state:',
                  isMobileMenuOpen
                );
                setIsMobileMenuOpen(prev => !prev);
              }}
            >
              <div className='flex flex-col gap-1'>
                <span
                  className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-current transition-opacity duration-300 ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                ></span>
              </div>
            </Button>
          </div>
        </div>
        {/* <div className="w-screen h-20 bg-background flex items-center justify-center md:hidden px-4 pb-4">
					<SearchBar />
				</div> */}
      </header>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={handleCloseMobileMenu} />
    </>
  );
};

export default Header;
