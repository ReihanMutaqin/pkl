import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminData } from '@/types/pkl';
import { PlusCircle, Trash2, UserCog, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPageProps {
  adminData: AdminData[];
  onAddAdminData: (data: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteAdminData: (id: string) => void;
}

export function AdminPage({ adminData, onAddAdminData, onDeleteAdminData }: AdminPageProps) {
  const [formData, setFormData] = useState({
    inet: '',
    scOrder: '',
    note: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

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
            Input Data Inet & SC ORDER
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
          <CardTitle className="text-lg">Daftar Data Master (Inet & SC ORDER)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[420px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Inet</TableHead>
                  <TableHead>SC ORDER</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Tanggal Input</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada data master
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.inet}</TableCell>
                      <TableCell>{item.scOrder}</TableCell>
                      <TableCell className="text-muted-foreground">{item.note || '-'}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteAdminData(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
