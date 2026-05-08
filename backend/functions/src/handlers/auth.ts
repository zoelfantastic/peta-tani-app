import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = () => getFirestore();

export const setupProfil = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const nama = ((request.data.nama as string) ?? "").trim();
  if (!nama) {
    throw new HttpsError("invalid-argument", "Nama tidak boleh kosong");
  }

  await db().collection("users").doc(request.auth.uid).set({
    nama,
    nomor_hp: request.auth.token.phone_number ?? "",
    foto_url: null,
    notif_enabled: true,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const updateProfil = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const updates: Record<string, unknown> = {};

  if ("nama" in request.data) {
    const nama = ((request.data.nama as string) ?? "").trim();
    if (!nama) throw new HttpsError("invalid-argument", "Nama tidak boleh kosong");
    updates.nama = nama;
  }
  if ("foto_url" in request.data) {
    updates.foto_url = request.data.foto_url;
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpsError("invalid-argument", "Tidak ada data yang diubah");
  }

  updates.updated_at = FieldValue.serverTimestamp();
  await db().collection("users").doc(request.auth.uid).update(updates);

  return { success: true };
});

export const updateNotifSettings = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  if (request.data.notif_enabled == null) {
    throw new HttpsError("invalid-argument", "notif_enabled diperlukan");
  }

  await db().collection("users").doc(request.auth.uid).update({
    notif_enabled: Boolean(request.data.notif_enabled),
    updated_at: FieldValue.serverTimestamp(),
  });

  return { success: true };
});
