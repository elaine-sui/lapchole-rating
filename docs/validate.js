// Mirror of validate_rating in serve.py, checked against it by tests/test_validate_js.py.
// Runs before every save so a record the server would reject never leaves the page.
const RATING_RULES = {
  preferences: ["a_much", "a_slight", "tie", "b_slight", "b_much"],
  scores: [0, 1, 2],
  notApplicable: "na",
  activityItems: ["a1", "a2", "a3"],
  constructiveItems: ["b1", "b2", "b3", "b4", "b5", "b6", "b7"],
  reinforcementItems: ["c1", "c2", "c3", "c4"],
  severities: [0, 1, 2, 3],
  likelihoods: ["unlikely", "possible", "likely"],
  missingTags: ["step", "instrument", "action", "tissue", "event"],
  harmTypes: ["patient", "teaching", "learner"],
  sources: ["attending", "ai", "unsure"],
  raterPattern: /^[A-Za-z0-9_-]{1,40}$/,
};

function validateTags(tags, allowed) {
  if (!Array.isArray(tags) || !tags.every((tag) => allowed.includes(tag))) {
    throw new Error(`bad tags ${JSON.stringify(tags)}; allowed here: ${allowed}`);
  }
}

function checkLevel(rating, item, allowed) {
  const value = rating[item] ?? null;
  if (!allowed.includes(value)) throw new Error(`bad ${item} rating: ${JSON.stringify(value)}; allowed: ${allowed}`);
}

function validateConstructive(rating) {
  const { constructiveItems, scores, notApplicable } = RATING_RULES;
  for (const item of constructiveItems) checkLevel(rating, item, item === "b3" ? scores : [...scores, notApplicable]);
  const marked = constructiveItems.filter((item) => rating[item] === notApplicable);
  if (marked.length && marked.length !== constructiveItems.length - 1) {
    throw new Error(`N/A must cover all of Part B except b3, got ${marked}`);
  }
}

function validateResponseRating(rating, performance, sourceGuess) {
  const rules = RATING_RULES;
  if (typeof rating !== "object" || rating === null || Array.isArray(rating)) {
    throw new Error(`bad response rating: ${JSON.stringify(rating)}`);
  }
  for (const item of rules.activityItems) checkLevel(rating, item, rules.scores);
  validateTags(rating.a2_missing, rating.a2 < 2 ? rules.missingTags : []);
  checkLevel(rating, "h1", rules.severities);
  checkLevel(rating, "h2", rating.h1 > 0 ? rules.likelihoods : [null]);
  validateTags(rating.h3, rating.h1 > 0 ? rules.harmTypes : []);
  if (rating.h1 > 0 && !rating.h3.length) throw new Error("h3 needs at least one harm type when h1 > 0");
  checkLevel(rating, "h4", rules.severities);
  if (performance === "INADEQUATE") validateConstructive(rating);
  else for (const item of rules.reinforcementItems) checkLevel(rating, item, rules.scores);
  checkLevel(rating, "source", sourceGuess ? rules.sources : [null]);
}

function validateRecord(record, pairsById) {
  if (!RATING_RULES.raterPattern.test(String(record.rater ?? ""))) throw new Error(`bad rater name: ${record.rater}`);
  const pair = pairsById[record.pair_id];
  if (!pair) throw new Error(`unknown pair_id: ${record.pair_id}`);
  if (!RATING_RULES.preferences.includes(record.preference)) throw new Error(`bad preference: ${record.preference}`);
  if (typeof record.swapped !== "boolean") throw new Error(`bad swapped flag: ${record.swapped}`);
  if (typeof record.seconds !== "number") throw new Error(`bad seconds: ${record.seconds}`);
  for (const side of ["a", "b"]) validateResponseRating(record[side], pair.performance, pair.source_guess);
}

if (typeof module !== "undefined") module.exports = { validateRecord }; // for the Node test runner
