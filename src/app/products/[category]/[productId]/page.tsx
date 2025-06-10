import Header from "@/components/global/Header";

export default async function Home(props: {
	params: Promise<{ category: string; productId: string }>;
}) {
	const params = await props.params;
	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen p-0">
				<pre>{JSON.stringify(params, null, 2)}</pre>
			</main>
		</>
	);
}
