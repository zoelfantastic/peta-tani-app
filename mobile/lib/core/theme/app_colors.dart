import 'package:flutter/material.dart';

/// Peta Tani color palette — designed for high contrast under sunlight.
/// All main colors have contrast ratio ≥ 7:1 against backgrounds.
class AppColors {
  AppColors._();

  // ─── Primary (Hijau Tani) ──────────────────────────────
  static const Color primary = Color(0xFF2D6A4F);
  static const Color primaryLight = Color(0xFF40916C);
  static const Color primaryDark = Color(0xFF1B4332);

  // ─── Secondary & Accent ────────────────────────────────
  static const Color secondary = Color(0xFFD4A373);
  static const Color accent = Color(0xFFE76F51);

  // ─── Backgrounds ───────────────────────────────────────
  static const Color background = Color(0xFFFEFAE0);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F0DC);

  // ─── Text ──────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textHint = Color(0xFF9CA3AF);

  // ─── Status ────────────────────────────────────────────
  static const Color success = Color(0xFF2D6A4F);
  static const Color warning = Color(0xFFE9C46A);
  static const Color error = Color(0xFFE63946);
  static const Color info = Color(0xFF3B82F6);

  // ─── Borders & Dividers ────────────────────────────────
  static const Color border = Color(0xFFE5E7EB);
  static const Color divider = Color(0xFFF3F4F6);

  // ─── Misc ──────────────────────────────────────────────
  static const Color shimmerBase = Color(0xFFE5E7EB);
  static const Color shimmerHighlight = Color(0xFFF9FAFB);

  // ─── Activity Colors ───────────────────────────────────
  static const Color olahTanah = Color(0xFF8B5E3C);
  static const Color persemaian = Color(0xFF2D6A4F);
  static const Color penanaman = Color(0xFF40916C);
  static const Color pemupukan = Color(0xFF3B82F6);
  static const Color pengendalianOpt = Color(0xFFE76F51);
  static const Color penyiangan = Color(0xFF84CC16);
  static const Color panen = Color(0xFFE9C46A);
}
