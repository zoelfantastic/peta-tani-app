/// User data model for Peta Tani.
/// Maps to the 'users' collection in Firestore.
class UserModel {
  const UserModel({
    required this.uid,
    required this.phoneNumber,
    this.name,
    this.photoUrl,
    this.createdAt,
    this.isProfileComplete = false,
    this.namaKelompokTani,
    this.kabupaten,
    this.kecamatan,
    this.desa,
  });

  final String uid;
  final String phoneNumber;
  final String? name;
  final String? photoUrl;
  final DateTime? createdAt;
  final bool isProfileComplete;
  final String? namaKelompokTani;
  final String? kabupaten;
  final String? kecamatan;
  final String? desa;

  factory UserModel.fromMap(Map<String, dynamic> map, String uid) {
    return UserModel(
      uid: uid,
      phoneNumber: map['phoneNumber'] as String? ?? '',
      name: map['name'] as String?,
      photoUrl: map['photoUrl'] as String?,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'] as String)
          : null,
      isProfileComplete: map['isProfileComplete'] as bool? ?? false,
      namaKelompokTani: map['nama_kelompok_tani'] as String?,
      kabupaten: map['kabupaten'] as String?,
      kecamatan: map['kecamatan'] as String?,
      desa: map['desa'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'phoneNumber': phoneNumber,
      'name': name,
      'photoUrl': photoUrl,
      'createdAt': createdAt?.toIso8601String(),
      'isProfileComplete': isProfileComplete,
      'nama_kelompok_tani': namaKelompokTani,
      'kabupaten': kabupaten,
      'kecamatan': kecamatan,
      'desa': desa,
    };
  }

  UserModel copyWith({
    String? uid,
    String? phoneNumber,
    String? name,
    String? photoUrl,
    DateTime? createdAt,
    bool? isProfileComplete,
    String? namaKelompokTani,
    String? kabupaten,
    String? kecamatan,
    String? desa,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      name: name ?? this.name,
      photoUrl: photoUrl ?? this.photoUrl,
      createdAt: createdAt ?? this.createdAt,
      isProfileComplete: isProfileComplete ?? this.isProfileComplete,
      namaKelompokTani: namaKelompokTani ?? this.namaKelompokTani,
      kabupaten: kabupaten ?? this.kabupaten,
      kecamatan: kecamatan ?? this.kecamatan,
      desa: desa ?? this.desa,
    );
  }
}
