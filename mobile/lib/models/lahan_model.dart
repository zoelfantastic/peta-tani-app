/// Lahan (farm land) data model for Peta Tani.
/// Maps to the 'lahan' collection in Firestore.
class LahanModel {
  const LahanModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.tanaman,
    required this.luas,
    this.satuanLuas = 'Ha',
    this.emoji = '🌾',
    this.tanggalTanam,
    this.fase = 'Persiapan',
    this.progress = 0.0,
    this.createdAt,
  });

  final String id;
  final String userId;
  final String name;
  final String tanaman;
  final double luas;
  final String satuanLuas;
  final String emoji;
  final DateTime? tanggalTanam;
  final String fase;
  final double progress;
  final DateTime? createdAt;

  /// Create from Firestore document map.
  factory LahanModel.fromMap(Map<String, dynamic> map, String id) {
    return LahanModel(
      id: id,
      userId: map['userId'] as String? ?? '',
      name: map['name'] as String? ?? '',
      tanaman: map['tanaman'] as String? ?? '',
      luas: (map['luas'] as num?)?.toDouble() ?? 0,
      satuanLuas: map['satuanLuas'] as String? ?? 'Ha',
      emoji: map['emoji'] as String? ?? '🌾',
      tanggalTanam: map['tanggalTanam'] != null
          ? DateTime.tryParse(map['tanggalTanam'] as String)
          : null,
      fase: map['fase'] as String? ?? 'Persiapan',
      progress: (map['progress'] as num?)?.toDouble() ?? 0,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
    );
  }

  /// Convert to Firestore document map.
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'name': name,
      'tanaman': tanaman,
      'luas': luas,
      'satuanLuas': satuanLuas,
      'emoji': emoji,
      'tanggalTanam': tanggalTanam?.toIso8601String(),
      'fase': fase,
      'progress': progress,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  LahanModel copyWith({
    String? id,
    String? userId,
    String? name,
    String? tanaman,
    double? luas,
    String? satuanLuas,
    String? emoji,
    DateTime? tanggalTanam,
    String? fase,
    double? progress,
    DateTime? createdAt,
  }) {
    return LahanModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      tanaman: tanaman ?? this.tanaman,
      luas: luas ?? this.luas,
      satuanLuas: satuanLuas ?? this.satuanLuas,
      emoji: emoji ?? this.emoji,
      tanggalTanam: tanggalTanam ?? this.tanggalTanam,
      fase: fase ?? this.fase,
      progress: progress ?? this.progress,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Display string for luas, e.g. "2 Ha"
  String get luasDisplay =>
      '${luas % 1 == 0 ? luas.toInt() : luas} $satuanLuas';
}

/// Available crop emoji mappings for selection.
const cropEmojis = <String, String>{
  'Padi': '🌾',
  'Jagung': '🌽',
  'Kedelai': '🫘',
  'Cabai': '🌶️',
  'Tomat': '🍅',
  'Sayuran': '🥬',
  'Buah': '🍈',
  'Lainnya': '🌿',
};

/// Growth phase options.
const growthPhases = [
  'Persiapan',
  'Vegetatif',
  'Generatif',
  'Pematangan',
  'Panen',
];
