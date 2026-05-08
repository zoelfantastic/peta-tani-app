import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';

/// Authentication service — wraps Firebase Auth Phone OTP.
///
/// Currently uses mock implementation since Firebase is not yet configured.
/// Replace mock methods with real Firebase calls when ready:
/// ```dart
/// import 'package:firebase_auth/firebase_auth.dart';
/// import 'package:cloud_firestore/cloud_firestore.dart';
/// ```
class AuthService {
  AuthService._();
  static final instance = AuthService._();

  // ─── Mock State ────────────────────────────────────────
  // These will be replaced with Firebase when configured.
  UserModel? _currentUser;
  String? _verificationId;
  bool _isLoggedIn = false;

  /// Current user (null if not logged in).
  UserModel? get currentUser => _currentUser;

  /// Whether user is authenticated.
  bool get isLoggedIn => _isLoggedIn;

  /// Whether the current user has completed their profile.
  bool get isProfileComplete => _currentUser?.isProfileComplete ?? false;

  // ─── Phone OTP Flow ────────────────────────────────────

  /// Step 1: Send OTP to phone number.
  /// Returns the verification ID for OTP verification.
  ///
  /// In production, this calls:
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
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    // Mock verification ID
    _verificationId =
        'mock_verification_${DateTime.now().millisecondsSinceEpoch}';

    debugPrint('[AuthService] OTP sent to +62$phoneNumber');
    debugPrint('[AuthService] Mock OTP code: 1234');

    return _verificationId!;
  }

  /// Step 2: Verify OTP code.
  /// Returns the authenticated [UserModel].
  ///
  /// In production:
  /// ```dart
  /// final credential = PhoneAuthProvider.credential(
  ///   verificationId: verificationId,
  ///   smsCode: otpCode,
  /// );
  /// final result = await FirebaseAuth.instance.signInWithCredential(credential);
  /// ```
  Future<UserModel> verifyOTP(String otpCode) async {
    await Future.delayed(const Duration(milliseconds: 800));

    // Mock: accept "1234" as valid OTP
    if (otpCode != '1234') {
      throw AuthException('Kode OTP tidak valid. Silakan coba lagi.');
    }

    // Mock: create/fetch user
    _currentUser = UserModel(
      uid: 'mock_user_${DateTime.now().millisecondsSinceEpoch}',
      phoneNumber: '+628123456789',
      createdAt: DateTime.now(),
      isProfileComplete: false,
    );
    _isLoggedIn = true;

    debugPrint('[AuthService] OTP verified, user: ${_currentUser!.uid}');
    return _currentUser!;
  }

  // ─── Profile Setup ─────────────────────────────────────

  /// Save user profile after first login.
  ///
  /// In production:
  /// ```dart
  /// await FirebaseFirestore.instance
  ///   .collection('users')
  ///   .doc(user.uid)
  ///   .set(user.toMap(), SetOptions(merge: true));
  /// ```
  Future<UserModel> saveProfile({required String name}) async {
    await Future.delayed(const Duration(milliseconds: 500));

    _currentUser = _currentUser!.copyWith(name: name, isProfileComplete: true);

    debugPrint('[AuthService] Profile saved: ${_currentUser!.name}');
    return _currentUser!;
  }

  // ─── Session ───────────────────────────────────────────

  /// Check if user is already logged in (on app start).
  ///
  /// In production:
  /// ```dart
  /// final user = FirebaseAuth.instance.currentUser;
  /// if (user != null) {
  ///   final doc = await FirebaseFirestore.instance
  ///     .collection('users').doc(user.uid).get();
  ///   return UserModel.fromMap(doc.data()!, user.uid);
  /// }
  /// ```
  Future<UserModel?> checkAuthState() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return _currentUser;
  }

  /// Sign out.
  Future<void> signOut() async {
    await Future.delayed(const Duration(milliseconds: 300));
    _currentUser = null;
    _isLoggedIn = false;
    _verificationId = null;
    debugPrint('[AuthService] User signed out');
  }
}

/// Custom auth exception with user-friendly message.
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
