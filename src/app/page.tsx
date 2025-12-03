"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Server, Cpu, HardDrive, Activity, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface System {
  id: string;
  name: string;
  host: string;
  status: string;
  info?: {
    cpu?: number;
    mem?: number;
    disk?: number;
  };
}

export default function HomePage() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (configured) {
      fetchSystems();
      const interval = setInterval(fetchSystems, 10000);
      return () => clearInterval(interval);
    }
  }, [configured]);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfigured(data.configured);
    } catch (error) {
      console.error('Error checking config:', error);
    }
  };

  const fetchSystems = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const response = await fetch('/api/beszel/systems');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch systems');
      }

      const data = await response.json();
      setSystems(data.items || data || []);
    } catch (error) {
      console.error('Error fetching systems:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch systems data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSystems();
  };

  if (!configured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Welcome to PocketView</CardTitle>
            <CardDescription>
              Configure your Beszel instance to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Go to Admin Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">PocketView Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {systems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Systems Found</h3>
                <p className="text-muted-foreground">
                  No systems are currently being monitored by Beszel.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systems.map((system) => (
              <Link key={system.id} href={`/system/${system.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{system.name}</CardTitle>
                      <div className={`h-3 w-3 rounded-full ${
                        system.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {system.info?.cpu !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">CPU</span>
                          </div>
                          <span className="text-sm font-bold">{system.info.cpu.toFixed(1)}%</span>
                        </div>
                      )}

                      {system.info?.mem !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Memory</span>
                          </div>
                          <span className="text-sm font-bold">{system.info.mem.toFixed(1)}%</span>
                        </div>
                      )}

                      {system.info?.disk !== undefined && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Disk</span>
                          </div>
                          <span className="text-sm font-bold">{system.info.disk.toFixed(1)}%</span>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Status</span>
                          <span className={`font-semibold ${
                            system.status === 'online' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {system.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Auto-refreshing every 10 seconds</p>
        </div>
      </div>
    </div>
  );
}
