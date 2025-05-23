import Link from "next/link";
import Heart from "../svg/Heart";
import Person from "../svg/Person";
import Tchat from "../svg/Tchat";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const Header = () => {
	return (
		<header className="flex items-center justify-between h-20 border sticky top-0 bg-background z-50 shadow-sm">
			<div className="max-w-[85rem] mx-auto py-4 px-4 lg:px-10 flex items-center justify-between w-full">
				<h1 className="text-2xl w-full">LOGO</h1>
				<div className="flex items-center gap-4 w-full">
					<Button>Déposer une annonce</Button>
					<Input placeholder="Rechercher" />
				</div>
				<nav className="hidden w-full md:flex justify-end">
					<ul className="flex items-center gap-4 [&>li]:cursor-pointer [&>li>a]:flex [&>li>a]:flex-col [&>li>a]:items-center [&>li>a]:justify-center [&>li>a>p]:text-sm">
						<li>
							<Link href="/favorites">
								<Heart />
								<p>Favoris</p>
							</Link>
						</li>
						<li>
							<Link href="/messages">
								<Tchat />
								<p>Messages</p>
							</Link>
						</li>
						<li>
							<Link href="/auth/login">
								<Person />
								<p>Se connecter</p>
							</Link>
						</li>
					</ul>
				</nav>
			</div>
		</header>
	);
};

export default Header;
