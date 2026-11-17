// Web mode (<body data-mode="web">): text content built by build_web.py is AES-GCM encrypted; the
// user's password unwraps the content key. Ratings and signed video URLs come from web/backend/main.py.
const PBKDF2_ITERATIONS = 600000; // must match build_web.py
const IV_BYTES = 12;
const LOGIN_FAILED = "Unknown username or wrong password.";
const REQUEST_TIMEOUT_MS = 10000; // normal replies take ~1 s
const RETRY_DELAYS_MS = [1000, 3000]; // waits between the 3 attempts

function fromBase64(text) {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decrypt(key, bytes) {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, IV_BYTES) }, key, bytes.slice(IV_BYTES));
}

async function fetchBytes(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`could not load ${path} (HTTP ${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

async function unlock(username, password) {
  const users = JSON.parse(new TextDecoder().decode(await fetchBytes("users.json")));
  const entry = users[toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(username)))];
  if (!entry) throw new Error(LOGIN_FAILED);
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const wrapKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromBase64(entry.salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  let secret;
  try {
    secret = await decrypt(wrapKey, fromBase64(entry.wrapped));
  } catch {
    throw new Error(LOGIN_FAILED); // AES-GCM tag mismatch = wrong password
  }
  const { key, token, swaps } = JSON.parse(new TextDecoder().decode(secret));
  const contentKey = await crypto.subtle.importKey("raw", fromBase64(key), "AES-GCM", false, ["decrypt"]);
  return { contentKey, token, swaps };
}

class Rejected extends Error {} // the server answered with an error: retrying won't help

async function requestOnce(url, request) {
  let response;
  try {
    response = await fetch(url, { ...request, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new Error(err.name === "TimeoutError" ? "ratings server did not answer in time" : "could not reach ratings server");
  }
  if (response.status >= 500) throw new Error(`ratings server HTTP ${response.status}`);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`unreadable reply from ratings server (HTTP ${response.status})`);
  }
  if (!body.ok) throw new Rejected(body.error);
  return body;
}

async function callBackend(search, request) {
  // Retrying a save is safe: a duplicate is an identical revision and the latest one wins.
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestOnce(`${document.body.dataset.ratingsUrl}${search}`, request);
    } catch (err) {
      if (err instanceof Rejected || attempt === RETRY_DELAYS_MS.length) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}

async function loadWeb(username, password, report) {
  report("Unlocking…");
  const { contentKey, token, swaps } = await unlock(username, password);
  const pairs = JSON.parse(new TextDecoder().decode(await decrypt(contentKey, await fetchBytes("data.enc"))));
  const unbalanced = pairs.filter((pair) => typeof swaps[pair.pair_id] !== "boolean");
  if (unbalanced.length) throw new Error(`no A/B assignment for ${unbalanced.map((pair) => pair.pair_id)}; rebuild`);
  report("Loading saved ratings…");
  const { ratings, videos } = await callBackend(`?${new URLSearchParams({ rater: username, token })}`, { method: "GET" });
  const missing = pairs.filter((pair) => !videos[pair.video]);
  if (missing.length) throw new Error(`video not on server for ${missing.map((pair) => pair.pair_id)}`);
  return {
    pairs: pairs.map((pair) => ({ ...pair, video: videos[pair.video] })), // signed URLs; the browser streams them
    ratings,
    swaps, // balanced across users by build_web.py
    // text/plain body: a "simple" request, so the browser skips the CORS preflight
    postRating: (record) => callBackend("", { method: "POST", body: JSON.stringify({ rater: username, token, record }) }),
  };
}
