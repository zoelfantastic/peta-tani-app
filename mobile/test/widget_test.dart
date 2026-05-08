import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

import 'package:peta_tani/features/auth/screens/onboarding_screen.dart';
import 'package:peta_tani/core/theme/app_theme.dart';

void main() {
  testWidgets('Onboarding screen renders correctly', (
    WidgetTester tester,
  ) async {
    // Test the onboarding screen directly (avoids splash screen timers).
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const OnboardingScreen(),
        ),
      ),
    );

    // Verify onboarding content is visible.
    expect(find.text('Lewati'), findsOneWidget);
    expect(find.text('Lanjut'), findsOneWidget);
    expect(find.textContaining('Catat Aktivitas'), findsOneWidget);
  });

  testWidgets('Onboarding navigates through slides', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          home: const OnboardingScreen(),
        ),
      ),
    );

    // First slide visible
    expect(find.textContaining('Catat Aktivitas'), findsOneWidget);

    // Tap "Lanjut" to go to slide 2
    await tester.tap(find.text('Lanjut'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Pantau Perkembangan'), findsOneWidget);

    // Tap "Lanjut" to go to slide 3
    await tester.tap(find.text('Lanjut'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Pengingat'), findsOneWidget);
    // Last slide shows "Mulai Sekarang" instead of "Lanjut"
    expect(find.text('Mulai Sekarang'), findsOneWidget);
  });
}
