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
  semai(label: 'Semai', icon: Icons.eco, emoji: '🌱', color: AppColors.semai),
  pupuk(
    label: 'Pupuk',
    icon: Icons.science,
    emoji: '💧',
    color: AppColors.pupuk,
  ),
  penyiraman(
    label: 'Penyiraman',
    icon: Icons.water_drop,
    emoji: '🚿',
    color: AppColors.penyiraman,
  ),
  panen(label: 'Panen', icon: Icons.grass, emoji: '🌾', color: AppColors.panen),
  pengendalianHama(
    label: 'Hama',
    icon: Icons.shield,
    emoji: '🛡️',
    color: AppColors.hama,
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
