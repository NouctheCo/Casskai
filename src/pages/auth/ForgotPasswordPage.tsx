import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../../hooks/useSupabase';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Veuillez saisir votre email.");
      return;
    }
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message || "Erreur lors de la demande de réinitialisation.");
        return;
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Mot de passe oublié</h2>
        {sent ? (
          <div className="text-green-600 text-center mb-4">Un email de réinitialisation a été envoyé.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" placeholder="Votre email" required className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">Envoyer</button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:underline">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
