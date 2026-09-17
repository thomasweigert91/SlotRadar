require("dotenv").config();
const CleverQClient = require("./cleverq-api");
const Notifier = require("./notifier");
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "bot.log");
const PID_FILE = path.join(__dirname, "bot.pid");

const origLog = console.log;
const origErr = console.error;

console.log = function (...args) {
  const line = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
    .join(" ");
  origLog.apply(console, args);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {}
};

console.error = function (...args) {
  const line =
    "[ERROR] " +
    args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
  origErr.apply(console, args);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {}
};

const SITE_SLUG = process.env.SITE_SLUG || "norderstedt";
const SERVICE_ID = parseInt(process.env.SERVICE_ID || "280", 10);
const SUBTASK_ID = parseInt(process.env.SUBTASK_ID || "191", 10);
const SUBTASK_COUNT = parseInt(process.env.SUBTASK_COUNT || "1", 10);
const DAYS_AHEAD = parseInt(process.env.DAYS_AHEAD || "5", 10);
const WEEKS_AHEAD = parseInt(process.env.WEEKS_AHEAD || "0", 10);
const DEFAULT_INTERVAL = parseInt(
  process.env.CHECK_INTERVAL_SECONDS || "30",
  10,
);
const FALLBACK_KEY = process.env.BOOKING_SESSION_KEY || "QMZ8NYgjIh7trKzPjEYVg";

// CLI Arguments
const args = process.argv.slice(2);
const isListMode = args.includes("--list") || args.includes("-l");
const isOnceMode = args.includes("--once") || args.includes("-1");
const intervalArgIdx = args.findIndex((a) => a === "--interval" || a === "-i");
const intervalSec =
  intervalArgIdx !== -1 && args[intervalArgIdx + 1]
    ? parseInt(args[intervalArgIdx + 1], 10)
    : DEFAULT_INTERVAL;
const subtaskArgIdx = args.findIndex((a) => a === "--subtask" || a === "-s");
const activeSubtaskId =
  subtaskArgIdx !== -1 && args[subtaskArgIdx + 1]
    ? parseInt(args[subtaskArgIdx + 1], 10)
    : SUBTASK_ID;

const daysArgIdx = args.findIndex((a) => a === "--days");
const activeDaysAhead =
  daysArgIdx !== -1 && args[daysArgIdx + 1]
    ? parseInt(args[daysArgIdx + 1], 10)
    : DAYS_AHEAD;

const fromArgIdx = args.findIndex((a) => a === "--from");
const customFrom =
  fromArgIdx !== -1 && args[fromArgIdx + 1] ? args[fromArgIdx + 1] : null;

const toArgIdx = args.findIndex((a) => a === "--to");
const customTo =
  toArgIdx !== -1 && args[toArgIdx + 1] ? args[toArgIdx + 1] : null;

const dayArgIdx = args.findIndex((a) => a === "--day" || a === "-d");
const targetDay =
  dayArgIdx !== -1 && args[dayArgIdx + 1] ? args[dayArgIdx + 1] : null;

const client = new CleverQClient(SITE_SLUG, FALLBACK_KEY);
const notifier = new Notifier({
  soundAlert: process.env.SOUND_ALERT !== "false",
  desktopAlert: process.env.DESKTOP_NOTIFICATION !== "false",
  autoOpenBrowser: process.env.AUTO_OPEN_BROWSER !== "false",
  bookingUrl: `https://cqm.cleverq.de/public/appointments/${SITE_SLUG}/index.html?lang=de`,
});

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatGermanDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function listSubtasks() {
  console.log(
    `\nLade Dienstleistungen und Subtasks für Standort "${SITE_SLUG}"...\n`,
  );
  try {
    const list = await client.listAllSubtasks();
    console.table(list);
    console.log(
      `\n💡 Tipp: Setze SUBTASK_ID=<id> in deiner .env Datei oder nutze "node bot.js --subtask <id>"\n`,
    );
  } catch (err) {
    console.error("Fehler beim Abrufen der Subtasks:", err.message);
  }
}

let lastFoundSlotKeys = new Set();
let checkCount = 0;

