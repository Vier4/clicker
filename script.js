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
// Points per click when the coin is at its biggest (MAX_SPEED or faster), before the goal bonus below.
const MAX_POINTS_PER_CLICK = 5;

// Auto-clicker check: this many clicks per second or more, nonstop for this long, opens the "take a rest"
// screen. People can't keep that up (very fast human clicking is around 10 a second, in short bursts).
const EXTREME_SPEED = 15;
const EXTREME_SPEED_DURATION_MS = 10000;
// The rest screen's button appears at least this far from where the clicks were landing,
// so an auto-clicker stuck on one spot can't press it.
const REST_BUTTON_MIN_DISTANCE_PX = 160;

// Score goals, in order. Reaching one shows a celebration message and multiplies every click's points
// from then on. Each multiplier replaces the previous one (they don't stack); this keeps the big goals reachable.
// The progress bar has one segment per goal.
const MILESTONES = [
  { points: 100, icon: "🥉", titleKey: "milestone100", multiplier: 2, confetti: 30 },
  { points: 1000, icon: "🥈", titleKey: "milestone1000", multiplier: 5, confetti: 50 },
  { points: 5000, icon: "🥇", titleKey: "milestone5000", multiplier: 20, confetti: 90 },
  { points: 50000, icon: "🏆", titleKey: "milestone50000", multiplier: 50, confetti: 120 },
  { points: 100000, icon: "👑", titleKey: "milestone100000", multiplier: 200, confetti: 160 },
  // The last goals open a victory screen instead of the usual message.
  {
    points: 1000000,
    icon: "💎",
    titleKey: "milestone1000000",
    multiplier: 500,
    victory: { textKey: "victoryText", confettiBursts: 5, fanfareRounds: 1 },
  },
  {
    points: 10000000,
    icon: "🚀",
    titleKey: "milestone10000000",
    multiplier: 1000,
    // "Legendary": rainbow border, twice the confetti, and the fanfare plays twice.
    victory: { textKey: "victoryTwiceText", confettiBursts: 10, fanfareRounds: 2, style: "legendary" },
  },
  {
    points: 100000000,
    icon: "🌟",
    titleKey: "milestone100000000",
    // No new bonus here: ×1000 from 10M stays. This is the end of the game.
    multiplier: 1000,
    // "Ultimate": the ending. The window becomes a night sky with falling coins, and the fanfare plays three times.
    victory: {
      textKey: "ultimateText",
      kickerKey: "ultimateKicker",
      buttonKey: "ultimateButton",
      confettiBursts: 15,
      coinRainWaves: 8,
      fanfareRounds: 3,
      style: "ultimate",
    },
  },
];
// How long a celebration message stays on screen.
const MESSAGE_DURATION_MS = 3000;
const CONFETTI_COLORS = ["#ffd54a", "#ffb300", "#fff3b0", "#ff7043", "#66bb6a", "#42a5f5"];
// Victory screens fire rounds of confetti; how many rounds is set per goal in MILESTONES.
const VICTORY_CONFETTI_PER_BURST = 80;
const VICTORY_CONFETTI_INTERVAL_MS = 600;
// The final ending also rains coins, in waves.
const COIN_RAIN_PER_WAVE = 20;
const COIN_RAIN_INTERVAL_MS = 900;
// Players are usually tapping fast when the victory screen opens, so its button waits a moment
// before it can be pressed; a stray tap can't close the screen before it's seen.
const VICTORY_CLOSE_DELAY_MS = 1500;

// Sounds are generated in code (no audio files).
const SOUND_VOLUME = 0.12;
// The click "bling" is two quick notes, B5 then E6, like a coin pickup.
const CLICK_NOTE_HZ = 988;
// The click sound goes up in pitch as the coin grows, by up to this many semitones at full size.
const CLICK_PITCH_RISE_SEMITONES = 7;
// Goal jingle: C6, E6, G6, C7.
const MILESTONE_NOTES_HZ = [1047, 1319, 1568, 2093];
// Victory fanfare: a rising run (C5 E5 G5 C6 G5 C6), then a held C major chord (C6 E6 G6).
const VICTORY_RUN_HZ = [523, 659, 784, 1047, 784, 1047];
const VICTORY_CHORD_HZ = [1047, 1319, 1568];
// Legendary victory: the run again an octave higher, ending on a bigger chord (C6 E6 G6 C7).
const VICTORY_ENCORE_CHORD_HZ = [1047, 1319, 1568, 2093];
// The final ending: a huge chord spanning two octaves (C5 up to C7).
const VICTORY_FINAL_CHORD_HZ = [523, 659, 784, 1047, 1319, 1568, 2093];

