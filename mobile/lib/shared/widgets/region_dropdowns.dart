import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../models/region_model.dart';
import '../../providers/region_provider.dart';

/// Cascading region dropdowns: Kabupaten → Kecamatan → Desa/Kelurahan.
///
/// Firestore data is cached by the SDK — only the first load hits the network.
/// Pass [initialKabupaten], [initialKecamatan], [initialDesa] to pre-populate
/// (e.g. when editing an existing profile).
class RegionDropdowns extends ConsumerStatefulWidget {
  const RegionDropdowns({
    super.key,
    this.initialKabupaten,
    this.initialKecamatan,
    this.initialDesa,
    required this.onChanged,
  });

  final String? initialKabupaten;
  final String? initialKecamatan;
  final String? initialDesa;

  /// Called whenever any selection changes. Receives the current
  /// (kabupaten, kecamatan, desa) nama values — null means unselected.
  final void Function(String? kabupaten, String? kecamatan, String? desa)
      onChanged;

  @override
  ConsumerState<RegionDropdowns> createState() => _RegionDropdownsState();
}

class _RegionDropdownsState extends ConsumerState<RegionDropdowns> {
  KabupatenEntry? _selectedKab;
  KecamatanModel? _selectedKec;
  DesaModel? _selectedDesa;

  // Track whether we've already applied initial values from props
  bool _initialApplied = false;

  void _applyInitialValues(
    List<KabupatenEntry> kabList,
    KabupatenDetail? detail,
  ) {
    if (_initialApplied) return;
    if (widget.initialKabupaten == null) {
      _initialApplied = true;
      return;
    }

    final kab = kabList.where((k) => k.nama == widget.initialKabupaten).firstOrNull;
    if (kab == null) return; // not yet loaded or not found

    // Wait until detail is loaded too (if we have a kecamatan to restore)
    if (widget.initialKecamatan != null && detail == null) return;

    _initialApplied = true;

    KecamatanModel? kec;
    DesaModel? desa;

    if (detail != null && widget.initialKecamatan != null) {
      kec = detail.kecamatan
          .where((k) => k.nama == widget.initialKecamatan)
          .firstOrNull;

      if (kec != null && widget.initialDesa != null) {
        desa = kec.desa.where((d) => d.nama == widget.initialDesa).firstOrNull;
      }
    }

    setState(() {
      _selectedKab = kab;
      _selectedKec = kec;
      _selectedDesa = desa;
    });
  }

  void _onKabupatenChanged(KabupatenEntry? entry) {
    setState(() {
      _selectedKab = entry;
      _selectedKec = null;
      _selectedDesa = null;
    });
    widget.onChanged(entry?.nama, null, null);
  }

  void _onKecamatanChanged(KecamatanModel? kec) {
    setState(() {
      _selectedKec = kec;
      _selectedDesa = null;
    });
    widget.onChanged(_selectedKab?.nama, kec?.nama, null);
  }

  void _onDesaChanged(DesaModel? desa) {
    setState(() => _selectedDesa = desa);
    widget.onChanged(_selectedKab?.nama, _selectedKec?.nama, desa?.nama);
  }

  @override
  Widget build(BuildContext context) {
    final kabListAsync = ref.watch(kabupatenListProvider);
    final detailAsync = ref.watch(
      kabupatenDetailProvider(_selectedKab?.id ?? ''),
    );

    // Apply initial values once data is available
    if (!_initialApplied) {
      kabListAsync.whenData((kabList) {
        _applyInitialValues(
          kabList,
          detailAsync.asData?.value,
        );
      });
    }

    final kecamatanList = detailAsync.asData?.value?.kecamatan ?? [];
    final desaList = _selectedKec?.desa ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ─── Kabupaten/Kota ──────────────────────────────
        _Label('Kabupaten / Kota'),
        const SizedBox(height: 8),
        kabListAsync.when(
          loading: () => _LoadingDropdown('Memuat daftar kabupaten...'),
          error: (e, _) => _ErrorDropdown('Gagal memuat data wilayah'),
          data: (kabList) => _DropdownField<KabupatenEntry>(
            hint: 'Pilih Kabupaten / Kota',
            value: _selectedKab,
            items: kabList,
            labelOf: (k) => k.nama,
            onChanged: _onKabupatenChanged,
          ),
        ),
        const SizedBox(height: 16),

        // ─── Kecamatan ───────────────────────────────────
        _Label('Kecamatan'),
        const SizedBox(height: 8),
        if (_selectedKab == null)
          _DisabledDropdown('Pilih kabupaten terlebih dahulu')
        else if (detailAsync.isLoading)
          _LoadingDropdown('Memuat kecamatan...')
        else
          _DropdownField<KecamatanModel>(
            hint: 'Pilih Kecamatan',
            value: _selectedKec,
            items: kecamatanList,
            labelOf: (k) => k.nama,
            onChanged: _onKecamatanChanged,
          ),
        const SizedBox(height: 16),

        // ─── Desa / Kelurahan ────────────────────────────
        _Label('Desa / Kelurahan'),
        const SizedBox(height: 8),
        if (_selectedKec == null)
          _DisabledDropdown('Pilih kecamatan terlebih dahulu')
        else
          _DropdownField<DesaModel>(
            hint: 'Pilih Desa / Kelurahan',
            value: _selectedDesa,
            items: desaList,
            labelOf: (d) => d.nama,
            onChanged: _onDesaChanged,
          ),
      ],
    );
  }
}

// ─── Internal Helpers ─────────────────────────────────────

class _Label extends StatelessWidget {
  const _Label(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
      ),
    );
  }
}

class _DropdownField<T> extends StatelessWidget {
  const _DropdownField({
    required this.hint,
    required this.value,
    required this.items,
    required this.labelOf,
    required this.onChanged,
  });

  final String hint;
  final T? value;
  final List<T> items;
  final String Function(T) labelOf;
  final void Function(T?) onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      hint: Text(hint, style: const TextStyle(color: AppColors.textHint, fontSize: 14)),
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        filled: true,
        fillColor: AppColors.surface,
      ),
      style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
      menuMaxHeight: 320,
      items: items
          .map((item) => DropdownMenuItem<T>(
                value: item,
                child: Text(
                  labelOf(item),
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
                ),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }
}

class _LoadingDropdown extends StatelessWidget {
  const _LoadingDropdown(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Text(message, style: const TextStyle(fontSize: 13, color: AppColors.textHint)),
        ],
      ),
    );
  }
}

class _DisabledDropdown extends StatelessWidget {
  const _DisabledDropdown(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      alignment: Alignment.centerLeft,
      child: Text(message, style: const TextStyle(fontSize: 13, color: AppColors.textHint)),
    );
  }
}

class _ErrorDropdown extends StatelessWidget {
  const _ErrorDropdown(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withAlpha(80)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, size: 16, color: AppColors.error),
          const SizedBox(width: 8),
          Text(message, style: const TextStyle(fontSize: 13, color: AppColors.error)),
        ],
      ),
    );
  }
}
