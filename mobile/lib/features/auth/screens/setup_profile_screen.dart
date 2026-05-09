import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../shared/widgets/region_dropdowns.dart';

class SetupProfileScreen extends ConsumerStatefulWidget {
  const SetupProfileScreen({super.key});

  @override
  ConsumerState<SetupProfileScreen> createState() => _SetupProfileScreenState();
}

class _SetupProfileScreenState extends ConsumerState<SetupProfileScreen>
    with SingleTickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _kelompokController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  String? _kabupaten;
  String? _kecamatan;
  String? _desa;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _animController.forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _kelompokController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).saveProfile(
          name: _nameController.text.trim(),
          namaKelompokTani: _kelompokController.text.trim().isEmpty
              ? null
              : _kelompokController.text.trim(),
          kabupaten: _kabupaten,
          kecamatan: _kecamatan,
          desa: _desa,
        );

    if (!mounted) return;

    if (success) {
      context.go('/beranda');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(authProvider).error ?? 'Gagal menyimpan profil'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(authProvider).isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 48, 24, 40),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ─── Header ───────────────────────────
                    Center(
                      child: Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withAlpha(20),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text('👨‍🌾', style: TextStyle(fontSize: 48)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Selamat Datang\ndi Peta Tani! 🌾',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Lengkapi profil Anda untuk memulai.\nBidang lokasi bisa diisi nanti.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // ─── Nama Lengkap ──────────────────────
                    _SectionLabel('Nama Lengkap', required: true),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameController,
                      textCapitalization: TextCapitalization.words,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: 'Contoh: Pak Ahmad',
                        prefixIcon: Icon(Icons.person_outline_rounded,
                            size: 22, color: AppColors.textSecondary),
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Mohon masukkan nama Anda';
                        if (v.trim().length < 2) return 'Nama minimal 2 karakter';
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // ─── Kelompok Tani ─────────────────────
                    _SectionLabel('Nama Kelompok Tani', required: false),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _kelompokController,
                      textCapitalization: TextCapitalization.words,
                      textInputAction: TextInputAction.done,
                      decoration: const InputDecoration(
                        hintText: 'Contoh: Tani Makmur (opsional)',
                        prefixIcon: Icon(Icons.groups_outlined,
                            size: 22, color: AppColors.textSecondary),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // ─── Lokasi ────────────────────────────
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 18, color: AppColors.primary),
                        const SizedBox(width: 6),
                        const Text(
                          'Lokasi Pertanian',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Opsional',
                            style: TextStyle(fontSize: 11, color: AppColors.textHint),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Wilayah provinsi Jawa Timur',
                      style: TextStyle(fontSize: 12, color: AppColors.textHint),
                    ),
                    const SizedBox(height: 16),

                    RegionDropdowns(
                      onChanged: (kab, kec, desa) {
                        _kabupaten = kab;
                        _kecamatan = kec;
                        _desa = desa;
                      },
                    ),
                    const SizedBox(height: 40),

                    // ─── Submit ────────────────────────────
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _saveProfile,
                        child: isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Mulai Menggunakan Peta Tani',
                                      style: TextStyle(
                                          fontSize: 15, fontWeight: FontWeight.w600)),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 20),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text, {this.required = false});
  final String text;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
          ),
        ),
        if (required) ...[
          const SizedBox(width: 4),
          const Text('*', style: TextStyle(color: AppColors.error, fontSize: 14)),
        ],
      ],
    );
  }
}
