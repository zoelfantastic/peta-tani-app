import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, Timestamp, Query } from "firebase-admin/firestore";

const db = () => getFirestore();

async function verifyAdmin(uid: string): Promise<void> {
  const doc = await db().collection("admins").doc(uid).get();
  if (!doc.exists) {
    throw new HttpsError("permission-denied", "Akses admin diperlukan");
  }
}

function pctChange(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 1000) / 10;
}

export const getDashboardKpi = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const firestore = db();
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    petaniSnap,
    lahanSnap,
    aktivitasSnap,
    panenSnap,
    aktivitasThisMonthSnap,
    aktivitasLastMonthSnap,
    recentSnap,
  ] = await Promise.all([
    firestore.collection("users").get(),
    firestore.collection("lahan").get(),
    firestore.collection("aktivitas").get(),
    firestore.collection("aktivitas").where("jenis", "==", "panen").get(),
    firestore
      .collection("aktivitas")
      .where("created_at", ">=", Timestamp.fromDate(firstThisMonth))
      .get(),
    firestore
      .collection("aktivitas")
      .where("created_at", ">=", Timestamp.fromDate(firstLastMonth))
      .where("created_at", "<", Timestamp.fromDate(firstThisMonth))
      .get(),
    firestore.collection("aktivitas").orderBy("created_at", "desc").limit(5).get(),
  ]);

  const recentAktivitas = await Promise.all(
    recentSnap.docs.map(async (doc) => {
      const d = doc.data();
      const userDoc = await firestore.collection("users").doc((d.uid as string) ?? "").get();
      return {
        id: doc.id,
        ...d,
        petani_nama: (userDoc.data()?.nama as string) ?? "-",
      };
    })
  );

  return {
    kpi: {
      total_petani: petaniSnap.size,
      total_lahan: lahanSnap.size,
      total_aktivitas: aktivitasSnap.size,
      total_panen: panenSnap.size,
      aktivitas_change_pct: pctChange(aktivitasThisMonthSnap.size, aktivitasLastMonthSnap.size),
    },
    aktivitas_terbaru: recentAktivitas,
  };
});

export const getDaftarPetani = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const data = request.data as Record<string, unknown>;
  const limit = Math.min(Number(data.limit ?? 20), 100);
  const lastDocId = data.last_doc_id as string | undefined;
  const search = ((data.search as string) ?? "").trim().toLowerCase();

  const firestore = db();
  let query: Query = firestore.collection("users").orderBy("nama");

  if (lastDocId) {
    const lastDoc = await firestore.collection("users").doc(lastDocId).get();
    if (lastDoc.exists) query = query.startAfter(lastDoc);
  }

  const snap = await query.limit(limit).get();

  const filtered = snap.docs.filter(
    (doc) => !search || ((doc.data().nama as string) ?? "").toLowerCase().includes(search)
  );

  const petaniList = await Promise.all(
    filtered.map(async (doc) => {
      const [lahanSnap, aktivitasSnap, lastAktivitasSnap] = await Promise.all([
        firestore.collection("lahan").where("uid", "==", doc.id).get(),
        firestore.collection("aktivitas").where("uid", "==", doc.id).get(),
        firestore
          .collection("aktivitas")
          .where("uid", "==", doc.id)
          .orderBy("created_at", "desc")
          .limit(1)
          .get(),
      ]);

      const d = doc.data();
      return {
        id: doc.id,
        nama: d.nama,
        nomor_hp: d.nomor_hp,
        foto_url: d.foto_url,
        jumlah_lahan: lahanSnap.size,
        jumlah_aktivitas: aktivitasSnap.size,
        last_aktivitas_at: lastAktivitasSnap.docs[0]?.data().created_at ?? null,
      };
    })
  );

  return { petani: petaniList, has_more: snap.docs.length === limit };
});

export const getDetailPetani = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const uid = request.data.uid as string;
  if (!uid) throw new HttpsError("invalid-argument", "UID petani diperlukan");

  const firestore = db();
  const userDoc = await firestore.collection("users").doc(uid).get();
  if (!userDoc.exists) throw new HttpsError("not-found", "Petani tidak ditemukan");

  const [lahanSnap, aktivitasSnap] = await Promise.all([
    firestore.collection("lahan").where("uid", "==", uid).get(),
    firestore
      .collection("aktivitas")
      .where("uid", "==", uid)
      .orderBy("created_at", "desc")
      .limit(10)
      .get(),
  ]);

  return {
    petani: { id: userDoc.id, ...userDoc.data() },
    lahan: lahanSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    aktivitas_terbaru: aktivitasSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
});

