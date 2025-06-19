"use client";
import { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

export const SubmitButton = (props: ComponentProps<"button">) => {
	const { pending } = useFormStatus();

	return <Button {...props} disabled={props.disabled || pending} />;
};
