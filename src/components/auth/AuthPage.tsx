
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, MapPin } from 'lucide-react';

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Since auth is removed, just show a message
    setError('Authentication has been removed. SafePath is now fully anonymous!');
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Since auth is removed, just show a message
    setError('Authentication has been removed. SafePath is now fully anonymous!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <MapPin className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">SafePath Melbourne</CardTitle>
          <CardDescription>
            Community-driven safety information for safer walks in Melbourne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">No Authentication Required</h3>
            <p className="text-gray-600">
              SafePath is now fully anonymous! You can submit safety reports, plan routes, and view safety information without creating an account.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to SafePath Map
            </Button>
          </div>
          
          {error && (
            <Alert className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
