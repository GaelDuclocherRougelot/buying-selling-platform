"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";

export function SearchBar() {
	const [query, setQuery] = useState("");
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			router.push(`/search?q=${encodeURIComponent(query.trim())}`);
		} else {
			// Si la recherche est vide, aller à la page de recherche générale
			router.push("/search");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex-1">
			<div className="relative flex items-center gap-2">
				<Input
					type="text"
					placeholder="Rechercher..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="cursor-text w-full md:max-w-64 min-w-48"
				/>

				<Button onClick={handleSubmit}>
					<Search />
					<span className="hidden md:block">Rechercher</span>
				</Button>
			</div>
		</form>
	);
}
