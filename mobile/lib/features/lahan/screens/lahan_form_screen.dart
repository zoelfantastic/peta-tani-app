import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/lahan_model.dart';
import '../../../providers/lahan_provider.dart';

/// Form screen for adding or editing a lahan.
/// If [lahan] is null, creates a new one. Otherwise edits.
class LahanFormScreen extends ConsumerStatefulWidget {
  const LahanFormScreen({super.key, this.lahan});

  final LahanModel? lahan;

  bool get isEditing => lahan != null;

  @override
  ConsumerState<LahanFormScreen> createState() => _LahanFormScreenState();
}

class _LahanFormScreenState extends ConsumerState<LahanFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _luasController;

  String _selectedTanaman = 'Padi';
  String _selectedEmoji = '🌾';
  String _satuanLuas = 'Ha';
  String _fase = 'Persiapan';
  DateTime? _tanggalTanam;

  @override
  void initState() {
    super.initState();
    final l = widget.lahan;
    _nameController = TextEditingController(text: l?.name ?? '');
    _luasController = TextEditingController(
      text: l != null
          ? (l.luas % 1 == 0 ? l.luas.toInt().toString() : l.luas.toString())
          : '',
    );
    if (l != null) {
      _selectedTanaman = l.tanaman;
      _selectedEmoji = l.emoji;
      _satuanLuas = l.satuanLuas;
      _fase = l.fase;
      _tanggalTanam = l.tanggalTanam;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _luasController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _tanggalTanam ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Pilih Tanggal Tanam',
      cancelText: 'Batal',
      confirmText: 'Pilih',
    );
    if (picked != null) {
      setState(() => _tanggalTanam = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final luas = double.tryParse(_luasController.text) ?? 0;
    bool success;

    if (widget.isEditing) {
      final updated = widget.lahan!.copyWith(
        name: _nameController.text.trim(),
        tanaman: _selectedTanaman,
        luas: luas,
        satuanLuas: _satuanLuas,
        emoji: _selectedEmoji,
        tanggalTanam: _tanggalTanam,
        fase: _fase,
      );
      success = await ref.read(lahanProvider.notifier).update(updated);
    } else {
      success = await ref
          .read(lahanProvider.notifier)
          .add(
            name: _nameController.text.trim(),
            tanaman: _selectedTanaman,
            luas: luas,
            satuanLuas: _satuanLuas,
            emoji: _selectedEmoji,
            tanggalTanam: _tanggalTanam,
            fase: _fase,
          );
    }

    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isEditing
                ? '✅ Lahan berhasil diubah'
                : '✅ Lahan berhasil ditambahkan',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final lahanState = ref.watch(lahanProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.isEditing ? 'Edit Lahan' : 'Tambah Lahan'),
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── Nama Lahan ──────────────────
              _label('Nama Lahan'),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  hintText: 'Contoh: Sawah Belakang',
                  prefixIcon: Icon(Icons.edit_rounded, size: 20),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Mohon isi nama lahan';
                  }
                  if (v.trim().length < 3) return 'Nama minimal 3 karakter';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // ─── Jenis Tanaman ───────────────
              _label('Jenis Tanaman'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: cropEmojis.entries.map((entry) {
                  final isSelected = _selectedTanaman == entry.key;
                  return GestureDetector(
                    onTap: () => setState(() {
                      _selectedTanaman = entry.key;
                      _selectedEmoji = entry.value;
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withAlpha(15)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.border,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            entry.value,
                            style: const TextStyle(fontSize: 18),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            entry.key,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // ─── Luas Lahan ──────────────────
              _label('Luas Lahan'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _luasController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[\d.]')),
                      ],
                      decoration: const InputDecoration(hintText: '2'),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Isi luas lahan';
                        final n = double.tryParse(v);
                        if (n == null || n <= 0) return 'Tidak valid';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _satuanLuas,
                          isExpanded: true,
                          items: ['Ha', 'm²', 'Are']
                              .map(
                                (e) =>
                                    DropdownMenuItem(value: e, child: Text(e)),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _satuanLuas = v!),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ─── Tanggal Tanam ───────────────
              _label('Tanggal Tanam (opsional)'),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_today_rounded,
                        size: 18,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _tanggalTanam != null
                            ? DateFormat(
                                'd MMMM yyyy',
                                'id',
                              ).format(_tanggalTanam!)
                            : 'Pilih tanggal',
                        style: TextStyle(
                          fontSize: 15,
                          color: _tanggalTanam != null
                              ? AppColors.textPrimary
                              : AppColors.textHint,
                        ),
                      ),
                      const Spacer(),
                      if (_tanggalTanam != null)
                        GestureDetector(
                          onTap: () => setState(() => _tanggalTanam = null),
                          child: const Icon(
                            Icons.close_rounded,
                            size: 18,
                            color: AppColors.textHint,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ─── Fase Pertumbuhan ────────────
              _label('Fase Pertumbuhan'),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _fase,
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded),
                    items: growthPhases
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (v) => setState(() => _fase = v!),
                  ),
                ),
              ),
              const SizedBox(height: 36),

              // ─── Simpan Button ───────────────
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: lahanState.isLoading ? null : _save,
                  icon: lahanState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.save_rounded),
                  label: Text(
                    widget.isEditing ? 'Simpan Perubahan' : 'Tambah Lahan',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
    text,
    style: const TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: AppColors.textPrimary,
    ),
  );
}
