import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/lahan_model.dart';
import '../../../models/aktivitas_model.dart';
import '../../../providers/lahan_provider.dart';
import '../../../providers/aktivitas_provider.dart';

/// Lahan detail screen — shows lahan info and its activity history.
class LahanDetailScreen extends ConsumerWidget {
  const LahanDetailScreen({super.key, required this.lahanId});

  final String lahanId;

  Color _jenisLahanColor(String jenisLahan) {
    switch (jenisLahan) {
      case 'Sawah':
        return AppColors.info;
      case 'Kebun':
        return AppColors.primary;
      case 'Pekarangan':
        return AppColors.warning;
      case 'Hutan':
        return const Color(0xFF2D5A1E);
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lahanState = ref.watch(lahanProvider);
    final aktState = ref.watch(aktivitasProvider);

    final lahan = lahanState.lahanList.where((l) => l.id == lahanId).firstOrNull;
    if (lahan == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.background,
          surfaceTintColor: Colors.transparent,
        ),
        body: const Center(child: Text('Lahan tidak ditemukan')),
      );
    }

    final activities = aktState.aktivitasList
        .where((a) => a.lahanId == lahanId)
        .toList();
    final jenisColor = _jenisLahanColor(lahan.jenisLahan);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Detail Lahan'),
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_rounded, size: 22),
            onPressed: () => context.push('/lahan/edit/$lahanId'),
          ),
          IconButton(
            icon: const Icon(
              Icons.delete_outline_rounded,
              size: 22,
              color: AppColors.error,
            ),
            onPressed: () => _confirmDelete(context, ref, lahan),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Header Card ────────────────────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(lahan.emoji, style: const TextStyle(fontSize: 44)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lahan.name,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${lahan.tanaman} • ${lahan.luasDisplay}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Jenis lahan badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: jenisColor.withAlpha(20),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          jenisLahanOptions[lahan.jenisLahan] ?? '🌱',
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          lahan.jenisLahan,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: jenisColor,
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (lahan.hasLocation) ...[
                    const SizedBox(height: 12),
                    const Divider(color: AppColors.border, height: 1),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            lahan.locationDisplay,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ─── Info Cards ─────────────────────
            Row(
              children: [
                Expanded(
                  child: _InfoCard(
                    icon: Icons.edit_note_rounded,
                    label: 'Aktivitas',
                    value: '${activities.length}',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.timelapse_rounded,
                    label: 'Berjalan',
                    value: '${activities.where((a) => a.isBerjalan).length}',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _InfoCard(
                    icon: Icons.check_circle_outline_rounded,
                    label: 'Selesai',
                    value: '${activities.where((a) => !a.isBerjalan).length}',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ─── Activity History ───────────────
            Row(
              children: [
                const Text(
                  'Riwayat Aktivitas',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => context.go('/catat'),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Catat'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (activities.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    const Text('📋', style: TextStyle(fontSize: 40)),
                    const SizedBox(height: 12),
                    Text(
                      'Belum ada aktivitas',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              )
            else
              ...activities.map(
                (a) => _ActivityRow(
                  aktivitas: a,
                  onTap: () => context.push('/aktivitas/detail/${a.id}'),
                  onMarkComplete: a.isBerjalan
                      ? () => _markComplete(context, ref, a)
                      : null,
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, LahanModel lahan) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Lahan?'),
        content: Text(
          'Anda yakin ingin menghapus "${lahan.name}"? Data lahan akan hilang permanen.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(lahanProvider.notifier).delete(lahan.id);
              if (context.mounted) context.pop();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  Future<void> _markComplete(
    BuildContext context,
    WidgetRef ref,
    AktivitasModel a,
  ) async {
    final success = await ref
        .read(aktivitasProvider.notifier)
        .markComplete(a.id);
    if (context.mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Aktivitas ditandai selesai'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.textHint),
          ),
        ],
      ),
    );
  }
}

class _ActivityRow extends StatelessWidget {
  const _ActivityRow({
    required this.aktivitas,
    this.onTap,
    this.onMarkComplete,
  });
  final AktivitasModel aktivitas;
  final VoidCallback? onTap;
  final VoidCallback? onMarkComplete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: aktivitas.isBerjalan
              ? AppColors.accent.withAlpha(60)
              : AppColors.border,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Text(aktivitas.type.emoji, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          aktivitas.type.label,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: aktivitas.isBerjalan
                                ? AppColors.accent.withAlpha(15)
                                : AppColors.primary.withAlpha(15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            aktivitas.statusLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: aktivitas.isBerjalan
                                  ? AppColors.accent
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (aktivitas.catatan != null &&
                        aktivitas.catatan!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        aktivitas.catatan!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (aktivitas.isBerjalan && onMarkComplete != null)
                TextButton(
                  onPressed: onMarkComplete,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    textStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  child: const Text('Selesaikan'),
                )
              else
                Text(
                  DateFormat('d MMM', 'id').format(aktivitas.tanggalMulai),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
