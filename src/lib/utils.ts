import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Stripe from "stripe";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
	apiVersion: "2023-08-16",
});
