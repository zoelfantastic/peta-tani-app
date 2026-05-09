import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/region_model.dart';

/// Fetches region data from Firestore /regions collection.
///
/// Firestore SDK caches documents locally — subsequent calls return
/// cached data instantly without a network round-trip.
class RegionService {
  RegionService._();
  static final instance = RegionService._();

  final _db = FirebaseFirestore.instance;

  /// Returns all kabupaten/kota in Jawa Timur (from the _index document).
  /// Cached by Firestore SDK after first fetch.
  Future<List<KabupatenEntry>> getKabupatenList() async {
    final doc = await _db.collection('regions').doc('_index').get();
    final data = doc.data();
    if (data == null) return [];
    return (data['kabupaten'] as List<dynamic>)
        .map((k) => KabupatenEntry.fromMap(k as Map<String, dynamic>))
        .toList();
  }

  /// Returns full kecamatan + desa detail for a kabupaten.
  /// Cached by Firestore SDK — only network on first call per kabupaten.
  Future<KabupatenDetail?> getKabupatenDetail(String kabupatenId) async {
    final doc = await _db.collection('regions').doc(kabupatenId).get();
    if (!doc.exists || doc.data() == null) return null;
    return KabupatenDetail.fromMap(doc.data()!);
  }
}
