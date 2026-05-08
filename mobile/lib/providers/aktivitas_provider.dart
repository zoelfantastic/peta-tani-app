import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/activity_types.dart';
import '../models/aktivitas_model.dart';
import '../services/aktivitas_service.dart';
import '../services/notification_service.dart';

// ─── Aktivitas State ─────────────────────────────────────

class AktivitasState {
  const AktivitasState({
    this.aktivitasList = const [],
    this.isLoading = false,
    this.error,
  });

  final List<AktivitasModel> aktivitasList;
  final bool isLoading;
  final String? error;

  /// Get aktivitas grouped by month (for timeline display).
  Map<String, List<AktivitasModel>> get groupedByMonth {
    final map = <String, List<AktivitasModel>>{};
    for (final a in aktivitasList) {
      final key = _monthKey(a.tanggalMulai);
      map.putIfAbsent(key, () => []).add(a);
    }
    return map;
  }

  /// Get only in-progress activities.
  List<AktivitasModel> get berjalanList =>
      aktivitasList.where((a) => a.isBerjalan).toList();

  /// Count of activities this month.
  int get monthlyCount {
    final now = DateTime.now();
    return aktivitasList
        .where(
          (a) =>
              a.tanggalMulai.year == now.year &&
              a.tanggalMulai.month == now.month,
        )
        .length;
  }

  /// Recent N activities.
  List<AktivitasModel> recent(int n) => aktivitasList.take(n).toList();

  /// Upcoming activities
  List<AktivitasModel> get upcomingList {
    final now = DateTime.now();
    return aktivitasList.where((a) => a.tanggalMulai.isAfter(now)).toList()
      ..sort((a, b) => a.tanggalMulai.compareTo(b.tanggalMulai));
  }

  static String _monthKey(DateTime date) {
    const months = [
      '',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return '${months[date.month]} ${date.year}';
  }

  AktivitasState copyWith({
    List<AktivitasModel>? aktivitasList,
    bool? isLoading,
    String? error,
  }) {
    return AktivitasState(
      aktivitasList: aktivitasList ?? this.aktivitasList,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ─── Aktivitas Notifier ──────────────────────────────────

class AktivitasNotifier extends StateNotifier<AktivitasState> {
  AktivitasNotifier() : super(const AktivitasState());

  final _service = AktivitasService.instance;

  /// Load all aktivitas.
  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _service.getAll();
      state = AktivitasState(aktivitasList: list);
    } catch (e) {
      debugPrint('[AktivitasNotifier] loadAll error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal memuat riwayat aktivitas',
      );
    }
  }

  /// Check if a lahan has a running activity (blocking logic).
  Future<AktivitasModel?> getRunningActivity(String lahanId) async {
    return _service.getRunningActivity(lahanId);
  }

  /// Add a new aktivitas.
  Future<bool> add({
    required String lahanId,
    required String lahanName,
    required ActivityType type,
    required DateTime tanggalMulai,
    DateTime? tanggalSelesai,
    String? catatan,
    double? jumlah,
    String? satuan,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final aktivitas = AktivitasModel(
        id: '',
        userId: 'mock_user',
        lahanId: lahanId,
        lahanName: lahanName,
        type: type,
        tanggalMulai: tanggalMulai,
        tanggalSelesai: tanggalSelesai,
        catatan: catatan,
        jumlah: jumlah,
        satuan: satuan,
      );
      final created = await _service.add(aktivitas);

      // Schedule reminder if start date is in the future
      if (tanggalMulai.isAfter(DateTime.now())) {
        await NotificationService.instance.scheduleReminder(
          id: created.id.hashCode,
          title: 'Pengingat Aktivitas: ${type.label}',
          body: 'Saatnya melakukan ${type.label.toLowerCase()} di $lahanName',
          scheduledDate: tanggalMulai,
        );
      }

      await loadAll();
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal menyimpan aktivitas',
      );
      return false;
    }
  }

  /// Mark an activity as completed.
  Future<bool> markComplete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _service.markComplete(id);
      await loadAll();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Gagal menandai selesai');
      return false;
    }
  }

  /// Delete an aktivitas.
  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _service.delete(id);
      await loadAll();
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal menghapus aktivitas',
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ─── Providers ───────────────────────────────────────────

final aktivitasProvider =
    StateNotifierProvider<AktivitasNotifier, AktivitasState>((ref) {
      final notifier = AktivitasNotifier();
      notifier.loadAll();
      return notifier;
    });
