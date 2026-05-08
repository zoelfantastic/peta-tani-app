import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/otp_screen.dart';
import '../../features/auth/screens/setup_profile_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/lahan/screens/lahan_screen.dart';
import '../../features/lahan/screens/lahan_detail_screen.dart';
import '../../features/lahan/screens/lahan_form_screen.dart';
import '../../features/aktivitas/screens/input_aktivitas_screen.dart';
import '../../features/aktivitas/screens/aktivitas_detail_screen.dart';
import '../../features/riwayat/screens/riwayat_screen.dart';
import '../../features/profil/screens/profil_screen.dart';
import '../../shared/widgets/app_shell.dart';
import '../../services/lahan_service.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

/// GoRouter configuration for declarative routing.
/// Max navigation depth: 3 levels (Tab → Detail → Sub-detail).
///
/// Auth flow:
///   /splash → /onboarding → /login → /otp/:phone → /setup-profil → /beranda
///
/// Main app (ShellRoute with Bottom Nav):
///   /beranda, /lahan, /catat, /riwayat, /profil
///
/// Lahan sub-routes (pushed over shell):
///   /lahan/detail/:id, /lahan/tambah, /lahan/edit/:id
final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    // ─── Auth Flow ────────────────────────────────────────
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/otp/:phone',
      builder: (context, state) {
        final phone = state.pathParameters['phone'] ?? '';
        return OtpScreen(phoneNumber: phone);
      },
    ),
    GoRoute(
      path: '/setup-profil',
      builder: (context, state) => const SetupProfileScreen(),
    ),

    // ─── Main App (Shell with Bottom Nav) ─────────────────
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(
          path: '/beranda',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: HomeScreen()),
        ),
        GoRoute(
          path: '/lahan',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: LahanScreen()),
        ),
        GoRoute(
          path: '/catat',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: InputAktivitasScreen()),
        ),
        GoRoute(
          path: '/riwayat',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: RiwayatScreen()),
        ),
        GoRoute(
          path: '/profil',
          pageBuilder: (context, state) =>
              const NoTransitionPage(child: ProfilScreen()),
        ),
      ],
    ),

    // ─── Lahan Sub-routes (pushed over shell) ─────────────
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/lahan/detail/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return LahanDetailScreen(lahanId: id);
      },
    ),
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/lahan/tambah',
      builder: (context, state) => const LahanFormScreen(),
    ),
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/lahan/edit/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        // Fetch lahan synchronously from service (already loaded)
        return FutureBuilder(
          future: LahanService.instance.getById(id),
          builder: (context, snapshot) {
            if (snapshot.hasData && snapshot.data != null) {
              return LahanFormScreen(lahan: snapshot.data);
            }
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          },
        );
      },
    ),
    // ─── Aktivitas Sub-routes ─────────────
    GoRoute(
      parentNavigatorKey: _rootNavigatorKey,
      path: '/aktivitas/detail/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return AktivitasDetailScreen(aktivitasId: id);
      },
    ),
  ],
);
