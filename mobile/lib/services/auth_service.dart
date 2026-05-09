import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

/// Authentication service — wraps Firebase Auth Phone OTP.
///
/// Session is persisted to disk via SharedPreferences so the user stays
/// logged in across app restarts. When Firebase Auth is integrated, replace
/// the mock methods with real Firebase calls — Firebase's own refresh token
/// mechanism takes over persistence automatically.
class AuthService {
  AuthService._();
  static final instance = AuthService._();

  static const _sessionKey = 'session_user';

  String? _verificationId;

  // ─── Phone OTP Flow ────────────────────────────────────

  /// Step 1: Send OTP to phone number.
  ///
  /// In production, replace with:
  /// ```dart
  /// await FirebaseAuth.instance.verifyPhoneNumber(
  ///   phoneNumber: '+62$phone',
  ///   verificationCompleted: (credential) async {
  ///     await FirebaseAuth.instance.signInWithCredential(credential);
  ///   },
  ///   verificationFailed: (e) => throw e,
  ///   codeSent: (verificationId, resendToken) { ... },
  ///   codeAutoRetrievalTimeout: (verificationId) { ... },
  /// );
  /// ```
  Future<String> sendOTP(String phoneNumber) async {
    await Future.delayed(const Duration(seconds: 1));
    _verificationId =
        'mock_verification_${DateTime.now().millisecondsSinceEpoch}';
    debugPrint('[AuthService] OTP sent to +62$phoneNumber');
    debugPrint('[AuthService] Mock OTP code: 1234');
    return _verificationId!;
  }

  /// Step 2: Verify OTP code and persist session.
  ///
  /// In production, replace with:
  /// ```dart
  /// final credential = PhoneAuthProvider.credential(
  ///   verificationId: verificationId,
  ///   smsCode: otpCode,
  /// );
  /// final result = await FirebaseAuth.instance.signInWithCredential(credential);
  /// ```
  Future<UserModel> verifyOTP(String otpCode) async {
    await Future.delayed(const Duration(milliseconds: 800));

    if (otpCode != '1234') {
      throw const AuthException('Kode OTP tidak valid. Silakan coba lagi.');
    }

    final user = UserModel(
      uid: 'mock_user_${DateTime.now().millisecondsSinceEpoch}',
      phoneNumber: '+628123456789',
      createdAt: DateTime.now(),
      isProfileComplete: false,
    );

    await _saveSession(user);
    debugPrint('[AuthService] OTP verified, session saved: ${user.uid}');
    return user;
  }

  // ─── Profile Setup ─────────────────────────────────────

  /// Save user profile after first login.
  ///
  /// In production, replace with:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///   .collection('users')
  ///   .doc(user.uid)
  ///   .set(user.toMap(), SetOptions(merge: true));
  /// ```
  Future<UserModel> saveProfile({required String name}) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final current = await checkAuthState();
    if (current == null) throw const AuthException('Sesi tidak ditemukan.');

    final updated = current.copyWith(name: name, isProfileComplete: true);
    await _saveSession(updated);
    debugPrint('[AuthService] Profile saved: ${updated.name}');
    return updated;
  }

  // ─── Session ───────────────────────────────────────────

  /// Load persisted session from disk on app start.
  ///
  /// Returns null only if the user has never logged in or has signed out.
  /// Session has no time-based expiry — valid until explicit sign-out.
  ///
  /// In production with Firebase Auth:
  /// ```dart
  /// final user = FirebaseAuth.instance.currentUser;
  /// if (user == null) return null;
  /// final doc = await FirebaseFirestore.instance
  ///   .collection('users').doc(user.uid).get();
  /// return UserModel.fromMap(doc.data()!, user.uid);
  /// ```
  Future<UserModel?> checkAuthState() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_sessionKey);
    if (raw == null) return null;

    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return UserModel.fromMap(map, map['uid'] as String);
    } catch (_) {
      await prefs.remove(_sessionKey);
      return null;
    }
  }

  /// Sign out — clears persisted session.
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
    _verificationId = null;
    debugPrint('[AuthService] User signed out, session cleared');
  }

  // ─── Internal ──────────────────────────────────────────

  Future<void> _saveSession(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    final map = {...user.toMap(), 'uid': user.uid};
    await prefs.setString(_sessionKey, jsonEncode(map));
  }
}

/// Custom auth exception with user-friendly message.
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
