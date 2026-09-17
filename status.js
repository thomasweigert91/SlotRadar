const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LOG_FILE = path.join(__dirname, "bot.log");

console.log("\n====================================================");
console.log("📊 CleverQ Bot Status-Prüfung");
console.log("====================================================");

let runningPids = [];
try {
  const output = execSync(
    "powershell -NoProfile -Command \"(Get-CimInstance Win32_Process -Filter \\\"Name = 'node.exe'\\\" | Where-Object { $_.CommandLine -like '*bot.js*' }).ProcessId\"",
    { encoding: "utf8" },
  ).trim();

  if (output) {
    runningPids = output
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
} catch (_) {}

if (runningPids.length > 0) {
  console.log(`🟢 STATUS: Bot LÄUFT aktiv im Hintergrund!`);
  console.log(`📌 Aktive Instanz(en) [PID]: ${runningPids.join(", ")}`);
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
