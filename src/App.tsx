import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  Upload, 
  Search as SearchIcon, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  ChevronRight,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Building2,
  Filter,
  Calendar,
  Globe,
  Disc
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(val);

const formatNumber = (val: number) => 
  new Intl.NumberFormat('ru-RU').format(val);

// --- Components ---

const Card = ({ children, className, title }: { children: React.ReactNode, className?: string, title?: string }) => (
  <div className={cn("bg-gray-50 rounded-2xl border border-blue-100 shadow-sm p-6", className)}>
    {title && <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>}
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <Card className="flex items-center gap-4">
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </Card>
);

// --- Pages ---

const Dashboard = ({ stats }: { stats: any }) => {
  if (!stats) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8', '#1e40af'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Общий доход" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Всего стримов" value={formatNumber(stats.totalStreams)} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title="Топ Артист" value={stats.topArtists[0]?.name || 'Н/Д'} icon={Users} color="bg-purple-500" />
        <StatCard title="Топ Трек" value={stats.topTracks[0]?.title || 'Н/Д'} icon={Music} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Доход по месяцам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `₽${v/1000}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Доход по платформам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.revenueByPlatform}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {stats.revenueByPlatform.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Топ 10 Артистов">
          <div className="space-y-4">
            {stats.topArtists.map((artist: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="font-medium text-gray-900">{artist.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(artist.revenue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(artist.streams)} стримов</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Топ 10 Треков">
          <div className="space-y-4">
            {stats.topTracks.map((track: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="max-w-[150px] truncate">
                    <p className="font-medium text-gray-900 truncate">{track.title}</p>
                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(track.revenue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(track.streams)} стримов</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Топ 10 Лейблов">
          <div className="space-y-4">
            {stats.topLabels.map((label: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <span className="font-medium text-gray-900">{label.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(label.revenue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(label.streams)} стримов</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ArtistsPage = ({ onSelectArtist }: { onSelectArtist: (id: number) => void }) => {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/artists').then(res => res.json()).then(data => {
      setArtists(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <Card title="Все Артисты">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Артист</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Всего стримов</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Общий доход</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {artists.map((artist) => (
              <tr key={artist.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectArtist(artist.id)}>
                <td className="py-4 font-medium text-gray-900">{artist.name}</td>
                <td className="py-4 text-right text-gray-600">{formatNumber(artist.totalStreams || 0)}</td>
                <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(artist.totalRevenue || 0)}</td>
                <td className="py-4 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const LabelsPage = ({ onSelectLabel }: { onSelectLabel: (id: number) => void }) => {
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/labels').then(res => res.json()).then(data => {
      setLabels(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <Card title="Все Лейблы">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Лейбл</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Всего стримов</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Общий доход</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {labels.map((label) => (
              <tr key={label.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectLabel(label.id)}>
                <td className="py-4 font-medium text-gray-900">{label.name}</td>
                <td className="py-4 text-right text-gray-600">{formatNumber(label.totalStreams || 0)}</td>
                <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(label.totalRevenue || 0)}</td>
                <td className="py-4 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const PlatformsPage = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/platforms')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch platforms');
        return res.json();
      })
      .then(data => {
        setPlatforms(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-red-500">Ошибка загрузки данных: {error}</div>;

  return (
    <Card title="Все Площадки">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Площадка</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Всего стримов</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Общий доход</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {platforms.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">Нет данных о площадках</td>
              </tr>
            ) : platforms.map((platform) => (
              <tr key={platform.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 font-medium text-gray-900">{platform.name}</td>
                <td className="py-4 text-right text-gray-600">{formatNumber(platform.totalStreams || 0)}</td>
                <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(platform.totalRevenue || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const TracksPage = ({ onSelectTrack }: { onSelectTrack: (id: number) => void }) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/all-tracks')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tracks');
        return res.json();
      })
      .then(data => {
        setTracks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-red-500">Ошибка загрузки данных: {error}</div>;

  return (
    <Card title="Все Треки">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Трек / Артист</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">ISRC / Альбом</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Стримы</th>
              <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Доход</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tracks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">Нет данных о треках</td>
              </tr>
            ) : tracks.map((track) => (
              <tr key={track.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectTrack(track.id)}>
                <td className="py-4">
                  <p className="font-medium text-gray-900">{track.title}</p>
                  <p className="text-xs text-gray-500">{track.artist}</p>
                </td>
                <td className="py-4">
                  <p className="text-xs font-mono text-gray-600">{track.isrc || '—'}</p>
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">{track.album || '—'}</p>
                </td>
                <td className="py-4 text-right text-gray-600">{formatNumber(track.totalStreams || 0)}</td>
                <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(track.totalRevenue || 0)}</td>
                <td className="py-4 text-right">
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const LabelDetail = ({ id, onBack, onSelectArtist }: { id: number, onBack: () => void, onSelectArtist: (id: number) => void }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/labels/${id}`).then(res => res.json()).then(setData);
  }, [id]);

  if (!data) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
        ← Назад к Лейблам
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Общий доход</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalRevenue || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Всего стримов</p>
            <p className="text-xl font-bold text-blue-600">{formatNumber(data.totalStreams || 0)}</p>
          </div>
        </div>
      </div>

      <Card title="Артисты лейбла">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Артист</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Стримы</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Доход</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.artists.map((artist: any) => (
                <tr key={artist.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectArtist(artist.id)}>
                  <td className="py-4 font-medium text-gray-900">{artist.name}</td>
                  <td className="py-4 text-right text-gray-600">{formatNumber(artist.streams || 0)}</td>
                  <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(artist.revenue || 0)}</td>
                  <td className="py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const ArtistDetail = ({ id, onBack, onSelectTrack }: { id: number, onBack: () => void, onSelectTrack: (id: number) => void }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/artists/${id}`).then(res => res.json()).then(setData);
  }, [id]);

  if (!data) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
        ← Назад к Артистам
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Общий доход</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalRevenue || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Всего стримов</p>
            <p className="text-xl font-bold text-blue-600">{formatNumber(data.totalStreams || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Доход по трекам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tracks.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Доход по платформам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.revenueByPlatform}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {data.revenueByPlatform.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Треки">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">Трек</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Стримы</th>
                <th className="pb-4 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Доход</th>
                <th className="pb-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.tracks.map((track: any) => (
                <tr key={track.id} className="group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onSelectTrack(track.id)}>
                  <td className="py-4 font-medium text-gray-900">{track.title}</td>
                  <td className="py-4 text-right text-gray-600">{formatNumber(track.streams || 0)}</td>
                  <td className="py-4 text-right font-bold text-blue-600">{formatCurrency(track.revenue || 0)}</td>
                  <td className="py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const TrackDetail = ({ id, onBack }: { id: number, onBack: () => void }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/tracks/${id}`).then(res => res.json()).then(setData);
  }, [id]);

  if (!data) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
        ← Назад
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
          <p className="text-lg text-gray-500">{data.artist} • {data.album || 'Сингл'}</p>
          <p className="text-xs font-mono text-gray-400 mt-1">ISRC: {data.isrc || 'Н/Д'}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Общий доход</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(data.totalRevenue || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Всего стримов</p>
            <p className="text-xl font-bold text-blue-600">{formatNumber(data.totalStreams || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Стримы по платформам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.streamsByPlatform}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip formatter={(v: any) => formatNumber(v)} />
                <Bar dataKey="streams" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Доход по платформам">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByPlatform}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const UploadPage = ({ onSelectReport }: { onSelectReport: (id: number) => void }) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchReports = () => {
    fetch('/api/reports').then(res => res.json()).then(setReports);
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await fetch('/api/upload', { method: 'POST', body: formData });
      setFiles(null);
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Загрузить отчеты о роялти">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 bg-gray-50/50">
          <Upload className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-4">Выберите один или несколько CSV файлов</p>
          <input 
            type="file" 
            accept=".csv" 
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            {files ? `Выбрано файлов: ${files.length}` : 'Выбрать файлы'}
          </label>
          {files && files.length > 0 && (
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 px-8 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Начать загрузку'}
            </button>
          )}
        </div>
      </Card>

      <Card title="Все отчеты">
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className={cn(
                "flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all",
                report.status === 'completed' ? "hover:bg-gray-100 cursor-pointer" : ""
              )}
              onClick={() => report.status === 'completed' && onSelectReport(report.id)}
            >
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{report.file_name}</p>
                  <p className="text-xs text-gray-500">{new Date(report.upload_date).toLocaleString('ru-RU')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Статус</p>
                  <div className="flex items-center gap-1">
                    {report.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                    {report.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {report.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className={cn(
                      "text-sm font-bold",
                      report.status === 'completed' ? "text-blue-600" :
                      report.status === 'processing' ? "text-blue-600" :
                      report.status === 'error' ? "text-red-600" : "text-gray-600"
                    )}>
                      {report.status === 'completed' ? 'ГОТОВО' : 
                       report.status === 'processing' ? 'ОБРАБОТКА' : 
                       report.status === 'error' ? 'ОШИБКА' : 'ОЖИДАНИЕ'}
                    </span>
                  </div>
                </div>
                {report.status === 'processing' && (
                  <div className="text-right min-w-[80px]">
                    <p className="text-xs font-bold text-gray-400 uppercase">Прогресс</p>
                    <p className="text-sm font-bold text-gray-900">{report.processed_rows} / {report.total_rows}</p>
                  </div>
                )}
                {report.status === 'completed' && (
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ReportDetail = ({ id, onBack }: { id: number, onBack: () => void }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports/${id}`).then(res => res.json()).then(setData);
  }, [id]);

  if (!data) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-4">
        ← Назад к Отчетам
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.file_name}</h1>
          <p className="text-sm text-gray-500">Загружен: {new Date(data.upload_date).toLocaleString('ru-RU')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold">Строк обработано</p>
          <p className="text-xl font-bold text-blue-600">{formatNumber(data.processed_rows)}</p>
        </div>
      </div>

      <Card title="Данные отчета (первые 1000 строк)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">Период</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">Артист</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">Трек</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">Площадка</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider">Лейбл</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Стримы</th>
                <th className="pb-3 font-semibold text-gray-500 uppercase tracking-wider text-right">Доход</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.royalties.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-gray-600">{r.period}</td>
                  <td className="py-3 font-medium text-gray-900">{r.artist}</td>
                  <td className="py-3 text-gray-900">{r.track}</td>
                  <td className="py-3 text-gray-500">{r.platform}</td>
                  <td className="py-3 text-gray-400">{r.label}</td>
                  <td className="py-3 text-right text-gray-600">{formatNumber(r.streams)}</td>
                  <td className="py-3 text-right font-bold text-blue-600">{formatCurrency(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const FilterBar = ({ filters, setFilters, artists, labels, platforms, periods }: any) => {
  // Group periods by quarter
  const getQuarters = () => {
    const quarters: any = {};
    periods.forEach((p: string) => {
      // Assuming period is YYYY-MM or YYYY.MM
      const match = p.match(/(\d{4})[-.](\d{2})/);
      if (match) {
        const year = match[1];
        const month = parseInt(match[2]);
        const q = Math.ceil(month / 3);
        const qKey = `${year}-Q${q}`;
        if (!quarters[qKey]) quarters[qKey] = [];
        quarters[qKey].push(p);
      }
    });
    return quarters;
  };

  const quarters = getQuarters();

  const handleQuarterSelect = (qKey: string) => {
    if (!qKey) {
      setFilters({ ...filters, start_period: '', end_period: '' });
      return;
    }
    const qPeriods = quarters[qKey].sort();
    setFilters({ 
      ...filters, 
      start_period: qPeriods[0], 
      end_period: qPeriods[qPeriods.length - 1] 
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Users className="w-3 h-3" /> Артист
        </label>
        <select 
          value={filters.artist_id || ''} 
          onChange={(e) => setFilters({ ...filters, artist_id: e.target.value })}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Все артисты</option>
          {artists.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Building2 className="w-3 h-3" /> Лейбл
        </label>
        <select 
          value={filters.label_id || ''} 
          onChange={(e) => setFilters({ ...filters, label_id: e.target.value })}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Все лейблы</option>
          {labels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Globe className="w-3 h-3" /> Площадка
        </label>
        <select 
          value={filters.platform_id || ''} 
          onChange={(e) => setFilters({ ...filters, platform_id: e.target.value })}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Все площадки</option>
          {platforms.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <BarChart3 className="w-3 h-3" /> Квартал
        </label>
        <select 
          onChange={(e) => handleQuarterSelect(e.target.value)}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Выбрать квартал</option>
          {Object.keys(quarters).sort().reverse().map(q => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Calendar className="w-3 h-3" /> С периода
        </label>
        <select 
          value={filters.start_period || ''} 
          onChange={(e) => setFilters({ ...filters, start_period: e.target.value })}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Начало</option>
          {periods.map((p: any) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
          <Calendar className="w-3 h-3" /> По период
        </label>
        <select 
          value={filters.end_period || ''} 
          onChange={(e) => setFilters({ ...filters, end_period: e.target.value })}
          className="w-full bg-white border border-blue-100 rounded-xl text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Конец</option>
          {periods.map((p: any) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activePage, setActivePage] = useState<'dashboard' | 'artists' | 'tracks' | 'platforms' | 'labels' | 'upload' | 'artist-detail' | 'track-detail' | 'label-detail' | 'report-detail'>('dashboard');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<any>({
    artist_id: '',
    label_id: '',
    platform_id: '',
    start_period: '',
    end_period: ''
  });
  
  const [artists, setArtists] = useState([]);
  const [labels, setLabels] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    const query = new URLSearchParams(filters).toString();
    fetch(`/api/stats?${query}`).then(res => res.json()).then(setStats);
  }, [activePage, filters]);

  useEffect(() => {
    fetch('/api/artists').then(res => res.json()).then(setArtists);
    fetch('/api/labels').then(res => res.json()).then(setLabels);
    fetch('/api/platforms').then(res => res.json()).then(setPlatforms);
    fetch('/api/periods').then(res => res.json()).then(setPeriods);
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.length > 2) {
      fetch(`/api/search?q=${q}`).then(res => res.json()).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
    { id: 'artists', label: 'Артисты', icon: Users },
    { id: 'tracks', label: 'Треки', icon: Disc },
    { id: 'platforms', label: 'Площадки', icon: Globe },
    { id: 'labels', label: 'Лейблы', icon: Building2 },
    { id: 'upload', label: 'Отчеты', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-600 mb-8">
            <TrendingUp className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-gray-900">роялти.<span className="text-blue-600">vime</span></span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id as any);
                  setSelectedId(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activePage === item.id 
                    ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-100" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Статус системы</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Система активна</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-black/5 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Поиск артистов, треков, ISRC..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden">
                {searchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSelectedId(res.id);
                      setActivePage(res.type === 'artist' ? 'artist-detail' : 'track-detail');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                  >
                    {res.type === 'artist' ? <Users className="w-4 h-4 text-purple-500" /> : <Music className="w-4 h-4 text-blue-500" />}
                    <div>
                      <p className="text-sm font-bold text-gray-900">{res.title}</p>
                      {res.subtitle && <p className="text-xs text-gray-500">{res.subtitle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Администратор</p>
              <p className="text-xs text-gray-500">Полный доступ</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              АД
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activePage === 'dashboard' && (
            <>
              <FilterBar filters={filters} setFilters={setFilters} artists={artists} labels={labels} platforms={platforms} periods={periods} />
              <Dashboard stats={stats} />
            </>
          )}
          {activePage === 'artists' && (
            <ArtistsPage onSelectArtist={(id) => { setSelectedId(id); setActivePage('artist-detail'); }} />
          )}
          {activePage === 'tracks' && (
            <TracksPage onSelectTrack={(id) => { setSelectedId(id); setActivePage('track-detail'); }} />
          )}
          {activePage === 'platforms' && (
            <PlatformsPage />
          )}
          {activePage === 'labels' && (
            <LabelsPage onSelectLabel={(id) => { setSelectedId(id); setActivePage('label-detail'); }} />
          )}
          {activePage === 'upload' && <UploadPage onSelectReport={(id) => { setSelectedId(id); setActivePage('report-detail'); }} />}
          {activePage === 'report-detail' && selectedId && (
            <ReportDetail id={selectedId} onBack={() => setActivePage('upload')} />
          )}
          {activePage === 'artist-detail' && selectedId && (
            <ArtistDetail 
              id={selectedId} 
              onBack={() => setActivePage('artists')} 
              onSelectTrack={(id) => { setSelectedId(id); setActivePage('track-detail'); }}
            />
          )}
          {activePage === 'label-detail' && selectedId && (
            <LabelDetail 
              id={selectedId} 
              onBack={() => setActivePage('labels')} 
              onSelectArtist={(id) => { setSelectedId(id); setActivePage('artist-detail'); }}
            />
          )}
          {activePage === 'track-detail' && selectedId && (
            <TrackDetail id={selectedId} onBack={() => setActivePage('tracks')} />
          )}
        </div>
      </main>
    </div>
  );
}
