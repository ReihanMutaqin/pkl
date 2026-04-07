import type { PKLData } from '@/types/pkl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PKLTableProps {
  data: PKLData[];
  onDelete: (id: string) => void;
  onEdit: (data: PKLData) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'IN PROGRESS':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'PENDING':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'CLOSED':
      return 'bg-green-500 hover:bg-green-600';
    case 'CANCEL':
      return 'bg-red-500 hover:bg-red-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

export function PKLTable({ data, onDelete, onEdit }: PKLTableProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Daftar Progress PKL</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Tiket</TableHead>
                <TableHead>Fallout</TableHead>
                <TableHead>WONUM</TableHead>
                <TableHead>Inet</TableHead>
                <TableHead>SC ORDER</TableHead>
                <TableHead>STATUS BIMA</TableHead>
                <TableHead>Tanggal Input</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Belum ada data progress PKL
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.tiket}</TableCell>
                    <TableCell>{item.fallout}</TableCell>
                    <TableCell>{item.wonum}</TableCell>
                    <TableCell>{item.inet}</TableCell>
                    <TableCell>{item.scOrder}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.statusBima)}>
                        {item.statusBima}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(item.id)}
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
  );
}
