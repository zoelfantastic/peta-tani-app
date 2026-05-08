from firebase_functions import https_fn
from firebase_admin import firestore
from datetime import datetime, timezone


def _db():
    return firestore.client()


FASE_OPTIONS = {"persiapan", "vegetatif", "generatif", "panen"}


def _assert_owner(doc, uid: str) -> None:
    if not doc.exists:
        raise https_fn.HttpsError("not-found", "Lahan tidak ditemukan")
    if doc.get("uid") != uid:
        raise https_fn.HttpsError("permission-denied", "Tidak punya akses ke lahan ini")


@https_fn.on_call()
def tambah_lahan(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    data = req.data
    nama = (data.get("nama") or "").strip()
    jenis_tanaman = (data.get("jenis_tanaman") or "").strip()

    if not nama:
        raise https_fn.HttpsError("invalid-argument", "Nama lahan diperlukan")
    if not jenis_tanaman:
        raise https_fn.HttpsError("invalid-argument", "Jenis tanaman diperlukan")

    fase = data.get("fase", "persiapan")
    if fase not in FASE_OPTIONS:
        raise https_fn.HttpsError("invalid-argument", f"Fase tidak valid: {fase}")

    now = datetime.now(timezone.utc)
    doc_ref = _db().collection("lahan").document()
    doc_ref.set({
        "uid": req.auth.uid,
        "nama": nama,
        "jenis_tanaman": jenis_tanaman,
        "luas_ha": float(data.get("luas_ha", 0)),
        "tanggal_tanam": data.get("tanggal_tanam"),  # ISO date string YYYY-MM-DD
        "fase": fase,
        "catatan": data.get("catatan"),
        "created_at": now,
        "updated_at": now,
    })

    return {"id": doc_ref.id}


@https_fn.on_call()
def edit_lahan(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    lahan_id = req.data.get("id")
    if not lahan_id:
        raise https_fn.HttpsError("invalid-argument", "ID lahan diperlukan")

    doc_ref = _db().collection("lahan").document(lahan_id)
    _assert_owner(doc_ref.get(), req.auth.uid)

    allowed = {"nama", "jenis_tanaman", "luas_ha", "tanggal_tanam", "fase", "catatan"}
    updates = {k: v for k, v in req.data.items() if k in allowed}

    if "fase" in updates and updates["fase"] not in FASE_OPTIONS:
        raise https_fn.HttpsError("invalid-argument", "Fase tidak valid")

    updates["updated_at"] = datetime.now(timezone.utc)
    doc_ref.update(updates)

    return {"success": True}


@https_fn.on_call()
def hapus_lahan(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    lahan_id = req.data.get("id")
    if not lahan_id:
        raise https_fn.HttpsError("invalid-argument", "ID lahan diperlukan")

    doc_ref = _db().collection("lahan").document(lahan_id)
    _assert_owner(doc_ref.get(), req.auth.uid)
    doc_ref.delete()

    return {"success": True}


@https_fn.on_call()
def get_lahan_list(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    docs = (
        _db().collection("lahan")
        .where("uid", "==", req.auth.uid)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )

    return {"lahan": [{"id": d.id, **d.to_dict()} for d in docs]}


@https_fn.on_call()
def get_detail_lahan(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    lahan_id = req.data.get("id")
    if not lahan_id:
        raise https_fn.HttpsError("invalid-argument", "ID lahan diperlukan")

    doc = _db().collection("lahan").document(lahan_id).get()
    _assert_owner(doc, req.auth.uid)

    aktivitas_docs = (
        _db().collection("aktivitas")
        .where("lahan_id", "==", lahan_id)
        .order_by("tanggal", direction="DESCENDING")
        .limit(5)
        .stream()
    )

    return {
        "id": doc.id,
        **doc.to_dict(),
        "aktivitas_terbaru": [{"id": a.id, **a.to_dict()} for a in aktivitas_docs],
    }
