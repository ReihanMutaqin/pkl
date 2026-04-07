import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { AdminPage } from '@/pages/AdminPage';
import { SiswaPage } from '@/pages/SiswaPage';
import type { AdminData, PKLData } from '@/types/pkl';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const [adminData, setAdminData] = useState<AdminData[]>([]);
  const [pklData, setPklData] = useState<PKLData[]>([]);

  // Listen to Firestore real-time updates for AdminData
  useEffect(() => {
    const q = query(collection(db, 'adminData'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminData[];
      setAdminData(data);
    }, (error) => {
      console.error("Error fetching adminData:", error);
      toast.error("Gagal sinkronisasi data Admin");
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates for PKLData
  useEffect(() => {
    const q = query(collection(db, 'pklData'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PKLData[];
      setPklData(data);
    }, (error) => {
      console.error("Error fetching pklData:", error);
      toast.error("Gagal sinkronisasi data PKL");
    });

    return () => unsubscribe();
  }, []);

  // Handler untuk Admin
  const handleAddAdminData = async (newData: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'adminData'), {
        ...newData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Data master berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambah data master');
    }
  };

  const handleDeleteAdminData = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'adminData', id));
      toast.success('Data master berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus data master');
    }
  };

  // Handler untuk Siswa PKL
  const handleAddPKL = async (newData: Omit<PKLData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'pklData'), {
        ...newData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Progress PKL berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambah progress PKL');
    }
  };

  const handleDeletePKL = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pklData', id));
      toast.success('Progress PKL berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus progress PKL');
    }
  };

  const handleEditPKL = async (updatedData: PKLData) => {
    try {
      const { id, ...dataToUpdate } = updatedData;
      await updateDoc(doc(db, 'pklData', id), {
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      });
      toast.success('Progress PKL berhasil diupdate!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengupdate progress PKL');
    }
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard adminData={adminData} pklData={pklData} />} />
          <Route 
            path="/admin" 
            element={
              <AdminPage 
                adminData={adminData}
                onAddAdminData={handleAddAdminData}
                onDeleteAdminData={handleDeleteAdminData}
              />
            } 
          />
          <Route 
            path="/siswa" 
            element={
              <SiswaPage 
                adminData={adminData}
                pklData={pklData}
                onAddPKL={handleAddPKL}
                onDeletePKL={handleDeletePKL}
                onEditPKL={handleEditPKL}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
