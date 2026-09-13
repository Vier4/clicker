const STORAGE_KEY = "coinClicker.score";
const LANGUAGE_KEY = "coinClicker.language";
const THEME_KEY = "coinClicker.theme";
const SOUND_KEY = "coinClicker.sound";

// Click speed = number of clicks in the last second.
const SPEED_WINDOW_MS = 1000;
// At this many clicks per second the coin reaches its full size. Around 10 is very fast mouse clicking.
const MAX_SPEED = 10;
// How big the coin gets at full speed (1 = starting size): 120px × 6 = 720px, most of the screen.
const MAX_COIN_SCALE = 6;
// Above 1, the coin grows slowly at normal speeds and fastest near MAX_SPEED,
// so the biggest sizes need very fast clicking.
const GROWTH_CURVE = 1.5;
// Below full size, every this many clicks per second adds +1 to each click: 1–2 → +1, 3–5 → +2, 6–8 → +3, 9 → +4.
const CLICKS_PER_BONUS_POINT = 3;
// Points per click when the coin is at its biggest (MAX_SPEED or faster). This is the most a click can give.
const MAX_POINTS_PER_CLICK = 5;

// Score goals, in order. Reaching one shows a celebration message; the progress bar has one segment per goal.
const MILESTONES = [
  { points: 100, icon: "🥉", titleKey: "milestone100", confetti: 30 },
  { points: 1000, icon: "🥈", titleKey: "milestone1000", confetti: 50 },
  { points: 5000, icon: "🏆", titleKey: "milestone5000", confetti: 90 },
];
// How long a celebration message stays on screen.
const MESSAGE_DURATION_MS = 3000;
const CONFETTI_COLORS = ["#ffd54a", "#ffb300", "#fff3b0", "#ff7043", "#66bb6a", "#42a5f5"];

// Sounds are generated in code (no audio files).
const SOUND_VOLUME = 0.12;
// The click "bling" is two quick notes, B5 then E6, like a coin pickup.
const CLICK_NOTE_HZ = 988;
// The click sound goes up in pitch as the coin grows, by up to this many semitones at full size.
const CLICK_PITCH_RISE_SEMITONES = 7;
// Goal jingle: C6, E6, G6, C7.
const MILESTONE_NOTES_HZ = [1047, 1319, 1568, 2093];

const TRANSLATIONS = {
  en: {
    pageTitle: "Coin Clicker",
    title: "Coin Clicker",
    score: "Score:",
    coinLabel: "Click the coin",
    reset: "Reset",
    languageLabel: "Language",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    soundOff: "Turn sound off",
    soundOn: "Turn sound on",
    nextGoal: "Next goal: {goal} · {left} to go",
    allGoalsReached: "All goals reached!",
    milestone100: "Nice start!",
    milestone1000: "Coin master!",
    milestone5000: "Legendary clicker!",
    milestoneReached: "You reached {points} points",
  },
  ru: {
    pageTitle: "Кликер монет",
    title: "Кликер монет",
    score: "Счёт:",
    coinLabel: "Нажмите на монету",
    reset: "Сбросить",
    languageLabel: "Язык",
    switchToLight: "Включить светлую тему",
    switchToDark: "Включить тёмную тему",
    soundOff: "Выключить звук",
    soundOn: "Включить звук",
    nextGoal: "Следующая цель: {goal} · осталось {left}",
    allGoalsReached: "Все цели достигнуты!",
    milestone100: "Отличное начало!",
    milestone1000: "Мастер монет!",
    milestone5000: "Легендарный кликер!",
    milestoneReached: "Вы набрали {points} очков",
  },
};

const scoreEl = document.getElementById("score");
const coinEl = document.getElementById("coin");
const resetEl = document.getElementById("reset");
const themeToggleEl = document.getElementById("theme-toggle");
const soundToggleEl = document.getElementById("sound-toggle");
const progressTextEl = document.getElementById("progress-text");
const progressTrackEl = document.getElementById("progress-track");
const milestoneLayerEl = document.getElementById("milestone-layer");
const languageSwitcherEl = document.querySelector(".language-switcher");
const languageButtons = document.querySelectorAll("[data-lang]");
const systemDarkQuery = matchMedia("(prefers-color-scheme: dark)");
const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const progressSegments = MILESTONES.map(createProgressSegment);

let score = loadScore();
let language = loadLanguage();
// The inline script in <head> has already chosen the starting theme.
let theme = document.documentElement.dataset.theme;
let soundOn = loadSound();
let audioContext = null;
let recentClicks = [];
let coinSizeFrame = null;
let messageTimer = null;
applyLanguage();
applyTheme();
applySound();
renderScore();

