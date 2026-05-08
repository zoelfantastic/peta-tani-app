import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Query } from "firebase-admin/firestore";

const db = () => getFirestore();

const JENIS_AKTIVITAS = new Set([
  "olah_tanah",
  "semai",
  "pupuk",
  "penyiraman",
  "panen",
  "pengendalian_hama",
]);

export const catatAktivitas = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const data = request.data as Record<string, unknown>;
  const lahanId = data.lahan_id as string;
  const jenis = data.jenis as string;
  const tanggal = data.tanggal as string;

  if (!lahanId) throw new HttpsError("invalid-argument", "Lahan diperlukan");
  if (!JENIS_AKTIVITAS.has(jenis)) {
    throw new HttpsError("invalid-argument", `Jenis aktivitas tidak valid: ${jenis}`);
  }
  if (!tanggal) throw new HttpsError("invalid-argument", "Tanggal diperlukan");

  const lahanDoc = await db().collection("lahan").doc(lahanId).get();
  if (!lahanDoc.exists) throw new HttpsError("not-found", "Lahan tidak ditemukan");
  if (lahanDoc.data()?.uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses ke lahan ini");
  }

  const docRef = db().collection("aktivitas").doc();
  await docRef.set({
    uid: request.auth.uid,
    lahan_id: lahanId,
    lahan_nama: lahanDoc.data()?.nama ?? "", // denormalized untuk query admin
    jenis,
    tanggal,
    catatan: data.catatan ?? null,
    jumlah: data.jumlah ?? null,
    satuan: data.satuan ?? null,
    created_at: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
});

export const editAktivitas = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const aktivitasId = request.data.id as string;
  if (!aktivitasId) throw new HttpsError("invalid-argument", "ID aktivitas diperlukan");

  const docRef = db().collection("aktivitas").doc(aktivitasId);
  const doc = await docRef.get();

  if (!doc.exists) throw new HttpsError("not-found", "Aktivitas tidak ditemukan");
  if (doc.data()?.uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses");
  }

  const ALLOWED = new Set(["jenis", "tanggal", "catatan", "jumlah", "satuan"]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request.data as Record<string, unknown>)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }

  if ("jenis" in updates && !JENIS_AKTIVITAS.has(updates.jenis as string)) {
    throw new HttpsError("invalid-argument", "Jenis aktivitas tidak valid");
  }

  await docRef.update(updates);
  return { success: true };
});

export const hapusAktivitas = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const aktivitasId = request.data.id as string;
  if (!aktivitasId) throw new HttpsError("invalid-argument", "ID aktivitas diperlukan");

  const docRef = db().collection("aktivitas").doc(aktivitasId);
  const doc = await docRef.get();

  if (!doc.exists) throw new HttpsError("not-found", "Aktivitas tidak ditemukan");
  if (doc.data()?.uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses");
  }

  await docRef.delete();
  return { success: true };
});

export const getRiwayat = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const data = request.data as Record<string, unknown>;
  const limit = Math.min(Number(data.limit ?? 20), 50);
  const lahanId = data.lahan_id as string | undefined;
  const lastDocId = data.last_doc_id as string | undefined;

  let query: Query = db()
    .collection("aktivitas")
    .where("uid", "==", request.auth.uid)
    .orderBy("tanggal", "desc");

  if (lahanId) {
    query = query.where("lahan_id", "==", lahanId);
  }

  if (lastDocId) {
    const lastDoc = await db().collection("aktivitas").doc(lastDocId).get();
    if (lastDoc.exists) query = query.startAfter(lastDoc);
  }

  const snap = await query.limit(limit).get();

  return {
    aktivitas: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    has_more: snap.docs.length === limit,
  };
});
