from firebase_functions import https_fn
from firebase_admin import firestore
from datetime import datetime, timezone, timedelta


def _db():
    return firestore.client()


def _verify_admin(uid: str) -> None:
    """Cek /admins/{uid} untuk verifikasi akses admin."""
    if not _db().collection("admins").document(uid).get().exists:
        raise https_fn.HttpsError("permission-denied", "Akses admin diperlukan")


def _pct_change(current: int, prev: int) -> float:
    if prev == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - prev) / prev * 100, 1)


@https_fn.on_call()
def get_dashboard_kpi(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    db = _db()
    now = datetime.now(timezone.utc)
    first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_last_month = (first_this_month - timedelta(days=1)).replace(day=1)

    total_petani = len(list(db.collection("users").stream()))
    total_lahan = len(list(db.collection("lahan").stream()))
    total_aktivitas = len(list(db.collection("aktivitas").stream()))
    total_panen = len(list(
        db.collection("aktivitas").where("jenis", "==", "panen").stream()
    ))

    aktv_this_month = len(list(
        db.collection("aktivitas").where("created_at", ">=", first_this_month).stream()
    ))
    aktv_last_month = len(list(
        db.collection("aktivitas")
        .where("created_at", ">=", first_last_month)
        .where("created_at", "<", first_this_month)
        .stream()
    ))

    # 5 aktivitas terbaru dengan nama petani
    recent_aktivitas = []
    for doc in (
        db.collection("aktivitas")
        .order_by("created_at", direction="DESCENDING")
        .limit(5)
        .stream()
    ):
        d = {"id": doc.id, **doc.to_dict()}
        user_doc = db.collection("users").document(d.get("uid", "")).get()
        d["petani_nama"] = user_doc.get("nama") if user_doc.exists else "-"
        recent_aktivitas.append(d)

    return {
        "kpi": {
            "total_petani": total_petani,
            "total_lahan": total_lahan,
            "total_aktivitas": total_aktivitas,
            "total_panen": total_panen,
            "aktivitas_change_pct": _pct_change(aktv_this_month, aktv_last_month),
        },
        "aktivitas_terbaru": recent_aktivitas,
    }


@https_fn.on_call()
def get_daftar_petani(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    db = _db()
    limit = min(int(req.data.get("limit", 20)), 100)
    last_doc_id = req.data.get("last_doc_id")
    search = req.data.get("search", "").strip().lower()

    query = db.collection("users").order_by("nama")
    if last_doc_id:
        last_doc = db.collection("users").document(last_doc_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    docs = list(query.limit(limit).stream())

    petani_list = []
    for doc in docs:
        d = doc.to_dict()
        if search and search not in (d.get("nama") or "").lower():
            continue

        jumlah_lahan = len(list(db.collection("lahan").where("uid", "==", doc.id).stream()))
        jumlah_aktivitas = len(list(db.collection("aktivitas").where("uid", "==", doc.id).stream()))

        last_aktv = list(
            db.collection("aktivitas")
            .where("uid", "==", doc.id)
            .order_by("created_at", direction="DESCENDING")
            .limit(1)
            .stream()
        )

        petani_list.append({
            "id": doc.id,
            "nama": d.get("nama"),
            "nomor_hp": d.get("nomor_hp"),
            "foto_url": d.get("foto_url"),
            "jumlah_lahan": jumlah_lahan,
            "jumlah_aktivitas": jumlah_aktivitas,
            "last_aktivitas_at": last_aktv[0].get("created_at") if last_aktv else None,
        })

    return {"petani": petani_list, "has_more": len(docs) == limit}


@https_fn.on_call()
def get_detail_petani(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    uid = req.data.get("uid")
    if not uid:
        raise https_fn.HttpsError("invalid-argument", "UID petani diperlukan")

    db = _db()
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise https_fn.HttpsError("not-found", "Petani tidak ditemukan")

    lahan_list = [
        {"id": d.id, **d.to_dict()}
        for d in db.collection("lahan").where("uid", "==", uid).stream()
    ]
    aktivitas_terbaru = [
        {"id": d.id, **d.to_dict()}
        for d in (
            db.collection("aktivitas")
            .where("uid", "==", uid)
            .order_by("created_at", direction="DESCENDING")
            .limit(10)
            .stream()
        )
    ]

    return {
        "petani": {"id": user_doc.id, **user_doc.to_dict()},
        "lahan": lahan_list,
        "aktivitas_terbaru": aktivitas_terbaru,
    }


@https_fn.on_call()
def get_daftar_aktivitas(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    db = _db()
    data = req.data
    limit = min(int(data.get("limit", 20)), 100)
    last_doc_id = data.get("last_doc_id")

    query = db.collection("aktivitas").order_by("created_at", direction="DESCENDING")

    if data.get("jenis"):
        query = query.where("jenis", "==", data["jenis"])
    if data.get("from_date"):
        query = query.where("tanggal", ">=", data["from_date"])
    if data.get("to_date"):
        query = query.where("tanggal", "<=", data["to_date"])

    if last_doc_id:
        last_doc = db.collection("aktivitas").document(last_doc_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    docs = list(query.limit(limit).stream())

    return {
        "aktivitas": [{"id": d.id, **d.to_dict()} for d in docs],
        "has_more": len(docs) == limit,
    }


@https_fn.on_call()
def get_analitik(req: https_fn.CallableRequest) -> dict:
    """Chart data: tren aktivitas harian + distribusi jenis + distribusi tanaman."""
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    db = _db()
    days = int(req.data.get("days", 30))
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    docs = list(db.collection("aktivitas").where("tanggal", ">=", from_date).stream())

    trend: dict[str, int] = {}
    jenis_count: dict[str, int] = {}

    for doc in docs:
        d = doc.to_dict()
        tanggal = (d.get("tanggal") or "")[:10]
        trend[tanggal] = trend.get(tanggal, 0) + 1
        jenis = d.get("jenis", "lainnya")
        jenis_count[jenis] = jenis_count.get(jenis, 0) + 1

    tanaman_count: dict[str, int] = {}
    for doc in db.collection("lahan").stream():
        tanaman = doc.get("jenis_tanaman") or "Lainnya"
        tanaman_count[tanaman] = tanaman_count.get(tanaman, 0) + 1

    return {
        "trend_aktivitas": [
            {"tanggal": k, "count": v} for k, v in sorted(trend.items())
        ],
        "distribusi_jenis": [
            {"jenis": k, "count": v} for k, v in jenis_count.items()
        ],
        "distribusi_tanaman": [
            {"tanaman": k, "count": v} for k, v in tanaman_count.items()
        ],
    }


@https_fn.on_call()
def generate_laporan(req: https_fn.CallableRequest) -> dict:
    """Generate data laporan, dikelompokkan per petani."""
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")
    _verify_admin(req.auth.uid)

    data = req.data
    from_date = data.get("from_date")
    to_date = data.get("to_date")
    jenis_laporan = data.get("jenis", "ringkasan_bulanan")

    if not from_date or not to_date:
        raise https_fn.HttpsError("invalid-argument", "from_date dan to_date diperlukan")

    db = _db()
    docs = list(
        db.collection("aktivitas")
        .where("tanggal", ">=", from_date)
        .where("tanggal", "<=", to_date)
        .order_by("tanggal")
        .stream()
    )

    petani_map: dict[str, dict] = {}
    for doc in docs:
        d = doc.to_dict()
        uid = d.get("uid", "")
        if uid not in petani_map:
            user_doc = db.collection("users").document(uid).get()
            petani_map[uid] = {
                "nama": user_doc.get("nama") if user_doc.exists else "-",
                "aktivitas": [],
            }
        petani_map[uid]["aktivitas"].append({
            "id": doc.id,
            "jenis": d.get("jenis"),
            "tanggal": d.get("tanggal"),
            "lahan_nama": d.get("lahan_nama"),
            "catatan": d.get("catatan"),
            "jumlah": d.get("jumlah"),
            "satuan": d.get("satuan"),
        })

    return {
        "jenis": jenis_laporan,
        "from_date": from_date,
        "to_date": to_date,
        "total_aktivitas": len(docs),
        "data": list(petani_map.values()),
    }
