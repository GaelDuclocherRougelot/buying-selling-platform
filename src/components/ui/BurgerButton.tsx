import { Menu } from "lucide-react";
import { Button } from "./button";

interface BurgerButtonProps {
	onClick: () => void;
	className?: string;
}

export default function BurgerButton({
	onClick,
	className,
}: BurgerButtonProps) {
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onClick}
			className={`md:hidden ${className}`}
			aria-label="Ouvrir le menu"
		>
			<Menu className="h-8 w-8" />
		</Button>
	);
}
