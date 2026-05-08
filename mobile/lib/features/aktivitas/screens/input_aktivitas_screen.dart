import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/activity_types.dart';
import '../../../models/aktivitas_model.dart';
import '../../../providers/lahan_provider.dart';
import '../../../providers/aktivitas_provider.dart';

/// Input Aktivitas — core screen for recording farming activities.
/// Designed to be completed in < 30 seconds.
///
/// Key business logic:
/// - Checks for running activities on selected lahan (blocking)
/// - If a "Berjalan" activity exists, shows warning + blocks form
/// - Quick "Tandai Selesai" action available from the warning
class InputAktivitasScreen extends ConsumerStatefulWidget {
  const InputAktivitasScreen({super.key});

  @override
  ConsumerState<InputAktivitasScreen> createState() =>
      _InputAktivitasScreenState();
}

class _InputAktivitasScreenState extends ConsumerState<InputAktivitasScreen> {
  String? _selectedLahanId;
  ActivityType? _selectedActivity;
  final _catatanController = TextEditingController();
  final _jumlahController = TextEditingController();
  String _satuan = 'kg';
  DateTime _tanggalMulai = DateTime.now();
  DateTime? _tanggalSelesai;

  // Blocking state
  AktivitasModel? _runningActivity;
  bool _checkingBlocked = false;

  @override
  void dispose() {
    _catatanController.dispose();
    _jumlahController.dispose();
    super.dispose();
  }

  /// Check if the selected lahan has a running activity.
  Future<void> _checkBlocking() async {
    if (_selectedLahanId == null) return;
    setState(() => _checkingBlocked = true);

    final running = await ref
        .read(aktivitasProvider.notifier)
        .getRunningActivity(_selectedLahanId!);

    if (mounted) {
      setState(() {
        _runningActivity = running;
        _checkingBlocked = false;
      });
    }
  }

  void _onLahanChanged(String? lahanId) {
    setState(() {
      _selectedLahanId = lahanId;
      _runningActivity = null;
    });
    _checkBlocking();
  }

