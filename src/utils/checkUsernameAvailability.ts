const checkUsernameAvailability = async (username: string) => {
	const response = await fetch(
		`/api/auth/check-username?username=${username}`,
		{
			method: "GET",
		}
	);
	const data = await response.json();
	if (!response.ok) {
		throw new Error(
			data.error || "Erreur lors de la vérification du pseudo"
		);
	}
	return data.avalaible;
};

export default checkUsernameAvailability;