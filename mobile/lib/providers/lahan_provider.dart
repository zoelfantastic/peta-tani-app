import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/lahan_model.dart';
import '../services/lahan_service.dart';

// ─── Lahan State ─────────────────────────────────────────

class LahanState {
  const LahanState({
    this.lahanList = const [],
    this.isLoading = false,
    this.error,
  });

  final List<LahanModel> lahanList;
  final bool isLoading;
  final String? error;

  LahanState copyWith({
    List<LahanModel>? lahanList,
    bool? isLoading,
    String? error,
  }) {
    return LahanState(
      lahanList: lahanList ?? this.lahanList,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ─── Lahan Notifier ──────────────────────────────────────

class LahanNotifier extends StateNotifier<LahanState> {
  LahanNotifier() : super(const LahanState());

  final _service = LahanService.instance;

  String? get _uid => FirebaseAuth.instance.currentUser?.uid;

  /// Load all lahan for the current user from Firestore.
  /// No-op if user is not authenticated.
  Future<void> loadAll() async {
    if (_uid == null) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final list = await _service.getAll();
      state = LahanState(lahanList: list);
    } catch (e) {
      debugPrint('[LahanNotifier] loadAll error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal memuat daftar lahan',
      );
    }
  }

  /// Clear all state — called on logout.
  void clearState() {
    state = const LahanState();
  }

  /// Add a new lahan to Firestore.
  Future<bool> add({
    required String name,
    required String tanaman,
    required double luas,
    required String satuanLuas,
    required String emoji,
    required String jenisLahan,
    double? latitude,
    double? longitude,
  }) async {
    final uid = _uid;
    if (uid == null) {
      state = state.copyWith(
        isLoading: false,
        error: 'Sesi tidak ditemukan, silakan login ulang',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, error: null);
    try {
      final lahan = LahanModel(
        id: '',
        userId: uid,
        name: name,
        tanaman: tanaman,
        luas: luas,
        satuanLuas: satuanLuas,
        emoji: emoji,
        jenisLahan: jenisLahan,
        latitude: latitude,
        longitude: longitude,
        createdAt: DateTime.now(),
      );
      await _service.add(lahan);
      await loadAll();
      return true;
    } catch (e) {
      debugPrint('[LahanNotifier] add error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal menambahkan lahan',
      );
      return false;
    }
  }

  /// Update an existing lahan in Firestore.
  Future<bool> update(LahanModel lahan) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _service.update(lahan);
      await loadAll();
      return true;
    } catch (e) {
      debugPrint('[LahanNotifier] update error: $e');
      state = state.copyWith(isLoading: false, error: 'Gagal mengubah lahan');
      return false;
    }
  }

  /// Delete a lahan from Firestore.
  Future<bool> delete(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _service.delete(id);
      await loadAll();
      return true;
    } catch (e) {
      debugPrint('[LahanNotifier] delete error: $e');
      state = state.copyWith(isLoading: false, error: 'Gagal menghapus lahan');
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ─── Provider ────────────────────────────────────────────

final lahanProvider = StateNotifierProvider<LahanNotifier, LahanState>((ref) {
  final notifier = LahanNotifier();
  notifier.loadAll();
  return notifier;
});
