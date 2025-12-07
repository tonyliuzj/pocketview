"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Server } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Login successful',
        });
        router.push('/admin');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/50">
      <div className="w-full max-w-sm">
         <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
               <div className="flex justify-center mb-2">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                     <Server className="size-6" />
                  </div>
               </div>
               <CardTitle className="text-2xl">Login to PocketView</CardTitle>
               <CardDescription>
                  Enter your credentials below to access the admin panel
               </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleLogin} className="grid gap-4">
                  <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                     id="username"
                     type="text"
                     placeholder="admin"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     required
                     autoComplete="username"
                  />
                  </div>
                  <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                     id="password"
                     type="password"
                     placeholder="******"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     autoComplete="current-password"
                  />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                  </Button>
               </form>
            </CardContent>
            <CardFooter>
               <div className="w-full text-center text-sm text-muted-foreground">
                  Default: <span className="font-mono font-medium">admin / changeme</span>
               </div>
            </CardFooter>
         </Card>
      </div>
    </div>
  );
}
