"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchHeaderProps {
	query: string;
	onSearch: (query: string) => void;
}

export function SearchHeader({ query, onSearch }: SearchHeaderProps) {
	const [searchValue, setSearchValue] = useState(query);

	// Mettre à jour la valeur quand la query change (ex: depuis l'URL)
	useEffect(() => {
		setSearchValue(query);
	}, [query]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch(searchValue);
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-4">
					Rechercher des annonces
				</h1>
				<p className="text-gray-600 mb-6">
					Trouvez exactement ce que vous cherchez parmi nos milliers
					d&apos;annonces
				</p>

				<form onSubmit={handleSubmit} className="relative">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
						<input
							type="text"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							placeholder="Que recherchez-vous ? (titre, description...)"
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
						/>
					</div>
					<button
						type="submit"
						className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
					>
						Rechercher
					</button>
				</form>
			</div>
		</div>
	);
}