export const getDaftarAktivitas = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const data = request.data as Record<string, unknown>;
  const limit = Math.min(Number(data.limit ?? 20), 100);
  const lastDocId = data.last_doc_id as string | undefined;

  const firestore = db();
  let query: Query = firestore.collection("aktivitas").orderBy("created_at", "desc");

  if (data.jenis) query = query.where("jenis", "==", data.jenis);
  if (data.from_date) query = query.where("tanggal", ">=", data.from_date);
  if (data.to_date) query = query.where("tanggal", "<=", data.to_date);

  if (lastDocId) {
    const lastDoc = await firestore.collection("aktivitas").doc(lastDocId).get();
    if (lastDoc.exists) query = query.startAfter(lastDoc);
  }

  const snap = await query.limit(limit).get();

  return {
    aktivitas: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    has_more: snap.docs.length === limit,
  };
});

export const getAnalitik = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const days = Number(request.data.days ?? 30);
  const fromDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const firestore = db();
  const [aktivitasSnap, lahanSnap] = await Promise.all([
    firestore.collection("aktivitas").where("tanggal", ">=", fromDate).get(),
    firestore.collection("lahan").get(),
  ]);

  const trend: Record<string, number> = {};
  const jenisCount: Record<string, number> = {};

  for (const doc of aktivitasSnap.docs) {
    const d = doc.data();
    const tanggal = ((d.tanggal as string) ?? "").slice(0, 10);
    trend[tanggal] = (trend[tanggal] ?? 0) + 1;
    const jenis = (d.jenis as string) ?? "lainnya";
    jenisCount[jenis] = (jenisCount[jenis] ?? 0) + 1;
  }

  const tanamanCount: Record<string, number> = {};
  for (const doc of lahanSnap.docs) {
    const tanaman = (doc.data().jenis_tanaman as string) ?? "Lainnya";
    tanamanCount[tanaman] = (tanamanCount[tanaman] ?? 0) + 1;
  }

  return {
    trend_aktivitas: Object.entries(trend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tanggal, count]) => ({ tanggal, count })),
    distribusi_jenis: Object.entries(jenisCount).map(([jenis, count]) => ({ jenis, count })),
    distribusi_tanaman: Object.entries(tanamanCount).map(([tanaman, count]) => ({
      tanaman,
      count,
    })),
  };
});

export const generateLaporan = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");
  await verifyAdmin(request.auth.uid);

  const data = request.data as Record<string, unknown>;
  const fromDate = data.from_date as string;
  const toDate = data.to_date as string;
  const jenisLaporan = (data.jenis as string) ?? "ringkasan_bulanan";

  if (!fromDate || !toDate) {
    throw new HttpsError("invalid-argument", "from_date dan to_date diperlukan");
  }

  const firestore = db();
  const snap = await firestore
    .collection("aktivitas")
    .where("tanggal", ">=", fromDate)
    .where("tanggal", "<=", toDate)
    .orderBy("tanggal")
    .get();

  const petaniMap: Record<string, { nama: string; aktivitas: unknown[] }> = {};

  await Promise.all(
    snap.docs.map(async (doc) => {
      const d = doc.data();
      const uid = (d.uid as string) ?? "";

      if (!petaniMap[uid]) {
        const userDoc = await firestore.collection("users").doc(uid).get();
        petaniMap[uid] = {
          nama: (userDoc.data()?.nama as string) ?? "-",
          aktivitas: [],
        };
      }

      petaniMap[uid].aktivitas.push({
        id: doc.id,
        jenis: d.jenis,
        tanggal: d.tanggal,
        lahan_nama: d.lahan_nama,
        catatan: d.catatan,
        jumlah: d.jumlah,
        satuan: d.satuan,
      });
    })
  );

  return {
    jenis: jenisLaporan,
    from_date: fromDate,
    to_date: toDate,
    total_aktivitas: snap.size,
    data: Object.values(petaniMap),
  };
});
