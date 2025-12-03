"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Cpu, Activity, HardDrive, Server, Clock, Network, Database, Gauge } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
    { value: '1h', label: '1 Hour', hours: 1 },
    { value: '6h', label: '6 Hours', hours: 6 },
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
            time: new Date(record.created).toLocaleString(),
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
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [systemId]);

  useEffect(() => {
    fetchHistoricalData();
    // Refresh historical data every 30 seconds
    const interval = setInterval(fetchHistoricalData, 30000);
    return () => clearInterval(interval);
  }, [systemId, timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSystemData();
    fetchHistoricalData();
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setRefreshing(true);};

  // Check if we have data for additional metrics
  const hasDiskIO = historicalData.some(d => d.diskRead !== undefined || d.diskWrite !== undefined);
  const hasNetwork = historicalData.some(d => d.networkIn !== undefined || d.networkOut !== undefined);
  const hasSwap = historicalData.some(d => d.swap !== undefined);
  const hasLoadAvg = historicalData.some(d => d.loadAvg1 !== undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading system details...</p>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Server className="h-8 w-8" />
                {system.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                System Details & Performance Metrics
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Time Range Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Range
            </CardTitle>
            <CardDescription>Select the time range for historical data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? 'default' : 'outline'}
                  onClick={() => handleTimeRangeChange(option.value)}
                  disabled={refreshing}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-3 w-3 rounded-full ${
                    system.status === 'up' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <p className="text-lg font-semibold">
                    {system.status === 'up' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hostname</p>
                <p className="text-lg font-semibold mt-1">{system.info?.h || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kernel</p>
                <p className="text-lg font-semibold mt-1">{system.info?.k || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPU Model</p>
                <p className="text-lg font-semibold mt-1">{system.info?.m || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPU Cores</p>
                <p className="text-lg font-semibold mt-1">{system.info?.c || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Threads</p>
                <p className="text-lg font-semibold mt-1">{system.info?.t || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-500">
                {system.info?.cpu?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Load Average: {system.info?.la?.map(l => l.toFixed(2)).join(', ') || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-500">
                {system.info?.mp?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Uptime: {system.info?.u ? Math.floor(system.info.u / 86400) : 0} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-500" />
                Disk Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-500">
                {system.info?.dp?.toFixed(1) || '0.0'}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total: {system.info?.dt?.toFixed(1) || '0'} GB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Historical Charts */}
        {historicalData.length > 0 ? (
          <>
            {/* CPU Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>CPU Usage Over Time</CardTitle>
                <CardDescription>Historical CPU usage percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}><AreaChart data={historicalData}><defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Memory Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Memory Usage Over Time</CardTitle>
                <CardDescription>Historical memory usage percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="memory" stroke="#22c55e" fillOpacity={1} fill="url(#colorMemory)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Disk Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Disk Usage Over Time</CardTitle>
                <CardDescription>Historical disk usage percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="disk" stroke="#a855f7" fillOpacity={1} fill="url(#colorDisk)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Disk I/O Chart */}
            {hasDiskIO && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Disk I/O Over Time</CardTitle>
                  <CardDescription>Disk read and write activity (MB/s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="diskRead" stroke="#f59e0b" name="Read (MB/s)" strokeWidth={2} />
                      <Line type="monotone" dataKey="diskWrite" stroke="#ef4444" name="Write (MB/s)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Network Bandwidth Chart */}
            {hasNetwork && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Network Bandwidth Over Time</CardTitle>
                  <CardDescription>Network traffic (MB/s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="networkIn" stroke="#10b981" name="Received (MB/s)" strokeWidth={2} />
                      <Line type="monotone" dataKey="networkOut" stroke="#06b6d4" name="Sent (MB/s)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Swap Usage Chart */}
            {hasSwap && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Swap Usage Over Time</CardTitle>
                  <CardDescription>Historical swap usage percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorSwap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="swap" stroke="#f97316" fillOpacity={1} fill="url(#colorSwap)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Load Average Chart */}
            {hasLoadAvg && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Load Average Over Time</CardTitle>
                  <CardDescription>System load average (1min, 5min, 15min)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="loadAvg1" stroke="#8b5cf6" name="1 min" strokeWidth={2} />
                      <Line type="monotone" dataKey="loadAvg5" stroke="#a78bfa" name="5 min" strokeWidth={2} />
                      <Line type="monotone" dataKey="loadAvg15" stroke="#c4b5fd" name="15 min" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Combined Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Combined Metrics</CardTitle>
                <CardDescription>All system metrics in one view</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" strokeWidth={2} />
                    <Line type="monotone" dataKey="memory" stroke="#22c55e" name="Memory %" strokeWidth={2} />
                    <Line type="monotone" dataKey="disk" stroke="#a855f7" name="Disk %" strokeWidth={2} />
                    {hasSwap && <Line type="monotone" dataKey="swap" stroke="#f97316" name="Swap %" strokeWidth={2} />}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {refreshing ? 'Loading historical data...' : 'No historical data available for the selected time range.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
