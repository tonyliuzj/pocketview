"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, LogOut, User, Key } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [beszelUrl, setBeszelUrl] = useState('');
  const [authMethod, setAuthMethod] = useState<'api_key' | 'password'>('api_key');
  const [beszelApiKey, setBeszelApiKey] = useState('');
  const [beszelEmail, setBeszelEmail] = useState('');
  const [beszelPassword, setBeszelPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchConfig();
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated) {
        setCurrentUsername(data.username);
        setNewUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();

      if (data.configured) {
        setBeszelUrl(data.beszel_url);
        setAuthMethod(data.auth_method || 'api_key');
        setBeszelApiKey(data.beszel_api_key || '');
        setBeszelEmail(data.beszel_email || '');
        setBeszelPassword(data.beszel_password || '');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beszel_url: beszelUrl,
          auth_method: authMethod,
          beszel_api_key: authMethod === 'api_key' ? beszelApiKey : undefined,
          beszel_email: authMethod === 'password' ? beszelEmail : undefined,
          beszel_password: authMethod === 'password' ? beszelPassword : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Beszel configuration saved successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsLoading(true);

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setCredentialsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newUsername,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUsername(newUsername);
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: 'Success',
          description: 'Credentials updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update credentials',
        variant: 'destructive',
      });
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Logout failed',
        variant: 'destructive',
      });
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Settings</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Beszel Configuration</CardTitle>
            <CardDescription>
              Configure your Beszel instance URL and authentication method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beszel-url">Beszel URL</Label>
                <Input
                  id="beszel-url"
                  type="url"
                  placeholder="https://beszel.example.com"
                  value={beszelUrl}
                  onChange={(e) => setBeszelUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The base URL of your Beszel instance (without trailing slash)
                </p>
              </div>

              <div className="space-y-3">
                <Label>Authentication Method</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="auth-method"
                      value="api_key"
                      checked={authMethod === 'api_key'}
                      onChange={(e) => setAuthMethod(e.target.value as 'api_key')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">API Key</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="auth-method"
                      value="password"
                      checked={authMethod === 'password'}
                      onChange={(e) => setAuthMethod(e.target.value as 'password')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Email & Password</span>
                  </label>
                </div>
              </div>

              {authMethod === 'api_key' && (
                <div className="space-y-2">
                  <Label htmlFor="beszel-api-key">Beszel API Key</Label>
                  <Input
                    id="beszel-api-key"
                    type="password"
                    placeholder="Enter your Beszel API key"
                    value={beszelApiKey}
                    onChange={(e) => setBeszelApiKey(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Your Beszel API authentication key
                  </p>
                </div>
              )}

              {authMethod === 'password' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="beszel-email">Email</Label>
                    <Input
                      id="beszel-email"
                      type="email"
                      placeholder="your@email.com"
                      value={beszelEmail}
                      onChange={(e) => setBeszelEmail(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Your Beszel account email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beszel-password">Password</Label>
                    <Input
                      id="beszel-password"
                      type="password"
                      placeholder="Enter your Beszel password"
                      value={beszelPassword}
                      onChange={(e) => setBeszelPassword(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Your Beszel account password
                    </p>
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Update your username and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-username">Current Username</Label>
                <Input
                  id="current-username"
                  type="text"
                  value={currentUsername}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-username">New Username</Label>
                <Input
                  id="new-username"
                  type="text"
                  placeholder="Enter new username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password (optional)</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank if you don't want to change your password
                </p>
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button type="submit" disabled={credentialsLoading} className="w-full">
                <Key className="mr-2 h-4 w-4" />
                {credentialsLoading ? 'Updating...' : 'Update Credentials'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              PocketView displays real-time system monitoring data from your Beszel instance.
              Configure your Beszel URL and API key above to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
