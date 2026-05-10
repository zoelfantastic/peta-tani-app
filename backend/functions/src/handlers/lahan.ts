import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, DocumentSnapshot } from "firebase-admin/firestore";

const db = () => getFirestore();

// ─── Konstanta validasi ────────────────────────────────────

const JENIS_LAHAN = new Set(["Sawah", "Kebun", "Pekarangan", "Hutan"]);

const SATUAN_LUAS = new Set(["Ha", "m²", "are", "bahu"]);

function assertOwner(doc: DocumentSnapshot, uid: string): void {
  if (!doc.exists) throw new HttpsError("not-found", "Lahan tidak ditemukan");
  if (doc.data()?.uid !== uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses ke lahan ini");
  }
}

function asCoord(v: unknown): number | null {
  const n = Number(v);
  return v !== undefined && v !== null && !isNaN(n) ? n : null;
}

// ─── tambahLahan ───────────────────────────────────────────

export const tambahLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const data = request.data as Record<string, unknown>;

  const nama = ((data.nama as string) ?? "").trim();
  const jenisTanaman = ((data.jenis_tanaman as string) ?? "").trim();
  const jenisLahan = ((data.jenis_lahan as string) ?? "").trim();

  if (!nama) throw new HttpsError("invalid-argument", "Nama lahan diperlukan");
  if (!jenisTanaman) throw new HttpsError("invalid-argument", "Jenis tanaman diperlukan");
  if (!jenisLahan) throw new HttpsError("invalid-argument", "Jenis lahan diperlukan");
  if (!JENIS_LAHAN.has(jenisLahan)) {
    throw new HttpsError("invalid-argument", `Jenis lahan tidak valid: ${jenisLahan}. Pilih: ${[...JENIS_LAHAN].join(", ")}`);
  }

  const luas = Number(data.luas ?? 0);
  if (luas < 0) throw new HttpsError("invalid-argument", "Luas tidak boleh negatif");

  const satuanLuas = ((data.satuan_luas as string) ?? "Ha").trim();
  if (!SATUAN_LUAS.has(satuanLuas)) {
    throw new HttpsError("invalid-argument", `Satuan luas tidak valid: ${satuanLuas}`);
  }

  const latitude = asCoord(data.latitude);
  const longitude = asCoord(data.longitude);

  const docRef = db().collection("lahan").doc();
  await docRef.set({
    uid: request.auth.uid,
    nama,
    jenis_tanaman: jenisTanaman,
    jenis_lahan: jenisLahan,
    luas,
    satuan_luas: satuanLuas,
    emoji: (data.emoji as string | null) ?? null,
    latitude,
    longitude,
    catatan: (data.catatan as string | null) ?? null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
});

// ─── editLahan ─────────────────────────────────────────────

export const editLahan = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const lahanId = request.data.id as string;
  if (!lahanId) throw new HttpsError("invalid-argument", "ID lahan diperlukan");

  const docRef = db().collection("lahan").doc(lahanId);
  assertOwner(await docRef.get(), request.auth.uid);

  const ALLOWED = new Set([
    "nama",
    "jenis_tanaman",
    "jenis_lahan",
    "luas",
    "satuan_luas",
    "emoji",
    "latitude",
    "longitude",
    "catatan",
  ]);

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request.data as Record<string, unknown>)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }

  if (
    "jenis_lahan" in updates &&
    updates.jenis_lahan !== null &&
    !JENIS_LAHAN.has(updates.jenis_lahan as string)
  ) {
    throw new HttpsError("invalid-argument", "Jenis lahan tidak valid");
  }

  if (
    "satuan_luas" in updates &&
    updates.satuan_luas !== null &&
    !SATUAN_LUAS.has(updates.satuan_luas as string)
  ) {
    throw new HttpsError("invalid-argument", "Satuan luas tidak valid");
  }

  if ("luas" in updates) {
    const luas = Number(updates.luas);
    if (isNaN(luas) || luas < 0) {
      throw new HttpsError("invalid-argument", "Luas tidak valid");
    }
    updates.luas = luas;
  }

  updates.updated_at = FieldValue.serverTimestamp();
  await docRef.update(updates);

  return { success: true };
});

// ─── hapusLahan ────────────────────────────────────────────

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

// ─── getLahanList ──────────────────────────────────────────

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

// ─── getDetailLahan ────────────────────────────────────────

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
