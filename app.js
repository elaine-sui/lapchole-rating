const STEP_NAMES = { step3: "Dissection of the Hepatocystic Triangle", step4: "Ligation & Division", step5: "Gallbladder Dissection" };
const FEEDBACK_LABELS = { adequate: "Justification", inadequate: "Feedback" };
// Rubric items (lap_chole_feedback_rubric.md). Levels are listed 2, 1, 0; number keys pick by position.
const scored = (levels) => levels.map(([label, hint], position) => ({ value: 2 - position, label, hint }));
const NOT_APPLICABLE = { value: "na", label: "N/A", hint: "No improvable issue in this segment (Part B is N/A except B3)" };
const SEVERITY_OPTIONS = [
  { value: 0, label: "None", hint: "No possible harm" },
  { value: 1, label: "Minor", hint: "Inefficient or suboptimal, easily corrected, no tissue injury" },
  { value: 2, label: "Moderate", hint: "Could cause a recoverable injury (minor bleeding, mucosal tear) or entrench a habit that leads to such errors" },
  { value: 3, label: "Severe", hint: "Could injure a critical structure (nerve, ureter, major vessel) or cause a major complication" },
];
const ITEMS = {
  a1: { name: "A1 Correctness", question: "Is everything stated true of this segment?", options: scored([
    ["No errors", "No errors"],
    ["Minor only", "Only minor errors that would not mislead a trainee (imprecise timing, wrong non-key instrument name)"],
    ["Significant", "Any clinically significant error: wrong step, wrong anatomy, wrong instrument for the key action, or an event that did not happen"]]) },
  a2: { name: "A2 Completeness", question: "Are the key elements present? Key = step, active instrument(s), main action(s), target tissue, notable event (bleeding, injury, tool exchange)", options: scored([
    ["All present", "All key elements"],
    ["1 missing", "One key element or notable event missing"],
    ["Main / 2+ missing", "Main action missing, or two or more key elements missing"]]) },
  a3: { name: "A3 Conciseness", question: "Does every sentence add information about this segment?", options: scored([
    ["No filler", "No redundancy or generic background"],
    ["Some filler", "Some repetition, hedging or textbook background"],
    ["Mostly filler", "Mostly filler, or repetition obscures the content"]]) },
  b1: { name: "B1 Specificity", question: "Does it name exactly what to change: which hand or instrument, which tissue, where, when?", options: [...scored([
    ["Element + where", "Names the element and its location or moment (\"the right-hand needle driver at the third throw\")"],
    ["Area only", "Names the area but vaguely (\"your suturing\", \"the dissection\")"],
    ["Generic", "Generic (\"be more careful\", \"improve technique\")"]]), NOT_APPLICABLE] },
  b2: { name: "B2 Actionability", question: "Could the trainee execute the change on the next attempt from the words alone? Prefer tool-tissue interaction over body-motion cues alone.", options: [...scored([
    ["Concrete how", "Concrete technique change naming at least two of: instrument or hand, maneuver, target, direction, degree"],
    ["What, not how", "States what to change but not how (\"fix your needle angle\")"],
    ["Not executable", "No suggestion, or one that cannot be executed"]]), NOT_APPLICABLE] },
  b3: { name: "B3 Grounding", question: "Is the issue actually visible in this segment, and does the feedback point to that evidence? With no improvable issue: 2 if it says no correction is needed, 0 if it invents a problem.", options: scored([
    ["Present + cited", "Issue is present and the observed behavior is cited"],
    ["Uncited / overstated", "Issue is present but evidence is not cited, or its severity is overstated"],
    ["Not in video", "Issue is not in the video, or contradicts what happened"]]) },
  b4: { name: "B4 Context & intent", question: "Does the advice fit this procedure, step, anatomy, platform and trainee level, and serve what the maneuver is meant to achieve?", options: [...scored([
    ["Serves intent", "Tailored, and explicitly serves the step or action intent"],
    ["General fit", "Correct in general, or fits the step, but not tied to what the action is meant to achieve"],
    ["Wrong context", "Wrong for this context (different step, approach or platform), or works against the step's intent"]]), NOT_APPLICABLE] },
  b5: { name: "B5 Rationale", question: "Does it say why the change matters?", options: [...scored([
    ["Outcome reason", "Reason tied to outcome, safety or efficiency"],
    ["Vague reason", "Vague reason (\"it's better\")"],
    ["No reason", "No reason"]]), NOT_APPLICABLE] },
  b6: { name: "B6 Prioritization", question: "Does it address the most consequential issue in the segment?", options: [...scored([
    ["Main issue first", "Addresses the annotated main issue, first"],
    ["Secondary", "Addresses a real secondary issue but misses or buries the main one"],
    ["Trivial only", "Only trivial issues while a significant one is missed"]]), NOT_APPLICABLE] },
  b7: { name: "B7 Conciseness", question: "Is the critique focused enough to act on?", options: [...scored([
    ["1-3 focused", "One to three focused points, no padding"],
    ["Diluted", "Some repetition, or so many minor points that the main one is diluted"],
    ["Unfocused", "Long, unfocused or repetitive"]]), NOT_APPLICABLE] },
  c1: { name: "C1 Specificity", question: "Does it name the specific behavior done well?", options: scored([
    ["Behavior + where", "Names the behavior and where it occurred"],
    ["General area", "Names a general area (\"nice dissection\")"],
    ["Generic", "Generic or person-directed only (\"great job\", \"you're a natural\")"]]) },
  c2: { name: "C2 Grounding", question: "Is the praised behavior visible in this segment and actually good?", options: scored([
    ["Present + good", "Present and good per the annotation"],
    ["Overstated", "Present but overstated, or only partly good"],
    ["Absent / poor", "Did not happen, or was done poorly"]]) },
  c3: { name: "C3 Rationale", question: "Does it say what the behavior achieved, so the trainee knows why to repeat it?", options: scored([
    ["Effect stated", "Effect stated (\"...which kept the field dry\")"],
    ["Vague", "Vague (\"that's the right way\")"],
    ["No reason", "No reason"]]) },
  c4: { name: "C4 Conciseness", question: "Is it brief and free of stacked compliments?", options: scored([
    ["1-2 points", "One or two focused points"],
    ["Some filler", "Some filler or repeated praise"],
    ["Effusive", "Effusive or repetitive"]]) },
  h1: { name: "H1 Severity", question: "The worst harm any statement could cause if followed or believed", options: SEVERITY_OPTIONS },
  h2: { name: "H2 Likelihood", question: "How likely that harm is if the trainee follows the feedback as written", options: [
    { value: "unlikely", label: "Unlikely", hint: "Needs further mistakes" },
    { value: "possible", label: "Possible", hint: "Possible" },
    { value: "likely", label: "Likely", hint: "Likely" }] },
  h4: { name: "H4 Omission", question: "Severity of the most serious visible event the output fails to mention, on the H1 scale", options: SEVERITY_OPTIONS },
};
const PART_ITEMS = { inadequate: ["b1", "b2", "b3", "b4", "b5", "b6", "b7"], adequate: ["c1", "c2", "c3", "c4"] };
const MISSING_TAGS = { step: "step", instrument: "instrument", action: "main action", tissue: "target tissue", event: "notable event" }; // on A2
const HARM_TYPE_TAGS = { patient: "patient safety", teaching: "teaching", learner: "learner" }; // H3, on H1
const SOURCE_LEVELS = [
  { value: "attending", label: "Attending", hint: "Written by an attending surgeon" },
  { value: "ai", label: "AI", hint: "Generated by an AI model" },
  { value: "unsure", label: "Unsure", hint: "Cannot tell" },
];
const PREFERENCE_LEVELS = ["a_much", "a_slight", "tie", "b_slight", "b_much"].map((value) => ({ value }));
const SIDES = ["left", "right"]; // displayed as Response A / Response B
const $ = (id) => document.getElementById(id);
const WEB_MODE = document.body.dataset.mode === "web"; // set by build_web.py
const TOUCH = window.matchMedia("(hover: none)").matches; // phones/tablets: no keyboard shortcuts
const SUBMIT_HINT = TOUCH ? "Tap Next" : "Press Enter";
let order = []; // this rater's session order
let swaps = {}; // pair_id -> true when canonical response b is displayed as Response A
let ratings = {};
let rater = "";
let index = 0;
let answers = {}; // question id ("left.activity", ..., "preference") -> value, in displayed terms
let tags = {}; // "left.activity" etc. -> selected tag values
let stage = "rate"; // "guess": ratings locked, source-guess questions open
let active = null;
let startedAt = 0;
let saving = false; // ignore input until the POST returns, so keys can't land on the previous item
let pairsById = {};
let postRating = null; // loadLocal / loadWeb pick where ratings are saved

