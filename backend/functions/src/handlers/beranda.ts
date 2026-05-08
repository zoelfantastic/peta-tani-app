import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const db = () => getFirestore();

export const getBerandaData = onCall(async (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan");
  }

  const uid = request.auth.uid;
  const firestore = db();
  const now = new Date();

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const todayStr = now.toISOString().slice(0, 10);

  const [lahanSnap, aktivitasBulanSnap, aktivitasTerbaruSnap, pengingatSnap, userDoc] =
    await Promise.all([
      firestore.collection("lahan").where("uid", "==", uid).get(),
      firestore
        .collection("aktivitas")
        .where("uid", "==", uid)
        .where("created_at", ">=", Timestamp.fromDate(firstOfMonth))
        .where("created_at", "<=", Timestamp.fromDate(endOfMonth))
        .get(),
      firestore
        .collection("aktivitas")
        .where("uid", "==", uid)
        .orderBy("created_at", "desc")
        .limit(3)
        .get(),
      firestore
        .collection("reminders")
        .where("uid", "==", uid)
        .where("tanggal", "==", todayStr)
        .where("is_done", "==", false)
        .get(),
      firestore.collection("users").doc(uid).get(),
    ]);

  return {
    nama: (userDoc.data()?.nama as string) ?? "",
    stats: {
      jumlah_lahan: lahanSnap.size,
      aktivitas_bulan_ini: aktivitasBulanSnap.size,
    },
    pengingat_hari_ini: pengingatSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    aktivitas_terbaru: aktivitasTerbaruSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
});
