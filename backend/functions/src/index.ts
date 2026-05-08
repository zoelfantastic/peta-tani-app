import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

initializeApp();
setGlobalOptions({ maxInstances: 10 });

// Auth & profil petani
export { setupProfil, updateProfil, updateNotifSettings } from "./handlers/auth";

// Manajemen lahan
export {
  tambahLahan,
  editLahan,
  hapusLahan,
  getLahanList,
  getDetailLahan,
} from "./handlers/lahan";

// Catat & riwayat aktivitas
export {
  catatAktivitas,
  editAktivitas,
  hapusAktivitas,
  getRiwayat,
} from "./handlers/aktivitas";

// Data Beranda (stats + pengingat + aktivitas terbaru)
export { getBerandaData } from "./handlers/beranda";

// Admin dashboard
export {
  getDashboardKpi,
  getDaftarPetani,
  getDetailPetani,
  getDaftarAktivitas,
  getAnalitik,
  generateLaporan,
} from "./handlers/admin";

// Pengingat & scheduler harian
export {
  tambahReminder,
  selesaikanReminder,
  kirimPengingatHarian,
} from "./handlers/reminders";