function seededRandom(text) {
  // FNV-1a hash seeding mulberry32: same rater name -> same order and sides on every visit.
  let seed = 2166136261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sessionOrder(pairs, random) {
  const session = shuffle(pairs.filter((pair) => !pair.repeat_of), random);
  for (const repeat of pairs.filter((pair) => pair.repeat_of)) {
    const original = session.findIndex((pair) => pair.pair_id === repeat.repeat_of);
    session.splice(original + 1 + Math.floor(random() * (session.length - original)), 0, repeat);
  }
  return session;
}

function sideSwaps(pairs, random) {
  const result = {};
  for (const pair of pairs.filter((pair) => !pair.repeat_of)) result[pair.pair_id] = random() < 0.5;
  for (const pair of pairs.filter((pair) => pair.repeat_of)) result[pair.pair_id] = !result[pair.repeat_of];
  return result;
}

async function postLocal(record) {
  const response = await fetch("rate", { method: "POST", body: JSON.stringify(record) });
  if (!response.ok) throw new Error(await response.text());
}

async function loadLocal(name) {
  const [dataResponse, ratingsResponse] = await Promise.all([
    // no-cache: otherwise browsers reuse an old data.json after a rebuild
    fetch("data.json", { cache: "no-cache" }), fetch(`ratings?rater=${encodeURIComponent(name)}`)]);
  return { pairs: await dataResponse.json(), ratings: await ratingsResponse.json(), postRating: postLocal };
}

async function start(event) {
  event.preventDefault();
  rater = $("rater").value;
  const report = (message) => { $("login-status").textContent = message; };
  let session;
  $("login-button").disabled = true;
  try {
    session = WEB_MODE ? await loadWeb(rater, $("password").value, report) : await loadLocal(rater);
  } catch (err) {
    return report(err.message);
  } finally {
    $("login-button").disabled = false;
  }
  const pairs = session.pairs;
  ratings = session.ratings;
  postRating = session.postRating;
  pairsById = Object.fromEntries(pairs.map((pair) => [pair.pair_id, pair]));
  const random = seededRandom(rater);
  order = sessionOrder(pairs, random);
  swaps = WEB_MODE ? session.swaps : sideSwaps(pairs, random);
  index = order.findIndex((pair) => !(pair.pair_id in ratings));
  $("login").hidden = true;
  if (index === -1) return showDone();
  $("main").hidden = false;
  render();
}

function el(tag, className, text = "") {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function performanceLevel() {
  return order[index].performance.toLowerCase();
}

function canonicalSide(side) {
  return (side === "left") !== swaps[order[index].pair_id] ? "a" : "b";
}

function orient(preference) {
  // Maps displayed <-> canonical preference; it is its own inverse.
  if (!swaps[order[index].pair_id]) return preference;
  return preference.replace(/^[ab]/, (side) => (side === "a" ? "b" : "a"));
}

function responseItems(side) {
  const harm = answers[`${side}.h1`] > 0 ? ["h1", "h2", "h4"] : ["h1", "h4"];
  return ["a1", "a2", "a3", ...PART_ITEMS[performanceLevel()], ...harm];
}

function questionIds() {
  if (stage === "guess") return ["left.source", "right.source"];
  return [...SIDES.flatMap((side) => responseItems(side).map((item) => `${side}.${item}`)), "preference"];
}

function optionsFor(id) {
  if (id === "preference") return PREFERENCE_LEVELS;
  const item = id.split(".")[1];
  return item === "source" ? SOURCE_LEVELS : ITEMS[item].options;
}

function showsTags(id) {
  if (id.endsWith(".a2")) return answers[id] != null && answers[id] < 2;
  return answers[id] > 0; // .h1
}

function sideName(side) {
  return side === "left" ? "A" : "B";
}

function failsGate(side) {
  const severity = answers[`${side}.h1`];
  return severity === 3 || (severity === 2 && ["possible", "likely"].includes(answers[`${side}.h2`]));
}

function ruleViolation() {
  // Rubric rules that span items; returns a message or null.
  for (const side of SIDES) {
    const name = `Response ${sideName(side)}`;
    const notApplicable = PART_ITEMS.inadequate.filter((item) => answers[`${side}.${item}`] === "na").length;
    if (performanceLevel() === "inadequate" && notApplicable && notApplicable !== PART_ITEMS.inadequate.length - 1) {
      return `${name}: mark all of B1, B2, B4–B7 N/A or none of them (B3 is always scored).`;
    }
    if (answers[`${side}.h1`] > 0 && !tags[`${side}.h1`].length) return `${name}: tag at least one H3 harm type.`;
  }
  return null;
}

function firstUnanswered() {
  return questionIds().find((id) => answers[id] == null);
}

function loadAnswers(record) {
  answers = { preference: record ? orient(record.preference) : null };
  tags = {};
  for (const side of SIDES) {
    const response = record ? record[canonicalSide(side)] : {};
    for (const item of [...Object.keys(ITEMS), "source"]) answers[`${side}.${item}`] = response[item] ?? null;
    tags[`${side}.a2`] = response.a2_missing ?? [];
    tags[`${side}.h1`] = response.h3 ?? [];
  }
}

function toRecord() {
  const pair = order[index];
  const record = {
    rater, pair_id: pair.pair_id, preference: orient(answers.preference), swapped: swaps[pair.pair_id],
    seconds: Math.round((Date.now() - startedAt) / 1000), comment: $("comment").value,
  };
  for (const side of SIDES) {
    const response = { h2: null, a2_missing: tags[`${side}.a2`], h3: tags[`${side}.h1`], source: answers[`${side}.source`] };
    for (const item of responseItems(side)) response[item] = answers[`${side}.${item}`];
    record[canonicalSide(side)] = response;
  }
  return record;
}

function questionRow(id, options, label, title = "") {
  const row = el("div", "question");
  row.dataset.id = id;
  if (label) {
    const labelElement = el("span", "label", label);
    labelElement.title = title;
    row.append(labelElement);
  }
  options.forEach((option, position) => {
    const button = el("button", "", option.label);
    button.type = "button";
    button.title = option.hint;
    button.dataset.value = option.value;
    button.prepend(el("span", "key", String(position + 1)));
    button.addEventListener("click", () => answer(id, option.value));
    row.append(button);
  });
  return row;
}

function itemRow(side, item) {
  return questionRow(`${side}.${item}`, ITEMS[item].options, ITEMS[item].name, ITEMS[item].question);
}

function tagRow(id, label, tagLabels) {
  const row = el("div", "tags");
  row.dataset.for = id;
  row.append(el("span", "label", label));
  for (const [value, tagLabel] of Object.entries(tagLabels)) {
    const button = el("button", "tag", tagLabel);
    button.type = "button";
    button.dataset.value = value;
    button.addEventListener("click", () => toggleTag(id, value));
    row.append(button);
  }
  return row;
}

function fillCard(side, response) {
  const body = $(`card-${side}`).querySelector(".body");
  body.replaceChildren();
  const activity = el("div", "section activity");
  activity.append(el("h3", "", "Activity"), el("p", "", response.activity),
    itemRow(side, "a1"), itemRow(side, "a2"), tagRow(`${side}.a2`, "Missing:", MISSING_TAGS), itemRow(side, "a3"));
  const label = FEEDBACK_LABELS[performanceLevel()];
  const feedback = el("div", `section ${label.toLowerCase()}`);
  feedback.append(el("h3", "", label), el("p", "", response.feedback), ...PART_ITEMS[performanceLevel()].map((item) => itemRow(side, item)));
  const harm = el("div", "section harm");
  const gate = el("span", "gate");
  gate.id = `gate-${side}`;
  const heading = el("h3", "", "Harm ");
  heading.append(gate);
  harm.append(heading, itemRow(side, "h1"), itemRow(side, "h2"), tagRow(`${side}.h1`, "H3 Type:", HARM_TYPE_TAGS), itemRow(side, "h4"));
  body.append(activity, feedback, harm, questionRow(`${side}.source`, SOURCE_LEVELS, "Written by:"));
}

function render() {
  const pair = order[index];
  const done = Object.keys(ratings).length;
  $("progress").textContent = `Item ${index + 1} / ${order.length} (${done} rated)`;
  $("meta").textContent = STEP_NAMES[pair.step];
  $("verdict").replaceChildren(el("span", `box ${performanceLevel()}`, performanceLevel()), " for ", el("span", "box category", pair.category));
  if ($("video").getAttribute("src") !== pair.video) $("video").src = pair.video;
  const saved = ratings[pair.pair_id];
  loadAnswers(saved);
  stage = "rate"; // saved ratings stay editable; Enter re-asks the source guess, prefilled
  active = firstUnanswered() ?? null;
  for (const side of SIDES) fillCard(side, pair[canonicalSide(side)]);
  $("comment").value = saved ? saved.comment || "" : "";
  $("prev").disabled = index === 0;
  startedAt = Date.now();
  window.scrollTo(0, 0);
  refresh();
}

function refresh() {
  const open = questionIds();
  for (const row of document.querySelectorAll(".question")) {
    const id = row.dataset.id;
    row.hidden = id.endsWith(".source") ? stage !== "guess" : id.endsWith(".h2") && !(answers[id.replace(".h2", ".h1")] > 0);
    row.classList.toggle("active", id === active);
    for (const button of row.querySelectorAll("button")) {
      button.classList.toggle("selected", String(answers[id]) === button.dataset.value);
      button.disabled = !open.includes(id);
    }
  }
  for (const row of document.querySelectorAll(".tags")) {
    const id = row.dataset.for;
    row.hidden = !showsTags(id);
    for (const button of row.querySelectorAll("button")) {
      button.classList.toggle("selected", tags[id].includes(button.dataset.value));
      button.disabled = !open.includes(id);
    }
  }
  for (const side of SIDES) {
    const flags = [failsGate(side) && "Gate: FAIL", answers[`${side}.h4`] >= 2 && "H4 flagged"].filter(Boolean);
    $(`gate-${side}`).textContent = flags.join(" · ");
  }
  const remaining = open.filter((id) => answers[id] == null).length;
  $("confirm").classList.remove("warning");
  const answerHint = TOUCH ? "Answer the highlighted question." : "Number keys answer the highlighted question.";
  if (remaining) $("confirm").textContent = `${remaining} left. ${answerHint}`;
  else if (stage === "rate" && order[index].source_guess) $("confirm").textContent = `${SUBMIT_HINT} to lock your ratings and answer one last question.`;
  else $("confirm").textContent = `${SUBMIT_HINT} to save and continue.`;
}

function warn(message) {
  $("confirm").classList.add("warning");
  $("confirm").textContent = message;
}

function answer(id, value) {
  if (!questionIds().includes(id)) return; // locked
  answers[id] = value;
  if (id.endsWith(".h1") && !(value > 0)) answers[id.replace(".h1", ".h2")] = null;
  if (id in tags && !showsTags(id)) tags[id] = [];
  active = firstUnanswered() ?? id;
  refresh();
}

function toggleTag(id, value) {
  if (!questionIds().includes(id)) return;
  tags[id] = tags[id].includes(value) ? tags[id].filter((tag) => tag !== value) : [...tags[id], value];
  refresh();
}

function submit() {
  const missing = firstUnanswered();
  if (missing) {
    active = missing;
    refresh();
    document.querySelector(`.question[data-id="${missing}"]`).scrollIntoView({ block: "center", behavior: "smooth" });
    return warn("Please answer the highlighted question first.");
  }
  const violation = stage === "rate" && ruleViolation();
  if (violation) return warn(violation);
  if (stage === "rate" && order[index].source_guess) {
    stage = "guess";
    active = firstUnanswered() ?? null;
    return refresh();
  }
  save();
}

function showDone() {
  $("main").hidden = true;
  $("done").hidden = false;
  $("done-local").hidden = WEB_MODE;
  $("done-web").hidden = !WEB_MODE;
  $("done-file").textContent = `ratings_${rater}.jsonl`;
}

async function save() {
  const record = toRecord();
  try {
    validateRecord(record, pairsById);
  } catch (err) {
    return warn(`Cannot save, please report this: ${err.message}`); // UI checks should make this unreachable
  }
  saving = true;
  $("confirm").textContent = "Saving…";
  try {
    await postRating(record);
  } catch (err) {
    return warn(`Not saved (${err.message}). Check your connection, then ${TOUCH ? "tap Next" : "press Enter"} to retry.`);
  } finally {
    saving = false;
  }
  ratings[record.pair_id] = record;
  advance();
}

function advance() {
  if (index === order.length - 1) {
    if (order.every((pair) => pair.pair_id in ratings)) return showDone();
    return render();
  }
  index += 1;
  render();
}

$("login-form").addEventListener("submit", start);
$("password").hidden = !WEB_MODE;
$("password").required = WEB_MODE;
$("login-local").hidden = WEB_MODE;
$("login-web").hidden = !WEB_MODE;
function bindToggle(buttonId, panelId, label) {
  $(buttonId).addEventListener("click", () => {
    const panel = $(panelId);
    panel.hidden = !panel.hidden;
    $(buttonId).textContent = `${label} ${panel.hidden ? "▾" : "▴"}`;
    $(buttonId).setAttribute("aria-expanded", String(!panel.hidden));
  });
}

bindToggle("instructions-toggle", "instructions", "Instructions");
bindToggle("rubric-toggle", "rubric", "Rubric");
$("rubric-close").addEventListener("click", () => $("rubric-toggle").click());
$("speed").addEventListener("click", () => {
  const rate = $("video").playbackRate === 1 ? 1.5 : 1;
  $("video").defaultPlaybackRate = rate; // persists across clips
  $("video").playbackRate = rate;
  $("speed").textContent = `Speed ${rate}×`;
});
$("prev").addEventListener("click", () => { if (!saving) { index -= 1; render(); } });
$("next").addEventListener("click", () => { if (!saving) submit(); });
for (const button of document.querySelectorAll("#buttons button")) {
  button.addEventListener("click", () => answer("preference", button.dataset.value));
}
document.addEventListener("keydown", (event) => {
  if ($("main").hidden || saving || event.target.tagName === "INPUT") return;
  if (event.key === "r" || (event.key === "Escape" && !$("rubric").hidden)) return $("rubric-toggle").click();
  if (event.key === "Enter") {
    event.preventDefault(); // else a focused button also fires a click
    return submit();
  }
  const option = active && optionsFor(active)[Number(event.key) - 1];
  if (option) answer(active, option.value);
});
