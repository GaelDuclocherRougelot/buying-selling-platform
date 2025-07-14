"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import checkUsernameAvailability from "@/utils/checkUsernameAvailability";
import { User } from "better-auth";
import { Edit } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ProfileFormValues = {
	username: string;
	name: string;
	image: File | null; // Accepte null pour gérer l'absence d'image
};

type UserWithUsername = User & { username: string };

export default function ProfileForm({ user }: { user: UserWithUsername }) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedUser, setEditedUser] = useState<UserWithUsername>(user);
	const [imagePreview, setImagePreview] = useState<string | null | undefined>(
		user.image || null
	);

	const form = useForm<ProfileFormValues>({
		defaultValues: {
			username: user.username || "",
			name: user.name || "",
			image: null,
		},
	});
	const { setValue, register } = form;

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setValue("image", file); // Mettre à jour le champ image dans react-hook-form
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setValue("image", null);
			setImagePreview(null);
		}
	};

	const onSubmit = form.handleSubmit(async (data) => {
		try {
			let imageUrl = user.image; // Garder l'image actuelle par défaut

			// Uploader l'image si une nouvelle a été sélectionnée
			if (data.image) {
				const formData = new FormData();
				formData.append("files", data.image);
				const response = await fetch("/api/upload/profile-pictures", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || "Échec de l'upload de l'image"
					);
				}

				const imageResult = (await response.json()) as {
					urls: string[];
				};
				imageUrl = imageResult.urls[0]; // Prendre la première URL
			}

			// Vérifier la disponibilité du pseudo
			const usernameIsAvailable = await checkUsernameAvailability(
				data.username
			);
			console.log(usernameIsAvailable);

			await authClient.updateUser(
				usernameIsAvailable
					? {
							username: data.username,
							name: data.name,
							image: imageUrl,
						}
					: {
							name: data.name,
							image: imageUrl,
						},
				{
					onSuccess: () => {
						toast.success(
							"Votre profil a été mis à jour avec succès."
						);
						setEditedUser({
							...editedUser,
							username: data.username,
							name: data.name,
							image: imageUrl,
						});
						setIsEditing(false);
						setImagePreview(imageUrl);
					},
					onError: (error) => {
						if (user.username === data.username) {
							setIsEditing(false);
							return;
						}
						toast.error(
							(error.error?.message as string) ||
								"Une erreur s'est produite lors de la mise à jour du profil. Le pseudo peut être déjà utilisé."
						);
						setIsEditing(false);
					},
				}
			);

			// Mettre à jour le profil utilisateur
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Une erreur s'est produite lors de l'upload.";
			toast.error(errorMessage);
		}
	});

	return (
		<form className="flex flex-col gap-4" onSubmit={onSubmit}>
			<div
				className="flex items-center gap-2 cursor-pointer"
				onClick={() => setIsEditing(!isEditing)}
			>
				<p>Modifier mon profil</p>
				<Edit size={20} />
			</div>
			<div className="flex flex-col gap-2">
				<label htmlFor="username">Pseudo</label>
				{isEditing ? (
					<Input
						id="username"
						type="text"
						placeholder="Nom d'utilisateur"
						className="w-full max-w-md"
						{...register("username")}
					/>
				) : (
					<p className="w-full max-w-md">
						{editedUser.username}
					</p>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<label htmlFor="name">Nom complet</label>
				{isEditing ? (
					<Input
						id="name"
						type="text"
						placeholder="Nom complet"
						className="w-full max-w-md"
						{...register("name")}
					/>
				) : (
					<p className="w-full max-w-md">
						{editedUser.name}
					</p>
				)}
			</div>
			<div className="flex flex-col gap-4">
				<label>Photo de profil</label>
				{imagePreview && (
					<div className="relative w-full max-w-16 h-16 rounded-full overflow-hidden border flex items-center justify-center p-1">
						<Image
							src={imagePreview}
							alt="Image de profil"
							width={64}
							height={64}
							className="object-cover"
							quality={50}
							objectFit="cover"
						/>
					</div>
				)}
				{isEditing && (
					<div className="flex flex-col gap-2 w-fit">
						<label htmlFor="image">Image de profil</label>
						<Input
							id="image"
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="w-fit h-fit cursor-pointer"
						/>
					</div>
				)}
			</div>
			{isEditing && (
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="secondary"
						onClick={() => setIsEditing(false)}
					>
						Annuler
					</Button>
					<Button type="submit">Enregistrer</Button>
				</div>
			)}
		</form>
	);
}
