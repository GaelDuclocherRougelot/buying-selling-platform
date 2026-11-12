import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware, isAPIError } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { openAPI, username } from 'better-auth/plugins';
import { resend } from './resend';
import { securityLog } from './security-log';

const prisma = new PrismaClient();

const SIGN_IN_PATHS = ['/sign-in/email', '/sign-in/username'];

/**
 * Authentication configuration for the application.
 * This configuration uses BetterAuth for user management and authentication.
 * It includes email and password authentication, social login with Google,
 * and username validation.
 */
/**
 * Origines autorisées en plus de BETTER_AUTH_URL : URLs des déploiements
 * de preview Vercel (fournies par Vercel au build/runtime).
 */
const vercelPreviewOrigins =
  process.env.VERCEL_ENV === 'preview'
    ? [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
        .filter((host): host is string => Boolean(host))
        .map(host => `https://${host}`)
    : [];

export const auth = betterAuth({
  // En preview, les liens des emails (vérification, mot de passe oublié)
  // doivent rester sur la preview et non pointer vers BETTER_AUTH_URL (prod).
  baseURL: vercelPreviewOrigins[0],
  trustedOrigins: vercelPreviewOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      await resend.emails.send({
        from: 'ZONE <noreply@noreply.gael-dr.fr>',
        to: [data.user.email],
        subject: 'Réinitialiser votre mot de passe',
        text: `Réinitialiser votre mot de passe en cliquant sur ce lien : ${data.url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: 'ZONE <noreply@noreply.gael-dr.fr>',
        to: [user.email],
        subject: 'Vérifiez votre adresse email',
        text: `Merci de vérifier votre adresse email en cliquant sur ce lien : ${url}`,
      });
    },
  },
  socialProviders: {
    google: {
      prompt: 'select_account',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        unique: false,
      },
      displayUsername: {
        type: 'string',
        unique: false,
      },
      stripeAccountId: {
        type: 'string',
        unique: false,
        input: false, // server-controlled, never client-settable
      },
      stripeAccountStatus: {
        type: 'string',
        unique: false,
        input: false, // server-controlled, never client-settable
      },
      role: {
        type: 'string',
        defaultValue: 'user', // Default role for new users
        input: false, // server-controlled, never client-settable
      },
      deletedAt: {
        type: 'date',
        default: null, // Field to mark user deletion
        required: false,
        input: false, // server-controlled, never client-settable
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  hooks: {
    // Événements de connexion envoyés au SIEM (brute force)
    after: createAuthMiddleware(async ctx => {
      if (!SIGN_IN_PATHS.includes(ctx.path) || !ctx.headers) return;
      const failed = isAPIError(ctx.context.returned);
      await securityLog(
        failed ? 'auth.login_failed' : 'auth.login_success',
        ctx.headers,
        {
          path: ctx.path,
          login: ctx.body?.email ?? ctx.body?.username,
          userId: ctx.context.newSession?.user.id,
        },
      );
    }),
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      '/auth/register': {
        window: 10,
        max: 100,
      },
      '/auth/login': {
        window: 10,
        max: 100,
      },
      '/auth/reset-password': {
        window: 10,
        max: 100,
      },
      '/auth/verify-email': {
        window: 10,
        max: 100,
      },
    },
    storage: 'memory',
    modelName: 'rateLimit',
  },
  plugins: [
    nextCookies(),
    openAPI(),
    username({
      minUsernameLength: 5,
      maxUsernameLength: 20,
      usernameValidator: username => {
        if (username === 'admin') {
          return false; // Prevent using 'admin' as a username
        }
        return /^[a-zA-Z0-9_]+$/.test(username); // Only allow alphanumeric characters and underscores
      },
    }),
  ],
});
