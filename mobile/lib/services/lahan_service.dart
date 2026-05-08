import 'package:flutter/foundation.dart';
import '../models/lahan_model.dart';

/// Lahan CRUD service — wraps Firestore operations.
/// Currently uses mock data. Replace with real Firestore when configured.
class LahanService {
  LahanService._();
  static final instance = LahanService._();

  // ─── Mock Data Store ───────────────────────────────────
  final List<LahanModel> _lahan = [
    LahanModel(
      id: 'lahan_1',
      userId: 'mock_user',
      name: 'Sawah Belakang',
      tanaman: 'Padi',
      luas: 2,
      emoji: '🌾',
      tanggalTanam: DateTime(2026, 3, 15),
      fase: 'Vegetatif',
      progress: 0.45,
      createdAt: DateTime(2026, 3, 1),
    ),
    LahanModel(
      id: 'lahan_2',
      userId: 'mock_user',
      name: 'Kebun Atas',
      tanaman: 'Jagung',
      luas: 0.5,
      emoji: '🌽',
      tanggalTanam: DateTime(2026, 2, 1),
      fase: 'Generatif',
      progress: 0.72,
      createdAt: DateTime(2026, 2, 1),
    ),
    LahanModel(
      id: 'lahan_3',
      userId: 'mock_user',
      name: 'Ladang Timur',
      tanaman: 'Kedelai',
      luas: 3,
      emoji: '🫘',
      tanggalTanam: DateTime(2026, 1, 10),
      fase: 'Pematangan',
      progress: 0.88,
      createdAt: DateTime(2026, 1, 10),
    ),
  ];

  /// Get all lahan for current user.
  Future<List<LahanModel>> getAll() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return List.unmodifiable(_lahan);
  }

  /// Get lahan by ID.
  Future<LahanModel?> getById(String id) async {
    await Future.delayed(const Duration(milliseconds: 200));
    try {
      return _lahan.firstWhere((l) => l.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Add a new lahan. Returns the created model with generated ID.
  Future<LahanModel> add(LahanModel lahan) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final created = lahan.copyWith(
      id: 'lahan_${DateTime.now().millisecondsSinceEpoch}',
      createdAt: DateTime.now(),
    );
    _lahan.add(created);
    debugPrint('[LahanService] Added: ${created.name} (${created.id})');
    return created;
  }

  /// Update an existing lahan.
  Future<LahanModel> update(LahanModel lahan) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _lahan.indexWhere((l) => l.id == lahan.id);
    if (index == -1) throw Exception('Lahan tidak ditemukan');
    _lahan[index] = lahan;
    debugPrint('[LahanService] Updated: ${lahan.name}');
    return lahan;
  }

  /// Delete a lahan by ID.
  Future<void> delete(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    _lahan.removeWhere((l) => l.id == id);
    debugPrint('[LahanService] Deleted: $id');
  }
}
