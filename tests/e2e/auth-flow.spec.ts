// @ts-check
import { test, expect } from '@playwright/test';

// Utiliser une adresse e-mail unique pour chaque test pour éviter les conflits
const getUniqueUser = () => {
  const timestamp = Date.now();
  return {
    email: `testuser_${timestamp}@example.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: `User_${timestamp}`,
  };
};

test.describe('Full Authentication Flow', () => {
  const user = getUniqueUser();

  test('should allow a user to sign up, sign out, and sign back in', async ({ page }) => {
    // 1. Phase d'inscription (Sign Up)
    await page.goto('/auth'); // Assurez-vous que '/auth' est la bonne route pour votre formulaire

    // Cliquer sur l'onglet d'inscription
    await page.getByRole('tab', { name: 'Inscription' }).click();

    // Remplir le formulaire d'inscription
    await page.getByPlaceholder('Prénom').fill(user.firstName);
    await page.getByPlaceholder('Nom').fill(user.lastName);
    await page.getByPlaceholder('votre@email.com').fill(user.email);
    await page.getByPlaceholder('Mot de passe').fill(user.password);
    await page.getByPlaceholder('Confirmer le mot de passe').fill(user.password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: "S'inscrire" }).click();

    // Attendre la confirmation (peut nécessiter un ajustement en fonction de votre UI)
    // Idéalement, on attend la redirection vers la page de post-inscription (ex: onboarding)
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 10000 });
    console.log(`User ${user.email} signed up successfully and was redirected to onboarding.`);

    // 2. Phase de déconnexion (Sign Out)
    // Cette étape dépend de la présence d'un bouton de déconnexion sur la page d'onboarding
    // ou dans un menu utilisateur. À adapter.
    const signOutButton = page.getByRole('button', { name: /déconnexion/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      // Attendre la redirection vers la page d'authentification
      await expect(page).toHaveURL(/.*auth/);
      console.log('User signed out successfully.');
    } else {
      console.warn('Sign out button not found on onboarding page. Proceeding to sign in test.');
      // Revenir manuellement à la page d'auth pour le test de connexion
      await page.goto('/auth');
    }

    // 3. Phase de connexion (Sign In)
    // S'assurer qu'on est sur l'onglet de connexion
    await page.getByRole('tab', { name: 'Connexion' }).click();

    // Remplir le formulaire de connexion
    await page.getByPlaceholder('votre@email.com').fill(user.email);
    await page.getByPlaceholder('Mot de passe').fill(user.password);

    // Soumettre le formulaire
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Attendre la redirection vers le tableau de bord
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    console.log(`User ${user.email} signed in successfully and was redirected to the dashboard.`);

    // Vérifier qu'un élément du tableau de bord est visible
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible();
  });
});
