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
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { SearchBar } from "./SearchBar";

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
		<>
			<header className="flex items-center h-20 border sticky top-0 bg-background z-50 shadow-sm">
				<div className="max-w-[85rem] mx-auto py-4 px-4 lg:px-10 w-full flex items-center">
					<div className="flex items-center w-48">
						<Link href="/" className="text-2xl font-extrabold">
							Zone
						</Link>
					</div>

					<div className="flex-1 flex justify-center px-4">
						<div className="w-full max-w-2xl flex items-center gap-4">
							<SearchBar />
						</div>
					</div>

					<div className="flex items-center gap-4 w-fit">
						<Button
							onClick={handleLinkToPublish}
							className="py-5 whitespace-nowrap hidden md:flex"
							aria-label="Déposer une annonce"
							role="link"
						>
							Déposer une annonce
						</Button>

						{/* Navigation desktop */}
						<NavigationMenu
							className="hidden md:flex"
							viewport={false}
						>
							<NavigationMenuList>
								{user?.role === "admin" && (
									<NavigationMenuItem>
										<NavigationMenuLink asChild>
											<Link
												href="/admin"
												className="flex flex-col items-center gap-1"
											>
												<DashboardSVG />
												<span className="text-xs">
													Admin
												</span>
											</Link>
										</NavigationMenuLink>
									</NavigationMenuItem>
								)}
								<NavigationMenuItem>
									<NavigationMenuLink asChild>
										<Link
											href="/categories"
											className="flex flex-col items-center gap-1"
										>
											<CategorySVG />
											<span className="text-xs">
												Catégories
											</span>
										</Link>
									</NavigationMenuLink>
								</NavigationMenuItem>
								{user ? (
									<>
										<NavigationMenuItem>
											<NavigationMenuTrigger>
												<div className="flex flex-col items-center gap-1">
													<Person />
													<span className="text-xs font-normal">
														Mon compte
													</span>
												</div>
											</NavigationMenuTrigger>
											<NavigationMenuContent className="absolute top-full right-0 mt-2 z-[100] rounded-md shadow-lg bg-popover">
												<div className="flex flex-col gap-1">
													<NavigationMenuLink asChild>
														<Link
															href="/auth/profile"
															className="flex items-center gap-2 p-2 hover:bg-accent rounded"
														>
															<Person />
															<span>
																Mon profil
															</span>
														</Link>
													</NavigationMenuLink>
													<NavigationMenuLink asChild>
														<Link
															href="/auth/favorites"
															className="flex items-center gap-2 p-2 hover:bg-accent rounded"
														>
															<Heart />
															<span>Favoris</span>
														</Link>
													</NavigationMenuLink>
													<NavigationMenuLink asChild>
														<Link
															href="/auth/orders"
															className="flex items-center gap-2 p-2 hover:bg-accent rounded"
														>
															<DashboardSVG />
															<span>
																Commandes
															</span>
														</Link>
													</NavigationMenuLink>
													<NavigationMenuLink asChild>
														<Link
															href="/auth/messages"
															className="flex items-center gap-2 p-2 hover:bg-accent rounded"
														>
															<Tchat />
															<span>
																Messages
															</span>
														</Link>
													</NavigationMenuLink>
												</div>
											</NavigationMenuContent>
										</NavigationMenuItem>
									</>
								) : (
									<NavigationMenuItem>
										<NavigationMenuLink asChild>
											<Link href="/auth/login">
												<Button
													variant="outline"
													className="cursor-pointer bg-transparent"
												>
													Se connecter
												</Button>
											</Link>
										</NavigationMenuLink>
									</NavigationMenuItem>
								)}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>
			</header>
		</>
	);
};

export default Header;
