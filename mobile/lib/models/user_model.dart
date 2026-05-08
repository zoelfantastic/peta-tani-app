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
  });

  final String uid;
  final String phoneNumber;
  final String? name;
  final String? photoUrl;
  final DateTime? createdAt;
  final bool isProfileComplete;

  /// Create from Firestore document map.
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
    );
  }

  /// Convert to Firestore document map.
  Map<String, dynamic> toMap() {
    return {
      'phoneNumber': phoneNumber,
      'name': name,
      'photoUrl': photoUrl,
      'createdAt': createdAt?.toIso8601String(),
      'isProfileComplete': isProfileComplete,
    };
  }

  /// Create a copy with updated fields.
  UserModel copyWith({
    String? uid,
    String? phoneNumber,
    String? name,
    String? photoUrl,
    DateTime? createdAt,
    bool? isProfileComplete,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      name: name ?? this.name,
      photoUrl: photoUrl ?? this.photoUrl,
      createdAt: createdAt ?? this.createdAt,
      isProfileComplete: isProfileComplete ?? this.isProfileComplete,
    );
  }
}
