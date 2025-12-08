import React from 'react';

function PasswordResetForm({ email, setEmail, handleSubmit, isLoading, navigate, t }: { email: string; setEmail: React.Dispatch<React.SetStateAction<string>>; handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void; isLoading: boolean; navigate: (path: string) => void; t: (key: string, options?: Record<string, string>) => string }) {
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">{t('auth.emailAddress', { defaultValue: 'Adresse email' })}</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('auth.emailPlaceholder', { defaultValue: 'exemple@email.com' })}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !email.trim()}>
        {isLoading ? t('auth.sending', { defaultValue: 'Envoi en cours...' }) : t('auth.sendResetEmail', { defaultValue: 'Envoyer le lien de réinitialisation' })}
      </button>
      <button type="button" onClick={() => navigate('/login')} disabled={isLoading}>
        {t('auth.backToLogin', { defaultValue: 'Retour à la connexion' })}
      </button>
    </form>
  );
}

export default PasswordResetForm;
