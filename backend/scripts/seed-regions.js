#!/usr/bin/env node
/**
 * Downloads East Java (Jawa Timur) administrative region data from the
 * emsifa public API and uploads it to Firestore.
 *
 * Firestore structure:
 *   /regions/_index          — list of all 38 kabupaten/kota (lightweight)
 *   /regions/{kab_id}        — one doc per kabupaten, contains all kecamatan+desa
 *
 * Run once (or when region data needs updating):
 *   node seed-regions.js
 */

const https = require("https");
const path = require("path");
const fs = require("fs");

// Uses firebase-admin from the functions directory
const admin = require("../functions/node_modules/firebase-admin");

const PROJECT_ID = "petatani";
const PROVINCE_ID = "35"; // Jawa Timur
const BASE_API = "https://www.emsifa.com/api-wilayah-indonesia/api";
const CONCURRENCY = 8; // parallel district/village fetches
const SA_PATH = path.join(__dirname, "service-account.json");

if (!fs.existsSync(SA_PATH)) {
  console.error("\nError: service-account.json tidak ditemukan.");
  console.error("Download dari Firebase Console:");
  console.error("  Project Settings → Service Accounts → Generate new private key");
  console.error(`  Simpan sebagai: ${SA_PATH}\n`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });
const db = admin.firestore();

// ─── HTTP helpers ─────────────────────────────────────────

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`JSON parse error for ${url}: ${raw.slice(0, 80)}`));
        }
      });
    }).on("error", reject);
  });
}

/** Run async tasks with max concurrency. */
async function pool(items, fn, limit) {
  const results = [];
  let i = 0;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}


// ─── Name normalizer ──────────────────────────────────────

/** "KABUPATEN MALANG" → "Kabupaten Malang" */
function titleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bUi\b/g, "UI") // edge cases
    .trim();
}

function normalizeKabupaten(raw) {
  const name = titleCase(raw);
  const isKota = raw.toUpperCase().startsWith("KOTA");
  return { nama: name, tipe: isKota ? "kota" : "kabupaten" };
}

// ─── Main ─────────────────────────────────────────────────

const CACHE_FILE = path.join(__dirname, ".regions-cache.json");

async function main() {
  console.log("\n=== Peta Tani — Seed Region Data (Jawa Timur) ===\n");

  let regencies, byKabupaten, allDistricts;

  // Use cache if available (avoids re-downloading after token expiry)
  if (fs.existsSync(CACHE_FILE)) {
    console.log("Cache ditemukan — skip download, langsung upload.\n");
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    regencies = cache.regencies;
    byKabupaten = cache.byKabupaten;
    allDistricts = cache.allDistricts;
  } else {
    // 1. Fetch all kabupaten/kota in Jawa Timur
    console.log("Fetching kabupaten/kota...");
    regencies = await get(`${BASE_API}/regencies/${PROVINCE_ID}.json`);
    console.log(`  Found ${regencies.length} kabupaten/kota`);

    // 2. Fetch all kecamatan for each kabupaten (concurrent)
    console.log("Fetching kecamatan (concurrent)...");
    let done = 0;
    const withDistricts = await pool(regencies, async (reg) => {
      const districts = await get(`${BASE_API}/districts/${reg.id}.json`);
      done++;
      process.stdout.write(`  [${done}/${regencies.length}] ${titleCase(reg.name)} — ${districts.length} kecamatan\n`);
      return { ...reg, districts };
    }, CONCURRENCY);

    // 3. Fetch all desa for each kecamatan (concurrent)
    console.log("\nFetching desa/kelurahan (this takes ~2 minutes)...");
    allDistricts = withDistricts.flatMap((r) =>
      r.districts.map((d) => ({ ...d, regency: r }))
    );
    done = 0;
    const withVillages = await pool(allDistricts, async (dist) => {
      let villages = [];
      try {
        villages = await get(`${BASE_API}/villages/${dist.id}.json`);
        if (!Array.isArray(villages)) villages = [];
      } catch {
        process.stdout.write(`  ⚠  skip ${dist.id} (${titleCase(dist.name)}) — tidak ada data desa\n`);
      }
      done++;
      if (done % 50 === 0 || done === allDistricts.length) {
        process.stdout.write(`  ${done}/${allDistricts.length} kecamatan selesai\n`);
      }
      return { ...dist, villages };
    }, CONCURRENCY);

    // 4. Group back by kabupaten
    byKabupaten = {};
    for (const r of regencies) {
      byKabupaten[r.id] = { ...r, kecamatanList: [] };
    }
    for (const d of withVillages) {
      byKabupaten[d.regency.id].kecamatanList.push(d);
    }

    // Save cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ regencies, byKabupaten, allDistricts }));
    console.log("  Cache disimpan.\n");
  }

  // 5. Build Firestore docs and upload
  console.log("\nUploading ke Firestore...");
  const indexEntries = [];

  let done = 0;
  for (const reg of regencies) {
    const kab = byKabupaten[reg.id];
    const { nama, tipe } = normalizeKabupaten(reg.name);

    const kecamatanArr = kab.kecamatanList.map((d) => ({
      id: d.id,
      nama: titleCase(d.name),
      desa: d.villages.map((v) => ({
        id: v.id,
        nama: titleCase(v.name),
      })),
    }));

    const jumlah_desa = kecamatanArr.reduce((s, k) => s + k.desa.length, 0);

    await db.collection("regions").doc(reg.id).set({
      id: reg.id,
      nama,
      tipe,
      provinsi: "Jawa Timur",
      jumlah_kecamatan: kecamatanArr.length,
      jumlah_desa,
      kecamatan: kecamatanArr,
    });

    done++;
    process.stdout.write(`  [${done}/${regencies.length}] ${nama} — ${kecamatanArr.length} kecamatan, ${jumlah_desa} desa\n`);

    indexEntries.push({ id: reg.id, nama, tipe, jumlah_kecamatan: kecamatanArr.length, jumlah_desa });
  }

  // 6. Upload index doc
  const totalDesa = indexEntries.reduce((s, e) => s + e.jumlah_desa, 0);
  await db.collection("regions").doc("_index").set({
    provinsi: "Jawa Timur",
    province_id: PROVINCE_ID,
    total_kabupaten: indexEntries.length,
    total_desa: totalDesa,
    kabupaten: indexEntries,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 7. Clean up cache
  if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);

  console.log("\n========================================");
  console.log("  Region data berhasil diupload!");
  console.log("========================================");
  console.log(`  Provinsi  : Jawa Timur`);
  console.log(`  Kabupaten : ${indexEntries.length}`);
  console.log(`  Kecamatan : ${allDistricts.length}`);
  console.log(`  Desa/Kel  : ${totalDesa}`);
  console.log(`\n  Firestore: /regions/_index + /regions/{kab_id}`);
  console.log("========================================\n");
}

main().catch((e) => {
  console.error("\nError:", e.message);
  process.exit(1);
});
