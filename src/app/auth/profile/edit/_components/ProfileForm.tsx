"use client";

import { Input } from "@/components/ui/input";
import { User } from "better-auth";
import { useForm } from "react-hook-form";

type ProfileFormValues = {
	username: string;
	image: FileList;
};

export default function ProfileForm({ user }: { user: User }) {
	const {} = useForm<ProfileFormValues>();

	return (
		<form className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label htmlFor="username">Nom d&apos;utilisateur</label>
				<Input
					id="username"
					type="text"
					placeholder="Nom d'utilisateur"
					className="w-full max-w-md"
					defaultValue={user.name || ""}
				/>
			</div>
		</form>
	);
}
