// Web mode (<body data-mode="web">): content built by build_web.py is AES-GCM encrypted; the
// user's password unwraps the content key. Ratings go to the Apps Script in web/apps_script.gs.
const PBKDF2_ITERATIONS = 600000; // must match build_web.py
const IV_BYTES = 12;
const LOGIN_FAILED = "Unknown username or wrong password.";

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
  const { key, token } = JSON.parse(new TextDecoder().decode(secret));
  return { contentKey: await crypto.subtle.importKey("raw", fromBase64(key), "AES-GCM", false, ["decrypt"]), token };
}

async function callScript(search, request) {
  // Apps Script always answers HTTP 200; failures come back as {ok: false, error}.
  const response = await fetch(`${document.body.dataset.ratingsUrl}${search}`, request);
  if (!response.ok) throw new Error(`ratings server HTTP ${response.status}`);
  const body = await response.json();
  if (!body.ok) throw new Error(body.error);
  return body;
}

async function loadWeb(username, password, report) {
  report("Unlocking…");
  const { contentKey, token } = await unlock(username, password);
  const pairs = JSON.parse(new TextDecoder().decode(await decrypt(contentKey, await fetchBytes("data.enc"))));
  const videoUrls = {};
  const videoPaths = [...new Set(pairs.map((pair) => pair.video))];
  for (const [position, path] of videoPaths.entries()) {
    report(`Loading clip ${position + 1} / ${videoPaths.length}…`);
    const video = await decrypt(contentKey, await fetchBytes(path));
    videoUrls[path] = URL.createObjectURL(new Blob([video], { type: "video/mp4" }));
  }
  report("Loading saved ratings…");
  const { ratings } = await callScript(`?${new URLSearchParams({ rater: username, token })}`, { method: "GET" });
  return {
    pairs: pairs.map((pair) => ({ ...pair, video: videoUrls[pair.video] })),
    ratings,
    // text/plain body: a "simple" request, so the browser skips the CORS preflight Apps Script can't answer
    postRating: (record) => callScript("", { method: "POST", body: JSON.stringify({ rater: username, token, record }) }),
  };
}
