#!/usr/bin/env node
/**
 * Creates a Firebase Auth user and marks them as admin in Firestore.
 * Uses credentials already cached by Firebase CLI — no service account needed.
 *
 * Usage:
 *   node create-admin.js <email> <password> [displayName]
 *
 * Example:
 *   node create-admin.js admin@petatani.id "MyP@ss123" "Admin"
 */

const https = require("https");
const os = require("os");
const path = require("path");
const fs = require("fs");

const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

if (!WEB_API_KEY || !PROJECT_ID) {
  console.error("Error: FIREBASE_WEB_API_KEY dan FIREBASE_PROJECT_ID harus di-set.");
  console.error("  Prod : FIREBASE_PROJECT_ID=petatani FIREBASE_WEB_API_KEY=<key> node create-admin.js ...");
  console.error("  Dev  : FIREBASE_PROJECT_ID=petatani-dev FIREBASE_WEB_API_KEY=<key> node create-admin.js ...");
  process.exit(1);
}

// ─── Args ─────────────────────────────────────────────────
const [, , email, password, displayName = "Admin"] = process.argv;
if (!email || !password) {
  console.error("Usage: node create-admin.js <email> <password> [displayName]");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────
function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function patch(url, body, accessToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Authorization: `Bearer ${accessToken}`,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Read OAuth access token cached by Firebase CLI
function getFirebaseCliToken() {
  const configPath = path.join(
    os.homedir(),
    ".config",
    "configstore",
    "firebase-tools.json"
  );
  if (!fs.existsSync(configPath)) {
    throw new Error("Firebase CLI config not found. Run: firebase login");
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const token = config?.tokens?.access_token;
  if (!token) throw new Error("No access token in Firebase CLI config. Run: firebase login");
  return token;
}

// Refresh the access token if expired using the stored refresh token
async function refreshTokenIfNeeded(accessToken) {
  // Quick check — try a trivial API call
  const testRes = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "www.googleapis.com",
        path: "/oauth2/v1/tokeninfo?access_token=" + encodeURIComponent(accessToken),
        method: "GET",
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on("error", reject);
    req.end();
  });

  if (testRes.status === 200 && testRes.body.expires_in > 60) {
    return accessToken; // still valid
  }

  // Refresh using stored refresh token
  const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const refreshToken = config?.tokens?.refresh_token;
  if (!refreshToken) throw new Error("Refresh token not found. Run: firebase login");

  const refreshRes = await post(
    "https://oauth2.googleapis.com/token",
    {
      client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
      client_secret: "j9iVZfS8nnY63tMqdJ9_LjTi",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }
  );

  if (refreshRes.status !== 200) {
    throw new Error(`Token refresh failed: ${JSON.stringify(refreshRes.body)}`);
  }

  // Save refreshed token back
  config.tokens.access_token = refreshRes.body.access_token;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return refreshRes.body.access_token;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log(`\nCreating admin account for: ${email}\n`);

  // Step 1: Create Firebase Auth user via client REST API
  console.log("1. Creating Firebase Auth user...");
  const signUpRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${WEB_API_KEY}`,
    { email, password, displayName, returnSecureToken: true }
  );

  if (signUpRes.status !== 200) {
    const err = signUpRes.body?.error;
    if (err?.message === "EMAIL_EXISTS") {
      console.log("   ⚠  User already exists — fetching UID...");

      // Sign in to get UID
      const signInRes = await post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${WEB_API_KEY}`,
        { email, password, returnSecureToken: true }
      );
      if (signInRes.status !== 200) {
        console.error("   ✗ Failed to sign in:", signInRes.body?.error?.message);
        process.exit(1);
      }
      signUpRes.body = signInRes.body;
    } else {
      console.error("   ✗ Failed:", err?.message ?? JSON.stringify(signUpRes.body));
      process.exit(1);
    }
  }

  const uid = signUpRes.body.localId;
  console.log(`   ✓ UID: ${uid}`);

  // Step 2: Set displayName if newly created
  if (signUpRes.body.displayName !== displayName) {
    await post(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${WEB_API_KEY}`,
      { idToken: signUpRes.body.idToken, displayName, returnSecureToken: false }
    );
  }

  // Step 3: Create /admins/{uid} in Firestore using Firebase CLI OAuth token
  console.log("2. Writing admin record to Firestore...");
  let accessToken = getFirebaseCliToken();
  accessToken = await refreshTokenIfNeeded(accessToken);

  const firestoreUrl =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`;

  const firestoreRes = await patch(firestoreUrl, {
    fields: {
      email: { stringValue: email },
      display_name: { stringValue: displayName },
      created_at: { timestampValue: new Date().toISOString() },
    },
  }, accessToken);

  if (firestoreRes.status !== 200) {
    console.error("   ✗ Firestore write failed:", JSON.stringify(firestoreRes.body, null, 2));
    process.exit(1);
  }

  console.log("   ✓ /admins/" + uid + " created");

  // ─── Summary ─────────────────────────────────────────────
  console.log("\n========================================");
  console.log("  Admin account ready!");
  console.log("========================================");
  console.log("  Email   :", email);
  console.log("  Password:", password);
  console.log("  UID     :", uid);
  console.log("========================================");
  console.log("\nLogin di: http://localhost:3000/login");
  console.log("(atau domain production setelah deploy web)\n");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
