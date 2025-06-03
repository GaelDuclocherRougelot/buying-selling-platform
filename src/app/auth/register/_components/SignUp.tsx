"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormValues = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	passwordConfirmation: string;
	image: FileList;
};

export default function SignUp() {
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		reset,
	} = useForm<FormValues>();
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
		if (data.password !== data.passwordConfirmation) {
			toast.error("Les mots de passe ne correspondent pas.");
			return;
		}
		setLoading(true);
		const imageFile = data.image?.[0];
		const { error } = await signUp.email({
			email: data.email,
			password: data.password,
			name: `${data.firstName} ${data.lastName}`,
			image: imageFile ? await convertImageToBase64(imageFile) : "",
			fetchOptions: {
				onResponse: () => setLoading(false),
				onRequest: () => setLoading(true),
				onError: (ctx) => { toast.error(ctx.error.message); },
				onSuccess: async () => router.push("/auth/login"),
			},
		});
		setLoading(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		reset();
		setImagePreview(null);
	};

	const handleRemoveImage = () => {
		setValue("image", undefined as unknown as FileList);
		setImagePreview(null);
	};

	return (
		<Card className="max-w-[30rem] w-full">
			<CardHeader>
				<CardTitle className="text-lg md:text-2xl font-bold text-center">
					S&apos;inscrire
				</CardTitle>
				<CardDescription className="text-xs md:text-sm text-center">
					Entrez vos informations ci-dessous pour créer un compte
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="first-name">Prénom</Label>
							<Input
								id="first-name"
								placeholder="John"
								{...register("firstName", { required: true })}
							/>
							{errors.firstName && (
								<span className="text-xs text-red-500">
									Le prénom est requis.
								</span>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last-name">Nom</Label>
							<Input
								id="last-name"
								placeholder="Doe"
								{...register("lastName", { required: true })}
							/>
							{errors.lastName && (
								<span className="text-xs text-red-500">
									Le nom est requis.
								</span>
							)}
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="john.doe@example.com"
							{...register("email", {
								required: true,
								pattern: /^\S+@\S+$/i,
							})}
						/>
						{errors.email && (
							<span className="text-xs text-red-500">
								Un email valide est requis.
							</span>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Mot de passe</Label>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							placeholder="Mot de passe"
							{...register("password", { required: true })}
						/>
						{errors.password && (
							<span className="text-xs text-red-500">
								Le mot de passe est requis.
							</span>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password_confirmation">
							Confirmer le mot de passe
						</Label>
						<Input
							id="password_confirmation"
							type="password"
							autoComplete="new-password"
							placeholder="Confirmer le mot de passe"
							{...register("passwordConfirmation", {
								required: true,
							})}
						/>
						{errors.passwordConfirmation && (
							<span className="text-xs text-red-500">
								La confirmation du mot de passe est requise.
							</span>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="image">
							Image de profil (facultatif)
						</Label>
						<div className="flex items-center gap-4">
							{imagePreview && (
								<div className="relative w-full max-w-16 h-16 rounded-full overflow-hidden">
									<Image
										src={imagePreview}
										alt="Image de profil"
										layout="fill"
										objectFit="cover"
									/>
								</div>
							)}
							<div className="flex items-center gap-2 w-full">
								<Input
									id="image"
									type="file"
									accept="image/*"
									{...register("image")}
									onChange={(e) => {
										register("image").onChange(e);
										handleImageChange(e);
									}}
									className="w-full"
								/>
								{imagePreview && (
									<X
										className="cursor-pointer"
										onClick={handleRemoveImage}
									/>
								)}
							</div>
						</div>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Créer un compte"
						)}
					</Button>
				</form>
			</CardContent>
			<div className="flex items-center justify-center w-full py-2">
				<p className="text-sm text-muted-foreground">
					Déja un compte ?{" "}
					<Link
						href="/auth/login"
						className="underline hover:text-primary"
					>
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