const TRANSLATIONS = {
  en: {
    pageTitle: "Coin Clicker",
    title: "Coin Clicker",
    score: "Score:",
    coinLabel: "Click the coin",
    reset: "Reset",
    resetTitle: "Reset your progress?",
    resetText: "Your score, bonus and all goals will go back to 0. This can't be undone.",
    resetCancel: "Cancel",
    resetConfirm: "Reset",
    languageLabel: "Language",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    soundOff: "Turn sound off",
    soundOn: "Turn sound on",
    nextGoal: "Next goal: {goal} · {left} to go",
    allGoalsReached: "All goals reached!",
    milestone100: "Nice start!",
    milestone1000: "Coin master!",
    milestone5000: "Gold clicker!",
    milestone50000: "Coin tycoon!",
    milestone100000: "Coin king!",
    milestoneReached: "You reached {points} points",
    milestoneBonus: "Every click is now ×{multiplier}!",
    multiplierLabel: "Points multiplier",
    milestone1000000: "You beat the game!",
    victoryText: "{points} points! You're the ultimate Coin Clicker champion.",
    victoryButton: "Keep clicking",
    milestone10000000: "You beat it twice!",
    victoryTwiceText: "{points} points! You're unstoppable!",
    restTitle: "Slow down, speed demon!",
    restText: "More than {speed} clicks a second for {seconds} seconds straight. Your finger needs a rest… or is that a robot? 🤖",
    restButton: "I'm rested 😌",
    milestone100000000: "You did the impossible!",
    ultimateKicker: "✨ The end ✨",
    ultimateText: "{points} points. Almost nobody ever gets this far. The coin bows to you, Legend of the Coin! 👑",
    ultimateButton: "Keep clicking forever",
  },
  ru: {
    pageTitle: "Кликер монет",
    title: "Кликер монет",
    score: "Счёт:",
    coinLabel: "Нажмите на монету",
    reset: "Сбросить",
    resetTitle: "Сбросить прогресс?",
    resetText: "Счёт, бонус и все цели вернутся к нулю. Это нельзя отменить.",
    resetCancel: "Отмена",
    resetConfirm: "Сбросить",
    languageLabel: "Язык",
    switchToLight: "Включить светлую тему",
    switchToDark: "Включить тёмную тему",
    soundOff: "Выключить звук",
    soundOn: "Включить звук",
    // Short, so "Цель: 10 000 000 · осталось 9 000 000" still fits on one line on a phone.
    nextGoal: "Цель: {goal} · осталось {left}",
    allGoalsReached: "Все цели достигнуты!",
    milestone100: "Отличное начало!",
    milestone1000: "Мастер монет!",
    milestone5000: "Золотой кликер!",
    milestone50000: "Монетный магнат!",
    milestone100000: "Король монет!",
    milestoneReached: "Вы набрали {points} очков",
    milestoneBonus: "Теперь каждый клик ×{multiplier}!",
    multiplierLabel: "Множитель очков",
    milestone1000000: "Вы прошли игру!",
    victoryText: "{points} очков! Вы — абсолютный чемпион кликера монет.",
    victoryButton: "Кликать дальше",
    milestone10000000: "Вы прошли игру дважды!",
    victoryTwiceText: "{points} очков! Вас не остановить!",
    restTitle: "Помедленнее, торопыга!",
    restText: "Больше {speed} кликов в секунду {seconds} секунд подряд. Пальцу нужен отдых… или это робот? 🤖",
    restButton: "Отдых окончен 😌",
    milestone100000000: "Вы сделали невозможное!",
    ultimateKicker: "✨ Конец игры ✨",
    ultimateText: "{points} очков. Так далеко почти никто не доходит. Монета склоняется перед вами, Легенда монеты! 👑",
    ultimateButton: "Кликать вечно",
  },
};

