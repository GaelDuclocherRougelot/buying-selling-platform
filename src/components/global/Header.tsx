"use client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CategorySVG from "../svg/Category";
import DashboardSVG from "../svg/Dashboard";
import Heart from "../svg/Heart";
import Person from "../svg/Person";
import Tchat from "../svg/Tchat";
import { Button } from "../ui/button";
import { SearchBar } from "./SearchBar";
// import MobileMenu from "./MobileMenu";

/**
 * Header component for the main navigation bar.
 * Shows navigation links and user actions.
 *
 * @component
 * @returns {JSX.Element}
 */
const Header = (): JSX.Element => {
	const user = useSession().data?.user;
	const router = useRouter();
	// const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLinkToPublish = () => {
		if (!user) {
			toast.error("Veuillez vous connecter pour déposer une annonce");
			router.push("/auth/login");
			return;
		}
		if (!user?.emailVerified) {
			toast.error(
				"Veuillez vérifier votre email pour déposer une annonce"
			);
			router.push("/auth/profile/edit");
			return;
		}
		router.push("/auth/publish");
	};

	// const toggleMobileMenu = () => {
	// 	setIsMobileMenuOpen(!isMobileMenuOpen);
	// };

	// const closeMobileMenu = () => {
	// 	setIsMobileMenuOpen(false);
	// };

	return (
		<>
			<header className="flex items-center justify-between h-20 border sticky top-0 bg-background z-50 shadow-sm">
				<div className="max-w-[85rem] mx-auto py-4 px-4 lg:px-10 flex items-center justify-between w-full">
					{/* Logo et bouton burger */}
					<div className="flex items-center gap-4">
						<Link href="/" className="text-2xl font-extrabold">
							Zone
						</Link>
					</div>

					{/* Barre de recherche et bouton publier */}
					<div className="flex items-center gap-4 w-full max-w-md mx-4">
						<Button
							onClick={handleLinkToPublish}
							className="py-5 whitespace-nowrap"
							aria-label="Déposer une annonce"
							role="link"
						>
							Déposer une annonce
						</Button>
						<SearchBar />
					</div>

					{/* Navigation desktop */}
					<nav className="hidden md:flex justify-end">
						<ul className="flex items-center gap-4 [&>li]:cursor-pointer [&>li>a]:flex [&>li>a]:flex-col [&>li>a]:items-center [&>li>a]:justify-center [&>li>a>p]:text-sm">
							{user?.role === "admin" && (
								<li>
									<Link href="/admin">
										<DashboardSVG />
										<p>Admin</p>
									</Link>
								</li>
							)}
							<li>
								<Link href="/categories">
									<CategorySVG />
									<p>Catégories</p>
								</Link>
							</li>
							{user ? (
								<>
									{" "}
									<li>
										<Link href="/auth/favorites">
											<Heart />
											<p>Favoris</p>
										</Link>
									</li>
									<li>
										<Link href="/auth/orders">
											<DashboardSVG />
											<p>Commandes</p>
										</Link>
									</li>
									<li>
										<Link href="/auth/messages">
											<Tchat />
											<p>Messages</p>
										</Link>
									</li>
									<li>
										<Link href="/auth/profile">
											<Person />
											<p>Mon profil</p>
										</Link>
									</li>
								</>
							) : (
								<li>
									<Link href="/auth/login">
										<Button
											variant="outline"
											className="cursor-pointer"
										>
											Se connecter
										</Button>
									</Link>
								</li>
							)}
						</ul>
					</nav>
				</div>
			</header>

			{/* Menu mobile */}
		</>
	);
};

export default Header;
