import { apiFetch } from '@/lib/api';

const checkUsernameAvailability = async (username: string) => {
  const response = await apiFetch(
    `/api/auth/check-username?username=${username}`,
    {
      method: 'GET',
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors de la vérification du pseudo');
  }
  return data.available;
};

export default checkUsernameAvailability;
