import React from 'react'
import SignUp from './_components/SignUp';

/**
 * SignUp page component.
 * This component renders the SignUp form within a main section.
 *
 * @returns {JSX.Element} The SignUp page component
 */
export default function page(): JSX.Element {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-0">
            <SignUp />
        </main>
    );
}
