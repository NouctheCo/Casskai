export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export async function simulatePasswordReset(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  // Simuler un délai d'API
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simuler différents scénarios
  const lowercaseEmail = email.toLowerCase().trim();

  if (lowercaseEmail.includes('notfound') || lowercaseEmail.includes('inexistant')) {
    return {
      success: false,
      error: "Aucun compte n'est associé à cette adresse email."
    };
  }

  if (lowercaseEmail.includes('blocked') || lowercaseEmail.includes('suspend')) {
    return {
      success: false,
      error: "Ce compte est temporairement suspendu. Contactez le support."
    };
  }

  // Succès par défaut
  return {
    success: true,
    message: "Un email de réinitialisation a été envoyé à votre adresse."
  };
}
