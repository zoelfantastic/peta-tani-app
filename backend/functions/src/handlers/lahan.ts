import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, DocumentSnapshot } from "firebase-admin/firestore";

const db = () => getFirestore();

const FASE_OPTIONS = new Set(["persiapan", "vegetatif", "generatif", "panen"]);

function assertOwner(doc: DocumentSnapshot, uid: string): void {
  if (!doc.exists) throw new HttpsError("not-found", "Lahan tidak ditemukan");
  if (doc.data()?.uid !== uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses ke lahan ini");
  }
}

export const tambahLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const data = request.data as Record<string, unknown>;
  const nama = ((data.nama as string) ?? "").trim();
  const jenisTanaman = ((data.jenis_tanaman as string) ?? "").trim();

  if (!nama) throw new HttpsError("invalid-argument", "Nama lahan diperlukan");
  if (!jenisTanaman) throw new HttpsError("invalid-argument", "Jenis tanaman diperlukan");

  const fase = (data.fase as string) ?? "persiapan";
  if (!FASE_OPTIONS.has(fase)) {
    throw new HttpsError("invalid-argument", `Fase tidak valid: ${fase}`);
  }

  const docRef = db().collection("lahan").doc();
  await docRef.set({
    uid: request.auth.uid,
    nama,
    jenis_tanaman: jenisTanaman,
    luas_ha: Number(data.luas_ha ?? 0),
    tanggal_tanam: data.tanggal_tanam ?? null,
    fase,
    catatan: data.catatan ?? null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
});

export const editLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const lahanId = request.data.id as string;
  if (!lahanId) throw new HttpsError("invalid-argument", "ID lahan diperlukan");

  const docRef = db().collection("lahan").doc(lahanId);
  assertOwner(await docRef.get(), request.auth.uid);

  const ALLOWED = new Set(["nama", "jenis_tanaman", "luas_ha", "tanggal_tanam", "fase", "catatan"]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request.data as Record<string, unknown>)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }

  if ("fase" in updates && !FASE_OPTIONS.has(updates.fase as string)) {
    throw new HttpsError("invalid-argument", "Fase tidak valid");
  }

  updates.updated_at = FieldValue.serverTimestamp();
  await docRef.update(updates);

  return { success: true };
});

export const hapusLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const lahanId = request.data.id as string;
  if (!lahanId) throw new HttpsError("invalid-argument", "ID lahan diperlukan");

  const docRef = db().collection("lahan").doc(lahanId);
  assertOwner(await docRef.get(), request.auth.uid);
  await docRef.delete();

  return { success: true };
});

export const getLahanList = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const snap = await db()
    .collection("lahan")
    .where("uid", "==", request.auth.uid)
    .orderBy("created_at", "desc")
    .get();

  return { lahan: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

export const getDetailLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const lahanId = request.data.id as string;
  if (!lahanId) throw new HttpsError("invalid-argument", "ID lahan diperlukan");

  const doc = await db().collection("lahan").doc(lahanId).get();
  assertOwner(doc, request.auth.uid);

  const aktivitasSnap = await db()
    .collection("aktivitas")
    .where("lahan_id", "==", lahanId)
    .orderBy("tanggal", "desc")
    .limit(5)
    .get();

  return {
    id: doc.id,
    ...doc.data(),
    aktivitas_terbaru: aktivitasSnap.docs.map((a) => ({ id: a.id, ...a.data() })),
  };
});
