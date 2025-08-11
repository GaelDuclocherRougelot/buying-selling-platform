import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import { WebSocketProvider } from "@/lib/contexts/WebSocketContext";

export default function MessagesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<WebSocketProvider>
			<Header />
			<main className="flex flex-col p-0 bg-white min-h-screen">
				{children}
			</main>
			<Footer />
		</WebSocketProvider>
	);
}
