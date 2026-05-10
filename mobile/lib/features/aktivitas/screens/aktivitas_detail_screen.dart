import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/aktivitas_provider.dart';

final _rupiahFmt =
    NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

class AktivitasDetailScreen extends ConsumerWidget {
  const AktivitasDetailScreen({super.key, required this.aktivitasId});

  final String aktivitasId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(aktivitasProvider);
    final aktivitas =
        state.aktivitasList.where((a) => a.id == aktivitasId).firstOrNull;

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
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Header card ──────────────────────────────
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
                      child: Text(aktivitas.type.emoji,
                          style: const TextStyle(fontSize: 32)),
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
                  _StatusBadge(isBerjalan: aktivitas.isBerjalan),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─── Waktu ────────────────────────────────────
            _Section(
              title: 'Waktu',
              children: [
                _DetailRow(
                  icon: Icons.calendar_today_rounded,
                  label: 'Tanggal Mulai',
                  value: DateFormat('EEEE, d MMMM yyyy', 'id')
                      .format(aktivitas.tanggalMulai),
                ),
                const Divider(height: 28),
                _DetailRow(
                  icon: aktivitas.isBerjalan
                      ? Icons.pending_actions_rounded
                      : Icons.check_circle_outline_rounded,
                  label: 'Tanggal Selesai',
                  value: aktivitas.tanggalSelesai != null
                      ? DateFormat('EEEE, d MMMM yyyy', 'id')
                          .format(aktivitas.tanggalSelesai!)
                      : 'Masih berjalan',
                  valueColor:
                      aktivitas.isBerjalan ? AppColors.accent : null,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ─── Alat ────────────────────────────────────
            if (aktivitas.alatYangDigunakan != null) ...[
              _Section(
                title: 'Alat yang Digunakan',
                children: [
                  _DetailRow(
                    icon: Icons.agriculture_rounded,
                    label: 'Alat',
                    value: aktivitas.alatYangDigunakan!,
                  ),
                  if (aktivitas.kebutuhanBahanBakar != null) ...[
                    const Divider(height: 28),
                    _DetailRow(
                      icon: Icons.local_gas_station_rounded,
                      label: 'Kebutuhan BBM',
                      value:
                          '${aktivitas.kebutuhanBahanBakar} liter',
                    ),
                  ],
                  if (aktivitas.biayaBahanBakar != null) ...[
                    const Divider(height: 28),
                    _DetailRow(
                      icon: Icons.payments_outlined,
                      label: 'Biaya BBM',
                      value: _rupiahFmt.format(aktivitas.biayaBahanBakar),
                    ),
                  ],
                  if (aktivitas.jumlahAlatUnit != null) ...[
                    const Divider(height: 28),
                    _DetailRow(
                      icon: Icons.devices_other_rounded,
                      label: 'Jumlah Alat',
                      value: '${aktivitas.jumlahAlatUnit!.toStringAsFixed(aktivitas.jumlahAlatUnit! % 1 == 0 ? 0 : 1)} unit',
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ─── Saprodi ─────────────────────────────────
            if (aktivitas.jenisSaprodi != null) ...[
              _Section(
                title: 'Kebutuhan Saprodi',
                children: [
                  _DetailRow(
                    icon: Icons.science_outlined,
                    label: 'Jenis Saprodi',
                    value: aktivitas.jenisSaprodi!,
                  ),
                  if (aktivitas.jumlahSaprodi != null) ...[
                    const Divider(height: 28),
                    _DetailRow(
                      icon: Icons.scale_rounded,
                      label: 'Jumlah',
                      value:
                          '${aktivitas.jumlahSaprodi} ${aktivitas.satuanSaprodi ?? ""}',
                    ),
                  ],
                  if (aktivitas.biayaSaprodi != null) ...[
                    const Divider(height: 28),
                    _DetailRow(
                      icon: Icons.payments_outlined,
                      label: 'Harga Total Saprodi',
                      value: _rupiahFmt.format(aktivitas.biayaSaprodi),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ─── HOK ─────────────────────────────────────
            if (aktivitas.jumlahTenagaKerja != null ||
                aktivitas.biayaHok != null) ...[
              _Section(
                title: 'Tenaga Kerja (HOK)',
                children: [
                  if (aktivitas.jumlahTenagaKerja != null)
                    _DetailRow(
                      icon: Icons.people_outline_rounded,
                      label: 'Jumlah Tenaga Kerja',
                      value:
                          '${aktivitas.jumlahTenagaKerja!.toStringAsFixed(0)} orang',
                    ),
                  if (aktivitas.jumlahTenagaKerja != null &&
                      aktivitas.biayaHok != null)
                    const Divider(height: 28),
                  if (aktivitas.biayaHok != null)
                    _DetailRow(
                      icon: Icons.payments_outlined,
                      label: 'Total Biaya HOK',
                      value: _rupiahFmt.format(aktivitas.biayaHok),
                    ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ─── Catatan ─────────────────────────────────
            if (aktivitas.catatan != null &&
                aktivitas.catatan!.isNotEmpty) ...[
              _Section(
                title: 'Catatan',
                children: [
                  _DetailRow(
                    icon: Icons.notes_rounded,
                    label: 'Catatan',
                    value: aktivitas.catatan!,
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // ─── Mark Complete ────────────────────────────
            if (aktivitas.isBerjalan) ...[
              const SizedBox(height: 16),
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
                          content: Text('Aktivitas ditandai selesai'),
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
}

// ─── Internal widgets ─────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.isBerjalan});
  final bool isBerjalan;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isBerjalan
            ? AppColors.accent.withAlpha(15)
            : AppColors.primary.withAlpha(15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        isBerjalan ? 'Berjalan' : 'Selesai',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: isBerjalan ? AppColors.accent : AppColors.primary,
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
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
