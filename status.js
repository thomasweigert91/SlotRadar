const fs = require("fs");
const path = require("path");

const PID_FILE = path.join(__dirname, "bot.pid");
const LOG_FILE = path.join(__dirname, "bot.log");

console.log("\n====================================================");
console.log("📊 CleverQ Bot Status-Prüfung");
console.log("====================================================");

let isRunning = false;
let pid = null;

if (fs.existsSync(PID_FILE)) {
  try {
    pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
    // process.kill with signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    isRunning = true;
  } catch (err) {
    isRunning = false;
  }
}

if (isRunning) {
  console.log(`🟢 STATUS: Bot LÄUFT aktiv im Hintergrund!`);
  console.log(`📌 Prozess-ID (PID): ${pid}`);
} else {
  console.log(`🔴 STATUS: Bot läuft aktuell NICHT.`);
  console.log(`💡 Du kannst ihn starten mit:`);
  console.log(
    `   - Doppelklick auf 'bot-starten-hintergrund.vbs' (im Hintergrund)`,
  );
  console.log(`   - oder im Terminal mit 'npm start'`);
}

if (fs.existsSync(LOG_FILE)) {
  console.log("\n--- Die letzten Einträge aus dem Bot-Log (bot.log) ---");
  const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n");
  const lastLines = lines.slice(-8);
  console.log(lastLines.join("\n"));
  console.log("-----------------------------------------------------\n");
} else {
  console.log("\n(Noch keine Log-Datei vorhanden)\n");
}
