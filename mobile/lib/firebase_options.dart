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
    apiKey: 'AIzaSyAaOK1th4JrqG2tzy_OnGrBm5gJpckUoLo',
    appId: '1:630313058128:android:0627121fbe3a2dc8427655',
    messagingSenderId: '630313058128',
    projectId: 'petatani',
    storageBucket: 'petatani.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyD6B8d7vGztr-WRiC9onybYfr7DLe6SGj4',
    appId: '1:630313058128:ios:1c77c4467a0860a6427655',
    messagingSenderId: '630313058128',
    projectId: 'petatani',
    storageBucket: 'petatani.firebasestorage.app',
    iosBundleId: 'com.petatani.petaTani',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAQ6ZcbbF82T2Ch-3zwP6EAt7JK2KR9aKg',
    appId: '1:630313058128:web:0dc4b82d64bab7ed427655',
    messagingSenderId: '630313058128',
    projectId: 'petatani',
    authDomain: 'petatani.firebaseapp.com',
    storageBucket: 'petatani.firebasestorage.app',
    measurementId: 'G-ZD02B97SYJ',
  );

}