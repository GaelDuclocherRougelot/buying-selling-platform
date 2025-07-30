import { User } from "lucide-react";
import Link from "next/link";

interface SellerLinkProps {
	userId: string;
	username: string | null;
	name: string;
	className?: string;
}

export default function SellerLink({
	userId,
	username,
	name,
	className = "",
}: SellerLinkProps) {
	return (
		<Link
			href={`/profile/${userId}`}
			className={`inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors ${className}`}
		>
			<User className="h-3 w-3" />
			<span>{username || name}</span>
		</Link>
	);
}
