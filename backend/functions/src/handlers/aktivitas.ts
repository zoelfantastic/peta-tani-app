import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Query } from "firebase-admin/firestore";

const db = () => getFirestore();

// ─── Konstanta validasi ────────────────────────────────────

const JENIS_AKTIVITAS = new Set([
  "olahTanah",
  "persemaian",
  "penanaman",
  "pemupukan",
  "pengendalianOpt",
  "penyiangan",
  "panen",
]);

export const VALID_ALAT = new Set([
  "Traktor Roda 2",
  "Traktor Roda 4",
  "Transplanter",
  "Sprayer",
  "Drone",
  "Combine Harvester",
  "Manual",
]);

// Alat yang membutuhkan input bahan bakar
export const ALAT_BBM = new Set([
  "Traktor Roda 2",
  "Traktor Roda 4",
  "Transplanter",
  "Combine Harvester",
]);

// Alat yang membutuhkan input jumlah unit
export const ALAT_UNIT = new Set(["Sprayer", "Drone"]);

// Alat yang menonaktifkan input saprodi
export const ALAT_DISABLE_SAPRODI = new Set([
  "Traktor Roda 2",
  "Traktor Roda 4",
  "Combine Harvester",
]);

export const VALID_SAPRODI = new Set(["Benih", "Pupuk", "Pestisida", "Herbisida"]);

const VALID_SATUAN_SAPRODI = new Set(["kg", "botol", "liter"]);

// ─── Helper ────────────────────────────────────────────────

function asNum(v: unknown): number | null {
  const n = Number(v);
  return v !== undefined && v !== null && !isNaN(n) ? n : null;
}

// ─── catatAktivitas ────────────────────────────────────────

export const catatAktivitas = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const data = request.data as Record<string, unknown>;

  // ── Core fields ──────────────────────────────────────────
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

  // ── Alat yang digunakan ──────────────────────────────────
  const alatYangDigunakan = (data.alat_yang_digunakan as string | null) ?? null;

  if (alatYangDigunakan !== null && !VALID_ALAT.has(alatYangDigunakan)) {
    throw new HttpsError("invalid-argument", `Alat tidak valid: ${alatYangDigunakan}`);
  }

  const needsBbm = alatYangDigunakan !== null && ALAT_BBM.has(alatYangDigunakan);
  const needsUnit = alatYangDigunakan !== null && ALAT_UNIT.has(alatYangDigunakan);

  const kebutuhanBahanBakar = asNum(data.kebutuhan_bahan_bakar);
  const biayaBahanBakar = asNum(data.biaya_bahan_bakar);
  const jumlahAlatUnit = asNum(data.jumlah_alat_unit);

  if (needsBbm && kebutuhanBahanBakar === null) {
    throw new HttpsError("invalid-argument", "Kebutuhan bahan bakar diperlukan untuk alat ini");
  }
  if (needsBbm && biayaBahanBakar === null) {
    throw new HttpsError("invalid-argument", "Biaya bahan bakar diperlukan untuk alat ini");
  }
  if (needsUnit && jumlahAlatUnit === null) {
    throw new HttpsError("invalid-argument", "Jumlah alat (unit) diperlukan untuk alat ini");
  }

  // ── Kebutuhan saprodi ────────────────────────────────────
  const jenisSaprodi = (data.jenis_saprodi as string | null) ?? null;

  if (jenisSaprodi !== null) {
    if (!VALID_SAPRODI.has(jenisSaprodi)) {
      throw new HttpsError("invalid-argument", `Jenis saprodi tidak valid: ${jenisSaprodi}`);
    }
    if (alatYangDigunakan !== null && ALAT_DISABLE_SAPRODI.has(alatYangDigunakan)) {
      throw new HttpsError(
        "invalid-argument",
        "Alat ini tidak mendukung input saprodi"
      );
    }
  }

  const jumlahSaprodi = asNum(data.jumlah_saprodi);
  const satuanSaprodi = (data.satuan_saprodi as string | null) ?? null;
  const biayaSaprodi = asNum(data.biaya_saprodi);

  if (jenisSaprodi !== null && jumlahSaprodi === null) {
    throw new HttpsError("invalid-argument", "Jumlah saprodi diperlukan");
  }
  if (satuanSaprodi !== null && !VALID_SATUAN_SAPRODI.has(satuanSaprodi)) {
    throw new HttpsError("invalid-argument", `Satuan saprodi tidak valid: ${satuanSaprodi}`);
  }

  // ── HOK ─────────────────────────────────────────────────
  const jumlahTenagaKerja = asNum(data.jumlah_tenaga_kerja);
  const biayaHok = asNum(data.biaya_hok);

  // ── Simpan ───────────────────────────────────────────────
  const docRef = db().collection("aktivitas").doc();
  await docRef.set({
    uid: request.auth.uid,
    lahan_id: lahanId,
    lahan_nama: lahanDoc.data()?.nama ?? "",
    jenis,
    tanggal,
    tanggal_selesai: (data.tanggal_selesai as string | null) ?? null,
    catatan: (data.catatan as string | null) ?? null,
    jumlah: asNum(data.jumlah),
    satuan: (data.satuan as string | null) ?? null,
    // Alat
    alat_yang_digunakan: alatYangDigunakan,
    kebutuhan_bahan_bakar: needsBbm ? kebutuhanBahanBakar : null,
    biaya_bahan_bakar: needsBbm ? biayaBahanBakar : null,
    jumlah_alat_unit: needsUnit ? jumlahAlatUnit : null,
    // Saprodi
    jenis_saprodi: jenisSaprodi,
    jumlah_saprodi: jenisSaprodi !== null ? jumlahSaprodi : null,
    satuan_saprodi: jenisSaprodi !== null ? satuanSaprodi : null,
    biaya_saprodi: jenisSaprodi !== null ? biayaSaprodi : null,
    // HOK
    jumlah_tenaga_kerja: jumlahTenagaKerja,
    biaya_hok: biayaHok,
    created_at: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
});

// ─── editAktivitas ─────────────────────────────────────────

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

  const ALLOWED = new Set([
    "jenis",
    "tanggal",
    "tanggal_selesai",
    "catatan",
    "jumlah",
    "satuan",
    // Alat
    "alat_yang_digunakan",
    "kebutuhan_bahan_bakar",
    "biaya_bahan_bakar",
    "jumlah_alat_unit",
    // Saprodi
    "jenis_saprodi",
    "jumlah_saprodi",
    "satuan_saprodi",
    "biaya_saprodi",
    // HOK
    "jumlah_tenaga_kerja",
    "biaya_hok",
  ]);

  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(request.data as Record<string, unknown>)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }

  if ("jenis" in updates && !JENIS_AKTIVITAS.has(updates.jenis as string)) {
    throw new HttpsError("invalid-argument", "Jenis aktivitas tidak valid");
  }
  if (
    "alat_yang_digunakan" in updates &&
    updates.alat_yang_digunakan !== null &&
    !VALID_ALAT.has(updates.alat_yang_digunakan as string)
  ) {
    throw new HttpsError("invalid-argument", "Alat tidak valid");
  }
  if (
    "jenis_saprodi" in updates &&
    updates.jenis_saprodi !== null &&
    !VALID_SAPRODI.has(updates.jenis_saprodi as string)
  ) {
    throw new HttpsError("invalid-argument", "Jenis saprodi tidak valid");
  }

  await docRef.update(updates);
  return { success: true };
});

// ─── hapusAktivitas ────────────────────────────────────────

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

// ─── getRiwayat ────────────────────────────────────────────

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
