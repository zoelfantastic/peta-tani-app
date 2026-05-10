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
    this.jenisLahan = 'Sawah',
    this.latitude,
    this.longitude,
    this.createdAt,
  });

  final String id;
  final String userId;
  final String name;
  final String tanaman;
  final double luas;
  final String satuanLuas;
  final String emoji;
  final String jenisLahan;
  final double? latitude;
  final double? longitude;
  final DateTime? createdAt;

  bool get hasLocation => latitude != null && longitude != null;

  String get locationDisplay {
    if (!hasLocation) return '';
    final lat = latitude!.toStringAsFixed(6);
    final lng = longitude!.toStringAsFixed(6);
    return '$lat, $lng';
  }

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
      jenisLahan: map['jenisLahan'] as String? ?? 'Sawah',
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
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
      'jenisLahan': jenisLahan,
      'latitude': latitude,
      'longitude': longitude,
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
    String? jenisLahan,
    double? latitude,
    double? longitude,
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
      jenisLahan: jenisLahan ?? this.jenisLahan,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Display string for luas, e.g. "2 Ha"
  String get luasDisplay =>
      '${luas % 1 == 0 ? luas.toInt() : luas} $satuanLuas';
}

/// Jenis lahan options with emoji.
const jenisLahanOptions = <String, String>{
  'Sawah': '🌾',
  'Kebun': '🌳',
  'Pekarangan': '🏡',
  'Hutan': '🌲',
};

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
