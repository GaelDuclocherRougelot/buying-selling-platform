import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface ProductStatusBadgeProps {
	status: string;
	className?: string;
}

export default function ProductStatusBadge({
	status,
	className = "",
}: ProductStatusBadgeProps) {
	const getStatusConfig = (status: string) => {
		switch (status) {
			case "sold":
				return {
					variant: "destructive" as const,
					icon: <XCircle className="h-3 w-3" />,
					text: "Vendu",
					className: "bg-red-100 text-red-800 border-red-200",
				};
			case "pending":
				return {
					variant: "outline" as const,
					icon: <Clock className="h-3 w-3" />,
					text: "En attente",
					className:
						"bg-yellow-100 text-yellow-800 border-yellow-200",
				};
			case "active":
			default:
				return {
					variant: "default" as const,
					icon: <CheckCircle className="h-3 w-3" />,
					text: "Disponible",
					className: "bg-green-100 text-green-800 border-green-200",
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<Badge
			variant={config.variant}
			className={`flex items-center gap-1 ${config.className} ${className}`}
		>
			{config.icon}
			{config.text}
		</Badge>
	);
}
