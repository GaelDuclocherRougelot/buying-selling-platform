import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Stripe from "stripe";

/**
 * Utility function to merge class names and handle conditional classes.
 *
 * @param {...ClassValue} inputs - Class names to be merged.
 * @returns {string} Merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Stripe instance for handling payments.
 * This instance is configured with the secret key and API version.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
	apiVersion: "2023-08-16",
});
