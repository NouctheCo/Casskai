// Minimal E2E helper: close cookie/privacy overlays that can block clicks.
// Kept intentionally defensive (different UIs may show different consent modals).

export async function dismissOverlays(page: any) {
  await dismissCookieConsent(page);
  await dismissPrivacyModal(page);
}

async function dismissCookieConsent(page: any) {
  const cookieRoot = page.locator?.('.CookieConsent');
  if (!cookieRoot) return;

  const isRootVisible = await cookieRoot.isVisible().catch(() => false);
  if (!isRootVisible) return;

  const acceptButton = cookieRoot.getByRole('button', { name: /Tout accepter|Accept cookies/i });
  const declineButton = cookieRoot.getByRole('button', { name: /Tout refuser|Decline cookies/i });

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click().catch(() => undefined);
  } else if (await declineButton.isVisible().catch(() => false)) {
    await declineButton.click().catch(() => undefined);
  }

  await cookieRoot.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
}

async function dismissPrivacyModal(page: any) {
  const heading = page.getByRole?.('heading', { name: /Respect de votre vie privée/i });
  if (!heading) return;

  const isVisible = await heading.isVisible().catch(() => false);
  if (!isVisible) return;

  // Prefer accept to reduce repeated prompts.
  const acceptButton = page.getByRole('button', { name: /^Accepter$/i });
  const refuseButton = page.getByRole('button', { name: /^Refuser$/i });

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click().catch(() => undefined);
  } else if (await refuseButton.isVisible().catch(() => false)) {
    await refuseButton.click().catch(() => undefined);
  }

  await heading.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
}
