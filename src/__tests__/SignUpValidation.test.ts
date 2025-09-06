import { z } from 'zod';

// Validation des types de fichiers d'image acceptés
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Schéma de validation Zod pour le formulaire d'inscription
const signUpSchema = z
  .object({
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

    password: z
      .string()
      .min(1, 'Le mot de passe est requis')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(
        /[^A-Za-z0-9]/,
        'Le mot de passe doit contenir au moins un caractère spécial'
      ),

    passwordConfirmation: z
      .string()
      .min(1, 'La confirmation du mot de passe est requise'),

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
  })
  .refine(data => data.password === data.passwordConfirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirmation'],
  });

describe('SignUp Form Validation', () => {
  describe('firstName validation', () => {
    it('should accept valid first names', () => {
      const validNames = ['Jean', 'Marie-Claire', "D'Artagnan", 'José'];

      validNames.forEach(name => {
        const result = signUpSchema.shape.firstName.safeParse(name);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid first names', () => {
      const invalidNames = ['', 'A', 'Jean123', 'Marie@', 'A'.repeat(51)];

      invalidNames.forEach(name => {
        const result = signUpSchema.shape.firstName.safeParse(name);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('username validation', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['john_doe', 'user123', 'test-user', 'JohnDoe123'];

      validUsernames.forEach(username => {
        const result = signUpSchema.shape.username.safeParse(username);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '',
        'ab',
        '123user',
        'user@name',
        'user name',
        'A'.repeat(21),
      ];

      invalidUsernames.forEach(username => {
        const result = signUpSchema.shape.username.safeParse(username);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('email validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@test.org',
      ];

      validEmails.forEach(email => {
        const result = signUpSchema.shape.email.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        '@domain.com',
        'user@',
        'user.domain.com',
      ];

      invalidEmails.forEach(email => {
        const result = signUpSchema.shape.email.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('password validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = ['MyPass123!', 'Secure#456', 'Test1234@'];

      validPasswords.forEach(password => {
        const result = signUpSchema.shape.password.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        '', // empty
        'short', // too short
        'nouppercase123!', // no uppercase
        'NOLOWERCASE123!', // no lowercase
        'NoNumbers!', // no numbers
        'NoSpecialChar123', // no special characters
        'A'.repeat(129), // too long
      ];

      invalidPasswords.forEach(password => {
        const result = signUpSchema.shape.password.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('password confirmation validation', () => {
    it('should accept matching passwords', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'MyPass123!',
        passwordConfirmation: 'MyPass123!',
      };

      const result = signUpSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'MyPass123!',
        passwordConfirmation: 'DifferentPass123!',
      };

      const result = signUpSchema.safeParse(formData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues[0].path).toContain('passwordConfirmation');
        expect(result.error.issues[0].message).toBe(
          'Les mots de passe ne correspondent pas'
        );
      }
    });
  });

  describe('image validation', () => {
    it('should accept valid image files', () => {
      // Mock valid file
      const validFile = {
        0: {
          size: 1024 * 1024, // 1MB
          type: 'image/jpeg',
        },
        length: 1,
      };

      const result = signUpSchema.shape.image.safeParse(validFile);
      expect(result.success).toBe(true);
    });

    it('should accept no image (optional)', () => {
      const result = signUpSchema.shape.image.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should reject files that are too large', () => {
      // Mock file that's too large
      const largeFile = {
        0: {
          size: 6 * 1024 * 1024, // 6MB
          type: 'image/jpeg',
        },
        length: 1,
      };

      const result = signUpSchema.shape.image.safeParse(largeFile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid file types', () => {
      // Mock invalid file type
      const invalidFile = {
        0: {
          size: 1024 * 1024, // 1MB
          type: 'application/pdf',
        },
        length: 1,
      };

      const result = signUpSchema.shape.image.safeParse(invalidFile);
      expect(result.success).toBe(false);
    });
  });

  describe('complete form validation', () => {
    it('should validate a complete valid form', () => {
      const validFormData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        username: 'jean_dupont',
        email: 'jean.dupont@example.com',
        password: 'MonMotDePasse123!',
        passwordConfirmation: 'MonMotDePasse123!',
      };

      const result = signUpSchema.safeParse(validFormData);
      expect(result.success).toBe(true);
    });

    it('should provide detailed error messages for invalid form', () => {
      const invalidFormData = {
        firstName: '', // empty
        lastName: 'A', // too short
        username: '123', // starts with number
        email: 'invalid-email', // invalid format
        password: 'weak', // doesn't meet requirements
        passwordConfirmation: 'different', // doesn't match
      };

      const result = signUpSchema.safeParse(invalidFormData);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have multiple validation errors
        expect(result.error.issues.length).toBeGreaterThan(1);

        // Check that we get French error messages
        const errorMessages = result.error.issues.map(issue => issue.message);
        expect(errorMessages.some(msg => msg.includes('requis'))).toBe(true);
      }
    });
  });
});
