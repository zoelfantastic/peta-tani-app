import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// ─── Auth State ──────────────────────────────────────────

/// Possible authentication states.
enum AuthStatus {
  /// App just started, checking stored session.
  initial,

  /// Not authenticated.
  unauthenticated,

  /// Authenticated but profile incomplete (needs setup).
  needsProfile,

  /// Fully authenticated with complete profile.
  authenticated,
}

/// Immutable auth state.
class AuthState {
  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.isLoading = false,
    this.error,
  });

  final AuthStatus status;
  final UserModel? user;
  final bool isLoading;
  final String? error;

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ─── Auth Notifier ───────────────────────────────────────

/// Riverpod notifier that manages authentication state.
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  final _authService = AuthService.instance;

  /// Check if user has an existing session (called on app start).
  Future<void> checkAuthState() async {
    try {
      final user = await _authService.checkAuthState();
      if (user != null) {
        state = AuthState(
          status: user.isProfileComplete
              ? AuthStatus.authenticated
              : AuthStatus.needsProfile,
          user: user,
        );
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (e) {
      debugPrint('[AuthNotifier] checkAuthState error: $e');
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Step 1: Send OTP to phone.
  Future<String?> sendOTP(String phoneNumber) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final verificationId = await _authService.sendOTP(phoneNumber);
      state = state.copyWith(isLoading: false);
      return verificationId;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal mengirim kode OTP. Periksa nomor HP Anda.',
      );
      return null;
    }
  }

  /// Step 2: Verify OTP code.
  Future<bool> verifyOTP(String otpCode) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.verifyOTP(otpCode);
      state = AuthState(
        status: user.isProfileComplete
            ? AuthStatus.authenticated
            : AuthStatus.needsProfile,
        user: user,
      );
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Maaf, ada masalah. Silakan coba lagi.',
      );
      return false;
    }
  }

  /// Save profile after first login.
  Future<bool> saveProfile({required String name}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.saveProfile(name: name);
      state = AuthState(status: AuthStatus.authenticated, user: user);
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Gagal menyimpan profil. Coba lagi.',
      );
      return false;
    }
  }

  /// Sign out.
  Future<void> signOut() async {
    await _authService.signOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Clear error.
  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ─── Providers ───────────────────────────────────────────

/// Main auth state provider.
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
