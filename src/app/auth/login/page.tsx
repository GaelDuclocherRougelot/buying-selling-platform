
/**
 * Renders the login page for the application.
 *
 * This component displays a centered layout containing the `LoginForm` component,
 * which handles user authentication.
 *
 * @returns The login page layout with the sign-in form.
 */
import LoginForm from "./_components/SignIn";

export default function Login() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-0">
			<LoginForm />
		</main>
	);
}
