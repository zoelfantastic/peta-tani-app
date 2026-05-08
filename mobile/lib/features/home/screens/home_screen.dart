import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/aktivitas_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/lahan_provider.dart';
import '../../../providers/aktivitas_provider.dart';

/// Home / Beranda screen — main dashboard for farmers.
/// Shows greeting, stats, running activities, and recent activity.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final userName = user?.name ?? 'Pengguna';
    final lahanState = ref.watch(lahanProvider);
    final aktState = ref.watch(aktivitasProvider);

    final lahanCount = lahanState.lahanList.length;
    final monthlyCount = aktState.monthlyCount;
    final berjalanList = aktState.berjalanList;
    final recentList = aktState.recent(3);
    final upcomingList = aktState.upcomingList;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(lahanProvider.notifier).loadAll();
            await ref.read(aktivitasProvider.notifier).loadAll();
          },
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─── Greeting ────────────────────────
                _buildGreeting(context, userName),
                const SizedBox(height: 24),

                // ─── Stats Cards ─────────────────────
                _buildStatsRow(
                  lahanCount: lahanCount,
                  aktivitasCount: monthlyCount,
                  berjalanCount: berjalanList.length,
                ),
                const SizedBox(height: 24),

                // ─── Running Activities ──────────────
                if (berjalanList.isNotEmpty) ...[
                  _buildSection(
                    context,
                    title: '⚡ Sedang Berjalan',
                    child: Column(
                      children: berjalanList
                          .map(
                            (a) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: _RunningCard(
                                aktivitas: a,
                                onTap: () =>
                                    context.push('/aktivitas/detail/${a.id}'),
                                onMarkComplete: () async {
                                  final success = await ref
                                      .read(aktivitasProvider.notifier)
                                      .markComplete(a.id);
                                  if (context.mounted && success) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          '✅ Aktivitas ditandai selesai',
                                        ),
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // ─── Jadwal Mendatang ──────────────
                if (upcomingList.isNotEmpty) ...[
                  _buildSection(
                    context,
                    title: '📅 Jadwal Mendatang',
                    child: Column(
                      children: upcomingList
                          .take(3)
                          .map(
                            (a) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: _ActivityItem(
                                aktivitas: a,
                                onTap: () =>
                                    context.push('/aktivitas/detail/${a.id}'),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // ─── Aktivitas Terakhir ──────────────
                _buildSection(
                  context,
                  title: '🕐 Aktivitas Terakhir',
                  trailing: TextButton(
                    onPressed: () => context.go('/riwayat'),
                    child: const Text(
                      'Lihat semua',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  child: recentList.isEmpty
                      ? Container(
                          padding: const EdgeInsets.all(24),
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            children: [
                              const Text('📋', style: TextStyle(fontSize: 32)),
                              const SizedBox(height: 8),
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
                      : Column(
                          children: recentList
                              .map(
                                (a) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: _ActivityItem(
                                    aktivitas: a,
                                    onTap: () => context.push(
                                      '/aktivitas/detail/${a.id}',
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGreeting(BuildContext context, String userName) {
    final now = DateTime.now();
    final hour = now.hour;
    final greeting = hour < 11
        ? 'Selamat pagi'
        : hour < 15
        ? 'Selamat siang'
        : hour < 18
        ? 'Selamat sore'
        : 'Selamat malam';
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id').format(now);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting, $userName 👋',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                dateStr,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        // Notification bell
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: const Center(
            child: Icon(
              Icons.notifications_none_rounded,
              color: AppColors.textSecondary,
              size: 22,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow({
    required int lahanCount,
    required int aktivitasCount,
    required int berjalanCount,
  }) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.map_rounded,
            iconColor: AppColors.primary,
            label: 'Lahan',
            value: '$lahanCount',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.edit_note_rounded,
            iconColor: AppColors.accent,
            label: 'Bulan Ini',
            value: '$aktivitasCount',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.timelapse_rounded,
            iconColor: AppColors.warning,
            label: 'Berjalan',
            value: '$berjalanCount',
          ),
        ),
      ],
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required Widget child,
    Widget? trailing,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            ?trailing,
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }
}

// ─── Sub-widgets ────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _RunningCard extends StatelessWidget {
  const _RunningCard({
    required this.aktivitas,
    required this.onMarkComplete,
    this.onTap,
  });

  final AktivitasModel aktivitas;
  final VoidCallback onMarkComplete;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accent.withAlpha(60)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: aktivitas.type.color.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  aktivitas.type.icon,
                  color: aktivitas.type.color,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${aktivitas.type.label} — ${aktivitas.lahanName}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Mulai: ${DateFormat('d MMM', 'id').format(aktivitas.tanggalMulai)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onMarkComplete,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  minimumSize: Size.zero,
                  textStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: const Text('Selesai'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({required this.aktivitas, this.onTap});

  final AktivitasModel aktivitas;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
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
                    Text(
                      aktivitas.type.label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${aktivitas.lahanName}${aktivitas.catatan != null && aktivitas.catatan!.isNotEmpty ? " • ${aktivitas.catatan}" : ""}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _relativeTime(aktivitas.tanggalMulai),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textHint,
                    ),
                  ),
                  if (aktivitas.isBerjalan) ...[
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withAlpha(15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Berjalan',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _relativeTime(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays == 0) return 'Hari ini';
    if (diff.inDays == 1) return 'Kemarin';
    if (diff.inDays < 7) return '${diff.inDays} hari lalu';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} minggu lalu';
    return DateFormat('d MMM', 'id').format(date);
  }
}
