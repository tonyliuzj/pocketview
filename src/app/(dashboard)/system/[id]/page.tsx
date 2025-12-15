"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Cpu, Activity, HardDrive, Server, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemInfo {
  h?: string;
  k?: string;
  c?: number;
  t?: number;
  m?: string;
  u?: number;
  cpu?: number;
  mp?: number;
  dp?: number;
  b?: number;
  v?: string;
  dt?: number;
  os?: number;
  l1?: number;
  l5?: number;
  l15?: number;
  bb?: number;
  la?: number[];
  ct?: number;
  sv?: number[];
}

interface System {
  id: string;
  name: string;
  host: string;
  status: string;
  info?: SystemInfo;
  updated?: string;
}

interface HistoricalData {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  diskRead?: number;
  diskWrite?: number;
  networkIn?: number;
  networkOut?: number;
  swap?: number;
  loadAvg1?: number;
  loadAvg5?: number;
  loadAvg15?: number;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export default function SystemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const systemId = params.id as string;

  const [system, setSystem] = useState<System | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [nextRefresh, setNextRefresh] = useState(5);

  const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
    { value: '1h', label: '10 Minutes', hours: 10 / 60 },
    { value: '6h', label: '1 Hour', hours: 1 },
    { value: '24h', label: '24 Hours', hours: 24 },
    { value: '7d', label: '7 Days', hours: 168 },
    { value: '30d', label: '30 Days', hours: 720 },
  ];

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/beszel/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch system data');
      }

      const data = await response.json();
      const systems = data.items || [];
      const currentSystem = systems.find((s: System) => s.id === systemId);

      if (currentSystem) {
        setSystem(currentSystem);}
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const selectedRange = timeRangeOptions.find(r => r.value === timeRange);
      if (!selectedRange) return;

      const to = Date.now();
      const from = to - (selectedRange.hours * 60 * 60 * 1000);

      const response = await fetch(
        `/api/beszel/stats?systemId=${systemId}&from=${from}&to=${to}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const data = await response.json();

      // Transform the system_stats collection response
      if (data.items && Array.isArray(data.items)) {
        const transformed = data.items.map((record: any) => {
          // The stats field contains the actual metrics as JSON
          const stats = typeof record.stats === 'string' ? JSON.parse(record.stats) : record.stats;

          // Calculate swap percentage if swap data is available
          const swapPercent = stats.s && stats.su ? (stats.su / stats.s) * 100 : undefined;

          return {
            time: record.created,
            cpu: stats.cpu || stats.c || 0,
            memory: stats.mp || stats.mem || stats.memory || 0,
            disk: stats.dp || stats.disk || 0,
            // Disk I/O (MB/s)
            diskRead: stats.dr,
            diskWrite: stats.dw,
            // Network bandwidth (MB/s)
            networkIn: stats.nr,
            networkOut: stats.ns,
            // Swap usage (percentage)
            swap: swapPercent,
            // Load average
            loadAvg1: stats.la?.[0],
            loadAvg5: stats.la?.[1],
            loadAvg15: stats.la?.[2],
          };
        });
        setHistoricalData(transformed);
      } else {
        setHistoricalData([]);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setHistoricalData([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [systemId]);

  useEffect(() => {
    fetchHistoricalData();
    // Refresh historical data every 5 seconds
    const interval = setInterval(fetchHistoricalData, 5000);
    return () => clearInterval(interval);
  }, [systemId, timeRange]);

  useEffect(() => {
    if (!loading) {
      setNextRefresh(5);
      const countdown = setInterval(() => {
        setNextRefresh((prev) => {
          if (prev <= 1) {
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [loading, refreshing, timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSystemData();
    fetchHistoricalData();
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setRefreshing(true);
  };

  // Check if we have data for additional metrics
  const hasDiskIO = historicalData.some(d => d.diskRead !== undefined || d.diskWrite !== undefined);
  const hasNetwork = historicalData.some(d => d.networkIn !== undefined || d.networkOut !== undefined);
  const hasSwap = historicalData.some(d => d.swap !== undefined);
  const hasLoadAvg = historicalData.some(d => d.loadAvg1 !== undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-3xl">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">System not found</p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{system.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={system.status === 'up' ? 'default' : 'destructive'} className={system.status === 'up' ? 'bg-green-500 hover:bg-green-600' : ''}>
                {system.status === 'up' ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Next refresh in {nextRefresh}s</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Historical Metrics</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Time Range:</div>
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleTimeRangeChange(option.value)}
                disabled={refreshing}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{system.info?.cpu?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  Load: {system.info?.la?.map(l => l.toFixed(2)).join(', ') || 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{system.info?.mp?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  {system.info?.m ? system.info.m.split(' @')[0] : 'Unknown Memory'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{system.info?.dp?.toFixed(1) || '0.0'}%</div>
                <p className="text-xs text-muted-foreground">
                  Total: {system.info?.dt?.toFixed(1) || '0'} GB
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {system.info?.u ? Math.floor(system.info.u / 86400) : 0} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Kernel: {system.info?.k || 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resource Overview</CardTitle>
                <CardDescription>
                  Combined CPU, Memory, and Disk usage over the selected period.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  {historicalData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">No data available for the selected time range</p>
                        <p className="text-xs mt-1">Data will appear as the system collects metrics</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            if (timeRange === '1h' || timeRange === '6h') {
                              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else if (timeRange === '24h') {
                              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else {
                              return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }
                          }}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="memory" stroke="#22c55e" name="Memory" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="disk" stroke="#a855f7" name="Disk" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Detailed hardware and software specs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">OS</p>
                      <p className="text-sm font-medium">Linux</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Kernel</p>
                      <p className="text-sm font-medium truncate" title={system.info?.k}>{system.info?.k || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cores</p>
                      <p className="text-sm font-medium">{system.info?.c || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">CPU Model</p>
                    <p className="text-sm font-medium">{system.info?.m || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
               <CardHeader><CardTitle>CPU Usage</CardTitle></CardHeader>
               <CardContent className="h-[250px]">
                  {historicalData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">No data available</p>
                        <p className="text-xs mt-1">Waiting for metrics</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                         <defs>
                            <linearGradient id="fillCpu" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                               <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="time" hide />
                         <YAxis domain={[0, 100]} />
                         <Tooltip
                           labelFormatter={(value) => {
                             const date = new Date(value);
                             return date.toLocaleString([], {
                               month: 'short',
                               day: 'numeric',
                               hour: '2-digit',
                               minute: '2-digit'
                             });
                           }}
                         />
                         <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#fillCpu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader><CardTitle>Memory Usage</CardTitle></CardHeader>
               <CardContent className="h-[250px]">
                  {historicalData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">No data available</p>
                        <p className="text-xs mt-1">Waiting for metrics</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                         <defs>
                            <linearGradient id="fillMem" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                               <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="time" hide />
                         <YAxis domain={[0, 100]} />
                         <Tooltip
                           labelFormatter={(value) => {
                             const date = new Date(value);
                             return date.toLocaleString([], {
                               month: 'short',
                               day: 'numeric',
                               hour: '2-digit',
                               minute: '2-digit'
                             });
                           }}
                         />
                         <Area type="monotone" dataKey="memory" stroke="#22c55e" fill="url(#fillMem)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
               </CardContent>
            </Card>

            {hasDiskIO && (
              <Card>
                 <CardHeader><CardTitle>Disk I/O (MB/s)</CardTitle></CardHeader>
                 <CardContent className="h-[250px]">
                    {historicalData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No data available</p>
                          <p className="text-xs mt-1">Waiting for metrics</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="time" hide />
                           <YAxis />
                           <Tooltip
                             labelFormatter={(value) => {
                               const date = new Date(value);
                               return date.toLocaleString([], {
                                 month: 'short',
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               });
                             }}
                           />
                           <Legend />
                           <Line type="monotone" dataKey="diskRead" stroke="#f59e0b" name="Read" dot={false} />
                           <Line type="monotone" dataKey="diskWrite" stroke="#ef4444" name="Write" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                 </CardContent>
              </Card>
            )}

            {hasNetwork && (
              <Card>
                 <CardHeader><CardTitle>Network (MB/s)</CardTitle></CardHeader>
                 <CardContent className="h-[250px]">
                    {historicalData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No data available</p>
                          <p className="text-xs mt-1">Waiting for metrics</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="time" hide />
                           <YAxis />
                           <Tooltip
                             labelFormatter={(value) => {
                               const date = new Date(value);
                               return date.toLocaleString([], {
                                 month: 'short',
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               });
                             }}
                           />
                           <Legend />
                           <Line type="monotone" dataKey="networkIn" stroke="#10b981" name="Rx" dot={false} />
                           <Line type="monotone" dataKey="networkOut" stroke="#06b6d4" name="Tx" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                 </CardContent>
              </Card>
            )}
            
            {hasLoadAvg && (
               <Card>
                 <CardHeader><CardTitle>Load Average</CardTitle></CardHeader>
                 <CardContent className="h-[250px]">
                    {historicalData.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <p className="text-sm">No data available</p>
                          <p className="text-xs mt-1">Waiting for metrics</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="time" hide />
                           <YAxis />
                           <Tooltip
                             labelFormatter={(value) => {
                               const date = new Date(value);
                               return date.toLocaleString([], {
                                 month: 'short',
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               });
                             }}
                           />
                           <Legend />
                           <Line type="monotone" dataKey="loadAvg1" stroke="#8b5cf6" name="1m" dot={false} />
                           <Line type="monotone" dataKey="loadAvg5" stroke="#a78bfa" name="5m" dot={false} />
                           <Line type="monotone" dataKey="loadAvg15" stroke="#c4b5fd" name="15m" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                 </CardContent>
               </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
