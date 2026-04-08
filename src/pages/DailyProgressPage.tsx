import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdminData, PKLData } from '@/types/pkl';
import { getStatusLabel } from '@/types/pkl';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ListChecks,
  History,
  CalendarCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface DailyProgressPageProps {
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

// Helper: get date string in WIB (UTC+7) as YYYY-MM-DD
const getWIBDateString = (isoString: string): string => {
  const date = new Date(isoString);
  // Convert to WIB (UTC+7)
  const wibOffset = 7 * 60; // minutes
  const wibDate = new Date(date);
  wibDate.setUTCMinutes(wibDate.getUTCMinutes() + wibOffset);
  return wibDate.toISOString().split('T')[0];
};

// Helper: get today's date string in WIB
const getTodayWIB = (): string => {
  const now = new Date();
  const wibOffset = 7 * 60;
  const wibNow = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
  return wibNow.toISOString().split('T')[0];
};

// Helper: format date to readable Indonesian format
const formatDateID = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('id-ID', options);
};

// Helper: format time from ISO string
const formatTimeWIB = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
};

// Helper: get relative day label
const getRelativeDay = (dateStr: string, today: string): string => {
  const dateMs = new Date(dateStr).getTime();
  const todayMs = new Date(today).getTime();
  const diffDays = Math.round((todayMs - dateMs) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari Ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays === 2) return '2 Hari Lalu';
  if (diffDays === 3) return '3 Hari Lalu';
  return `${diffDays} Hari Lalu`;
};

