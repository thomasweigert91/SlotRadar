require("dotenv").config();
const CleverQClient = require("./cleverq-api");
const Notifier = require("./notifier");

const SITE_SLUG = process.env.SITE_SLUG || "norderstedt";
const SERVICE_ID = parseInt(process.env.SERVICE_ID || "280", 10);
const DEFAULT_SUBTASK_ID = parseInt(process.env.SUBTASK_ID || "191", 10);

const args = process.argv.slice(2);
const subtaskArgIdx = args.findIndex((a) => a === "--subtask" || a === "-s");
const subtaskId =
  subtaskArgIdx !== -1 && args[subtaskArgIdx + 1]
    ? parseInt(args[subtaskArgIdx + 1], 10)
    : DEFAULT_SUBTASK_ID;
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || "2026-09-30";

const client = new CleverQClient(SITE_SLUG);
const notifier = new Notifier({
  bookingUrl: `https://cqm.cleverq.de/public/appointments/${SITE_SLUG}/index.html?lang=de`,
});

function formatGermanDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function checkSpecificDay() {
  console.log("\n====================================================");
  console.log(`🔍 Einmalige Detailprüfung für CleverQ (${SITE_SLUG})`);
  console.log("====================================================");
  console.log(`Datum:       ${formatGermanDate(dateArg)} (${dateArg})`);
  console.log(
    `Subtask-ID:  ${subtaskId} (${subtaskId === 191 ? "Zulassung/Umschreibung" : subtaskId === 190 ? "Außerbetriebsetzung" : "Sonstiges"})`,
  );
  console.log("Lade Zeitslots...\n");

  try {
    const slotsData = await client.getAvailableTimeSlots(
      SERVICE_ID,
      subtaskId,
      dateArg,
      1,
    );
    const totalSlots = slotsData.all.length;
    const openSlots = slotsData.open;

    if (totalSlots === 0) {
      console.log(
        `⚠️ An diesem Tag (${dateArg}) bietet die Behörde regulär keine Termine an (z. B. Wochenende oder Feiertag).`,
      );
      return;
    }

    console.log(`📊 Status für ${formatGermanDate(dateArg)}:`);
    console.log(`   • Gesamte Zeitslots an diesem Tag:  ${totalSlots}`);
    console.log(
      `   • Bereits gebuchte Slots:           ${totalSlots - openSlots.length}`,
    );
    console.log(`   • Freie / buchbare Slots:           ${openSlots.length}\n`);

    if (openSlots.length > 0) {
      console.log("🎉 GEFUNDENE FREIE SLOTS:");
      const openLabels = [];
      for (const s of openSlots) {
        const label = `${s.time_of_slot} Uhr (${s.available} frei)`;
        console.log(`   ✅ ${label}`);
        openLabels.push(
          `${formatGermanDate(dateArg)} um ${s.time_of_slot} Uhr`,
        );
      }

      console.log(
        `\n🔗 Buchungslink: https://cqm.cleverq.de/public/appointments/${SITE_SLUG}/index.html?lang=de\n`,
      );

      // Ask if alert should be sent to Telegram
      if (args.includes("--notify")) {
        console.log("Sende Benachrichtigung via Telegram...");
        await notifier.notify(
          `Freier Termin am ${formatGermanDate(dateArg)}!`,
          `Gefundene Zeiten:\n${openLabels.join("\n")}`,
          openLabels,
        );
        console.log("Telegram-Benachrichtigung gesendet!");
      } else {
        console.log(
          '💡 Tipp: Hänge "--notify" an den Befehl an, um bei Fund auch direkt eine Telegram-Nachricht zu erhalten.',
        );
      }
    } else {
      console.log("❌ Für diesen Tag sind aktuell alle Termine belegt.");
      console.log(
        '💡 Starte den Bot mit "npm start", damit er im Hintergrund wartet, bis jemand storniert.',
      );
    }
  } catch (err) {
    console.error("Fehler bei der Abfrage:", err.response?.data || err.message);
  }
}

checkSpecificDay();
