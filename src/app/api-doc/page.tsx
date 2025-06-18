import { getApiDocs } from "@/lib/swagger/swagger";
import ReactSwagger from "@/features/docs/SwaggerUI";

export default async function IndexPage() {
	const spec = await getApiDocs() as Record<string, unknown>;
	return (
		<section className="container">
			<ReactSwagger spec={spec} />
		</section>
	);
}
