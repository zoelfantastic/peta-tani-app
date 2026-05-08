#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Test semua Firebase Cloud Functions via emulator HTTP endpoint
# Jalankan saat emulator sudah aktif: firebase emulators:start --only functions,firestore
# ---------------------------------------------------------------------------

BASE="http://127.0.0.1:5001/petatani/us-central1"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# call <name> <fn> <payload> [token] [expected_status]
# expected_status: "result" (default) or an error status like "UNAUTHENTICATED"
call() {
  local name="$1"
  local fn="$2"
  local payload="$3"
  local token="$4"
  local expected="${5:-result}"

  response=$(curl -s -X POST "$BASE/$fn" \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -d "{\"data\": $payload}")

  if [ "$expected" = "result" ]; then
    if echo "$response" | grep -q '"result"'; then
      echo -e "${GREEN}✓ PASS${NC} $name"
      ((PASS++))
    else
      echo -e "${RED}✗ FAIL${NC} $name — expected result, got: ${response:0:120}"
      ((FAIL++))
    fi
  else
    # Expect a specific error status
    if echo "$response" | grep -q "\"$expected\""; then
      echo -e "${GREEN}✓ PASS${NC} $name"
      ((PASS++))
    elif echo "$response" | grep -q '"error"'; then
      actual=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1)
      echo -e "${RED}✗ FAIL${NC} $name — expected $expected, got $actual"
      ((FAIL++))
    else
      echo -e "${YELLOW}? WARN${NC} $name — unexpected response: ${response:0:120}"
      ((FAIL++))
    fi
  fi
}

echo ""
echo "========================================"
echo " Peta Tani — Function Smoke Tests"
echo " Target: $BASE"
echo "========================================"
echo ""

# ─── Auth ─────────────────────────────────────────────────────────────────
echo "[ Auth ]"

call "setupProfil — unauthenticated returns error" \
  "setupProfil" '{"nama":"Pak Test"}' "" "UNAUTHENTICATED"

# ─── Lahan ────────────────────────────────────────────────────────────────
echo ""
echo "[ Lahan ]"

call "tambahLahan — unauthenticated returns error" \
  "tambahLahan" '{"nama":"Sawah A","jenis_tanaman":"Padi"}' "" "UNAUTHENTICATED"

call "getLahanList — unauthenticated returns error" \
  "getLahanList" '{}' "" "UNAUTHENTICATED"

call "getDetailLahan — unauthenticated returns error" \
  "getDetailLahan" '{}' "" "UNAUTHENTICATED"

# ─── Aktivitas ────────────────────────────────────────────────────────────
echo ""
echo "[ Aktivitas ]"

call "catatAktivitas — unauthenticated returns error" \
  "catatAktivitas" '{"lahan_id":"x","jenis":"pupuk","tanggal":"2026-05-08"}' "" "UNAUTHENTICATED"

call "getRiwayat — unauthenticated returns error" \
  "getRiwayat" '{}' "" "UNAUTHENTICATED"

# ─── Beranda ──────────────────────────────────────────────────────────────
echo ""
echo "[ Beranda ]"

call "getBerandaData — unauthenticated returns error" \
  "getBerandaData" '{}' "" "UNAUTHENTICATED"

# ─── Admin ────────────────────────────────────────────────────────────────
echo ""
echo "[ Admin ]"

call "getDashboardKpi — unauthenticated returns error" \
  "getDashboardKpi" '{}' "" "UNAUTHENTICATED"

call "getDaftarPetani — unauthenticated returns error" \
  "getDaftarPetani" '{}' "" "UNAUTHENTICATED"

call "getAnalitik — unauthenticated returns error" \
  "getAnalitik" '{"days":30}' "" "UNAUTHENTICATED"

call "generateLaporan — unauthenticated returns error" \
  "generateLaporan" '{}' "" "UNAUTHENTICATED"

# ─── Reminders ────────────────────────────────────────────────────────────
echo ""
echo "[ Reminders ]"

call "tambahReminder — unauthenticated returns error" \
  "tambahReminder" '{"lahan_id":"x","tanggal":"2026-05-08","jenis":"pupuk"}' "" "UNAUTHENTICATED"

call "selesaikanReminder — unauthenticated returns error" \
  "selesaikanReminder" '{"id":"abc"}' "" "UNAUTHENTICATED"

# ─── Summary ──────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo -e " PASS: ${GREEN}$PASS${NC}  FAIL: ${RED}$FAIL${NC}  TOTAL: $((PASS + FAIL))"
echo "========================================"

# Semua test di atas seharusnya PASS karena mengharapkan error "unauthenticated"
# dari function (bukan crash/500). Artinya function berjalan & routing benar.

if [ "$FAIL" -eq 0 ]; then
  echo -e "\n${GREEN}Semua functions merespons dengan benar.${NC}"
  exit 0
else
  echo -e "\n${RED}Ada $FAIL function yang tidak merespons dengan benar.${NC}"
  exit 1
fi
