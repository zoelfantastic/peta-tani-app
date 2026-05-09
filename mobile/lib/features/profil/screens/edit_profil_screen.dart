import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/user_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../shared/widgets/region_dropdowns.dart';

class EditProfilScreen extends ConsumerStatefulWidget {
  const EditProfilScreen({super.key, required this.user});

  final UserModel user;

  @override
  ConsumerState<EditProfilScreen> createState() => _EditProfilScreenState();
}

class _EditProfilScreenState extends ConsumerState<EditProfilScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _kelompokController;

  String? _kabupaten;
  String? _kecamatan;
  String? _desa;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.name ?? '');
    _kelompokController =
        TextEditingController(text: widget.user.namaKelompokTani ?? '');
    _kabupaten = widget.user.kabupaten;
    _kecamatan = widget.user.kecamatan;
    _desa = widget.user.desa;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _kelompokController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final kelompok = _kelompokController.text.trim();

    // Only send fields that changed
    final success = await ref.read(authProvider.notifier).updateProfile(
          name: name != (widget.user.name ?? '') ? name : null,
          namaKelompokTani: kelompok != (widget.user.namaKelompokTani ?? '')
              ? (kelompok.isEmpty ? '' : kelompok)
              : null,
          kabupaten: _kabupaten != widget.user.kabupaten ? _kabupaten : null,
          kecamatan: _kecamatan != widget.user.kecamatan ? _kecamatan : null,
          desa: _desa != widget.user.desa ? _desa : null,
        );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profil berhasil diperbarui'),
          backgroundColor: AppColors.primary,
        ),
      );
      Navigator.of(context).pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ref.read(authProvider).error ?? 'Gagal memperbarui profil',
          ),
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
      appBar: AppBar(
        title: const Text('Edit Profil'),
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
        actions: [
          TextButton(
            onPressed: isLoading ? null : _save,
            child: isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppColors.primary),
                  )
                : const Text(
                    'Simpan',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── Nama ──────────────────────────────────
              _Label('Nama Lengkap', required: true),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.person_outline_rounded,
                      size: 22, color: AppColors.textSecondary),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Nama tidak boleh kosong';
                  if (v.trim().length < 2) return 'Nama minimal 2 karakter';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // ─── Kelompok Tani ─────────────────────────
              _Label('Nama Kelompok Tani'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _kelompokController,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                  hintText: 'Opsional',
                  prefixIcon: Icon(Icons.groups_outlined,
                      size: 22, color: AppColors.textSecondary),
                ),
              ),
              const SizedBox(height: 28),

              // ─── Lokasi ────────────────────────────────
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
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Wilayah provinsi Jawa Timur',
                style: TextStyle(fontSize: 12, color: AppColors.textHint),
              ),
              const SizedBox(height: 16),

              RegionDropdowns(
                initialKabupaten: widget.user.kabupaten,
                initialKecamatan: widget.user.kecamatan,
                initialDesa: widget.user.desa,
                onChanged: (kab, kec, desa) {
                  _kabupaten = kab;
                  _kecamatan = kec;
                  _desa = desa;
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text, {this.required = false});
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
