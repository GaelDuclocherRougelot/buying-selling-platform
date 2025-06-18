import { Resend } from 'resend';

/**
 * Resend instance for sending emails.
 * This instance is configured with the API key from environment variables.
 */
export const resend = new Resend(process.env.RESEND_API_KEY || '');