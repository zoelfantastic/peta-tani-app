from firebase_functions import https_fn
from firebase_admin import firestore
from datetime import datetime, timezone
import calendar


def _db():
    return firestore.client()


@https_fn.on_call()
def get_beranda_data(req: https_fn.CallableRequest) -> dict:
    """Satu endpoint untuk semua data Beranda: profil, stats, pengingat, aktivitas terbaru."""
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    uid = req.auth.uid
    db = _db()
    now = datetime.now(timezone.utc)

    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day = calendar.monthrange(now.year, now.month)[1]
    end_of_month = now.replace(day=last_day, hour=23, minute=59, second=59)
    today_str = now.strftime("%Y-%m-%d")

    # Stats
    jumlah_lahan = len(list(db.collection("lahan").where("uid", "==", uid).stream()))
    aktivitas_bulan_ini = len(list(
        db.collection("aktivitas")
        .where("uid", "==", uid)
        .where("created_at", ">=", first_of_month)
        .where("created_at", "<=", end_of_month)
        .stream()
    ))

    # 3 aktivitas terbaru
    aktivitas_terbaru = [
        {"id": d.id, **d.to_dict()}
        for d in (
            db.collection("aktivitas")
            .where("uid", "==", uid)
            .order_by("created_at", direction="DESCENDING")
            .limit(3)
            .stream()
        )
    ]

    # Pengingat hari ini yang belum selesai
    pengingat_hari_ini = [
        {"id": d.id, **d.to_dict()}
        for d in (
            db.collection("reminders")
            .where("uid", "==", uid)
            .where("tanggal", "==", today_str)
            .where("is_done", "==", False)
            .stream()
        )
    ]

    user_doc = db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    return {
        "nama": user_data.get("nama", ""),
        "stats": {
            "jumlah_lahan": jumlah_lahan,
            "aktivitas_bulan_ini": aktivitas_bulan_ini,
        },
        "pengingat_hari_ini": pengingat_hari_ini,
        "aktivitas_terbaru": aktivitas_terbaru,
    }
