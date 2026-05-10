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
    // Alat
    this.alatYangDigunakan,
    this.kebutuhanBahanBakar,
    this.biayaBahanBakar,
    this.jumlahAlatUnit,
    // Saprodi
    this.jenisSaprodi,
    this.jumlahSaprodi,
    this.satuanSaprodi,
    this.biayaSaprodi,
    // HOK
    this.jumlahTenagaKerja,
    this.biayaHok,
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

  // ─── Alat yang digunakan ──────────────────────────────
  final String? alatYangDigunakan;
  final double? kebutuhanBahanBakar; // liter (traktor/transplanter/combine)
  final double? biayaBahanBakar;     // Rupiah
  final double? jumlahAlatUnit;      // unit (sprayer/drone)

  // ─── Kebutuhan saprodi ────────────────────────────────
  final String? jenisSaprodi;  // benih/pupuk/pestisida/herbisida
  final double? jumlahSaprodi;
  final String? satuanSaprodi; // kg / botol / liter
  final double? biayaSaprodi;  // Rupiah

  // ─── Tenaga kerja HOK ────────────────────────────────
  final double? jumlahTenagaKerja; // orang
  final double? biayaHok;          // Rupiah

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
      alatYangDigunakan: map['alatYangDigunakan'] as String?,
      kebutuhanBahanBakar: (map['kebutuhanBahanBakar'] as num?)?.toDouble(),
      biayaBahanBakar: (map['biayaBahanBakar'] as num?)?.toDouble(),
      jumlahAlatUnit: (map['jumlahAlatUnit'] as num?)?.toDouble(),
      jenisSaprodi: map['jenisSaprodi'] as String?,
      jumlahSaprodi: (map['jumlahSaprodi'] as num?)?.toDouble(),
      satuanSaprodi: map['satuanSaprodi'] as String?,
      biayaSaprodi: (map['biayaSaprodi'] as num?)?.toDouble(),
      jumlahTenagaKerja: (map['jumlahTenagaKerja'] as num?)?.toDouble(),
      biayaHok: (map['biayaHok'] as num?)?.toDouble(),
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
      'alatYangDigunakan': alatYangDigunakan,
      'kebutuhanBahanBakar': kebutuhanBahanBakar,
      'biayaBahanBakar': biayaBahanBakar,
      'jumlahAlatUnit': jumlahAlatUnit,
      'jenisSaprodi': jenisSaprodi,
      'jumlahSaprodi': jumlahSaprodi,
      'satuanSaprodi': satuanSaprodi,
      'biayaSaprodi': biayaSaprodi,
      'jumlahTenagaKerja': jumlahTenagaKerja,
      'biayaHok': biayaHok,
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
    String? alatYangDigunakan,
    double? kebutuhanBahanBakar,
    double? biayaBahanBakar,
    double? jumlahAlatUnit,
    String? jenisSaprodi,
    double? jumlahSaprodi,
    String? satuanSaprodi,
    double? biayaSaprodi,
    double? jumlahTenagaKerja,
    double? biayaHok,
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
      alatYangDigunakan: alatYangDigunakan ?? this.alatYangDigunakan,
      kebutuhanBahanBakar: kebutuhanBahanBakar ?? this.kebutuhanBahanBakar,
      biayaBahanBakar: biayaBahanBakar ?? this.biayaBahanBakar,
      jumlahAlatUnit: jumlahAlatUnit ?? this.jumlahAlatUnit,
      jenisSaprodi: jenisSaprodi ?? this.jenisSaprodi,
      jumlahSaprodi: jumlahSaprodi ?? this.jumlahSaprodi,
      satuanSaprodi: satuanSaprodi ?? this.satuanSaprodi,
      biayaSaprodi: biayaSaprodi ?? this.biayaSaprodi,
      jumlahTenagaKerja: jumlahTenagaKerja ?? this.jumlahTenagaKerja,
      biayaHok: biayaHok ?? this.biayaHok,
    );
  }
}
