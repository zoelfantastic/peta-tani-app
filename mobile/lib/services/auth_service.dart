import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';

/// Authentication service — Firebase Phone OTP + Firestore profile.
///
/// Session lifetime: Firebase refresh tokens do not expire unless the user
/// signs out, the token is revoked by an admin, or the account is deleted.
/// Users stay logged in indefinitely across app restarts.
class AuthService {
  AuthService._();
  static final instance = AuthService._();

  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;

  String? _verificationId;

  // ─── Phone OTP Flow ────────────────────────────────────

  /// Step 1: Send OTP to phone number (Indonesian +62 prefix).
  /// Returns verificationId on codeSent; throws [AuthException] on failure.
  Future<String> sendOTP(String phoneNumber) async {
    final completer = Completer<String>();

    await _auth.verifyPhoneNumber(
      phoneNumber: '+62$phoneNumber',
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Android auto-verification — sign in silently without OTP entry.
        try {
          await _auth.signInWithCredential(credential);
        } catch (e) {
          debugPrint('[AuthService] Auto-verification sign-in error: $e');
        }
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!completer.isCompleted) {
          completer.completeError(AuthException(_mapError(e)));
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        _verificationId = verificationId;
        if (!completer.isCompleted) {
          completer.complete(verificationId);
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        _verificationId = verificationId;
      },
    );

    return completer.future;
  }

  /// Step 2: Verify OTP code and return authenticated [UserModel].
  Future<UserModel> verifyOTP(String otpCode) async {
    if (_verificationId == null) {
      throw const AuthException('Sesi OTP kadaluarsa. Minta kode baru.');
    }

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: otpCode,
      );
      final result = await _auth.signInWithCredential(credential);
      final user = result.user!;

      // Fetch existing profile from Firestore, or return shell model.
      return await _fetchOrCreateProfile(user);
    } on FirebaseAuthException catch (e) {
      throw AuthException(_mapError(e));
    }
  }

  // ─── Profile Setup ─────────────────────────────────────

  /// Save user profile to Firestore after first login.
  Future<UserModel> saveProfile({
    required String name,
    String? namaKelompokTani,
    String? kabupaten,
    String? kecamatan,
    String? desa,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw const AuthException('Sesi tidak ditemukan.');

    final updated = UserModel(
      uid: user.uid,
      phoneNumber: user.phoneNumber ?? '',
      name: name,
      createdAt: DateTime.now(),
      isProfileComplete: true,
      namaKelompokTani: namaKelompokTani,
      kabupaten: kabupaten,
      kecamatan: kecamatan,
      desa: desa,
    );

    await _db.collection('users').doc(user.uid).set(
      updated.toMap(),
      SetOptions(merge: true),
    );

    return updated;
  }

  /// Update existing profile fields (partial update).
  Future<UserModel> updateProfile({
    String? name,
    String? namaKelompokTani,
    String? kabupaten,
    String? kecamatan,
    String? desa,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw const AuthException('Sesi tidak ditemukan.');

    final updates = <String, dynamic>{};
    if (name != null) updates['name'] = name;
    if (namaKelompokTani != null) updates['nama_kelompok_tani'] = namaKelompokTani;
    if (kabupaten != null) updates['kabupaten'] = kabupaten;
    if (kecamatan != null) updates['kecamatan'] = kecamatan;
    if (desa != null) updates['desa'] = desa;

    await _db.collection('users').doc(user.uid).update(updates);

    // Return refreshed profile
    final doc = await _db.collection('users').doc(user.uid).get();
    return UserModel.fromMap(doc.data()!, user.uid);
  }

  // ─── Session ───────────────────────────────────────────

  /// Returns the currently signed-in user by reading Firebase Auth state
  /// and their Firestore profile. Returns null if not authenticated.
  ///
  /// Firebase SDK automatically refreshes the ID token (every 1 hour)
  /// in the background — no manual handling needed.
  Future<UserModel?> checkAuthState() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    try {
      return await _fetchOrCreateProfile(user);
    } catch (e) {
      debugPrint('[AuthService] checkAuthState error: $e');
      return null;
    }
  }

  /// Sign out from Firebase Auth.
  Future<void> signOut() async {
    await _auth.signOut();
    _verificationId = null;
  }

  // ─── Internal ──────────────────────────────────────────

  Future<UserModel> _fetchOrCreateProfile(User firebaseUser) async {
    final doc =
        await _db.collection('users').doc(firebaseUser.uid).get();

    if (doc.exists && doc.data() != null) {
      return UserModel.fromMap(doc.data()!, firebaseUser.uid);
    }

    // First login — profile not yet created.
    return UserModel(
      uid: firebaseUser.uid,
      phoneNumber: firebaseUser.phoneNumber ?? '',
      createdAt: DateTime.now(),
      isProfileComplete: false,
    );
  }

  String _mapError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-verification-code':
        return 'Kode OTP tidak valid. Silakan coba lagi.';
      case 'session-expired':
        return 'Sesi OTP kadaluarsa. Minta kode baru.';
      case 'invalid-phone-number':
        return 'Nomor HP tidak valid.';
      case 'too-many-requests':
        return 'Terlalu banyak percobaan. Coba beberapa saat lagi.';
      case 'quota-exceeded':
        return 'Kuota SMS habis. Hubungi administrator.';
      default:
        return 'Terjadi kesalahan. Silakan coba lagi. (${e.code})';
    }
  }
}

/// Auth exception with Indonesian user-friendly message.
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
