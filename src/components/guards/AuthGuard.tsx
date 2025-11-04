import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const { signIn, signUp, isAuthenticated, onboardingCompleted } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect authenticated users appropriately
  if (isAuthenticated && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (isAuthenticated && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(signInForm);
    } catch (err: any) {
      setError((error as Error).message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await signUp({
        email: signUpForm.email,
        password: signUpForm.password,
        options: {
          data: {
            first_name: signUpForm.firstName,
            last_name: signUpForm.lastName,
          },
        },
      });
      setSuccess("Inscription réussie ! Veuillez vérifier vos e-mails pour confirmer votre compte.");
      setSignUpForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
      setActiveTab('signin');
    } catch (err: any) {
      setError((error as Error).message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenue sur CassKai</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre espace</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert className="border-green-500 text-green-700 mb-4"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup" data-testid="signup-tab">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="m@example.com" required value={signInForm.email} onChange={(e) => setSignInForm({...signInForm, email: e.target.value})} data-testid="email-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Mot de passe</Label>
                  <Input id="password-signin" type="password" required value={signInForm.password} onChange={(e) => setSignInForm({...signInForm, password: e.target.value})} data-testid="password-input" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && activeTab === 'signin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" placeholder="Jean" required value={signUpForm.firstName} onChange={(e) => setSignUpForm({...signUpForm, firstName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" placeholder="Dupont" required value={signUpForm.lastName} onChange={(e) => setSignUpForm({...signUpForm, lastName: e.target.value})} />
                    </div>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" required value={signUpForm.email} onChange={(e) => setSignUpForm({...signUpForm, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Mot de passe</Label>
                  <Input id="password-signup" type="password" required value={signUpForm.password} onChange={(e) => setSignUpForm({...signUpForm, password: e.target.value})} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input id="confirmPassword" type="password" required value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm({...signUpForm, confirmPassword: e.target.value})} />
                  </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && activeTab === 'signup' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
                  S'inscrire
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuardComp: React.FC<AuthGuardProps> = ({ children }) => {
  const { loading, isAuthenticated, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
