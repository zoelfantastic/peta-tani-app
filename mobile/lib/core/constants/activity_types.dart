/// Activity types used throughout the app.
/// Each type has an icon, label, and color for consistent UI.
library;

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum ActivityType {
  olahTanah(
    label: 'Olah Tanah',
    icon: Icons.agriculture,
    emoji: '🪓',
    color: AppColors.olahTanah,
  ),
  persemaian(
    label: 'Persemaian',
    icon: Icons.eco,
    emoji: '🌱',
    color: AppColors.persemaian,
  ),
  penanaman(
    label: 'Penanaman',
    icon: Icons.local_florist,
    emoji: '🌿',
    color: AppColors.penanaman,
  ),
  pemupukan(
    label: 'Pemupukan',
    icon: Icons.science,
    emoji: '💧',
    color: AppColors.pemupukan,
  ),
  pengendalianOpt(
    label: 'Pengendalian OPT',
    icon: Icons.shield,
    emoji: '🛡️',
    color: AppColors.pengendalianOpt,
  ),
  penyiangan(
    label: 'Penyiangan',
    icon: Icons.content_cut,
    emoji: '✂️',
    color: AppColors.penyiangan,
  ),
  panen(
    label: 'Panen',
    icon: Icons.grass,
    emoji: '🌾',
    color: AppColors.panen,
  );

  const ActivityType({
    required this.label,
    required this.icon,
    required this.emoji,
    required this.color,
  });

  final String label;
  final IconData icon;
  final String emoji;
  final Color color;
}
