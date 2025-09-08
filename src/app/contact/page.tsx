"use client";

import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { handleError } from "@/lib/error-handler";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import { z } from "zod";

const schema = z.object({
	name: z.string().min(2, "Nom trop court").max(100),
	email: z.string().email("Email invalide").max(200),
	subject: z.string().min(3, "Sujet trop court").max(150),
	message: z.string().min(10, "Message trop court").max(5000),
	website: z.string().optional(), // Honeypot
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
	const [submitting, setSubmitting] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({ resolver: zodResolver(schema) });

	const onSubmit = async (values: FormValues) => {
		try {
			setSubmitting(true);
			const res = await apiFetch("/api/contact", {
				method: "POST",
				body: JSON.stringify(values),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Erreur lors de l'envoi");
			}
			toast.success("Message envoyé. Nous vous répondrons rapidement.");
			reset();
		} catch (err: unknown) {
			handleError(err);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<Header />
			<main className="prose max-w-[85rem] h-screen mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
				<h1>Contact</h1>
				<p>
					Une question, une remarque, un partenariat ? Envoyez-nous un
					message via ce formulaire.
				</p>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="grid gap-4 max-w-xl"
				>
					<div>
						<label htmlFor="name">Nom</label>
						<input
							id="name"
							className="w-full border rounded px-3 py-2"
							placeholder="Votre nom"
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-red-600 text-sm">
								{errors.name.message}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="email">Email</label>
						<input
							id="email"
							className="w-full border rounded px-3 py-2"
							type="email"
							placeholder="vous@exemple.com"
							{...register("email")}
						/>
						{errors.email && (
							<p className="text-red-600 text-sm">
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="subject">Sujet</label>
						<input
							id="subject"
							className="w-full border rounded px-3 py-2"
							placeholder="Sujet du message"
							{...register("subject")}
						/>
						{errors.subject && (
							<p className="text-red-600 text-sm">
								{errors.subject.message}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="message">Message</label>
						<textarea
							id="message"
							className="w-full border rounded px-3 py-2 min-h-40"
							placeholder="Décrivez votre demande"
							{...register("message")}
						/>
						{errors.message && (
							<p className="text-red-600 text-sm">
								{errors.message.message}
							</p>
						)}
					</div>

					{/* Honeypot */}
					<input
						type="text"
						className="hidden"
						autoComplete="off"
						placeholder="Laissez ce champ vide"
						{...register("website")}
					/>

					<Button type="submit" disabled={submitting}>
						{submitting ? "Envoi..." : "Envoyer"}
					</Button>
				</form>
			</main>
			<Toaster />
			<Footer />
		</>
	);
}
