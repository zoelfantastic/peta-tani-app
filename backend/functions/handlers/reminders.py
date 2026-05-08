from firebase_functions import https_fn, scheduler_fn
from firebase_admin import firestore
from datetime import datetime, timezone


def _db():
    return firestore.client()


@https_fn.on_call()
def tambah_reminder(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    data = req.data
    lahan_id = data.get("lahan_id")
    tanggal = data.get("tanggal")  # YYYY-MM-DD
    jenis = data.get("jenis")

    if not all([lahan_id, tanggal, jenis]):
        raise https_fn.HttpsError("invalid-argument", "lahan_id, tanggal, dan jenis diperlukan")

    lahan_doc = _db().collection("lahan").document(lahan_id).get()
    if not lahan_doc.exists or lahan_doc.get("uid") != req.auth.uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses ke lahan ini")

    doc_ref = _db().collection("reminders").document()
    doc_ref.set({
        "uid": req.auth.uid,
        "lahan_id": lahan_id,
        "lahan_nama": lahan_doc.get("nama"),
        "jenis": jenis,
        "tanggal": tanggal,
        "waktu": data.get("waktu", "07:00"),
        "is_done": False,
        "created_at": datetime.now(timezone.utc),
    })

    return {"id": doc_ref.id}


@https_fn.on_call()
def selesaikan_reminder(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    reminder_id = req.data.get("id")
    if not reminder_id:
        raise https_fn.HttpsError("invalid-argument", "ID reminder diperlukan")

    doc_ref = _db().collection("reminders").document(reminder_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise https_fn.HttpsError("not-found", "Reminder tidak ditemukan")
    if doc.get("uid") != req.auth.uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses")

    doc_ref.update({"is_done": True})
    return {"success": True}


# Jalan tiap hari jam 00:00 UTC = 07:00 WIB
# Future: kirim FCM push notification ke tiap user yang punya reminder hari ini
@scheduler_fn.on_schedule(schedule="0 0 * * *")
def kirim_pengingat_harian(event: scheduler_fn.ScheduledEvent) -> None:
    db = _db()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    reminders = list(
        db.collection("reminders")
        .where("tanggal", "==", today)
        .where("is_done", "==", False)
        .stream()
    )

    print(f"[kirim_pengingat_harian] {today}: {len(reminders)} reminder aktif")
    # TODO: kirim FCM notification via firebase_admin.messaging