async function checkAppointments() {
  checkCount++;
  const timestamp = new Date().toLocaleTimeString("de-DE");

  const fromDay = customFrom || formatDate(new Date());
  let toDateObj;
  if (activeDaysAhead > 0) {
    toDateObj = new Date(Date.now() + activeDaysAhead * 24 * 60 * 60 * 1000);
  } else {
    toDateObj = new Date(
      Date.now() + (WEEKS_AHEAD || 1) * 7 * 24 * 60 * 60 * 1000,
    );
  }
  const toDay = customTo || formatDate(toDateObj);

  try {
    const availableDays = await client.getAvailableDays(
      SERVICE_ID,
      activeSubtaskId,
      fromDay,
      toDay,
      SUBTASK_COUNT,
    );

    if (!availableDays || availableDays.length === 0) {
      console.log(
        `[${timestamp}] [#${checkCount}] Keine freien Termine (${fromDay} bis ${toDay}). Nächster Check in ${intervalSec}s...`,
      );
      lastFoundSlotKeys.clear();
      return;
    }

    console.log(
      `\n=============================================================`,
    );
    console.log(
      `🚨 [${timestamp}] [#${checkCount}] GEFUNDEN! ${availableDays.length} Tag(e) mit Terminen verfügbar!`,
    );
    console.log(
      `=============================================================`,
    );

    const openSlotDetails = [];
    const currentFoundKeys = new Set();

    for (const dayEntry of availableDays) {
      const dayStr = typeof dayEntry === "object" ? dayEntry.day : dayEntry;
      try {
        const slotsResult = await client.getAvailableTimeSlots(
          SERVICE_ID,
          activeSubtaskId,
          dayStr,
          SUBTASK_COUNT,
        );
        const openSlots = slotsResult.open;

        if (openSlots.length > 0) {
          console.log(`\n📅 ${formatGermanDate(dayStr)}:`);
          for (const s of openSlots) {
            const slotKey = `${dayStr}_${s.time_of_slot}`;
            currentFoundKeys.add(slotKey);
            const slotLabel = `${formatGermanDate(dayStr)} um ${s.time_of_slot} Uhr`;
            console.log(
              `   ⏰ ${s.time_of_slot} Uhr (noch ${s.available} frei)`,
            );
            openSlotDetails.push(slotLabel);
          }
        } else {
          console.log(
            `\n📅 ${formatGermanDate(dayStr)}: (Tag gelistet, lade Slots...)`,
          );
        }
      } catch (slotErr) {
        console.log(
          `   (Slots für ${dayStr} konnten nicht im Detail geladen werden: ${slotErr.message})`,
        );
      }
    }

    // Check if there are newly discovered slots
    const hasNewSlots = [...currentFoundKeys].some(
      (k) => !lastFoundSlotKeys.has(k),
    );
    lastFoundSlotKeys = currentFoundKeys;

    if (hasNewSlots || checkCount === 1) {
      const title = `🚨 Freier Termin in ${client.siteName || SITE_SLUG}!`;
      const msg =
        openSlotDetails.length > 0
          ? `Gefundene Zeiten:\n${openSlotDetails.slice(0, 5).join("\n")}${openSlotDetails.length > 5 ? "\n... und weitere" : ""}`
          : `${availableDays.length} verfügbare(r) Tag(e) entdeckt!`;

      await notifier.notify(title, msg, openSlotDetails);
    } else {
      console.log(
        `[Info] Termine waren bereits beim vorherigen Check gemeldet.`,
      );
    }

    console.log(
      `\nBooking Link: https://cqm.cleverq.de/public/appointments/${SITE_SLUG}/index.html?lang=de\n`,
    );
  } catch (err) {
    console.error(
      `[${timestamp}] [#${checkCount}] Fehler bei Abfrage:`,
      err.response?.data || err.message,
    );
  }
}

async function main() {
  if (isListMode) {
    await listSubtasks();
    return;
  }

  if (!isOnceMode) {
    fs.writeFileSync(PID_FILE, process.pid.toString());
    const cleanup = () => {
      try {
        if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
      } catch (_) {}
    };
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit();
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit();
    });
  }

  console.log(`\n====================================================`);
  console.log(`🚗 CleverQ Termin-Bot gestartet!`);
  console.log(`====================================================`);
  console.log(`Standort:            ${SITE_SLUG}`);
  console.log(`Service-ID:          ${SERVICE_ID}`);
  console.log(`Subtask-ID:          ${activeSubtaskId}`);
  const searchWindowText = customTo
    ? `${customFrom || "Heute"} bis ${customTo}`
    : activeDaysAhead > 0
      ? `${activeDaysAhead} Tage (ab heute)`
      : `${WEEKS_AHEAD} Wochen`;
  console.log(`Suchzeitraum:        ${searchWindowText}`);
  console.log(`Prüf-Intervall:      ${intervalSec} Sekunden`);
  console.log(
    `Sound-Alarm:         ${process.env.SOUND_ALERT !== "false" ? "Aktiviert" : "Deaktiviert"}`,
  );
  console.log(
    `Desktop-Notify:      ${process.env.DESKTOP_NOTIFICATION !== "false" ? "Aktiviert" : "Deaktiviert"}`,
  );
  console.log(
    `Auto-Browser-Open:   ${process.env.AUTO_OPEN_BROWSER !== "false" ? "Aktiviert" : "Deaktiviert"}`,
  );
  console.log(`====================================================\n`);

  // Run initial check
  await checkAppointments();

  if (isOnceMode) {
    console.log("\n[Einmal-Modus] Beende Bot nach erster Prüfung.");
    return;
  }

  // Set recurring interval
  setInterval(async () => {
    await checkAppointments();
  }, intervalSec * 1000);
}

main().catch((err) => {
  console.error("Kritischer Fehler beim Starten des Bots:", err);
});
