import { useState } from 'react';
import * as XLSX from 'xlsx';
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
  ChevronDown,
  Download
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
  const [selectedName, setSelectedName] = useState<string>(''); // '' = semua
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

  // Daftar nama unik untuk filter chips
  const uniqueNames = Array.from(
    new Set(pklData.map(item => (item.namaInput?.trim() || 'Tidak Diketahui').replace(/\b\w/g, c => c.toUpperCase())))
  ).sort();

  // Hitung jumlah pekerjaan per nama (semua status)
  const countByName = pklData.reduce<Record<string, number>>((acc, item) => {
    const name = (item.namaInput?.trim() || 'Tidak Diketahui').replace(/\b\w/g, c => c.toUpperCase());
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const filteredData = pklData.filter(item => {
    const name = (item.namaInput?.trim() || 'Tidak Diketahui').replace(/\b\w/g, c => c.toUpperCase());
    const matchName = selectedName === '' || name === selectedName;
    const q = searchTerm.toLowerCase();
    const matchSearch = q === '' ||
      item.tiket.toLowerCase().includes(q) ||
      item.fallout.toLowerCase().includes(q) ||
      item.wonum.toLowerCase().includes(q) ||
      item.inet.toLowerCase().includes(q) ||
      item.scOrder.toLowerCase().includes(q) ||
      item.statusBima.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q);
    return matchName && matchSearch;
  });

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

  const handleDownloadXLSX = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const filterLabel = selectedName ? selectedName : 'Semua Siswa';
    const wb = XLSX.utils.book_new();

    // ─────────────────────────────────────────
    // SHEET 1: RINGKASAN PER SISWA
    // ─────────────────────────────────────────
    const summaryData: (string | number)[][] = [
      // Baris info
      ['LAPORAN PROGRESS PKL', '', '', '', '', '', '', ''],
      ['Tanggal Unduh', dateStr, '', '', '', '', '', ''],
      ['Filter', filterLabel, '', '', '', '', '', ''],
      ['Total Data', filteredData.length, '', '', '', '', '', ''],
      [],
      // Header tabel ringkasan
      ['Nama Siswa', 'Total', 'COMPWORK', 'WAPPR', 'INSTCOMP', 'ACTCOMP', 'CANCLWORK', 'WORKFAIL'],
    ];

    // Baris data ringkasan (hanya nama yang ada di filteredData)
    const activeNames = Array.from(
      new Set(filteredData.map(d => (d.namaInput?.trim() || 'Tidak Diketahui').replace(/\b\w/g, c => c.toUpperCase())))
    ).sort();

    activeNames.forEach(name => {
      const items = filteredData.filter(d =>
        (d.namaInput?.trim() || 'Tidak Diketahui').replace(/\b\w/g, c => c.toUpperCase()) === name
      );
      const cnt = (s: string) => items.filter(d => d.statusBima === s).length;
      summaryData.push([
        name,
        items.length,
        cnt('COMPWORK'),
        cnt('WAPPR'),
        cnt('INSTCOMP'),
        cnt('ACTCOMP'),
        cnt('CANCLWORK'),
        cnt('WORKFAIL'),
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Lebar kolom sheet ringkasan
    wsSummary['!cols'] = [
      { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 10 }, { wch: 13 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // ─────────────────────────────────────────
    // SHEET 2: DETAIL DATA (dengan AutoFilter)
    // ─────────────────────────────────────────
    const detailHeader = [
      'No', 'Nama Siswa', 'Inet', 'SC ORDER', 'Tiket', 'Fallout', 'WONUM', 'Status BIMA', 'Keterangan Status', 'Tanggal Input',
    ];

    const detailRows = filteredData.map((item, index) => [
      index + 1,
      (item.namaInput?.trim() || '-').replace(/\b\w/g, c => c.toUpperCase()),
      item.inet,
      item.scOrder,
      item.tiket,
      item.fallout,
      item.wonum,
      item.statusBima,
      getStatusLabel(item.statusBima),
      new Date(item.createdAt).toLocaleDateString('id-ID'),
    ]);

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);

    // Auto-filter pada seluruh kolom header
    const lastCol = XLSX.utils.encode_col(detailHeader.length - 1);
    const lastRow = detailRows.length + 1;
    wsDetail['!autofilter'] = { ref: `A1:${lastCol}${lastRow}` };

    // Lebar kolom sheet detail
    wsDetail['!cols'] = [
      { wch: 5 },  // No
      { wch: 26 }, // Nama
      { wch: 14 }, // Inet
      { wch: 22 }, // SC ORDER
      { wch: 18 }, // Tiket
      { wch: 10 }, // Fallout
      { wch: 20 }, // WONUM
      { wch: 13 }, // Status
      { wch: 24 }, // Keterangan
      { wch: 14 }, // Tanggal
    ];

    // Freeze baris pertama (header tetap terlihat saat scroll)
    wsDetail['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Data');

    // ─────────────────────────────────────────
    // DOWNLOAD
    // ─────────────────────────────────────────
    XLSX.writeFile(wb, `laporan-progress-pkl-${now.toISOString().slice(0, 10)}.xlsx`);
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
              {leaderboard.map((entry) => {
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
      <Dialog open={showViewAll} onOpenChange={(open) => { setShowViewAll(open); if (!open) { setSelectedName(''); setSearchTerm(''); } }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-semibold">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Semua Data Progress PKL
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Copy'}
                </Button>
                <Button
                  onClick={handleDownloadXLSX}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  title="Download laporan lengkap Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowViewAll(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 overflow-hidden flex-1 px-6 py-4">

            {/* ── Kartu ringkasan per siswa ── */}
            {uniqueNames.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {/* Chip "Semua" */}
                <button
                  onClick={() => setSelectedName('')}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                    selectedName === ''
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-muted/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-xs font-semibold truncate">Semua Siswa</span>
                  <span className={`ml-2 shrink-0 text-sm font-bold ${
                    selectedName === '' ? 'text-primary-foreground' : 'text-primary'
                  }`}>{pklData.length}</span>
                </button>

                {/* Chip per nama */}
                {uniqueNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedName(prev => prev === name ? '' : name)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                      selectedName === name
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/40 hover:bg-muted'
                    }`}
                  >
                    <span className="text-xs font-semibold truncate">{name}</span>
                    <span className={`ml-2 shrink-0 text-sm font-bold ${
                      selectedName === name ? 'text-primary-foreground' : 'text-primary'
                    }`}>{countByName[name] ?? 0}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Search ── */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari tiket, inet, SC ORDER, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* ── Info baris aktif ── */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {selectedName
                  ? <><span className="font-semibold text-foreground">{selectedName}</span> — {filteredData.length} pekerjaan</>
                  : <>Menampilkan <span className="font-semibold text-foreground">{filteredData.length}</span> dari {pklData.length} total data</>}
              </span>
              {(selectedName || searchTerm) && (
                <button
                  onClick={() => { setSelectedName(''); setSearchTerm(''); }}
                  className="text-primary underline hover:no-underline text-xs"
                >
                  Reset filter
                </button>
              )}
            </div>

            {/* ── Tabel ── */}
            <div className="overflow-auto flex-1 border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow className="text-xs">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead className="min-w-[130px]">Nama Siswa</TableHead>
                    <TableHead className="min-w-[110px]">Inet</TableHead>
                    <TableHead className="min-w-[140px]">SC ORDER</TableHead>
                    <TableHead className="min-w-[110px]">Tiket</TableHead>
                    <TableHead className="min-w-[80px]">Fallout</TableHead>
                    <TableHead className="min-w-[110px]">WONUM</TableHead>
                    <TableHead className="min-w-[130px]">Status BIMA</TableHead>
                    <TableHead className="min-w-[90px]">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 opacity-30" />
                          <p>Tidak ada data yang sesuai filter</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={item.id} className="text-sm hover:bg-muted/40 transition-colors">
                        <TableCell className="text-center text-muted-foreground text-xs">{index + 1}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary text-xs">
                            {(item.namaInput?.trim() || '-').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-xs">{item.inet}</TableCell>
                        <TableCell className="text-xs text-blue-700 break-all">{item.scOrder}</TableCell>
                        <TableCell className="text-xs">{item.tiket}</TableCell>
                        <TableCell className="text-xs">{item.fallout}</TableCell>
                        <TableCell className="text-xs">{item.wonum}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(item.statusBima)} text-[10px] px-1.5 py-0`}>
                            {item.statusBima}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                            {getStatusLabel(item.statusBima)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