const scoreEl = document.getElementById("score");
const multiplierEl = document.getElementById("multiplier");
const coinEl = document.getElementById("coin");
const resetEl = document.getElementById("reset");
const resetDialogEl = document.getElementById("reset-dialog");
const resetCancelEl = document.getElementById("reset-cancel");
const resetConfirmEl = document.getElementById("reset-confirm");
const themeToggleEl = document.getElementById("theme-toggle");
const soundToggleEl = document.getElementById("sound-toggle");
const progressTextEl = document.getElementById("progress-text");
const progressTrackEl = document.getElementById("progress-track");
const milestoneLayerEl = document.getElementById("milestone-layer");
const victoryEl = document.getElementById("victory");
const restDialogEl = document.getElementById("rest-dialog");
const restCardEl = document.getElementById("rest-card");
const restTextEl = document.getElementById("rest-text");
const restButtonEl = document.getElementById("rest-button");
const victoryKickerEl = document.getElementById("victory-kicker");
const victoryIconEl = document.getElementById("victory-icon");
const victoryTitleEl = document.getElementById("victory-title");
const victoryTextEl = document.getElementById("victory-text");
const victoryBonusEl = document.getElementById("victory-bonus");
const victoryCloseEl = document.getElementById("victory-close");
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
// When the current nonstop run of extreme-speed clicking started (null when not clicking that fast).
let extremeSpeedSince = null;
let coinSizeFrame = null;
let messageTimer = null;
let victoryTimers = [];
applyLanguage();
applyTheme();
applySound();
renderScore();

coinEl.addEventListener("click", (event) => {
  recentClicks.push(performance.now());
  const points = pointsForSpeed(currentSpeed()) * currentMultiplier();
  const previousScore = score;

  score += points;
  renderScore();
  saveScore();
  showFloatingPoints(event, points);
  updateCoinSize();
  playClickSound(coinGrowth());
  celebrateMilestones(previousScore, score);
  watchForExtremeSpeed(event);
});

// Holding Enter makes the browser repeat clicks very fast; only count real key presses.
coinEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.repeat) event.preventDefault();
});

// Reset asks first. Escape or Cancel closes the question without changing anything.
resetEl.addEventListener("click", () => {
  // Nothing to lose yet, so there's nothing to ask about.
  if (score === 0) return;
  resetDialogEl.showModal();
});

resetCancelEl.addEventListener("click", () => resetDialogEl.close());

