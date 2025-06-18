"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
	spec: Record<string, unknown>;
};

/**
 * ReactSwagger component renders Swagger UI with the provided OpenAPI specification.
 *
 * @param {Props} props - Component properties
 * @returns {JSX.Element} The Swagger UI component
 */
function ReactSwagger({ spec }: Props) {
	return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
