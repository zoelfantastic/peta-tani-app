import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/auth_provider.dart';
import 'edit_profil_screen.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar dari Peta Tani?'),
        content: const Text(
          'Anda yakin ingin keluar? Anda perlu masuk kembali untuk menggunakan aplikasi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) context.go('/login');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final displayName = user?.name ?? 'Pengguna';
    final phone = user?.phoneNumber ?? '-';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Profil',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 20),

              // ─── Profile Card ─────────────────────────────
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(20),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              _getInitials(displayName),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                displayName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                phone,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: user == null
                              ? null
                              : () => Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => EditProfilScreen(user: user),
                                    ),
                                  ),
                          icon: const Icon(Icons.edit_rounded,
                              size: 20, color: AppColors.primary),
                          tooltip: 'Edit Profil',
                        ),
                      ],
                    ),

                    // ─── Info Rows ────────────────────────
                    if (user?.namaKelompokTani != null ||
                        user?.kabupaten != null) ...[
                      const SizedBox(height: 16),
                      const Divider(color: AppColors.border, height: 1),
                      const SizedBox(height: 16),
                      if (user?.namaKelompokTani != null)
                        _InfoRow(
                          icon: Icons.groups_outlined,
                          label: 'Kelompok Tani',
                          value: user!.namaKelompokTani!,
                        ),
                      if (user?.kabupaten != null) ...[
                        if (user?.namaKelompokTani != null)
                          const SizedBox(height: 10),
                        _InfoRow(
                          icon: Icons.location_on_outlined,
                          label: 'Lokasi',
                          value: _buildLocationString(user!),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ─── Menu ─────────────────────────────────────
              _MenuItem(
                icon: Icons.notifications_none_rounded,
                label: 'Pengingat',
                subtitle: 'Aktif',
                onTap: () {},
              ),
              _MenuItem(
                icon: Icons.help_outline_rounded,
                label: 'Bantuan / FAQ',
                onTap: () {},
              ),
              _MenuItem(
                icon: Icons.info_outline_rounded,
                label: 'Tentang Aplikasi',
                subtitle: 'v1.0.0',
                onTap: () {},
              ),
              const SizedBox(height: 8),
              _MenuItem(
                icon: Icons.logout_rounded,
                label: 'Keluar',
                isDestructive: true,
                onTap: () => _confirmLogout(context, ref),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _buildLocationString(dynamic user) {
    final parts = <String>[];
    if (user.desa != null) parts.add(user.desa!);
    if (user.kecamatan != null) parts.add(user.kecamatan!);
    if (user.kabupaten != null) parts.add(user.kabupaten!);
    return parts.join(', ');
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}

// ─── Internal Widgets ──────────────────────────────────────

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textHint,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.label,
    this.subtitle,
    this.isDestructive = false,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String? subtitle;
  final bool isDestructive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? AppColors.error : AppColors.textPrimary;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: color, size: 22),
        title: Text(
          label,
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: color),
        ),
        subtitle: subtitle != null
            ? Text(subtitle!,
                style: const TextStyle(fontSize: 12, color: AppColors.textHint))
            : null,
        trailing: isDestructive
            ? null
            : const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
