import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../hooks/useSupabase';


const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signUp } = useSupabase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!form.confirm) {
      setError("Vous devez accepter les CGU/RGPD.");
      setLoading(false);
      return;
    }
    if (!form.email || !form.password || !form.name) {
      setError("Tous les champs sont obligatoires.");
      setLoading(false);
      return;
    }
    try {
      const { user, error } = await signUp(form.email, form.password, { name: form.name });
      if (error) {
        setError(error.message || "Erreur lors de la création du compte.");
        setLoading(false);
        return;
      }
      // Redirection vers le setup après inscription
      navigate('/setup');
    } catch (err: any) {
      setError(err.message || "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" type="text" placeholder="Nom complet" required className="w-full p-2 border rounded" onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" required className="w-full p-2 border rounded" onChange={handleChange} />
          <input name="password" type="password" placeholder="Mot de passe" required className="w-full p-2 border rounded" onChange={handleChange} />
          <div className="flex items-center">
            <input name="confirm" type="checkbox" required className="mr-2" onChange={handleChange} />
            <span>J'accepte les <a href="#" className="underline">CGU/RGPD</a></span>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:underline">Déjà un compte ? Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
