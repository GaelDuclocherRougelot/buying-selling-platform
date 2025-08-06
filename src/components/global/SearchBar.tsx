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
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
				<Input
					type="text"
					placeholder="Rechercher une annonce"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="pl-10 cursor-text w-20"
				/>

				<Button onClick={handleSubmit}>
                    <Search />
                    Rechercher
				</Button>
			</div>
		</form>
	);
}