export function DailyProgressPage({ adminData, pklData }: DailyProgressPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getTodayWIB());

  const today = getTodayWIB();

  // Split data: today vs previous days
  const { todayData, historyGrouped, historyDates, totalHistoryCount } = useMemo(() => {
    const todayItems: PKLData[] = [];
    const historyMap: Record<string, PKLData[]> = {};

    pklData.forEach(item => {
      const itemDate = getWIBDateString(item.createdAt);
      if (itemDate === selectedDate) {
        todayItems.push(item);
      } else if (itemDate < selectedDate) {
        if (!historyMap[itemDate]) historyMap[itemDate] = [];
        historyMap[itemDate].push(item);
      }
    });

    // Sort today items by createdAt desc
    todayItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort history dates descending
    const sortedDates = Object.keys(historyMap).sort((a, b) => b.localeCompare(a));
    
    // Sort items within each date
    sortedDates.forEach(date => {
      historyMap[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    let totalHistory = 0;
    sortedDates.forEach(d => { totalHistory += historyMap[d].length; });

    return {
      todayData: todayItems,
      historyGrouped: historyMap,
      historyDates: sortedDates,
      totalHistoryCount: totalHistory
    };
  }, [pklData, selectedDate]);

  // Filter for search
  const filterItem = (item: PKLData) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.tiket.toLowerCase().includes(term) ||
      item.fallout.toLowerCase().includes(term) ||
      item.wonum.toLowerCase().includes(term) ||
      item.inet.toLowerCase().includes(term) ||
      item.scOrder.toLowerCase().includes(term) ||
      item.statusBima.toLowerCase().includes(term)
    );
  };

  const filteredTodayData = todayData.filter(filterItem);

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleCopyToday = () => {
    const headers = ['No', 'Nama', 'Inet', 'SC ORDER', 'Tiket', 'Fallout', 'WONUM', 'STATUS BIMA', 'Jam'];
    const rows = filteredTodayData.map((item, index) => [
      index + 1,
      item.namaInput || '-',
      item.inet,
      item.scOrder,
      item.tiket,
      item.fallout,
      item.wonum,
      item.statusBima,
      formatTimeWIB(item.createdAt)
    ]);
    const csvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHistory = (dateKey: string) => {
    const items = historyGrouped[dateKey] || [];
    const headers = ['No', 'Nama', 'Inet', 'SC ORDER', 'Tiket', 'Fallout', 'WONUM', 'STATUS BIMA', 'Tanggal', 'Jam'];
    const rows = items.map((item, index) => [
      index + 1,
      item.namaInput || '-',
      item.inet,
      item.scOrder,
      item.tiket,
      item.fallout,
      item.wonum,
      item.statusBima,
      getWIBDateString(item.createdAt),
      formatTimeWIB(item.createdAt)
    ]);
    const csvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === today;

  // Stats for today
  const todayCompwork = todayData.filter(d => d.statusBima === 'COMPWORK').length;
  const todayWappr = todayData.filter(d => d.statusBima === 'WAPPR').length;
  const progressPercent = adminData.length > 0 ? ((todayData.length / adminData.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Progres Harian</h1>
          <p className="text-sm text-muted-foreground">Tracking progress PKL per hari</p>
        </div>
      </div>

      {/* Date Navigator */}
      <Card className="border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center min-w-[250px]">
              <div className="flex items-center justify-center gap-2">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span className="font-semibold text-lg">
                  {formatDateID(selectedDate)}
                </span>
              </div>
              {isToday && (
                <Badge className="bg-green-500 mt-1">Hari Ini</Badge>
              )}
              {!isToday && (
                <span className="text-xs text-muted-foreground">
                  {getRelativeDay(selectedDate, today)}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              disabled={selectedDate >= today}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(getTodayWIB())}
                className="gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Hari Ini
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards for selected date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dikerjakan</p>
                <p className="text-2xl font-bold">{todayData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">COMPWORK</p>
                <p className="text-2xl font-bold">{todayCompwork}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WAPPR</p>
                <p className="text-2xl font-bold">{todayWappr}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500 bg-opacity-10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Progress {isToday ? 'Hari Ini' : formatDateID(selectedDate)}
            </span>
            <span className="text-sm text-muted-foreground">
              {todayData.length} / {adminData.length} order
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================== */}
      {/* SECTION 1: Progress Hari Ini       */}
      {/* ================================== */}
      <Card className="border-green-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <ListChecks className="w-5 h-5" />
              {isToday ? '🟢 Progress Hari Ini' : `📅 Progress ${formatDateID(selectedDate)}`}
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                {todayData.length} order
              </Badge>
            </CardTitle>
            <Button
              onClick={handleCopyToday}
              variant="outline"
              size="sm"
              className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
              disabled={todayData.length === 0}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Search for today */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari data hari ini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table className="table-fixed min-w-[850px]">
              <TableHeader className="bg-green-50">
                <TableRow>
                  <TableHead className="w-[40px]">No</TableHead>
                  <TableHead className="w-[120px]">Nama</TableHead>
                  <TableHead className="w-[110px]">Inet</TableHead>
                  <TableHead className="w-[150px]">SC ORDER</TableHead>
                  <TableHead className="w-[100px]">Tiket</TableHead>
                  <TableHead className="w-[140px]">Fallout</TableHead>
                  <TableHead className="w-[100px]">WONUM</TableHead>
                  <TableHead className="w-[100px]">STATUS BIMA</TableHead>
                  <TableHead className="w-[55px]">Jam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTodayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarDays className="w-10 h-10 text-gray-300" />
                        <p className="font-medium">Belum ada progress {isToday ? 'hari ini' : 'pada tanggal ini'}</p>
                        <p className="text-xs">
                          {isToday ? 'Mulai input progress di halaman Input Progres' : 'Tidak ada data pada tanggal ini'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTodayData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-green-50/50">
                      <TableCell className="font-medium text-green-700">{index + 1}</TableCell>
                      <TableCell className="font-medium text-primary truncate" title={item.namaInput || '-'}>{item.namaInput || '-'}</TableCell>
                      <TableCell className="font-medium truncate" title={item.inet}>{item.inet}</TableCell>
                      <TableCell className="truncate" title={item.scOrder}>{item.scOrder}</TableCell>
                      <TableCell className="truncate" title={item.tiket}>{item.tiket}</TableCell>
                      <TableCell className="truncate" title={item.fallout}>{item.fallout}</TableCell>
                      <TableCell className="truncate" title={item.wonum}>{item.wonum}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.statusBima)}>
                          {item.statusBima}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {getStatusLabel(item.statusBima)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatTimeWIB(item.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* SECTION 2: Riwayat Order yang Sudah Dikerjakan */}
      {/* ============================================ */}
      <Card className="border-slate-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
            <History className="w-5 h-5" />
            📋 Riwayat Order yang Sudah Dikerjakan
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">
              {totalHistoryCount} order
            </Badge>
            <Badge variant="outline" className="text-xs">
              {historyDates.length} hari
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {historyDates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-medium">Belum ada riwayat sebelumnya</p>
              <p className="text-xs">Order yang sudah dikerjakan akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyDates.map(dateKey => {
                const items = historyGrouped[dateKey];
                const isExpanded = expandedDates[dateKey] ?? false;
                const compworkInDate = items.filter(i => i.statusBima === 'COMPWORK').length;

                return (
                  <div key={dateKey} className="border rounded-lg overflow-hidden">
                    {/* Date Group Header */}
                    <button
                      onClick={() => toggleDateExpand(dateKey)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarCheck className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="font-semibold text-sm">
                            {formatDateID(dateKey)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({getRelativeDay(dateKey, today)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {items.length} order
                          </Badge>
                          {compworkInDate > 0 && (
                            <Badge className="bg-green-500 text-xs">
                              {compworkInDate} selesai
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Table */}
                    {isExpanded && (
                      <div>
                        <div className="flex justify-end px-4 py-2 bg-white border-t">
                          <Button
                            onClick={() => handleCopyHistory(dateKey)}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-xs"
                          >
                            <Copy className="w-3 h-3" />
                            Copy ke Spreadsheet
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <Table className="table-fixed min-w-[850px]">
                            <TableHeader className="bg-slate-50">
                              <TableRow>
                                <TableHead className="w-[40px]">No</TableHead>
                                <TableHead className="w-[120px]">Nama</TableHead>
                                <TableHead className="w-[110px]">Inet</TableHead>
                                <TableHead className="w-[150px]">SC ORDER</TableHead>
                                <TableHead className="w-[100px]">Tiket</TableHead>
                                <TableHead className="w-[140px]">Fallout</TableHead>
                                <TableHead className="w-[100px]">WONUM</TableHead>
                                <TableHead className="w-[100px]">STATUS BIMA</TableHead>
                                <TableHead className="w-[55px]">Jam</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item, index) => (
                                <TableRow key={item.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell className="font-medium text-primary truncate" title={item.namaInput || '-'}>{item.namaInput || '-'}</TableCell>
                                  <TableCell className="font-medium truncate" title={item.inet}>{item.inet}</TableCell>
                                  <TableCell className="truncate" title={item.scOrder}>{item.scOrder}</TableCell>
                                  <TableCell className="truncate" title={item.tiket}>{item.tiket}</TableCell>
                                  <TableCell className="truncate" title={item.fallout}>{item.fallout}</TableCell>
                                  <TableCell className="truncate" title={item.wonum}>{item.wonum}</TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(item.statusBima)}>
                                      {item.statusBima}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {getStatusLabel(item.statusBima)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {formatTimeWIB(item.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
    </div>
  );
}