  Future<void> _pickTanggalMulai() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _tanggalMulai,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      helpText: 'Tanggal Mulai',
      cancelText: 'Batal',
      confirmText: 'Pilih',
    );
    if (picked != null) setState(() => _tanggalMulai = picked);
  }

  Future<void> _pickTanggalSelesai() async {
    if (_tanggalSelesai != null) {
      setState(() => _tanggalSelesai = null);
      return;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: _tanggalMulai,
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Tanggal Selesai',
      cancelText: 'Batal',
      confirmText: 'Pilih',
    );
    if (picked != null) setState(() => _tanggalSelesai = picked);
  }

  Future<void> _markRunningComplete() async {
    if (_runningActivity == null) return;
    final success = await ref
        .read(aktivitasProvider.notifier)
        .markComplete(_runningActivity!.id);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Aktivitas sebelumnya ditandai selesai'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      _checkBlocking(); // re-check
    }
  }

  Future<void> _simpan() async {
    if (_selectedLahanId == null) {
      _showError('Pilih lahan terlebih dahulu');
      return;
    }
    if (_selectedActivity == null) {
      _showError('Pilih jenis aktivitas terlebih dahulu');
      return;
    }
    if (_runningActivity != null) {
      _showError('Selesaikan aktivitas sebelumnya terlebih dahulu');
      return;
    }

    final lahanState = ref.read(lahanProvider);
    final lahan = lahanState.lahanList.firstWhere(
      (l) => l.id == _selectedLahanId,
    );

    final jumlah = _jumlahController.text.isNotEmpty
        ? double.tryParse(_jumlahController.text)
        : null;

    final success = await ref
        .read(aktivitasProvider.notifier)
        .add(
          lahanId: _selectedLahanId!,
          lahanName: lahan.name,
          type: _selectedActivity!,
          tanggalMulai: _tanggalMulai,
          tanggalSelesai: _tanggalSelesai,
          catatan: _catatanController.text.isNotEmpty
              ? _catatanController.text.trim()
              : null,
          jumlah: jumlah,
          satuan: jumlah != null ? _satuan : null,
        );

    if (mounted && success) {
      _showSuccess();
      // Reset form
      setState(() {
        _selectedActivity = null;
        _catatanController.clear();
        _jumlahController.clear();
        _tanggalMulai = DateTime.now();
        _tanggalSelesai = null;
      });
      _checkBlocking();
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), behavior: SnackBarBehavior.floating),
    );
  }

  void _showSuccess() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  size: 44,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Berhasil Disimpan!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Aktivitas ${_selectedActivity?.label ?? ''} telah dicatat.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Catat Lagi'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        context.go('/beranda');
                      },
                      child: const Text('Beranda'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final lahanState = ref.watch(lahanProvider);
    final aktState = ref.watch(aktivitasProvider);
    final lahanList = lahanState.lahanList;
    final isBlocked = _runningActivity != null;

    // Auto-select first lahan if none selected
    if (_selectedLahanId == null && lahanList.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _onLahanChanged(lahanList.first.id);
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Catat Aktivitas'),
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
      ),
      body: lahanList.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🗺️', style: TextStyle(fontSize: 64)),
                    const SizedBox(height: 16),
                    const Text(
                      'Tambahkan lahan terlebih dahulu',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Anda perlu mendaftarkan lahan sebelum mencatat aktivitas.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/lahan/tambah'),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text('Tambah Lahan'),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── Pilih Lahan ──────────────────
                  _label('Pilih Lahan'),
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
                        value: _selectedLahanId,
                        isExpanded: true,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded),
                        hint: const Text('Pilih lahan...'),
                        items: lahanList.map((l) {
                          return DropdownMenuItem(
                            value: l.id,
                            child: Row(
                              children: [
                                Text(
                                  l.emoji,
                                  style: const TextStyle(fontSize: 18),
                                ),
                                const SizedBox(width: 8),
                                Text(l.name),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: _onLahanChanged,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ─── Blocking Warning ────────────
                  if (_checkingBlocked)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Center(
                        child: SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    )
                  else if (isBlocked) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withAlpha(10),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.accent.withAlpha(50),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.warning_amber_rounded,
                                color: AppColors.accent,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'Ada aktivitas yang masih berjalan',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.accent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  _runningActivity!.type.emoji,
                                  style: const TextStyle(fontSize: 24),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _runningActivity!.type.label,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      Text(
                                        'Mulai: ${DateFormat('d MMM yyyy', 'id').format(_runningActivity!.tanggalMulai)}',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Selesaikan aktivitas di atas terlebih dahulu sebelum mencatat yang baru.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: aktState.isLoading
                                  ? null
                                  : _markRunningComplete,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                minimumSize: const Size(double.infinity, 44),
                              ),
                              icon: const Icon(
                                Icons.check_circle_rounded,
                                size: 18,
                              ),
                              label: const Text('Tandai Selesai Sekarang'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ─── Form (disabled if blocked) ──
                  IgnorePointer(
                    ignoring: isBlocked,
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 300),
                      opacity: isBlocked ? 0.4 : 1.0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Jenis Aktivitas
                          _label('Jenis Aktivitas'),
                          const SizedBox(height: 8),
                          GridView.count(
                            crossAxisCount: 3,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 1.1,
                            children: ActivityType.values.map((type) {
                              final isSelected = _selectedActivity == type;
                              return GestureDetector(
                                onTap: () =>
                                    setState(() => _selectedActivity = type),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? type.color.withAlpha(20)
                                        : AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isSelected
                                          ? type.color
                                          : AppColors.border,
                                      width: isSelected ? 2 : 1,
                                    ),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        type.icon,
                                        size: 28,
                                        color: isSelected
                                            ? type.color
                                            : AppColors.textSecondary,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        type.label,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: isSelected
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                          color: isSelected
                                              ? type.color
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

                          // Tanggal Mulai
                          _label('Tanggal Mulai'),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: _pickTanggalMulai,
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
                                    DateFormat(
                                      'd MMMM yyyy',
                                      'id',
                                    ).format(_tanggalMulai),
                                    style: const TextStyle(
                                      fontSize: 15,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (_isToday(_tanggalMulai))
                                    const Text(
                                      'Hari Ini',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Tanggal Selesai
                          _label('Tanggal Selesai (opsional)'),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: _pickTanggalSelesai,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: _tanggalSelesai != null
                                    ? AppColors.surface
                                    : AppColors.background,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _tanggalSelesai != null
                                      ? AppColors.primary
                                      : AppColors.border,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.event_available_rounded,
                                    size: 18,
                                    color: _tanggalSelesai != null
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    _tanggalSelesai != null
                                        ? DateFormat(
                                            'd MMMM yyyy',
                                            'id',
                                          ).format(_tanggalSelesai!)
                                        : 'Belum selesai (Masih berjalan)',
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: _tanggalSelesai != null
                                          ? AppColors.textPrimary
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (_tanggalSelesai != null)
                                    const Icon(
                                      Icons.close_rounded,
                                      size: 18,
                                      color: AppColors.textHint,
                                    ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Catatan
                          _label('Catatan (opsional)'),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _catatanController,
                            maxLines: 3,
                            minLines: 2,
                            decoration: const InputDecoration(
                              hintText: 'Contoh: Pupuk urea 50kg',
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Jumlah
                          _label('Jumlah (opsional)'),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: _jumlahController,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    hintText: '50',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _satuan,
                                      isExpanded: true,
                                      items: ['kg', 'liter', 'ton', 'karung']
                                          .map(
                                            (e) => DropdownMenuItem(
                                              value: e,
                                              child: Text(e),
                                            ),
                                          )
                                          .toList(),
                                      onChanged: (v) =>
                                          setState(() => _satuan = v!),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 32),

                          // Simpan
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton.icon(
                              onPressed: aktState.isLoading ? null : _simpan,
                              icon: aktState.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.save_rounded),
                              label: const Text('SIMPAN'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
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
