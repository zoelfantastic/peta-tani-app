import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/aktivitas_provider.dart';

class AktivitasDetailScreen extends ConsumerWidget {
  const AktivitasDetailScreen({super.key, required this.aktivitasId});

  final String aktivitasId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(aktivitasProvider);
    final aktivitas = state.aktivitasList
        .where((a) => a.id == aktivitasId)
        .firstOrNull;

    if (aktivitas == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Detail Aktivitas'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(child: Text('Aktivitas tidak ditemukan')),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text(
          'Detail Aktivitas',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: aktivitas.isBerjalan
                      ? AppColors.accent.withAlpha(50)
                      : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        aktivitas.type.emoji,
                        style: const TextStyle(fontSize: 32),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          aktivitas.type.label,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          aktivitas.lahanName,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: aktivitas.isBerjalan
                          ? AppColors.accent.withAlpha(15)
                          : AppColors.primary.withAlpha(15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      aktivitas.statusLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: aktivitas.isBerjalan
                            ? AppColors.accent
                            : AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Detail Information
            const Text(
              'Informasi Detail',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _buildDetailRow(
                    icon: Icons.calendar_today_rounded,
                    label: 'Tanggal Mulai',
                    value: DateFormat(
                      'EEEE, d MMMM yyyy',
                      'id',
                    ).format(aktivitas.tanggalMulai),
                  ),
                  const Divider(height: 32),
                  _buildDetailRow(
                    icon: aktivitas.isBerjalan
                        ? Icons.pending_actions_rounded
                        : Icons.check_circle_outline_rounded,
                    label: 'Tanggal Selesai',
                    value: aktivitas.tanggalSelesai != null
                        ? DateFormat(
                            'EEEE, d MMMM yyyy',
                            'id',
                          ).format(aktivitas.tanggalSelesai!)
                        : '-',
                    valueColor: aktivitas.isBerjalan ? AppColors.accent : null,
                  ),
                  if (aktivitas.jumlah != null) ...[
                    const Divider(height: 32),
                    _buildDetailRow(
                      icon: Icons.scale_rounded,
                      label: 'Jumlah / Takaran',
                      value: '${aktivitas.jumlah} ${aktivitas.satuan ?? ""}',
                    ),
                  ],
                  if (aktivitas.catatan != null &&
                      aktivitas.catatan!.isNotEmpty) ...[
                    const Divider(height: 32),
                    _buildDetailRow(
                      icon: Icons.notes_rounded,
                      label: 'Catatan',
                      value: aktivitas.catatan!,
                    ),
                  ],
                ],
              ),
            ),

            if (aktivitas.isBerjalan) ...[
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final success = await ref
                        .read(aktivitasProvider.notifier)
                        .markComplete(aktivitas.id);
                    if (context.mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('✅ Aktivitas ditandai selesai'),
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle_rounded),
                  label: const Text('Tandai Selesai Sekarang'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: valueColor ?? AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
