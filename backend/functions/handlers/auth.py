from firebase_functions import https_fn
from firebase_admin import firestore
from datetime import datetime, timezone


def _db():
    return firestore.client()


@https_fn.on_call()
def setup_profil(req: https_fn.CallableRequest) -> dict:
    """Dipanggil setelah Phone OTP berhasil untuk membuat dokumen user."""
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    nama = (req.data.get("nama") or "").strip()
    if not nama:
        raise https_fn.HttpsError("invalid-argument", "Nama tidak boleh kosong")

    now = datetime.now(timezone.utc)
    _db().collection("users").document(req.auth.uid).set({
        "nama": nama,
        "nomor_hp": req.auth.token.get("phone_number", ""),
        "foto_url": None,
        "notif_enabled": True,
        "created_at": now,
        "updated_at": now,
    })

    return {"success": True}


@https_fn.on_call()
def update_profil(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    updates: dict = {}
    if "nama" in req.data:
        nama = req.data["nama"].strip()
        if not nama:
            raise https_fn.HttpsError("invalid-argument", "Nama tidak boleh kosong")
        updates["nama"] = nama
    if "foto_url" in req.data:
        updates["foto_url"] = req.data["foto_url"]

    if not updates:
        raise https_fn.HttpsError("invalid-argument", "Tidak ada data yang diubah")

    updates["updated_at"] = datetime.now(timezone.utc)
    _db().collection("users").document(req.auth.uid).update(updates)

    return {"success": True}


@https_fn.on_call()
def update_notif_settings(req: https_fn.CallableRequest) -> dict:
    if not req.auth:
        raise https_fn.HttpsError("unauthenticated", "Login diperlukan")

    notif_enabled = req.data.get("notif_enabled")
    if notif_enabled is None:
        raise https_fn.HttpsError("invalid-argument", "notif_enabled diperlukan")

    _db().collection("users").document(req.auth.uid).update({
        "notif_enabled": bool(notif_enabled),
        "updated_at": datetime.now(timezone.utc),
    })

    return {"success": True}
