import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/aktivitas_model.dart';

/// Aktivitas CRUD service backed by Firestore.
/// Collection: /aktivitas — each document has a userId field for ownership.
class AktivitasService {
  AktivitasService._();
  static final instance = AktivitasService._();

  final _db = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection('aktivitas');

  String _requireUid() {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('Pengguna belum login');
    return uid;
  }

  /// Get all aktivitas owned by the current user, sorted newest first.
  Future<List<AktivitasModel>> getAll() async {
    final uid = _requireUid();

    final snap = await _col.where('userId', isEqualTo: uid).get();

    final list = snap.docs
        .map((doc) => AktivitasModel.fromMap(doc.data(), doc.id))
        .toList();

    list.sort((a, b) => b.tanggalMulai.compareTo(a.tanggalMulai));

    return list;
  }

  /// Add a new aktivitas document.
  Future<AktivitasModel> add(AktivitasModel aktivitas) async {
    final docRef = await _col.add(aktivitas.toMap());
    debugPrint(
      '[AktivitasService] Added: ${aktivitas.type.label} on ${aktivitas.lahanName} → ${docRef.id}',
    );
    return aktivitas.copyWith(id: docRef.id);
  }

  /// Mark an activity as completed (sets tanggalSelesai to now).
  Future<void> markComplete(String id) async {
    await _col.doc(id).update({
      'tanggalSelesai': DateTime.now().toIso8601String(),
    });
    debugPrint('[AktivitasService] Marked complete: $id');
  }

  /// Delete an aktivitas document.
  Future<void> delete(String id) async {
    await _col.doc(id).delete();
    debugPrint('[AktivitasService] Deleted: $id');
  }
}
