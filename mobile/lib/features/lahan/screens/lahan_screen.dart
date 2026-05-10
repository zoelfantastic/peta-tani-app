import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/lahan_model.dart';
import '../../../providers/lahan_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_state.dart';

/// Lahan list screen — shows all registered farmlands.
class LahanScreen extends ConsumerWidget {
  const LahanScreen({super.key});

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
    final lahanList = lahanState.lahanList;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: lahanState.isLoading && lahanList.isEmpty
            ? const LoadingState(message: 'Memuat daftar lahan...')
            : lahanList.isEmpty
            ? EmptyState(
                emoji: '🗺️',
                title: 'Belum ada lahan',
                subtitle:
                    'Tambahkan lahan pertama Anda untuk\nmulai mencatat aktivitas.',
                actionLabel: 'Tambah Lahan',
                onAction: () => context.push('/lahan/tambah'),
              )
            : RefreshIndicator(
                onRefresh: () => ref.read(lahanProvider.notifier).loadAll(),
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Lahan Saya',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${lahanList.length} lahan terdaftar',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 20),

                      ...lahanList.map(
                        (lahan) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _LahanCard(
                            lahan: lahan,
                            jenisColor: _jenisLahanColor(lahan.jenisLahan),
                            onTap: () =>
                                context.push('/lahan/detail/${lahan.id}'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => context.push('/lahan/tambah'),
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('Tambah Lahan'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}

class _LahanCard extends StatelessWidget {
  const _LahanCard({
    required this.lahan,
    required this.jenisColor,
    required this.onTap,
  });

  final LahanModel lahan;
  final Color jenisColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(lahan.emoji, style: const TextStyle(fontSize: 32)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lahan.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${lahan.tanaman} • ${lahan.luasDisplay}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Jenis lahan badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
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
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            lahan.jenisLahan,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: jenisColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (lahan.hasLocation) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_rounded,
                        size: 13,
                        color: AppColors.primary.withAlpha(180),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        lahan.locationDisplay,
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textHint,
                          fontFamily: 'monospace',
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.textHint,
                      ),
                    ],
                  ),
                ] else ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.location_off_rounded,
                        size: 13,
                        color: AppColors.textHint,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Belum ada titik lokasi',
                        style: TextStyle(fontSize: 11, color: AppColors.textHint),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.textHint,
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
