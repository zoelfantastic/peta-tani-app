import 'package:flutter/foundation.dart';
import '../core/constants/activity_types.dart';
import '../models/aktivitas_model.dart';

/// Aktivitas CRUD service — wraps Firestore operations.
/// Currently uses mock data. Replace with real Firestore when configured.
class AktivitasService {
  AktivitasService._();
  static final instance = AktivitasService._();

  // ─── Mock Data Store ───────────────────────────────────
  final List<AktivitasModel> _aktivitas = [
    AktivitasModel(
      id: 'akt_1',
      userId: 'mock_user',
      lahanId: 'lahan_1',
      lahanName: 'Sawah Belakang',
      type: ActivityType.pupuk,
      tanggalMulai: DateTime(2026, 5, 3),
      tanggalSelesai: null, // Berjalan
      catatan: 'Pupuk urea 50kg',
      jumlah: 50,
      satuan: 'kg',
      createdAt: DateTime(2026, 5, 3),
    ),
    AktivitasModel(
      id: 'akt_2',
      userId: 'mock_user',
      lahanId: 'lahan_2',
      lahanName: 'Kebun Atas',
      type: ActivityType.semai,
      tanggalMulai: DateTime(2026, 5, 1),
      tanggalSelesai: DateTime(2026, 5, 2),
      catatan: 'Varietas IR64',
      createdAt: DateTime(2026, 5, 1),
    ),
    AktivitasModel(
      id: 'akt_3',
      userId: 'mock_user',
      lahanId: 'lahan_1',
      lahanName: 'Sawah Belakang',
      type: ActivityType.olahTanah,
      tanggalMulai: DateTime(2026, 4, 28),
      tanggalSelesai: DateTime(2026, 4, 29),
      catatan: 'Bajak traktor',
      createdAt: DateTime(2026, 4, 28),
    ),
    AktivitasModel(
      id: 'akt_4',
      userId: 'mock_user',
      lahanId: 'lahan_3',
      lahanName: 'Ladang Timur',
      type: ActivityType.penyiraman,
      tanggalMulai: DateTime(2026, 4, 25),
      tanggalSelesai: DateTime(2026, 4, 25),
      createdAt: DateTime(2026, 4, 25),
    ),
    AktivitasModel(
      id: 'akt_5',
      userId: 'mock_user',
      lahanId: 'lahan_2',
      lahanName: 'Kebun Atas',
      type: ActivityType.pengendalianHama,
      tanggalMulai: DateTime(2026, 4, 20),
      tanggalSelesai: DateTime(2026, 4, 21),
      catatan: 'Semprot pestisida',
      createdAt: DateTime(2026, 4, 20),
    ),
    AktivitasModel(
      id: 'akt_6',
      userId: 'mock_user',
      lahanId: 'lahan_1',
      lahanName: 'Sawah Belakang',
      type: ActivityType.panen,
      tanggalMulai: DateTime(2026, 3, 15),
      tanggalSelesai: DateTime(2026, 3, 16),
      catatan: 'Hasil 4.2 ton',
      jumlah: 4.2,
      satuan: 'ton',
      createdAt: DateTime(2026, 3, 15),
    ),
  ];

  /// Get all aktivitas, sorted by tanggalMulai descending.
  Future<List<AktivitasModel>> getAll() async {
    await Future.delayed(const Duration(milliseconds: 300));
    final sorted = List<AktivitasModel>.from(_aktivitas)
      ..sort((a, b) => b.tanggalMulai.compareTo(a.tanggalMulai));
    return sorted;
  }

  /// Get aktivitas for a specific lahan.
  Future<List<AktivitasModel>> getByLahan(String lahanId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    final filtered = _aktivitas.where((a) => a.lahanId == lahanId).toList()
      ..sort((a, b) => b.tanggalMulai.compareTo(a.tanggalMulai));
    return filtered;
  }

  /// Check if a lahan has any in-progress (Berjalan) activity.
  /// This is the key blocking logic: can't add new if one is still running.
  Future<AktivitasModel?> getRunningActivity(String lahanId) async {
    await Future.delayed(const Duration(milliseconds: 100));
    try {
      return _aktivitas.firstWhere((a) => a.lahanId == lahanId && a.isBerjalan);
    } catch (_) {
      return null;
    }
  }

  /// Add a new aktivitas.
  Future<AktivitasModel> add(AktivitasModel aktivitas) async {
    await Future.delayed(const Duration(milliseconds: 400));
    final created = aktivitas.copyWith(
      id: 'akt_${DateTime.now().millisecondsSinceEpoch}',
      createdAt: DateTime.now(),
    );
    _aktivitas.add(created);
    debugPrint(
      '[AktivitasService] Added: ${created.type.label} on ${created.lahanName}',
    );
    return created;
  }

  /// Mark an activity as completed (sets tanggalSelesai to now).
  Future<AktivitasModel> markComplete(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final index = _aktivitas.indexWhere((a) => a.id == id);
    if (index == -1) throw Exception('Aktivitas tidak ditemukan');
    final updated = _aktivitas[index].copyWith(tanggalSelesai: DateTime.now());
    _aktivitas[index] = updated;
    debugPrint('[AktivitasService] Marked complete: $id');
    return updated;
  }

  /// Delete an aktivitas.
  Future<void> delete(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    _aktivitas.removeWhere((a) => a.id == id);
    debugPrint('[AktivitasService] Deleted: $id');
  }

  /// Get count of aktivitas this month.
  Future<int> getMonthlyCount() async {
    final now = DateTime.now();
    return _aktivitas
        .where(
          (a) =>
              a.tanggalMulai.year == now.year &&
              a.tanggalMulai.month == now.month,
        )
        .length;
  }

  /// Get the most recent N aktivitas.
  Future<List<AktivitasModel>> getRecent(int count) async {
    final all = await getAll();
    return all.take(count).toList();
  }
}
