import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = () => getFirestore();

export const tambahReminder = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");

  const data = request.data as Record<string, unknown>;
  const lahanId = data.lahan_id as string;
  const tanggal = data.tanggal as string;
  const jenis = data.jenis as string;

  if (!lahanId || !tanggal || !jenis) {
    throw new HttpsError("invalid-argument", "lahan_id, tanggal, dan jenis diperlukan");
  }

  const lahanDoc = await db().collection("lahan").doc(lahanId).get();
  if (!lahanDoc.exists || lahanDoc.data()?.uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses ke lahan ini");
  }

  const docRef = db().collection("reminders").doc();
  await docRef.set({
    uid: request.auth.uid,
    lahan_id: lahanId,
    lahan_nama: lahanDoc.data()?.nama ?? "",
    jenis,
    tanggal,
    waktu: (data.waktu as string) ?? "07:00",
    is_done: false,
    created_at: FieldValue.serverTimestamp(),
  });

  return { id: docRef.id };
});

export const selesaikanReminder = onCall(async (request: CallableRequest) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login diperlukan");

  const reminderId = request.data.id as string;
  if (!reminderId) throw new HttpsError("invalid-argument", "ID reminder diperlukan");

  const docRef = db().collection("reminders").doc(reminderId);
  const doc = await docRef.get();

  if (!doc.exists) throw new HttpsError("not-found", "Reminder tidak ditemukan");
  if (doc.data()?.uid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Tidak punya akses");
  }

  await docRef.update({ is_done: true });
  return { success: true };
});

// Jalan tiap hari jam 00:00 UTC = 07:00 WIB
export const kirimPengingatHarian = onSchedule("0 0 * * *", async () => {
  const firestore = db();
  const today = new Date().toISOString().slice(0, 10);

  const snap = await firestore
    .collection("reminders")
    .where("tanggal", "==", today)
    .where("is_done", "==", false)
    .get();

  logger.info(`[kirimPengingatHarian] ${today}: ${snap.size} reminder aktif`);
  // TODO: kirim FCM notification via firebase-admin messaging
});
