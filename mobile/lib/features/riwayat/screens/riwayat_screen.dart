import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/aktivitas_model.dart';
import '../../../providers/aktivitas_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_state.dart';

/// Timeline / Riwayat screen — shows farming activity history grouped by month.
/// Features:
/// - Filter by lahan (dropdown)
/// - Status indicator: Berjalan (orange) / Selesai (green)
/// - Quick "Tandai Selesai" for running activities
class RiwayatScreen extends ConsumerStatefulWidget {
  const RiwayatScreen({super.key});

  @override
  ConsumerState<RiwayatScreen> createState() => _RiwayatScreenState();
}

class _RiwayatScreenState extends ConsumerState<RiwayatScreen> {
  String _filterLahan = 'Semua Lahan';
  bool _isCalendarView = false;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final aktState = ref.watch(aktivitasProvider);
    final allActivities = aktState.aktivitasList;

    // Get unique lahan names for filter
    final lahanNames = <String>{'Semua Lahan'};
    for (final a in allActivities) {
      lahanNames.add(a.lahanName);
    }

    // Apply filter
    final filtered = _filterLahan == 'Semua Lahan'
        ? allActivities
        : allActivities.where((a) => a.lahanName == _filterLahan).toList();

    // Group by month
    final grouped = <String, List<AktivitasModel>>{};
    for (final a in filtered) {
      final key = _monthKey(a.tanggalMulai);
      grouped.putIfAbsent(key, () => []).add(a);
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Header ────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Riwayat',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              onPressed: () =>
                                  setState(() => _isCalendarView = false),
                              icon: Icon(
                                Icons.format_list_bulleted_rounded,
                                color: !_isCalendarView
                                    ? AppColors.primary
                                    : AppColors.textHint,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 36,
                                minHeight: 36,
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 20,
                              color: AppColors.border,
                            ),
                            IconButton(
                              onPressed: () =>
                                  setState(() => _isCalendarView = true),
                              icon: Icon(
                                Icons.calendar_month_rounded,
                                color: _isCalendarView
                                    ? AppColors.primary
                                    : AppColors.textHint,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 36,
                                minHeight: 36,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (!_isCalendarView)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _filterLahan,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded),
                          items: lahanNames
                              .map(
                                (e) =>
                                    DropdownMenuItem(value: e, child: Text(e)),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _filterLahan = v!),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ─── Content ───────────────────────
            Expanded(
              child: aktState.isLoading && allActivities.isEmpty
                  ? const LoadingState(message: 'Memuat riwayat...')
                  : filtered.isEmpty
                  ? const EmptyState(
                      emoji: '📋',
                      title: 'Belum ada aktivitas',
                      subtitle:
                          'Mulai catat aktivitas pertanian Anda\ndengan tap tombol + di bawah.',
                    )
                  : _isCalendarView
                  ? _buildCalendarView(filtered)
                  : RefreshIndicator(
                      onRefresh: () =>
                          ref.read(aktivitasProvider.notifier).loadAll(),
                      color: AppColors.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                        itemCount: _buildItemCount(grouped),
                        itemBuilder: (context, index) =>
                            _buildItem(context, index, grouped),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarView(List<AktivitasModel> allActivities) {
    // Map activities to dates
    final eventsMap = <DateTime, List<AktivitasModel>>{};
    for (final a in allActivities) {
      final date = DateTime(
        a.tanggalMulai.year,
        a.tanggalMulai.month,
        a.tanggalMulai.day,
      );
      eventsMap.putIfAbsent(date, () => []).add(a);
      if (a.tanggalSelesai != null) {
        final endDate = DateTime(
          a.tanggalSelesai!.year,
          a.tanggalSelesai!.month,
          a.tanggalSelesai!.day,
        );
        if (endDate != date) {
          eventsMap.putIfAbsent(endDate, () => []).add(a);
        }
      }
    }

    final selectedDate = _selectedDay ?? _focusedDay;
    final selectedDateOnly = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
    );
    final selectedEvents = eventsMap[selectedDateOnly] ?? [];

    return Column(
      children: [
        TableCalendar<AktivitasModel>(
          firstDay: DateTime.now().subtract(const Duration(days: 365)),
          lastDay: DateTime.now().add(const Duration(days: 365)),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
          },
          eventLoader: (day) {
            final dateOnly = DateTime(day.year, day.month, day.day);
            return eventsMap[dateOnly] ?? [];
          },
          calendarStyle: CalendarStyle(
            todayDecoration: BoxDecoration(
              color: AppColors.primary.withAlpha(50),
              shape: BoxShape.circle,
            ),
            selectedDecoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            markerDecoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
          ),
          headerStyle: const HeaderStyle(
            formatButtonVisible: false,
            titleCentered: true,
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: selectedEvents.isEmpty
              ? const EmptyState(
                  emoji: '📅',
                  title: 'Tidak ada aktivitas',
                  subtitle: 'Pilih tanggal lain',
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  itemCount: selectedEvents.length,
                  itemBuilder: (context, index) {
                    final a = selectedEvents[index];
                    return _TimelineItem(
                      aktivitas: a,
                      isLast: index == selectedEvents.length - 1,
                      onTap: () => context.push('/aktivitas/detail/${a.id}'),
                      onMarkComplete: a.isBerjalan
                          ? () => _markComplete(a.id)
                          : null,
                    );
                  },
                ),
        ),
      ],
    );
  }

  int _buildItemCount(Map<String, List<AktivitasModel>> grouped) {
    int count = 0;
    for (final entry in grouped.entries) {
      count++; // month header
      count += entry.value.length; // items
    }
    return count;
  }

  Widget _buildItem(
    BuildContext context,
    int index,
    Map<String, List<AktivitasModel>> grouped,
  ) {
    int current = 0;
    for (final entry in grouped.entries) {
      if (index == current) {
        return _MonthHeader(month: entry.key);
      }
      current++;
      for (int i = 0; i < entry.value.length; i++) {
        if (index == current) {
          final a = entry.value[i];
          return _TimelineItem(
            aktivitas: a,
            isLast: i == entry.value.length - 1,
            onTap: () => context.push('/aktivitas/detail/${a.id}'),
            onMarkComplete: a.isBerjalan ? () => _markComplete(a.id) : null,
          );
        }
        current++;
      }
    }
    return const SizedBox.shrink();
  }

  Future<void> _markComplete(String id) async {
    final success = await ref.read(aktivitasProvider.notifier).markComplete(id);
    if (mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Aktivitas ditandai selesai'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  static String _monthKey(DateTime date) {
    const months = [
      '',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return '${months[date.month]} ${date.year}';
  }
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({required this.month});
  final String month;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Text(
        month,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  const _TimelineItem({
    required this.aktivitas,
    this.isLast = false,
    this.onTap,
    this.onMarkComplete,
  });
  final AktivitasModel aktivitas;
  final bool isLast;
  final VoidCallback? onTap;
  final VoidCallback? onMarkComplete;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: aktivitas.isBerjalan
                        ? AppColors.accent
                        : AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: aktivitas.isBerjalan
                          ? AppColors.accent.withAlpha(60)
                          : AppColors.primary.withAlpha(60),
                      width: 3,
                    ),
                  ),
                ),
                if (!isLast)
                  Container(width: 2, height: 60, color: AppColors.border),
              ],
            ),
          ),
          // Content card
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: aktivitas.isBerjalan
                      ? AppColors.accent.withAlpha(50)
                      : AppColors.border,
                ),
              ),
              child: InkWell(
                onTap: onTap,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            aktivitas.type.emoji,
                            style: const TextStyle(fontSize: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      aktivitas.type.label,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: aktivitas.isBerjalan
                                            ? AppColors.accent.withAlpha(15)
                                            : AppColors.primary.withAlpha(15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        aktivitas.statusLabel,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: aktivitas.isBerjalan
                                              ? AppColors.accent
                                              : AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
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
                          Text(
                            DateFormat(
                              'd MMM',
                              'id',
                            ).format(aktivitas.tanggalMulai),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                      ),
                      // Quick "Tandai Selesai" for running activities
                      if (aktivitas.isBerjalan && onMarkComplete != null) ...[
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          height: 36,
                          child: OutlinedButton.icon(
                            onPressed: onMarkComplete,
                            icon: const Icon(
                              Icons.check_circle_rounded,
                              size: 16,
                            ),
                            label: const Text('Tandai Selesai'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              side: const BorderSide(
                                color: AppColors.primary,
                                width: 1,
                              ),
                              textStyle: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                              padding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
