// File ini di-generate oleh FlutterFire CLI.
// Jalankan perintah berikut dari direktori mobile/ untuk mengisi nilai yang benar:
//
//   dart pub global activate flutterfire_cli
//   flutterfire configure --project=petatani
//
// File ini akan otomatis diganti dengan konfigurasi Firebase project Anda.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions tidak tersedia untuk platform ini.',
        );
    }
  }

  // TODO: Ganti nilai-nilai di bawah dengan konfigurasi Firebase project Anda.
  // Cara termudah: jalankan `flutterfire configure --project=petatani`

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'YOUR_ANDROID_API_KEY',
    appId: 'YOUR_ANDROID_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'petatani',
    storageBucket: 'petatani.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: 'YOUR_IOS_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'petatani',
    storageBucket: 'petatani.firebasestorage.app',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    iosBundleId: 'com.petatani.peta_tani',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'YOUR_WEB_API_KEY',
    appId: 'YOUR_WEB_APP_ID',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    projectId: 'petatani',
    storageBucket: 'petatani.firebasestorage.app',
    authDomain: 'petatani.firebaseapp.com',
  );
}
