export interface Petani {
  id: string;
  nama: string;
  hp: string;
  wilayah: string;
  bergabung: string;
  status: "aktif" | "tidak_aktif";
  jumlahLahan: number;
  totalAktivitas: number;
  lastActive: string;
}

export type JenisLahan = "Sawah" | "Kebun" | "Pekarangan" | "Hutan";

export interface Lahan {
  id: string;
  nama: string;
  pemilik: string;
  pemilikId: string;
  tanaman: string;
  jenisLahan: JenisLahan;
  luas: number;
  satuanLuas: string;
  emoji: string;
  latitude: number | null;
  longitude: number | null;
}

// Stored as the Dart enum name (type.name)
export type JenisAktivitas =
  | "olahTanah"
  | "persemaian"
  | "penanaman"
  | "pemupukan"
  | "pengendalianOpt"
  | "penyiangan"
  | "panen";

export const JENIS_AKTIVITAS_LABEL: Record<JenisAktivitas, string> = {
  olahTanah: "Olah Tanah",
  persemaian: "Persemaian",
  penanaman: "Penanaman",
  pemupukan: "Pemupukan",
  pengendalianOpt: "Pengendalian OPT",
  penyiangan: "Penyiangan",
  panen: "Panen",
};

export interface Aktivitas {
  id: string;
  petani: string;
  petaniId: string;
  lahan: string;
  lahanId: string;
  jenis: JenisAktivitas;
  tanaman: string;
  catatan: string | null;
  tanggal: string;
  tanggalSelesai: string | null;
  status: "berjalan" | "selesai";
  // Alat
  alatYangDigunakan: string | null;
  kebutuhanBahanBakar: number | null;
  biayaBahanBakar: number | null;
  jumlahAlatUnit: number | null;
  // Saprodi
  jenisSaprodi: string | null;
  jumlahSaprodi: number | null;
  satuanSaprodi: string | null;
  biayaSaprodi: number | null;
  // HOK
  jumlahTenagaKerja: number | null;
  biayaHok: number | null;
}

export interface KPIData {
  totalPetani: number;
  totalLahan: number;
  aktivitasBulanIni: number;
  totalPanen: number;
  perubahanPetani: number;
  perubahanLahan: number;
  perubahanAktivitas: number;
  perubahanPanen: number;
}

export interface Reminder {
  id: string;
  uid: string;
  lahanId: string;
  lahanNama: string;
  jenis: JenisAktivitas;
  tanggal: string;
  isDone: boolean;
}
