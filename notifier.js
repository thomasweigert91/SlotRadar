const notifier = require("node-notifier");
const { exec } = require("child_process");
const axios = require("axios");

class Notifier {
  constructor(config = {}) {
    this.soundAlert = config.soundAlert !== false;
    this.desktopAlert = config.desktopAlert !== false;
    this.autoOpenBrowser = config.autoOpenBrowser !== false;
    this.bookingUrl =
      config.bookingUrl ||
      "https://cqm.cleverq.de/public/appointments/norderstedt/index.html?lang=de";
    this.telegramToken = config.telegramToken || process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID;
    this.discordWebhook =
      config.discordWebhook || process.env.DISCORD_WEBHOOK_URL;
  }

  /**
   * Play alert sound (Windows beep)
   */
  playSound() {
    if (!this.soundAlert) return;
    try {
      // Multiple beeps to catch user's attention
      if (process.platform === "win32") {
        exec(
          'powershell -c "[Console]::Beep(800, 200); [Console]::Beep(1200, 300); [Console]::Beep(1600, 400)"',
        );
      } else {
        process.stdout.write("\x07");
      }
    } catch (_) {}
  }

  /**
   * Open the booking webpage in default browser
   */
  openBrowser() {
    if (!this.autoOpenBrowser) return;
    const startCmd =
      process.platform === "win32"
        ? `start "" "${this.bookingUrl}"`
        : process.platform === "darwin"
          ? `open "${this.bookingUrl}"`
          : `xdg-open "${this.bookingUrl}"`;
    exec(startCmd, (err) => {
      if (err)
        console.log(
          "[Notifier] Konnte Browser nicht automatisch öffnen:",
          err.message,
        );
    });
  }

  /**
   * Show Windows toast notification
   */
  showDesktopNotification(title, message) {
    if (!this.desktopAlert) return;
    notifier.notify({
      title: title || "Termin gefunden!",
      message: message,
      sound: true,
      wait: true,
    });
  }

  /**
   * Send notification via Telegram Bot if configured
   */
  async sendTelegram(text) {
    if (!this.telegramToken || !this.telegramChatId) return;
    try {
      const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.telegramChatId,
        text: text,
        parse_mode: "HTML",
      });
      console.log("[Notifier] Telegram-Benachrichtigung erfolgreich gesendet.");
    } catch (err) {
      console.error("[Notifier] Fehler beim Senden an Telegram:", err.message);
    }
  }

  /**
   * Send notification via Discord Webhook if configured
   */
  async sendDiscord(content) {
    if (!this.discordWebhook) return;
    try {
      await axios.post(this.discordWebhook, {
        content: content,
      });
      console.log("[Notifier] Discord-Nachricht gesendet.");
    } catch (err) {
      console.error("[Notifier] Fehler beim Senden an Discord:", err.message);
    }
  }

  /**
   * Trigger all configured notifications
   */
  async notify(title, message, slots = []) {
    this.playSound();
    this.showDesktopNotification(title, message);
    this.openBrowser();

    let fullMsg = `🚨 <b>${title}</b>\n\n${message}\n\n`;
    if (slots.length > 0) {
      fullMsg +=
        `<b>Verfügbare Termine:</b>\n` +
        slots.map((s) => `• ${s}`).join("\n") +
        `\n\n`;
    }
    fullMsg += `👉 <a href="${this.bookingUrl}">Jetzt buchen</a>`;

    await Promise.allSettled([
      this.sendTelegram(fullMsg),
      this.sendDiscord(`🚨 **${title}**\n${message}\nLink: ${this.bookingUrl}`),
    ]);
  }
}

module.exports = Notifier;
