"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, Server, Cpu, HardDrive, Activity, RefreshCw, LayoutGrid, List, Search } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface System {
  id: string;
  name: string;
  host: string;
  status: string;
  info?: {
    cpu?: number;
    mp?: number;  // memory percentage
    dp?: number;  // disk percentage
  };
}

export default function HomePage() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (configured) {
      fetchSystems();
      const interval = setInterval(fetchSystems, 5000);
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

  const filteredSystems = systems.filter(system => 
    system.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: systems.length,
    online: systems.filter(s => s.status === 'up' || s.status === 'online').length,
    offline: systems.filter(s => s.status !== 'up' && s.status !== 'online').length,
  };

  if (!configured) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Systems</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-green-600">{stats.online}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Systems</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-red-600">{stats.offline}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search systems..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto sm:ml-0"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-0">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
             </div>
          ) : filteredSystems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">No systems found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSystems.map((system) => (
                <Link key={system.id} href={`/system/${system.id}`} className="block h-full">
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{
                    borderLeftColor: system.status === 'online' || system.status === 'up' ? '#22c55e' : '#ef4444'
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold truncate" title={system.name}>{system.name}</CardTitle>
                        <Badge variant={system.status === 'online' || system.status === 'up' ? 'default' : 'destructive'} className={system.status === 'online' || system.status === 'up' ? 'bg-green-500 hover:bg-green-600' : ''}>
                          {system.status === 'up' ? 'ONLINE' : system.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">CPU</p>
                          <p className="font-bold text-lg">{system.info?.cpu?.toFixed(0) || 0}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">MEM</p>
                          <p className="font-bold text-lg">{system.info?.mp?.toFixed(0) || 0}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">DISK</p>
                          <p className="font-bold text-lg">{system.info?.dp?.toFixed(0) || 0}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                   ))
                ) : filteredSystems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No systems found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSystems.map((system) => (
                    <TableRow key={system.id}>
                      <TableCell>
                        <div className={`h-3 w-3 rounded-full ${
                          system.status === 'online' || system.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </TableCell>
                      <TableCell className="font-medium">{system.name}</TableCell>
                      <TableCell>{system.info?.cpu?.toFixed(1) || 0}%</TableCell>
                      <TableCell>{system.info?.mp?.toFixed(1) || 0}%</TableCell>
                      <TableCell>{system.info?.dp?.toFixed(1) || 0}%</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/system/${system.id}`}>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
