import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";

export default function CGU() {
	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center min-h-screen p-0">
				<section className="prose max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full h-screen flex flex-col gap-6 [&>p]:max-w-xl">
					<h1>Conditions générales d&apos;utilisation</h1>
					<p className="text-sm">
						L&apos;accès, la consultation et l&apos;utilisation,
						sont subordonnés à l&apos;acceptation sans réserve des
						présentes Conditions Générales d&apos;Utilisation.
					</p>
				</section>
			</main>
			<Footer />
		</>
	);
}
