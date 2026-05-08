# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Peta Tani is a multi-platform agricultural activity tracking app. The repo is a monorepo with three independent sub-projects:

- `web/` — Next.js 14 admin dashboard (TypeScript)
- `mobile/` — Flutter farmer mobile app (Dart)
- `backend/` — Firebase Cloud Functions (Python 3.14)

## Commands

### Web (`web/`)
```bash
npm run dev       # Dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint via Next.js
```

### Mobile (`mobile/`)
```bash
flutter run       # Run on connected device/emulator
flutter build apk # Build Android APK
flutter analyze   # Static analysis (flutter_lints)
flutter test      # Run tests
```

### Backend (`backend/`)
```bash
firebase deploy   # Deploy functions to Firebase project "petatani"
```

## Architecture

### Web (Next.js)
- **App Router** with two route groups: `(auth)` and `(dashboard)`
- **State:** Zustand v5 stores
- **UI:** Ant Design v6 + Tailwind CSS; Indonesian locale (`id_ID`); dark theme (primary `#2D6A4F`, accent `#22D3EE`)
- Path alias `@/*` maps to `src/*`
- Pages: `/login`, `/dashboard`, `/dashboard/petani`, `/dashboard/lahan`, `/dashboard/aktivitas`, `/dashboard/analitik`, `/dashboard/laporan`

### Mobile (Flutter)
- **State:** Riverpod v2 (`lib/providers/`)
- **Routing:** GoRouter v15 with declarative routes defined in `lib/core/`
- **Theme:** Material 3, optimized for outdoor/high-sunlight use (48dp touch targets, warm agricultural palette)
- Auth flow: Splash → Onboarding → Login → OTP → Profile Setup → Home
- Bottom nav: Beranda, Lahan, Catat (FAB), Riwayat, Profil
- Feature modules under `lib/features/`; shared widgets in `lib/shared/`; data models in `lib/models/`; Firebase integrations in `lib/services/`

### Backend (Firebase Cloud Functions)
- Entry point: `backend/functions/main.py`
- Python 3.14 runtime, max 10 instances
- Currently minimal — ready for implementation
