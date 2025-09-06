'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
// import { signUp } from '@/lib/auth-client';
import checkUsernameAvailability from '@/utils/checkUsernameAvailability';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import profile_default from '../../../../../public/images/profile_default.webp';

// Validation des types de fichiers d'image acceptés
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Schéma de validation Zod pour le formulaire d'inscription (sans mot de passe)
const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(
      /^[a-zA-ZÀ-ÿ\s-']+$/,
      'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    ),

  lastName: z
    .string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(
      /^[a-zA-ZÀ-ÿ\s-']+$/,
      'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    ),

  username: z
    .string()
    .min(1, "Le nom d'utilisateur est requis")
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
    )
    .regex(/^[a-zA-Z]/, "Le nom d'utilisateur doit commencer par une lettre"),

  email: z
    .string()
    .min(1, "L'email est requis")
    .email('Veuillez saisir un email valide')
    .max(255, "L'email ne peut pas dépasser 255 caractères"),

  image: z
    .any()
    .optional()
    .refine(files => {
      if (!files || files.length === 0) return true; // Optionnel
      return files[0]?.size <= MAX_FILE_SIZE;
    }, "L'image doit faire moins de 5MB")
    .refine(files => {
      if (!files || files.length === 0) return true; // Optionnel
      return ACCEPTED_IMAGE_TYPES.includes(files[0]?.type);
    }, 'Seuls les formats JPEG, PNG et WebP sont acceptés'),
});

type FormValues = z.infer<typeof signUpSchema>;

/**
 * SignUp component renders a registration form for new users.
 * It includes fields for first name, last name, email, password, and an optional profile image.
 *
 * @returns {JSX.Element} The SignUp component
 */
export default function SignUp(): JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur', // Validation on blur for better UX
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    const usernameIsAvailable = await checkUsernameAvailability(data.username);

    if (!usernameIsAvailable) {
      toast.error('Ce pseudo est déjà utilisé.');
      setLoading(false);
      return;
    }

    let imageFile: File | null = null;
    if (data.image && data.image[0]) {
      imageFile = data.image[0];
    } else {
      // Convert the default image (profile_default) to a File object
      const response = await apiFetch(profile_default.src, {
        method: 'GET',
      });
      const blob = await response.blob();
      imageFile = new File([blob], 'profile_default.webp', {
        type: blob.type,
      });
    }
    try {
      await apiFetch('/api/auth/pending-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          name: `${data.firstName} ${data.lastName}`,
          image: imageFile ? await convertImageToBase64(imageFile) : '',
          role: 'user',
        }),
      });
      toast.success('Vérifiez votre email pour finaliser votre inscription.');
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      // error handled by apiFetch
    } finally {
      setLoading(false);
    }
    reset();
    setImagePreview(null);
  };

  const handleRemoveImage = () => {
    setValue('image', undefined as unknown as FileList);
    setImagePreview(null);
  };

  return (
    <Card className='max-w-[30rem] w-full'>
      <CardHeader>
        <CardTitle className='text-lg md:text-2xl font-bold text-center'>
          S&apos;inscrire
        </CardTitle>
        <CardDescription className='text-xs md:text-sm text-center'>
          Entrez vos informations ci-dessous pour créer un compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4' onSubmit={handleSubmit(onSubmit)}>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='first-name'>Prénom</Label>
              <Input
                id='first-name'
                placeholder='John'
                {...register('firstName')}
              />
              {errors.firstName && (
                <span className='text-xs text-red-500'>
                  {errors.firstName.message}
                </span>
              )}
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='last-name'>Nom</Label>
              <Input
                id='last-name'
                placeholder='Doe'
                {...register('lastName')}
              />
              {errors.lastName && (
                <span className='text-xs text-red-500'>
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='username'>Nom d&apos;utilisateur</Label>
            <Input
              id='username'
              placeholder='john_doe'
              {...register('username')}
            />
            {errors.username && (
              <span className='text-xs text-red-500'>
                {errors.username.message}
              </span>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='john.doe@example.com'
              {...register('email')}
            />
            {errors.email && (
              <span className='text-xs text-red-500'>
                {errors.email.message}
              </span>
            )}
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='image'>Image de profil (facultatif)</Label>
            <div className='flex items-center gap-4'>
              {imagePreview && (
                <div className='relative w-full max-w-16 h-16 rounded-full overflow-hidden'>
                  <Image
                    src={imagePreview}
                    alt='Image de profil'
                    layout='fill'
                    objectFit='cover'
                  />
                </div>
              )}
              <div className='flex items-center gap-2 w-full'>
                <Input
                  id='image'
                  type='file'
                  accept='image/*'
                  {...register('image')}
                  onChange={e => {
                    register('image').onChange(e);
                    handleImageChange(e);
                  }}
                  className='w-full'
                />
                {imagePreview && (
                  <X className='cursor-pointer' onClick={handleRemoveImage} />
                )}
              </div>
            </div>
            {errors.image && (
              <span className='text-xs text-red-500'>
                {errors.image.message?.toString()}
              </span>
            )}
          </div>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              'Créer un compte'
            )}
          </Button>
        </form>
      </CardContent>
      <div className='flex items-center justify-center w-full py-2'>
        <p className='text-sm text-muted-foreground'>
          Déja un compte ?{' '}
          <Link href='/auth/login' className='underline hover:text-primary'>
            Se connecter
          </Link>
        </p>
      </div>
    </Card>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
