import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AdminData, PKLData } from '@/types/pkl';
import { getStatusLabel } from '@/types/pkl';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Database,
  GraduationCap,
  UserCog,
  Wrench,
  Ban,
  Eye,
  Search,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Trophy,
  ChevronDown
} from 'lucide-react';

interface DashboardProps {
  adminData: AdminData[];
  pklData: PKLData[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPWORK':
      return 'bg-green-500';
    case 'WAPPR':
      return 'bg-yellow-500';
    case 'INSTCOMP':
      return 'bg-blue-500';
    case 'ACTCOMP':
      return 'bg-purple-500';
    case 'CANCLWORK':
      return 'bg-red-500';
    case 'WORKFAIL':
      return 'bg-gray-700';
    default:
      return 'bg-gray-500';
  }
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  COMPWORK:  { label: 'COMPWORK',  color: 'text-green-700',  bg: 'bg-green-100' },
  WAPPR:     { label: 'WAPPR',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  INSTCOMP:  { label: 'INSTCOMP',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  ACTCOMP:   { label: 'ACTCOMP',   color: 'text-purple-700', bg: 'bg-purple-100' },
  CANCLWORK: { label: 'CANCLWORK', color: 'text-red-700',    bg: 'bg-red-100' },
  WORKFAIL:  { label: 'WORKFAIL',  color: 'text-gray-700',   bg: 'bg-gray-200' },
};

export function Dashboard({ adminData, pklData }: DashboardProps) {
  const [showViewAll, setShowViewAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());

  const toggleExpand = (name: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const totalAdminData = adminData.length;
  const totalPKLData = pklData.length;
  
  // Status baru
  const compworkCount = pklData.filter(d => d.statusBima === 'COMPWORK').length;
  const wapprCount = pklData.filter(d => d.statusBima === 'WAPPR').length;
  const instcompCount = pklData.filter(d => d.statusBima === 'INSTCOMP').length;
  const actcompCount = pklData.filter(d => d.statusBima === 'ACTCOMP').length;
  const canclworkCount = pklData.filter(d => d.statusBima === 'CANCLWORK').length;
  const workfailCount = pklData.filter(d => d.statusBima === 'WORKFAIL').length;

  const adminStats = [
    {
      title: 'Total Data Master',
      value: totalAdminData,
      icon: Database,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    }
  ];

  const siswaStats = [
    {
      title: 'Total Progress PKL',
      value: totalPKLData,
      icon: ClipboardList,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'COMPWORK',
      value: compworkCount,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'WAPPR',
      value: wapprCount,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500'
    },
    {
      title: 'INSTCOMP',
      value: instcompCount,
      icon: Wrench,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'ACTCOMP',
      value: actcompCount,
      icon: CheckCircle,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'CANCLWORK',
      value: canclworkCount,
      icon: Ban,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      title: 'WORKFAIL',
      value: workfailCount,
      icon: AlertCircle,
      color: 'bg-gray-700',
      textColor: 'text-gray-700'
    }
  ];

  const filteredData = pklData.filter(item => 
    item.tiket.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fallout.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.wonum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.statusBima.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Leaderboard: hitung jumlah pekerjaan per siswa (semua status), case-insensitive
  const leaderboardMap = pklData.reduce<Record<string, { displayName: string; count: number; statusBreakdown: Record<string, number> }>>((acc, item) => {
    const raw = item.namaInput?.trim() || 'Tidak Diketahui';
    const key = raw.toLowerCase();
    if (!acc[key]) {
      const titleCase = raw.replace(/\b\w/g, (c) => c.toUpperCase());
      acc[key] = { displayName: titleCase, count: 0, statusBreakdown: {} };
    }
    acc[key].count += 1;
    const s = item.statusBima || 'UNKNOWN';
    acc[key].statusBreakdown[s] = (acc[key].statusBreakdown[s] || 0) + 1;
    return acc;
  }, {});

  const leaderboard = Object.values(leaderboardMap)
    .sort((a, b) => b.count - a.count);

  const maxCount = leaderboard[0]?.count || 1;

  const handleCopyToClipboard = () => {
    // Format data untuk copy ke spreadsheet
    const headers = ['No', 'Nama', 'Inet', 'SC ORDER', 'Tiket', 'Fallout', 'WONUM', 'STATUS BIMA', 'Tanggal'];
    const rows = filteredData.map((item, index) => [
      index + 1,
      item.namaInput || '-',
      item.inet,
      item.scOrder,
      item.tiket,
      item.fallout,
      item.wonum,
      item.statusBima,
      new Date(item.createdAt).toLocaleDateString('id-ID')
    ]);
    
    const csvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Admin Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Data Admin (Master)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Siswa Stats dengan tombol View All */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Data Siswa PKL (Progress)
          </h2>
          <Button 
            onClick={() => setShowViewAll(true)} 
            variant="outline"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {siswaStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard Siswa PKL
          </CardTitle>
          <p className="text-sm text-muted-foreground">Peringkat berdasarkan total pekerjaan yang sudah dikerjakan (semua status)</p>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Belum ada data progress PKL</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                // Dense rank: rank ditentukan dari count, bukan index
                const rank = leaderboard.findIndex(e => e.count === entry.count) + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                const barColor =
                  rank === 1 ? 'bg-yellow-400' :
                  rank === 2 ? 'bg-gray-400' :
                  rank === 3 ? 'bg-amber-600' :
                  'bg-primary';
                const isTopRank = rank <= 3;
                const isExpanded = expandedNames.has(entry.displayName);
                const breakdown = Object.entries(entry.statusBreakdown).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={entry.displayName} className="border rounded-lg overflow-hidden">
                    {/* Row utama — klik untuk expand */}
                    <button
                      onClick={() => toggleExpand(entry.displayName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      {/* Rank */}
                      <div className="w-8 text-center font-bold text-sm shrink-0">
                        {medal ?? <span className="text-muted-foreground">#{rank}</span>}
                      </div>
                      {/* Name & bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm truncate ${isTopRank ? 'font-semibold' : 'font-medium'}`}>
                            {entry.displayName}
                          </span>
                          <span className="text-sm font-bold ml-2 shrink-0">{entry.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                            style={{ width: `${(entry.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      {/* Chevron */}
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown detail breakdown */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-muted/30 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Breakdown per status:</p>
                        <div className="flex flex-wrap gap-2">
                          {breakdown.map(([status, cnt]) => {
                            const cfg = STATUS_CONFIG[status];
                            return (
                              <span
                                key={status}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {status}
                                <span className="font-bold">{cnt}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ringkasan */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Status Progress PKL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalPKLData > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Persentase Complete Work</span>
                  <span className="font-medium">
                    {((compworkCount / totalPKLData) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(compworkCount / totalPKLData) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-muted-foreground">Persentase Waiting Approval</span>
                  <span className="font-medium">
                    {((wapprCount / totalPKLData) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(wapprCount / totalPKLData) * 100}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Belum ada data progress PKL untuk ditampilkan
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog View All */}
      <Dialog open={showViewAll} onOpenChange={setShowViewAll}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Semua Data Progress PKL
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCopyToClipboard} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Copy ke Spreadsheet'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowViewAll(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="overflow-auto flex-1 border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Inet</TableHead>
                    <TableHead>SC ORDER</TableHead>
                    <TableHead>Tiket</TableHead>
                    <TableHead>Fallout</TableHead>
                    <TableHead>WONUM</TableHead>
                    <TableHead>STATUS BIMA</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium text-primary">{item.namaInput || '-'}</TableCell>
                        <TableCell className="font-medium">{item.inet}</TableCell>
                        <TableCell>{item.scOrder}</TableCell>
                        <TableCell>{item.tiket}</TableCell>
                        <TableCell>{item.fallout}</TableCell>
                        <TableCell>{item.wonum}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.statusBima)}>
                            {item.statusBima}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {getStatusLabel(item.statusBima)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              Total: {filteredData.length} data
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
