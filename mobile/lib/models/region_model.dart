/// Represents a desa/kelurahan within a kecamatan.
class DesaModel {
  const DesaModel({required this.id, required this.nama});
  final String id;
  final String nama;

  factory DesaModel.fromMap(Map<String, dynamic> m) =>
      DesaModel(id: m['id'] as String, nama: m['nama'] as String);
}

/// Represents a kecamatan with its list of desa.
class KecamatanModel {
  const KecamatanModel({
    required this.id,
    required this.nama,
    required this.desa,
  });
  final String id;
  final String nama;
  final List<DesaModel> desa;

  factory KecamatanModel.fromMap(Map<String, dynamic> m) => KecamatanModel(
        id: m['id'] as String,
        nama: m['nama'] as String,
        desa: (m['desa'] as List<dynamic>? ?? [])
            .map((d) => DesaModel.fromMap(d as Map<String, dynamic>))
            .toList(),
      );
}

/// Lightweight kabupaten entry from the _index document.
class KabupatenEntry {
  const KabupatenEntry({
    required this.id,
    required this.nama,
    required this.tipe,
  });
  final String id;
  final String nama;
  final String tipe; // "kabupaten" | "kota"

  factory KabupatenEntry.fromMap(Map<String, dynamic> m) => KabupatenEntry(
        id: m['id'] as String,
        nama: m['nama'] as String,
        tipe: m['tipe'] as String? ?? 'kabupaten',
      );
}

/// Full kabupaten document with all kecamatan + desa.
class KabupatenDetail {
  const KabupatenDetail({
    required this.id,
    required this.nama,
    required this.tipe,
    required this.kecamatan,
  });
  final String id;
  final String nama;
  final String tipe;
  final List<KecamatanModel> kecamatan;

  factory KabupatenDetail.fromMap(Map<String, dynamic> m) => KabupatenDetail(
        id: m['id'] as String,
        nama: m['nama'] as String,
        tipe: m['tipe'] as String? ?? 'kabupaten',
        kecamatan: (m['kecamatan'] as List<dynamic>? ?? [])
            .map((k) => KecamatanModel.fromMap(k as Map<String, dynamic>))
            .toList(),
      );
}
