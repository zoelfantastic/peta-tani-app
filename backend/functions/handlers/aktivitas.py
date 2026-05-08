from firebase_functions import https_fn
from firebase_admin import firestore
from datetime import datetime, timezone


def _db():
    return firestore.client()


JENIS_AKTIVITAS = {
    "olah_tanah", "semai", "pupuk", "penyiraman", "panen", "pengendalian_hama"
}


@https_fn.on_call()
def catat_aktivitas(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    data = req.data
    lahan_id = data.get("lahan_id")
    jenis = data.get("jenis")
    tanggal = data.get("tanggal")  # YYYY-MM-DD

    if not lahan_id:
        raise https_fn.HttpsError("invalid-argument", "Lahan diperlukan")
    if jenis not in JENIS_AKTIVITAS:
        raise https_fn.HttpsError("invalid-argument", f"Jenis aktivitas tidak valid: {jenis}")
    if not tanggal:
        raise https_fn.HttpsError("invalid-argument", "Tanggal diperlukan")

    lahan_doc = _db().collection("lahan").document(lahan_id).get()
    if not lahan_doc.exists:
        raise https_fn.HttpsError("not-found", "Lahan tidak ditemukan")
    if lahan_doc.get("uid") != req.auth.uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses ke lahan ini")

    doc_ref = _db().collection("aktivitas").document()
    doc_ref.set({
        "uid": req.auth.uid,
        "lahan_id": lahan_id,
        "lahan_nama": lahan_doc.get("nama"),  # denormalized untuk query admin
        "jenis": jenis,
        "tanggal": tanggal,
        "catatan": data.get("catatan"),
        "jumlah": data.get("jumlah"),
        "satuan": data.get("satuan"),
        "created_at": datetime.now(timezone.utc),
    })

    return {"id": doc_ref.id}


@https_fn.on_call()
def edit_aktivitas(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    aktivitas_id = req.data.get("id")
    if not aktivitas_id:
        raise https_fn.HttpsError("invalid-argument", "ID aktivitas diperlukan")

    doc_ref = _db().collection("aktivitas").document(aktivitas_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise https_fn.HttpsError("not-found", "Aktivitas tidak ditemukan")
    if doc.get("uid") != req.auth.uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses")

    allowed = {"jenis", "tanggal", "catatan", "jumlah", "satuan"}
    updates = {k: v for k, v in req.data.items() if k in allowed}

    if "jenis" in updates and updates["jenis"] not in JENIS_AKTIVITAS:
        raise https_fn.HttpsError("invalid-argument", "Jenis aktivitas tidak valid")

    doc_ref.update(updates)
    return {"success": True}


@https_fn.on_call()
def hapus_aktivitas(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    aktivitas_id = req.data.get("id")
    if not aktivitas_id:
        raise https_fn.HttpsError("invalid-argument", "ID aktivitas diperlukan")

    doc_ref = _db().collection("aktivitas").document(aktivitas_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise https_fn.HttpsError("not-found", "Aktivitas tidak ditemukan")
    if doc.get("uid") != req.auth.uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses")

    doc_ref.delete()
    return {"success": True}


@https_fn.on_call()
def get_riwayat(req: https_fn.CallableRequest) -> dict:
    """Paginated timeline aktivitas. Filter opsional per lahan_id."""
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    limit = min(int(req.data.get("limit", 20)), 50)
    lahan_id = req.data.get("lahan_id")
    last_doc_id = req.data.get("last_doc_id")

    query = (
        _db().collection("aktivitas")
        .where("uid", "==", req.auth.uid)
        .order_by("tanggal", direction="DESCENDING")
    )

    if lahan_id:
        query = query.where("lahan_id", "==", lahan_id)

    if last_doc_id:
        last_doc = _db().collection("aktivitas").document(last_doc_id).get()
        if last_doc.exists:
            query = query.start_after(last_doc)

    docs = list(query.limit(limit).stream())

    return {
        "aktivitas": [{"id": d.id, **d.to_dict()} for d in docs],
        "has_more": len(docs) == limit,
    }
