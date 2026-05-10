import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/lahan_model.dart';

/// Lahan CRUD service backed by Firestore.
/// Collection: /lahan — each document has a userId field for ownership.
class LahanService {
  LahanService._();
  static final instance = LahanService._();

  final _db = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  CollectionReference<Map<String, dynamic>> get _col => _db.collection('lahan');

  String _requireUid() {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('Pengguna belum login');
    return uid;
  }

  /// Get all lahan owned by the current user, sorted newest first.
  Future<List<LahanModel>> getAll() async {
    final uid = _requireUid();

    final snap = await _col.where('userId', isEqualTo: uid).get();

    final list = snap.docs
        .map((doc) => LahanModel.fromMap(doc.data(), doc.id))
        .toList();

    list.sort((a, b) =>
        (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));

    return list;
  }

  /// Get a single lahan by document ID.
  Future<LahanModel?> getById(String id) async {
    final doc = await _col.doc(id).get();
    if (!doc.exists || doc.data() == null) return null;
    return LahanModel.fromMap(doc.data()!, doc.id);
  }

  /// Add a new lahan document. Returns the created model with real Firestore ID.
  Future<LahanModel> add(LahanModel lahan) async {
    final docRef = await _col.add(lahan.toMap());
    debugPrint('[LahanService] Added: ${lahan.name} → ${docRef.id}');
    return lahan.copyWith(id: docRef.id);
  }

  /// Update an existing lahan document.
  Future<LahanModel> update(LahanModel lahan) async {
    await _col.doc(lahan.id).update(lahan.toMap());
    debugPrint('[LahanService] Updated: ${lahan.name} (${lahan.id})');
    return lahan;
  }

  /// Delete a lahan document by ID.
  Future<void> delete(String id) async {
    await _col.doc(id).delete();
    debugPrint('[LahanService] Deleted: $id');
  }
}
