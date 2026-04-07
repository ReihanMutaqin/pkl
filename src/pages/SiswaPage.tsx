import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AdminData, PKLData } from '@/types/pkl';
import { STATUS_BIMA_OPTIONS, getStatusLabel } from '@/types/pkl';
import { PlusCircle, Trash2, Edit, ClipboardList, Search, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Wifi } from 'lucide-react';
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

  // Filter data Inet yang belum dipakai (opsional, bisa dihapus jika ingin memperbolehkan duplikat)
  const availableInet = adminData;

  // Cek data mana yang sudah diupdate oleh siswa
  const getIsDataUpdated = (adminItem: AdminData) => {
    return pklData.some(pkl => pkl.adminDataId === adminItem.id || pkl.inet === adminItem.inet);
  };

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

  const filteredData = pklData.filter(item => 
    item.tiket.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fallout.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.wonum.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.statusBima.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button 
            onClick={() => setShowInetList(!showInetList)}
            className="w-full flex items-center justify-between hover:bg-green-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
          >
            <CardTitle className="text-base flex items-center gap-2 font-medium">
              <Wifi className="w-4 h-4 text-green-600" />
              Data Inet Tersedia
              <Badge variant="secondary" className="text-xs">
                {adminData.length}
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                {pklData.length} sudah diupdate
              </Badge>
            </CardTitle>
            {showInetList ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        
        {showInetList && (
          <CardContent className="pt-0">
            {adminData.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Belum ada data Inet dari Admin
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                {adminData.map((item) => {
                  const isUpdated = getIsDataUpdated(item);
                  return (
                    <div 
                      key={item.id} 
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-default ${
                        isUpdated 
                          ? 'bg-green-100 border-green-400 text-green-800' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                      title={`SC: ${item.scOrder}${isUpdated ? ' - Sudah diupdate' : ''}`}
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

              {/* Pilih Inet dari data Admin */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="selectInet">Pilih Inet (dari data Admin)</Label>
                <Select value={selectedInet} onValueChange={handleInetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Inet" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInet.map((item) => {
                      const isExisting = pklData.some(pkl => pkl.inet === item.inet);
                      return (
                        <SelectItem key={item.id} value={item.inet}>
                          {item.inet} (SC: {item.scOrder}) {isExisting && '⚠️ Sudah ada data'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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

              {/* Info SC ORDER (readonly) */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="scOrderDisplay">SC ORDER</Label>
                <Input
                  id="scOrderDisplay"
                  value={selectedInet ? adminData.find(d => d.inet === selectedInet)?.scOrder || '' : ''}
                  disabled
                  placeholder="SC ORDER akan muncul setelah memilih Inet"
                />
              </div>
              
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cari progress (tiket, fallout, WONUM, inet, SC ORDER, status...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Progress PKL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Inet</TableHead>
                  <TableHead>SC ORDER</TableHead>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Fallout</TableHead>
                  <TableHead>WONUM</TableHead>
                  <TableHead>STATUS BIMA</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Belum ada progress PKL
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
                        <div className="text-xs text-muted-foreground mt-1">
                          {getStatusLabel(item.statusBima)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