coinEl.addEventListener("click", (event) => {
  recentClicks.push(performance.now());
  const points = pointsForSpeed(currentSpeed());
  const previousScore = score;

  score += points;
  renderScore();
  saveScore();
  showFloatingPoints(event, points);
  updateCoinSize();
  playClickSound(coinGrowth());
  celebrateMilestones(previousScore, score);
});

// Holding Enter makes the browser repeat clicks very fast; only count real key presses.
coinEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.repeat) event.preventDefault();
});

resetEl.addEventListener("click", () => {
  score = 0;
  renderScore();
  saveScore();
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    language = button.dataset.lang;
    saveLanguage();
    applyLanguage();
    renderScore();
  });
});

themeToggleEl.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  saveTheme();
  applyTheme();
});

soundToggleEl.addEventListener("click", () => {
  soundOn = !soundOn;
  saveSound();
  applySound();
  // A little bling so the player hears that sound is back on.
  playClickSound(0);
});

// Until the player picks a theme, keep following the system setting.
systemDarkQuery.addEventListener("change", (event) => {
  if (hasSavedTheme()) return;
  theme = event.matches ? "dark" : "light";
  applyTheme();
});

function currentSpeed() {
  const cutoff = performance.now() - SPEED_WINDOW_MS;
  recentClicks = recentClicks.filter((time) => time > cutoff);
  return recentClicks.length;
}

function pointsForSpeed(speed) {
  if (speed >= MAX_SPEED) return MAX_POINTS_PER_CLICK;
  // Keep the top reward for full size only.
  return Math.min(1 + Math.floor(speed / CLICKS_PER_BONUS_POINT), MAX_POINTS_PER_CLICK - 1);
}

// How grown the coin is right now: 0 = starting size, 1 = full size.
function coinGrowth() {
  // A single click (speed 1) keeps the starting size; growth starts from the second click in a second.
  const linearProgress = Math.min(Math.max(currentSpeed() - 1, 0) / (MAX_SPEED - 1), 1);
  return linearProgress ** GROWTH_CURVE;
}

function updateCoinSize() {
  coinEl.style.setProperty("--speed-scale", String(1 + (MAX_COIN_SCALE - 1) * coinGrowth()));

  // Keep re-checking while recent clicks remain, so the coin shrinks back once clicking slows or stops.
  cancelAnimationFrame(coinSizeFrame);
  coinSizeFrame = recentClicks.length > 0 ? requestAnimationFrame(updateCoinSize) : null;
}

function renderScore() {
  scoreEl.textContent = score.toLocaleString(language);
  renderProgress();
}

function createProgressSegment(milestone) {
  const segment = document.createElement("div");
  segment.className = "progress-segment";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  const marker = document.createElement("span");
  marker.className = "progress-marker";

  segment.append(fill, marker);
  progressTrackEl.append(segment);
  return { milestone, fill, marker };
}

function renderProgress() {
  const strings = TRANSLATIONS[language];

  // Each segment fills from the previous goal to its own goal.
  let previousGoal = 0;
  progressSegments.forEach(({ milestone, fill, marker }) => {
    const share = (score - previousGoal) / (milestone.points - previousGoal);
    fill.style.width = `${Math.min(Math.max(share, 0), 1) * 100}%`;

    const reached = score >= milestone.points;
    const goalText = formatNumber(milestone.points);
    marker.textContent = reached ? `${milestone.icon} ${goalText}` : goalText;
    marker.classList.toggle("reached", reached);
    previousGoal = milestone.points;
  });

  const nextMilestone = MILESTONES.find((milestone) => score < milestone.points);
  progressTextEl.textContent = nextMilestone
    ? fillTemplate(strings.nextGoal, {
        goal: formatNumber(nextMilestone.points),
        left: formatNumber(nextMilestone.points - score),
      })
    : strings.allGoalsReached;

  const lastGoal = MILESTONES[MILESTONES.length - 1].points;
  progressTrackEl.setAttribute("aria-valuemin", "0");
  progressTrackEl.setAttribute("aria-valuemax", String(lastGoal));
  progressTrackEl.setAttribute("aria-valuenow", String(Math.min(score, lastGoal)));
  progressTrackEl.setAttribute("aria-valuetext", progressTextEl.textContent);
}

function celebrateMilestones(previousScore, newScore) {
  // A fast click is worth several points, so check whether a goal was passed, not hit exactly.
  const passed = MILESTONES.filter(
    (milestone) => previousScore < milestone.points && newScore >= milestone.points
  );
  if (passed.length > 0) {
    showMilestoneMessage(passed[passed.length - 1]);
    playMilestoneSound();
  }
}

