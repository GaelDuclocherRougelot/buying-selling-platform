"use client";

import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import { Suspense } from "react";
import { SearchContent } from "./_components/SearchContent";

export default function SearchPage() {
	return (
		<>
			<Header />
			<Suspense fallback={<div>Chargement...</div>}>
				<SearchContent />
			</Suspense>
			<Footer />
		</>
	);
}
