// Data yang diinput oleh Admin (Master Data)
export interface AdminData {
  id: string;
  inet: string;
  scOrder: string;
  createdAt: string;
  updatedAt: string;
}

// Data yang diinput oleh Siswa PKL (Progress Data)
export interface PKLData {
  id: string;
  adminDataId: string; // Referensi ke data admin
  inet: string; // Copy dari admin untuk kemudahan
  scOrder: string; // Copy dari admin untuk kemudahan
  namaInput: string; // Nama penginput (siswa PKL)
  tiket: string;
  fallout: string;
  wonum: string;
  statusBima: StatusBima;
  createdAt: string;
  updatedAt: string;
}

export type StatusBima = 'COMPWORK' | 'WAPPR' | 'INSTCOMP' | 'ACTCOMP' | 'CANCLWORK' | 'WORKFAIL';

export const STATUS_BIMA_OPTIONS: StatusBima[] = [
  'COMPWORK',
  'WAPPR',
  'INSTCOMP',
  'ACTCOMP',
  'CANCLWORK',
  'WORKFAIL'
];

// Helper untuk mendapatkan label yang lebih readable
export const getStatusLabel = (status: StatusBima): string => {
  const labels: Record<StatusBima, string> = {
    'COMPWORK': 'Complete Work',
    'WAPPR': 'Waiting Approval',
    'INSTCOMP': 'Install Complete',
    'ACTCOMP': 'Activity Complete',
    'CANCLWORK': 'Cancel Work',
    'WORKFAIL': 'Work Failed'
  };
  return labels[status] || status;
};
