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

export interface Lahan {
  id: string;
  nama: string;
  pemilik: string;
  pemilikId: string;
  luas: string;
  tanaman: string;
  fase: "persiapan" | "vegetatif" | "generatif" | "panen";
  tanggalTanam: string;
  perkiraanPanen: string;
  progress: number;
  lokasi: string;
}

export type JenisAktivitas =
  | "Olah Tanah"
  | "Penyemaian"
  | "Pemupukan"
  | "Penyiraman"
  | "Pengendalian Hama"
  | "Panen";

export interface Aktivitas {
  id: string;
  petani: string;
  petaniId: string;
  lahan: string;
  lahanId: string;
  jenis: JenisAktivitas;
  tanaman: string;
  catatan: string;
  tanggal: string;
  tanggalSelesai: string | null;
  waktu: string;
  status: "berjalan" | "selesai";
}

export interface KPIData {
  totalPetani: number;
  totalLahan: number;
  aktivitasBulanIni: number;
  siapPanen: number;
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
  waktu: string;
  isDone: boolean;
}
