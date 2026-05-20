import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { AdminData } from '@/types/pkl';
import { PlusCircle, Trash2, UserCog, Search, Edit, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPageProps {
  adminData: AdminData[];
  onAddAdminData: (data: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteAdminData: (id: string) => void;
  onEditAdminData: (data: AdminData) => void;
}

export function AdminPage({ adminData, onAddAdminData, onDeleteAdminData, onEditAdminData }: AdminPageProps) {
  const [formData, setFormData] = useState({
    inet: '',
    scOrder: '',
    note: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk edit dialog
  const [editingItem, setEditingItem] = useState<AdminData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.inet && formData.scOrder) {
      // Cek apakah inet sudah ada
      const exists = adminData.some(item => item.inet.toLowerCase() === formData.inet.toLowerCase());
      if (exists) {
        toast.error('Inet sudah ada dalam database!');
        return;
      }
      onAddAdminData(formData);
      setFormData({ inet: '', scOrder: '', note: '' });
      toast.success('Data berhasil ditambahkan!');
    }
  };

  const handleOpenEdit = (item: AdminData) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editingItem.inet.trim() || !editingItem.scOrder.trim()) {
      toast.error('Inet dan SC ORDER tidak boleh kosong!');
      return;
    }
    // Cek duplikat inet (kecuali item yang sedang diedit)
    const duplicate = adminData.some(
      item => item.id !== editingItem.id && item.inet.toLowerCase() === editingItem.inet.toLowerCase()
    );
    if (duplicate) {
      toast.error('Inet sudah ada dalam database!');
      return;
    }
    onEditAdminData(editingItem);
    setIsEditDialogOpen(false);
    setEditingItem(null);
    toast.success('Data berhasil diperbarui!');
  };

  const filteredData = adminData.filter(item =>
    item.inet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Mode Admin - Input Data Master</h1>
      </div>

      <Card className="w-full border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Input Data Inet &amp; SC ORDER
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inet">Inet</Label>
                <Input
                  id="inet"
                  placeholder="Masukkan Inet"
                  value={formData.inet}
                  onChange={(e) => setFormData({ ...formData, inet: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scOrder">SC ORDER</Label>
                <Input
                  id="scOrder"
                  placeholder="Masukkan SC ORDER"
                  value={formData.scOrder}
                  onChange={(e) => setFormData({ ...formData, scOrder: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="note">Catatan (Opsional)</Label>
                <Input
                  id="note"
                  placeholder="Masukkan catatan khusus untuk Inet ini..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Simpan Data Master
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cari data (inet, SC ORDER...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Data Master (Inet &amp; SC ORDER)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[420px] rounded-md border">
            <Table className="w-full table-fixed min-w-[700px]">
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead className="w-[130px]">Inet</TableHead>
                  <TableHead>SC ORDER</TableHead>
                  <TableHead className="w-[160px]">Catatan</TableHead>
                  <TableHead className="w-[110px]">Tgl Input</TableHead>
                  <TableHead className="w-[90px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada data master
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.inet}</TableCell>
                      <TableCell className="text-xs text-blue-700 break-all">{item.scOrder}</TableCell>
                      <TableCell className="text-muted-foreground text-sm truncate" title={item.note || '-'}>
                        {item.note || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit data"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteAdminData(item.id)}
                            title="Hapus data"
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Data Master
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-admin-inet">Inet</Label>
                <Input
                  id="edit-admin-inet"
                  placeholder="Masukkan Inet"
                  value={editingItem.inet}
                  onChange={(e) => setEditingItem({ ...editingItem, inet: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-admin-sc">SC ORDER</Label>
                <Input
                  id="edit-admin-sc"
                  placeholder="Masukkan SC ORDER"
                  value={editingItem.scOrder}
                  onChange={(e) => setEditingItem({ ...editingItem, scOrder: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-admin-note">Catatan (Opsional)</Label>
                <Input
                  id="edit-admin-note"
                  placeholder="Masukkan catatan khusus..."
                  value={editingItem.note || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} className="gap-2">
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
