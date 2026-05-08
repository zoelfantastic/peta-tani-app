import '../core/constants/activity_types.dart';

/// Aktivitas (farming activity) data model for Peta Tani.
/// Maps to the 'aktivitas' collection in Firestore.
///
/// Status logic:
/// - tanggalSelesai == null → "Berjalan" (in progress)
/// - tanggalSelesai != null → "Selesai" (completed)
class AktivitasModel {
  const AktivitasModel({
    required this.id,
    required this.userId,
    required this.lahanId,
    required this.lahanName,
    required this.type,
    required this.tanggalMulai,
    this.tanggalSelesai,
    this.catatan,
    this.jumlah,
    this.satuan,
    this.createdAt,
  });

  final String id;
  final String userId;
  final String lahanId;
  final String lahanName;
  final ActivityType type;
  final DateTime tanggalMulai;
  final DateTime? tanggalSelesai;
  final String? catatan;
  final double? jumlah;
  final String? satuan;
  final DateTime? createdAt;

  /// Whether this activity is still in progress (no completion date).
  bool get isBerjalan => tanggalSelesai == null;

  /// Whether this activity is completed.
  bool get isSelesai => tanggalSelesai != null;

  /// Display status string.
  String get statusLabel => isBerjalan ? 'Berjalan' : 'Selesai';

  /// Create from Firestore document map.
  factory AktivitasModel.fromMap(Map<String, dynamic> map, String id) {
    return AktivitasModel(
      id: id,
      userId: map['userId'] as String? ?? '',
      lahanId: map['lahanId'] as String? ?? '',
      lahanName: map['lahanName'] as String? ?? '',
      type: ActivityType.values.firstWhere(
        (t) => t.name == map['type'],
        orElse: () => ActivityType.olahTanah,
      ),
      tanggalMulai:
          DateTime.tryParse(map['tanggalMulai'] as String? ?? '') ??
          DateTime.now(),
      tanggalSelesai: map['tanggalSelesai'] != null
          ? DateTime.tryParse(map['tanggalSelesai'] as String)
          : null,
      catatan: map['catatan'] as String?,
      jumlah: (map['jumlah'] as num?)?.toDouble(),
      satuan: map['satuan'] as String?,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  /// Convert to Firestore document map.
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'lahanId': lahanId,
      'lahanName': lahanName,
      'type': type.name,
      'tanggalMulai': tanggalMulai.toIso8601String(),
      'tanggalSelesai': tanggalSelesai?.toIso8601String(),
      'catatan': catatan,
      'jumlah': jumlah,
      'satuan': satuan,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  AktivitasModel copyWith({
    String? id,
    String? userId,
    String? lahanId,
    String? lahanName,
    ActivityType? type,
    DateTime? tanggalMulai,
    DateTime? tanggalSelesai,
    String? catatan,
    double? jumlah,
    String? satuan,
    DateTime? createdAt,
  }) {
    return AktivitasModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      lahanId: lahanId ?? this.lahanId,
      lahanName: lahanName ?? this.lahanName,
      type: type ?? this.type,
      tanggalMulai: tanggalMulai ?? this.tanggalMulai,
      tanggalSelesai: tanggalSelesai ?? this.tanggalSelesai,
      catatan: catatan ?? this.catatan,
      jumlah: jumlah ?? this.jumlah,
      satuan: satuan ?? this.satuan,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