function showMilestoneMessage(milestone) {
  const strings = TRANSLATIONS[language];

  const card = document.createElement("div");
  card.className = "milestone-card";
  const icon = document.createElement("span");
  icon.className = "milestone-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = milestone.icon;
  const title = document.createElement("strong");
  title.className = "milestone-title";
  title.textContent = strings[milestone.titleKey];
  const text = document.createElement("span");
  text.className = "milestone-text";
  text.textContent = fillTemplate(strings.milestoneReached, { points: formatNumber(milestone.points) });
  card.append(icon, title, text);

  // Replace any message that is still showing.
  milestoneLayerEl.replaceChildren(card);
  if (!reducedMotionQuery.matches) launchConfetti(milestone.confetti);

  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    card.classList.add("is-leaving");
    card.addEventListener("animationend", () => card.remove(), { once: true });
  }, MESSAGE_DURATION_MS);
}

function launchConfetti(count) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty("--dx", `${randomBetween(-240, 240)}px`);
    piece.style.setProperty("--dy", `${randomBetween(-160, 120)}px`);
    piece.style.setProperty("--spin", `${randomBetween(-540, 540)}deg`);
    piece.style.animationDelay = `${randomBetween(0, 120)}ms`;
    piece.addEventListener("animationend", () => piece.remove());
    milestoneLayerEl.append(piece);
  }
}

// growth: 0 = starting size, 1 = full size (higher pitch).
function playClickSound(growth) {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const firstNote = CLICK_NOTE_HZ * 2 ** ((growth * CLICK_PITCH_RISE_SEMITONES) / 12);
  playTone(context, firstNote, now, 0.07);
  // Second note a fourth higher (B5 → E6).
  playTone(context, firstNote * (4 / 3), now + 0.06, 0.16);
}

function playMilestoneSound() {
  const context = getAudioContext();
  if (!context) return;

  // Start just after the click sound so the two don't blur together.
  const start = context.currentTime + 0.12;
  MILESTONE_NOTES_HZ.forEach((frequency, index) => {
    const isLastNote = index === MILESTONE_NOTES_HZ.length - 1;
    playTone(context, frequency, start + index * 0.09, isLastNote ? 0.4 : 0.14);
  });
}

// Returns null when sound is off or the browser can't play generated audio.
function getAudioContext() {
  if (!soundOn) return null;

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  // Browsers keep audio paused until the player interacts with the page; this runs on a click, so resume.
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(context, frequency, startTime, duration) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  // A triangle wave sounds soft and a little chiptune-cute.
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Quick fade in and a smooth fade out, so notes don't click or pop.
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(SOUND_VOLUME, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function formatNumber(value) {
  return value.toLocaleString(language);
}

// Fills "{name}" placeholders in a translated string.
function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

function applyLanguage() {
  const strings = TRANSLATIONS[language];

  document.documentElement.lang = language;
  document.title = strings.pageTitle;
  languageSwitcherEl.setAttribute("aria-label", strings.languageLabel);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = strings[el.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", strings[el.dataset.i18nAriaLabel]);
  });

  languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });

  // The theme and sound buttons' labels are translated too.
  updateThemeToggleLabel();
  updateSoundToggleLabel();
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  updateThemeToggleLabel();
}

function updateThemeToggleLabel() {
  const strings = TRANSLATIONS[language];
  const label = theme === "dark" ? strings.switchToLight : strings.switchToDark;
  themeToggleEl.setAttribute("aria-label", label);
  themeToggleEl.title = label;
}

function applySound() {
  soundToggleEl.dataset.sound = soundOn ? "on" : "off";
  updateSoundToggleLabel();
}

function updateSoundToggleLabel() {
  const strings = TRANSLATIONS[language];
  const label = soundOn ? strings.soundOff : strings.soundOn;
  soundToggleEl.setAttribute("aria-label", label);
  soundToggleEl.title = label;
}

function hasSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark";
  } catch {
    return false;
  }
}

function saveTheme() {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage may be unavailable; the choice just won't be remembered.
  }
}

function loadSound() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveSound() {
  try {
    localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
  } catch {
    // Storage may be unavailable; the choice just won't be remembered.
  }
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved in TRANSLATIONS) return saved;
  } catch {
    // Fall through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function saveLanguage() {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Storage may be unavailable; the choice just won't be remembered.
  }
}

function loadScore() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

function saveScore() {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Storage may be unavailable (e.g. private mode); the game still works.
  }
}

function showFloatingPoints(event, points) {
  const floating = document.createElement("span");
  floating.className = "floating-plus";
  floating.textContent = `+${points}`;

  // Keyboard activation (Enter/Space) has no pointer position, so use the coin's center.
  const rect = coinEl.getBoundingClientRect();
  const fromKeyboard = event.clientX === 0 && event.clientY === 0;
  floating.style.left = `${fromKeyboard ? rect.left + rect.width / 2 : event.clientX}px`;
  floating.style.top = `${fromKeyboard ? rect.top + rect.height / 2 : event.clientY}px`;

  document.body.appendChild(floating);
  floating.addEventListener("animationend", () => floating.remove());
}
