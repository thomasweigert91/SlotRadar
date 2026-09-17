require("dotenv").config();
const axios = require("axios");

async function testTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  console.log("\n====================================================");
  console.log("📱 Telegram-Benachrichtigungstest");
  console.log("====================================================");

  if (!token || !chatId) {
    console.log(
      "❌ TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID fehlt in deiner .env Datei!\n",
    );
    console.log("So richtest du Telegram in 1 Minute ein:");
    console.log("1. Öffne Telegram auf deinem Handy/PC und suche: @BotFather");
    console.log(
      '2. Schreibe "/newbot" und wähle einen Namen (z.B. "MeinTerminBot").',
    );
    console.log(
      "3. Du erhältst ein Bot-Token (z.B. 123456789:ABCdefGHIjk...).",
    );
    console.log(
      '4. Suche deinen neuen Bot in Telegram und klicke auf "Start" (WICHTIG!).',
    );
    console.log(
      "5. Suche nach @userinfobot in Telegram und drücke Start -> kopiere deine numerische ID.",
    );
    console.log("6. Trage beides in die .env Datei ein:");
    console.log("   TELEGRAM_BOT_TOKEN=dein_token_hier");
    console.log("   TELEGRAM_CHAT_ID=deine_chat_id_hier\n");
    return;
  }

  console.log(`Bot-Token:  ${token.slice(0, 10)}... (maskiert)`);
  console.log(`Chat-ID:    ${chatId}`);
  console.log("\nSende Testnachricht an Telegram...");

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId,
      text: `🚗 <b>CleverQ Termin-Bot Test</b>\n\n✅ Die Verbindung funktioniert einwandfrei!\nDu wirst sofort auf diesem Kanal benachrichtigt, sobald ein Zulassungstermin frei wird.\n\n🔗 <a href="https://cqm.cleverq.de/public/appointments/norderstedt/index.html?lang=de">CleverQ Norderstedt</a>`,
      parse_mode: "HTML",
    });

    if (res.data.ok) {
      console.log(
        "🎉 ERFOLG! Die Testnachricht ist auf deinem Telegram angekommen.",
      );
    }
  } catch (err) {
    console.error("\n❌ Fehler beim Senden:");
    if (err.response?.data) {
      console.error(
        "Telegram-Fehler:",
        JSON.stringify(err.response.data, null, 2),
      );
      if (err.response.data.description?.includes("chat not found")) {
        console.log(
          '\n💡 Tipp: Hast du deinen neuen Bot in Telegram schon gesucht und auf "Start" geklickt? Der Bot darf dir erst schreiben, wenn du die Unterhaltung einmal gestartet hast.',
        );
      }
    } else {
      console.error(err.message);
    }
  }
}

testTelegram();