resetConfirmEl.addEventListener("click", () => {
  resetDialogEl.close();
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

restButtonEl.addEventListener("click", () => {
  restDialogEl.close();
  // Start the speed count over, so the coin shrinks back and the check starts fresh.
  recentClicks = [];
  extremeSpeedSince = null;
  updateCoinSize();
});

// Clicks anywhere else on the rest screen just shake the message.
restDialogEl.addEventListener("click", (event) => {
  if (event.target === restButtonEl || restCardEl.classList.contains("is-shaking")) return;
  restCardEl.classList.add("is-shaking");
});
restCardEl.addEventListener("animationend", () => restCardEl.classList.remove("is-shaking"));

// Escape doesn't close the rest screen: the player has to find and press the button.
restDialogEl.addEventListener("cancel", (event) => event.preventDefault());

victoryCloseEl.addEventListener("click", () => {
  victoryEl.close();
  // Clean up right away: the browser's "close" event can arrive later, and until then confetti kept coming.
  stopVictoryEffects();
});

// Also covers closing the victory screen with the Escape key.
victoryEl.addEventListener("close", stopVictoryEffects);

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

function watchForExtremeSpeed(event) {
  if (currentSpeed() < EXTREME_SPEED) {
    extremeSpeedSince = null;
    return;
  }

  const now = performance.now();
  if (extremeSpeedSince === null) extremeSpeedSince = now;
  if (now - extremeSpeedSince >= EXTREME_SPEED_DURATION_MS) showRestScreen(clickPosition(event));
}

function showRestScreen(clickPoint) {
  extremeSpeedSince = null;
  restTextEl.textContent = fillTemplate(TRANSLATIONS[language].restText, {
    speed: EXTREME_SPEED,
    seconds: EXTREME_SPEED_DURATION_MS / 1000,
  });
  restDialogEl.showModal();
  placeRestButton(clickPoint);
}

// Puts the button at a random spot that is away from where the clicks were landing and off the message.
function placeRestButton(clickPoint) {
  const margin = 16;
  const card = restCardEl.getBoundingClientRect();
  const { width, height } = restButtonEl.getBoundingClientRect();

  for (let attempt = 0; attempt < 100; attempt++) {
    const left = randomBetween(margin, window.innerWidth - width - margin);
    const top = randomBetween(margin, window.innerHeight - height - margin);
    const distance = Math.hypot(left + width / 2 - clickPoint.x, top + height / 2 - clickPoint.y);
    const clearOfCard =
      left + width + margin < card.left ||
      left - margin > card.right ||
      top + height + margin < card.top ||
      top - margin > card.bottom;

    if (distance >= REST_BUTTON_MIN_DISTANCE_PX && clearOfCard) {
      restButtonEl.style.left = `${left}px`;
      restButtonEl.style.top = `${top}px`;
      return;
    }
  }

  // No free spot (a very short window where the message fills the height): use the screen corner farthest
  // from the clicks. The button may cover part of the message there, but it stays on top and clickable.
  const corners = [
    { left: margin, top: margin },
    { left: window.innerWidth - width - margin, top: margin },
    { left: margin, top: window.innerHeight - height - margin },
    { left: window.innerWidth - width - margin, top: window.innerHeight - height - margin },
  ];
  const distanceFromClicks = (corner) =>
    Math.hypot(corner.left + width / 2 - clickPoint.x, corner.top + height / 2 - clickPoint.y);
  const farthest = corners.reduce((best, corner) =>
    distanceFromClicks(corner) > distanceFromClicks(best) ? corner : best
  );
  restButtonEl.style.left = `${farthest.left}px`;
  restButtonEl.style.top = `${farthest.top}px`;
}

// Where a click on the coin happened. Keyboard activation (Enter/Space) has no pointer position,
// so it counts as the coin's center.
function clickPosition(event) {
  if (event.clientX !== 0 || event.clientY !== 0) return { x: event.clientX, y: event.clientY };
  const rect = coinEl.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// The bonus from the highest goal reached so far (1 before the first goal).
function currentMultiplier() {
  const reached = MILESTONES.filter((milestone) => score >= milestone.points);
  return reached.length > 0 ? reached[reached.length - 1].multiplier : 1;
}

// Whether reaching this goal gives a bigger bonus than the goal before it.
function raisesMultiplier(milestone) {
  const index = MILESTONES.indexOf(milestone);
  return index === 0 || milestone.multiplier > MILESTONES[index - 1].multiplier;
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

  const multiplier = currentMultiplier();
  multiplierEl.hidden = multiplier === 1;
  multiplierEl.textContent = `×${multiplier}`;
  multiplierEl.title = TRANSLATIONS[language].multiplierLabel;

  renderProgress();
}

function createProgressSegment(milestone) {
  const segment = document.createElement("div");
  segment.className = "progress-segment";
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  const fill = document.createElement("div");
  fill.className = "progress-fill";
  const marker = document.createElement("span");
  marker.className = "progress-marker";

  bar.append(fill);
  segment.append(bar, marker);
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
    // Short labels ("50K", "50 тыс.") so all the goals fit under the bar.
    const goalText = formatCompactNumber(milestone.points);
    // Medal on the first line, number on the second. The medal line stays (empty) until the goal is
    // reached, so the numbers don't shift down when a medal appears.
    marker.textContent = `${reached ? milestone.icon : ""}\n${goalText}`;
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
  if (passed.length === 0) return;

  const milestone = passed[passed.length - 1];
  if (milestone.victory) {
    showVictory(milestone);
    playVictorySound(milestone.victory.fanfareRounds);
  } else {
    showMilestoneMessage(milestone);
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
  if (raisesMultiplier(milestone)) {
    const bonus = document.createElement("span");
    bonus.className = "milestone-bonus";
    bonus.textContent = fillTemplate(strings.milestoneBonus, { multiplier: milestone.multiplier });
    card.append(bonus);
  }

  // Replace any message that is still showing.
  milestoneLayerEl.replaceChildren(card);
  if (!reducedMotionQuery.matches) launchConfetti(milestone.confetti);

  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    card.classList.add("is-leaving");
    card.addEventListener("animationend", () => card.remove(), { once: true });
  }, MESSAGE_DURATION_MS);
}

function showVictory(milestone) {
  const strings = TRANSLATIONS[language];
  const { victory } = milestone;
  victoryEl.classList.toggle("is-legendary", victory.style === "legendary");
  victoryEl.classList.toggle("is-ultimate", victory.style === "ultimate");
  victoryKickerEl.hidden = !victory.kickerKey;
  victoryKickerEl.textContent = victory.kickerKey ? strings[victory.kickerKey] : "";
  victoryIconEl.textContent = milestone.icon;
  victoryTitleEl.textContent = strings[milestone.titleKey];
  victoryTextEl.textContent = fillTemplate(strings[victory.textKey], {
    points: formatNumber(milestone.points),
  });
  // Only mention the bonus when this goal actually raises it.
  victoryBonusEl.hidden = !raisesMultiplier(milestone);
  victoryBonusEl.textContent = fillTemplate(strings.milestoneBonus, { multiplier: milestone.multiplier });
  victoryCloseEl.textContent = strings[victory.buttonKey ?? "victoryButton"];

  // Clear any goal message still showing; the victory screen takes over.
  clearTimeout(messageTimer);
  milestoneLayerEl.replaceChildren();
  // Clear anything left from an earlier victory screen.
  stopVictoryEffects();
  victoryEl.showModal();

  victoryCloseEl.disabled = true;
  victoryTimers.push(
    setTimeout(() => {
      victoryCloseEl.disabled = false;
      victoryCloseEl.focus();
    }, VICTORY_CLOSE_DELAY_MS)
  );

  if (!reducedMotionQuery.matches) {
    for (let burst = 0; burst < milestone.victory.confettiBursts; burst++) {
      victoryTimers.push(
        setTimeout(() => {
          // Never add confetti to a screen that has already closed.
          if (victoryEl.open) launchConfetti(VICTORY_CONFETTI_PER_BURST, victoryEl);
        }, burst * VICTORY_CONFETTI_INTERVAL_MS)
      );
    }
    for (let wave = 0; wave < (victory.coinRainWaves ?? 0); wave++) {
      victoryTimers.push(
        setTimeout(() => {
          if (victoryEl.open) launchCoinRain(COIN_RAIN_PER_WAVE);
        }, wave * COIN_RAIN_INTERVAL_MS)
      );
    }
  }
}

// Coins falling from the top of the final ending screen.
function launchCoinRain(count) {
  for (let i = 0; i < count; i++) {
    const coin = document.createElement("span");
    coin.className = "coin-rain";
    const size = randomBetween(16, 36);
    coin.style.width = `${size}px`;
    coin.style.height = `${size}px`;
    coin.style.left = `${randomBetween(0, 100)}%`;
    coin.style.animationDuration = `${randomBetween(2200, 4200)}ms`;
    coin.style.animationDelay = `${randomBetween(0, 800)}ms`;
    coin.addEventListener("animationend", () => coin.remove());
    victoryEl.append(coin);
  }
}

// Stops pending confetti rounds and the button delay, and removes confetti from the victory screen.
function stopVictoryEffects() {
  victoryTimers.forEach(clearTimeout);
  victoryTimers = [];
  victoryEl.querySelectorAll(".confetti, .coin-rain").forEach((piece) => piece.remove());
}

function launchConfetti(count, container = milestoneLayerEl) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty("--dx", `${randomBetween(-240, 240)}px`);
    piece.style.setProperty("--dy", `${randomBetween(-160, 120)}px`);
    piece.style.setProperty("--spin", `${randomBetween(-540, 540)}deg`);
    piece.style.animationDelay = `${randomBetween(0, 120)}ms`;
    piece.addEventListener("animationend", () => piece.remove());
    container.append(piece);
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

// rounds: how many times the fanfare plays (1 for 1M, 2 for 10M, 3 for 100M). Rounds after the first are
// an octave higher, and the last round ends on a bigger, longer chord.
function playVictorySound(rounds) {
  const context = getAudioContext();
  if (!context) return;

  const lastChords = [VICTORY_CHORD_HZ, VICTORY_ENCORE_CHORD_HZ, VICTORY_FINAL_CHORD_HZ];
  const lastChordSeconds = [1.1, 1.4, 2.4];
  // Start just after the click sound so the two don't blur together.
  let start = context.currentTime + 0.12;

  for (let round = 0; round < rounds; round++) {
    const octave = round === 0 ? 1 : 2;
    VICTORY_RUN_HZ.forEach((frequency, index) => {
      playTone(context, frequency * octave, start + index * 0.11, 0.14);
    });

    const chordStart = start + VICTORY_RUN_HZ.length * 0.11 + 0.05;
    const isLastRound = round === rounds - 1;
    const chord = isLastRound ? lastChords[rounds - 1] : VICTORY_CHORD_HZ;
    const chordSeconds = isLastRound ? lastChordSeconds[rounds - 1] : 1.1;
    chord.forEach((frequency) => playTone(context, frequency, chordStart, chordSeconds));
    start = chordStart + 0.9;
  }
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

// Short goal labels: "1K", "100M". Always the K/M style, even in Russian, because Russian's own short forms
// ("100 тыс.", "100 млн") are too wide for eight goals under the bar on a phone.
function formatCompactNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
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

  const position = clickPosition(event);
  floating.style.left = `${position.x}px`;
  floating.style.top = `${position.y}px`;

  document.body.appendChild(floating);
  floating.addEventListener("animationend", () => floating.remove());
}
