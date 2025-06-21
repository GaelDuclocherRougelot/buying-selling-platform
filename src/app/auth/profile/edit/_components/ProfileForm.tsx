"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { User } from "better-auth";
import { Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ProfileFormValues = {
	username: string;
	name: string;
};

type UserWithUsername = User & { username: string };

export default function ProfileForm({ user }: { user: UserWithUsername }) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedUser, setEditedUser] = useState<UserWithUsername>(user);

	const form = useForm<ProfileFormValues>({
		defaultValues: {
			username: user.username || "",
			name: user.name || "",
		},
	});

	const onSubmit = form.handleSubmit(async (data) => {
		await authClient.updateUser(
			{
				username: data.username,
				name: data.name,
				image: user.image,
			},
			{
				onSuccess: () => {
					toast.success("Votre profil a été mis à jour avec succès.");
					setEditedUser((prev) => ({
						...prev,
						username: data.username,
						name: data.name,
					}));
					setIsEditing(false);
				},
				onError: () => {
					setIsEditing(false);
					toast.error(
						`Une erreur s'est produite lors de la mise à jour de votre profil.
						Le pseudo peut être déjà utilisé par un autre utilisateur.`
					);
				},
			}
		);
	});

	return (
		<form className="flex flex-col gap-4" onSubmit={onSubmit}>
			<div
				className="flex items-center gap-2 cursor-pointer font-semibold"
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
						{...form.register("username")}
					/>
				) : (
					<p className="w-full max-w-md font-semibold">
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
						{...form.register("name")}
					/>
				) : (
					<p className="w-full max-w-md font-semibold">
						{editedUser.name}
					</p>
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
