"use client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CategorySVG from "../svg/Category";
import Heart from "../svg/Heart";
import Person from "../svg/Person";
import Tchat from "../svg/Tchat";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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

	return (
		<header className="flex items-center justify-between h-20 border sticky top-0 bg-background z-50 shadow-sm">
			<div className="max-w-[85rem] mx-auto py-4 px-4 lg:px-10 flex items-center justify-between w-full">
				<Link href="/" className="text-2xl w-full font-extrabold">
					Zone
				</Link>
				<div className="flex items-center gap-4 w-full">
					<Button
						onClick={handleLinkToPublish}
						className="py-5"
						aria-label="Déposer une annonce (lien)"
						role="link"
					>
						Déposer une annonce
					</Button>
					<Input placeholder="Rechercher" />
				</div>
				<nav className="hidden w-full md:flex justify-end">
					<ul className="flex items-center gap-4 [&>li]:cursor-pointer [&>li>a]:flex [&>li>a]:flex-col [&>li>a]:items-center [&>li>a]:justify-center [&>li>a>p]:text-sm">
						<li>
							<Link href="/categories">
								<CategorySVG />
								Catégories
							</Link>
						</li>
						{user ? (
							<>
								{" "}
								<li>
									<Link href="/auth/favorites">
										<Heart />
										Favoris
									</Link>
								</li>
								<li>
									<Link href="/auth/messages">
										<Tchat />
										Messages
									</Link>
								</li>
								<li>
									<Link href="/auth/profile">
										<Person />
										Mon profil
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
	);
};

export default Header;
