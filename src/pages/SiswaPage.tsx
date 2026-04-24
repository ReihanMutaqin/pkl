import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdminData, PKLData } from '@/types/pkl';
import { STATUS_BIMA_OPTIONS, getStatusLabel } from '@/types/pkl';
import { PlusCircle, Trash2, Edit, ClipboardList, Search, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Wifi, CalendarDays, CalendarCheck, Clock, Copy, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SiswaPageProps {
  adminData: AdminData[];
  pklData: PKLData[];
  onAddPKL: (data: Omit<PKLData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeletePKL: (id: string) => void;
  onEditPKL: (data: PKLData) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPWORK':
      return 'bg-green-500 hover:bg-green-600';
    case 'WAPPR':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'INSTCOMP':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'ACTCOMP':
      return 'bg-purple-500 hover:bg-purple-600';
    case 'CANCLWORK':
      return 'bg-red-500 hover:bg-red-600';
    case 'WORKFAIL':
      return 'bg-gray-700 hover:bg-gray-800';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// Helper: get date string in WIB (UTC+7) as YYYY-MM-DD
const getWIBDateString = (isoString: string): string => {
  const date = new Date(isoString);
  const wibOffset = 7 * 60;
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
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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
  return `${diffDays} Hari Lalu`;
};

export function SiswaPage({ adminData, pklData, onAddPKL, onDeletePKL, onEditPKL }: SiswaPageProps) {
  const [selectedInet, setSelectedInet] = useState<string>('');
  const [namaInput, setNamaInput] = useState(() => localStorage.getItem('pklNamaInput') || '');
  const [formData, setFormData] = useState({
    tiket: '',
    fallout: '',
    wonum: '',
    statusBima: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingData, setEditingData] = useState<PKLData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // State untuk peringatan data sudah ada
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingData, setExistingData] = useState<PKLData | null>(null);
  
  // State untuk expand/collapse daftar inet
  const [showInetList, setShowInetList] = useState(false);
  const [openInetCombobox, setOpenInetCombobox] = useState(false);

  // State untuk filter tanggal pada badge "sudah diupdate"
  const [inetFilterDate, setInetFilterDate] = useState<string>('today');
  
  // State untuk expand/collapse per tanggal di daftar progress
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [copiedDate, setCopiedDate] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'inet' | 'sc' | null>(null);

  const handleCopyField = (field: 'inet' | 'sc') => {
    const adminItem = adminData.find(d => d.inet === selectedInet);
    if (!adminItem) return;
    const value = field === 'inet' ? adminItem.inet : adminItem.scOrder;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      toast.success(`${field === 'inet' ? 'Inet' : 'SC ORDER'} berhasil disalin!`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const today = getTodayWIB();

  // Semua tanggal unik dari adminData.createdAt (descending) — untuk dropdown
  const uniqueAdminDates = useMemo(() => {
    const dateSet = new Set<string>();
    adminData.forEach(item => dateSet.add(getWIBDateString(item.createdAt)));
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [adminData]);

  // adminData yang ditambahkan pada tanggal yang dipilih
  const filteredAdminByDate = useMemo(() => {
    const targetDate = inetFilterDate === 'today' ? today : inetFilterDate;
    return adminData.filter(item => getWIBDateString(item.createdAt) === targetDate);
  }, [adminData, inetFilterDate, today]);

  // Hitung berapa inet (dari hari terpilih) yang sudah diupdate siswa
  const updatedCountForDate = useMemo(() => {
    return filteredAdminByDate.filter(adminItem =>
      pklData.some(pkl => pkl.adminDataId === adminItem.id || pkl.inet === adminItem.inet)
    ).length;
  }, [filteredAdminByDate, pklData]);

  // Helper: apakah inet sudah diupdate oleh siswa (kapanpun)?
  const getIsDataUpdated = (adminItem: AdminData): boolean => {
    return pklData.some(
      item => item.adminDataId === adminItem.id || item.inet === adminItem.inet
    );
  };

  // Group PKL data by date
  const { groupedByDate, sortedDates, totalCount } = useMemo(() => {
    const groups: Record<string, PKLData[]> = {};

    pklData.forEach(item => {
      const dateKey = getWIBDateString(item.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    // Sort items within each date by createdAt desc
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    // Sort dates descending (newest first)
    const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    // Auto-expand today
    if (dates.includes(today)) {
      setExpandedDates(prev => {
        if (prev[today] === undefined) return { ...prev, [today]: true };
        return prev;
      });
    }

    return { groupedByDate: groups, sortedDates: dates, totalCount: pklData.length };
  }, [pklData, today]);

  // Filter items within a date group
  const filterItem = (item: PKLData) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.tiket.toLowerCase().includes(term) ||
      item.fallout.toLowerCase().includes(term) ||
      item.wonum.toLowerCase().includes(term) ||
      item.inet.toLowerCase().includes(term) ||
      item.scOrder.toLowerCase().includes(term) ||
      item.statusBima.toLowerCase().includes(term) ||
      (item.namaInput || '').toLowerCase().includes(term)
    );
  };

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleCopyDate = (dateKey: string) => {
    const items = (groupedByDate[dateKey] || []).filter(filterItem);
    const headers = ['No', 'Nama', 'Inet', 'SC ORDER', 'Tiket', 'Fallout', 'WONUM', 'STATUS BIMA', 'Jam'];
    const rows = items.map((item, index) => [
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
    setCopiedDate(dateKey);
    setTimeout(() => setCopiedDate(null), 2000);
  };

  // Filter data Inet yang belum dipakai (opsional, bisa dihapus jika ingin memperbolehkan duplikat)
  const availableInet = adminData;

  const handleInetSelect = (value: string) => {
    setSelectedInet(value);
    // Cek apakah data dengan inet ini sudah ada
    const existing = pklData.find(pkl => pkl.inet === value);
    if (existing) {
      setExistingData(existing);
      setShowDuplicateWarning(true);
      // Isi form dengan data yang sudah ada
      setFormData({
        tiket: existing.tiket,
        fallout: existing.fallout,
        wonum: existing.wonum,
        statusBima: existing.statusBima
      });
      if (existing.namaInput) setNamaInput(existing.namaInput);
    } else {
      setExistingData(null);
      setShowDuplicateWarning(false);
      setFormData({ tiket: '', fallout: '', wonum: '', statusBima: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaInput.trim()) {
      toast.error('Masukkan nama Anda terlebih dahulu!');
      return;
    }
    if (!selectedInet) {
      toast.error('Pilih Inet terlebih dahulu!');
      return;
    }
    // Simpan nama ke localStorage supaya tidak perlu input ulang
    localStorage.setItem('pklNamaInput', namaInput.trim());
    if (formData.tiket && formData.fallout && formData.wonum && formData.statusBima) {
      const selectedAdminData = adminData.find(item => item.inet === selectedInet);
      if (selectedAdminData) {
        // Cek apakah data dengan inet ini sudah ada
        const existing = pklData.find(pkl => pkl.inet === selectedInet);
        
        if (existing) {
          // Update data yang sudah ada
          onEditPKL({
            ...existing,
            namaInput: namaInput.trim(),
            tiket: formData.tiket,
            fallout: formData.fallout,
            wonum: formData.wonum,
            statusBima: formData.statusBima as any
          });
          toast.success('Data berhasil diupdate! Data sebelumnya telah diganti.');
        } else {
          // Tambah data baru
          onAddPKL({
            adminDataId: selectedAdminData.id,
            inet: selectedAdminData.inet,
            scOrder: selectedAdminData.scOrder,
            namaInput: namaInput.trim(),
            tiket: formData.tiket,
            fallout: formData.fallout,
            wonum: formData.wonum,
            statusBima: formData.statusBima as any
          });
          toast.success('Progress PKL berhasil disimpan!');
        }
        
        setFormData({ tiket: '', fallout: '', wonum: '', statusBima: '' });
        setSelectedInet('');
        setShowDuplicateWarning(false);
        setExistingData(null);
      }
    }
  };

  const handleEdit = (item: PKLData) => {
    setEditingData(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingData) {
      onEditPKL(editingData);
      setIsEditDialogOpen(false);
      setEditingData(null);
      toast.success('Data berhasil diperbarui!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Input Progres</h1>
      </div>

      {/* Daftar Inet yang tersedia - Minimal & Elegant */}
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => setShowInetList(!showInetList)}
              className="flex-1 flex items-center justify-between hover:bg-green-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors text-left"
            >
              <CardTitle className="text-base flex items-center gap-2 font-medium">
                <Wifi className="w-4 h-4 text-green-600" />
                Data Inet Tersedia
                <Badge variant="secondary" className="text-xs">
                  {adminData.length}
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                  {updatedCountForDate} sudah diupdate
                </Badge>
              </CardTitle>
              {showInetList ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Dropdown filter tanggal */}
            <Select
              value={inetFilterDate}
              onValueChange={setInetFilterDate}
            >
              <SelectTrigger className="w-auto h-8 text-xs gap-1 border-green-300 text-green-700 bg-green-50 hover:bg-green-100 shrink-0">
                <CalendarDays className="w-3 h-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                {uniqueAdminDates
                  .filter(d => d !== today)
                  .map(d => (
                    <SelectItem key={d} value={d}>
                      {formatDateID(d)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        {showInetList && (
          <CardContent className="pt-0">
            {filteredAdminByDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Tidak ada data Inet yang ditambahkan admin pada hari ini
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {filteredAdminByDate.map((item) => {
                  const isUpdated = getIsDataUpdated(item);
                  return (
                    <div
                      key={item.id}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-default ${
                        isUpdated
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      title={`SC: ${item.scOrder}${isUpdated ? ' - Sudah diupdate' : ' - Belum diupdate'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        {item.inet}
                        {isUpdated && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Hijau = Sudah diupdate | Putih = Belum diupdate
            </p>
          </CardContent>
        )}
      </Card>
      
      <Card className="w-full border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Input Progress PKL
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Penginput */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="namaInput">Nama Kalian (Penginput)</Label>
                <Input
                  id="namaInput"
                  placeholder="Masukkan nama Anda"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  required
                />
              </div>

              {/* Pilih Inet dari data Admin - Combobox dengan Search */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="selectInet">Pilih Inet (dari data Admin)</Label>
                <Popover open={openInetCombobox} onOpenChange={setOpenInetCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openInetCombobox}
                      className="w-full justify-between font-normal h-10"
                    >
                      {selectedInet ? (
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{selectedInet}</span>
                          {pklData.some(pkl => pkl.inet === selectedInet) && (
                            <span className="text-xs text-yellow-600">⚠️ Sudah ada data</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pilih Inet...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari inet atau SC ORDER..." />
                      <CommandList className="max-h-64">
                        <CommandEmpty>Inet tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {availableInet.map((item) => {
                            const isExisting = pklData.some(pkl => pkl.inet === item.inet);
                            return (
                              <CommandItem
                                key={item.id}
                                value={`${item.inet} ${item.scOrder}`}
                                onSelect={() => {
                                  handleInetSelect(item.inet);
                                  setOpenInetCombobox(false);
                                }}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{item.inet}</span>
                                  <span className="text-xs text-muted-foreground">SC: {item.scOrder}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isExisting && (
                                    <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">⚠️ Ada data</span>
                                  )}
                                  {selectedInet === item.inet && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Peringatan data sudah ada */}
              {showDuplicateWarning && existingData && (
                <div className="md:col-span-2 bg-yellow-50 border border-yellow-400 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Peringatan: Data sudah ada!</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Data dengan Inet <strong>{selectedInet}</strong> sudah pernah diinput sebelumnya.
                      Jika Anda menyimpan, data sebelumnya akan diupdate.
                    </div>
                  </div>
                </div>
              )}

              {/* Info SC ORDER (readonly) + Copy Buttons */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="scOrderDisplay">SC ORDER</Label>
                <Input
                  id="scOrderDisplay"
                  value={selectedInet ? adminData.find(d => d.inet === selectedInet)?.scOrder || '' : ''}
                  disabled
                  placeholder="SC ORDER akan muncul setelah memilih Inet"
                />
              </div>

              {/* Copy Buttons - hanya muncul jika Inet sudah dipilih */}
              {selectedInet && (
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyField('inet')}
                      className={`flex-1 gap-2 transition-all ${
                        copiedField === 'inet'
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      {copiedField === 'inet' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedField === 'inet' ? 'Inet Tersalin! ✓' : 'Copy Inet'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyField('sc')}
                      className={`flex-1 gap-2 transition-all ${
                        copiedField === 'sc'
                          ? 'border-green-500 text-green-600 bg-green-50'
                          : 'border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400'
                      }`}
                    >
                      {copiedField === 'sc' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedField === 'sc' ? 'SC Tersalin! ✓' : 'Copy SC'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    💡 Gunakan tombol di atas untuk menyalin Inet atau SC ORDER ke clipboard
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="tiket">Tiket</Label>
                <Input
                  id="tiket"
                  placeholder="Masukkan nomor tiket"
                  value={formData.tiket}
                  onChange={(e) => setFormData({ ...formData, tiket: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fallout">Fallout</Label>
                <Input
                  id="fallout"
                  placeholder="Masukkan fallout"
                  value={formData.fallout}
                  onChange={(e) => setFormData({ ...formData, fallout: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wonum">WONUM</Label>
                <Input
                  id="wonum"
                  placeholder="Masukkan WONUM"
                  value={formData.wonum}
                  onChange={(e) => setFormData({ ...formData, wonum: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statusBima">STATUS BIMA</Label>
                <Select
                  value={formData.statusBima}
                  onValueChange={(value) => setFormData({ ...formData, statusBima: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status BIMA" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_BIMA_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status} - {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={!selectedInet}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Simpan Progress PKL
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-300 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
            <CalendarDays className="w-5 h-5" />
            📋 Daftar Progress PKL
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">
              {totalCount} order
            </Badge>
            <Badge variant="outline" className="text-xs">
              {sortedDates.length} hari
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari progress (tiket, fallout, WONUM, inet, SC ORDER, nama, status...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {sortedDates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="font-medium">Belum ada progress PKL</p>
              <p className="text-xs">Mulai input progress di form di atas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDates.map(dateKey => {
                const allItems = groupedByDate[dateKey];
                const filteredItems = allItems.filter(filterItem);
                const isExpanded = expandedDates[dateKey] ?? false;
                const isDateToday = dateKey === today;
                const compworkCount = allItems.filter(i => i.statusBima === 'COMPWORK').length;

                // Skip dates with no filtered results when searching
                if (searchTerm && filteredItems.length === 0) return null;

                return (
                  <div key={dateKey} className={`border rounded-lg overflow-hidden ${isDateToday ? 'border-green-300 shadow-sm' : ''}`}>
                    {/* Date Group Header */}
                    <button
                      onClick={() => toggleDateExpand(dateKey)}
                      className={`w-full flex items-center justify-between p-4 transition-colors text-left ${
                        isDateToday
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarCheck className={`w-4 h-4 ${isDateToday ? 'text-green-600' : 'text-slate-500'}`} />
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
                            {allItems.length} order
                          </Badge>
                          {compworkCount > 0 && (
                            <Badge className="bg-green-500 text-xs">
                              {compworkCount} selesai
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
                            onClick={() => handleCopyDate(dateKey)}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-xs"
                          >
                            {copiedDate === dateKey ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedDate === dateKey ? 'Tersalin!' : 'Copy ke Spreadsheet'}
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <Table className="table-fixed min-w-[900px]">
                            <TableHeader className={isDateToday ? 'bg-green-50' : 'bg-slate-50'}>
                              <TableRow>
                                <TableHead className="w-[40px]">No</TableHead>
                                <TableHead className="w-[120px]">Nama</TableHead>
                                <TableHead className="w-[110px]">Inet</TableHead>
                                <TableHead className="w-[140px]">SC ORDER</TableHead>
                                <TableHead className="w-[100px]">Tiket</TableHead>
                                <TableHead className="w-[130px]">Fallout</TableHead>
                                <TableHead className="w-[100px]">WONUM</TableHead>
                                <TableHead className="w-[100px]">STATUS BIMA</TableHead>
                                <TableHead className="w-[55px]">Jam</TableHead>
                                <TableHead className="w-[80px]">Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredItems.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                                    Tidak ada data yang cocok dengan pencarian
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredItems.map((item, index) => (
                                  <TableRow key={item.id} className={isDateToday ? 'hover:bg-green-50/50' : ''}>
                                    <TableCell className={isDateToday ? 'font-medium text-green-700' : ''}>{index + 1}</TableCell>
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
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(item)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => onDeletePKL(item.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Progress PKL</DialogTitle>
          </DialogHeader>
          {editingData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Inet (tidak bisa diubah)</Label>
                <Input value={editingData.inet} disabled />
              </div>
              <div className="space-y-2">
                <Label>SC ORDER (tidak bisa diubah)</Label>
                <Input value={editingData.scOrder} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tiket">Tiket</Label>
                <Input
                  id="edit-tiket"
                  value={editingData.tiket}
                  onChange={(e) => setEditingData({ ...editingData, tiket: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fallout">Fallout</Label>
                <Input
                  id="edit-fallout"
                  value={editingData.fallout}
                  onChange={(e) => setEditingData({ ...editingData, fallout: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wonum">WONUM</Label>
                <Input
                  id="edit-wonum"
                  value={editingData.wonum}
                  onChange={(e) => setEditingData({ ...editingData, wonum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">STATUS BIMA</Label>
                <Select
                  value={editingData.statusBima}
                  onValueChange={(value) => setEditingData({ ...editingData, statusBima: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_BIMA_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status} - {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveEdit} className="w-full">
                Simpan Perubahan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
