import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/region_model.dart';
import '../services/region_service.dart';

/// List of all kabupaten/kota in Jawa Timur.
final kabupatenListProvider = FutureProvider<List<KabupatenEntry>>((ref) {
  return RegionService.instance.getKabupatenList();
});

/// Full detail (kecamatan + desa) for a selected kabupaten.
final kabupatenDetailProvider =
    FutureProvider.family<KabupatenDetail?, String>((ref, kabupatenId) {
  if (kabupatenId.isEmpty) return Future.value(null);
  return RegionService.instance.getKabupatenDetail(kabupatenId);
});
