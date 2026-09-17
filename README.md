# 🚗 CleverQ Termin-Bot (Norderstedt & Co.)

Ein automatisierter Bot zur Überwachung freier Termine auf CleverQ (z. B. Kfz-Zulassungsstelle Norderstedt / Kreis Segeberg).

Der Bot prüft in regelmäßigen Abständen auf freie Termine, listet bei Fund sofort die **genauen Uhrzeiten / Zeitslots** auf und benachrichtigt dich per **Desktop-Benachrichtigung**, **Sound-Alarm**, **automatischem Browser-Öffnen** und optional via **Telegram / Discord**.

---

## ⚡ Features

- **Automatisches Session-Management:** Du musst keine Keys mehr manuell aus den Chrome DevTools kopieren! Der Bot holt sich den `booking_session_key` und Cookies automatisch direkt von der CleverQ-Webseite und erneuert sie selbstständig, sobald sie ablaufen.
- **Detaillierte Zeitslot-Erkennung:** Findet nicht nur freie Tage, sondern fragt direkt alle verfügbaren Uhrzeiten (`08:35 Uhr`, `13:45 Uhr`, etc.) ab.
- **Multikanal-Benachrichtigung:**
  - 🔔 Windows Desktop-Benachrichtigung (Toast)
  - 🔊 Sound-Alarm (Beep)
  - 🌐 Öffnet bei Fund sofort die Buchungsseite im Browser
  - 📱 Optional: Push-Nachricht auf dein Smartphone via **Telegram**
  - 💬 Optional: Benachrichtigung per **Discord Webhook**
- **Flexibel für alle Dienstleistungen:** Mit einem einfachen Befehl (`npm run list`) kannst du alle Dienstleistungen & Subtasks (Zulassung, Abmeldung, Ersatzpapiere, Führerschein, etc.) auflisten und überwachen.

---

## 🚀 Schnellanleitung

### 1. Bot starten

```bash
npm start
```

Der Bot prüft standardmäßig alle 30 Sekunden auf Termine für die **Zulassung/Umschreibung eines Fahrzeuges** (Subtask-ID `191`).

### 2. Einmalige Prüfung durchführen

```bash
npm run once
```

### 3. Alle verfügbaren Dienstleistungen & IDs anzeigen

```bash
npm run list
```

Gibt eine übersichtliche Tabelle mit allen verfügbaren Anliegen und deren `subtaskId` aus:

- `190`: Außerbetriebsetzung
- `191`: Zulassung/Umschreibung eines Fahrzeuges
- `192`: Änderung der persönlichen Daten
- `364`: Änderung der Fahrzeugdaten
- `231`: Internationaler Führerschein
- `2173`: Ersatz Fahrzeugschein (Teil I)
- `366`: Ersatz Fahrzeugbrief (Teil II)
- `193`: Kurzzeitkennzeichen
- `367`: Ausfuhrkennzeichen
- etc.

---

## ⚙️ Konfiguration (`.env`)

Du kannst das Verhalten des Bots in der [`.env`](file:///d:/Scraper%20Bot%20Termine/.env) Datei anpassen:

```env
# Standort (URL-Slug)
SITE_SLUG=norderstedt

# Service-ID (Norderstedt = 280)
SERVICE_ID=280

# Subtask-ID (Standard: 191 für Kfz-Zulassung)
SUBTASK_ID=191

# Anzahl Personen/Vorgänge
SUBTASK_COUNT=1

# Suchzeitraum ab heute in Wochen (Standard: 12 Wochen)
WEEKS_AHEAD=12

# Prüf-Intervall in Sekunden (Standard: 30)
CHECK_INTERVAL_SECONDS=30

# Benachrichtigungen (true / false)
SOUND_ALERT=true
DESKTOP_NOTIFICATION=true
AUTO_OPEN_BROWSER=true

# Optional: Push-Nachricht auf dein Smartphone (Telegram)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Optional: Discord Webhook
DISCORD_WEBHOOK_URL=
```

---

## 🛠️ CLI-Optionen

Du kannst Parameter auch direkt beim Start übergeben:

```bash
# Anderen Subtask prüfen (z. B. Außerbetriebsetzung mit ID 190)
node bot.js --subtask 190

# Prüf-Intervall auf 15 Sekunden setzen
node bot.js --interval 15

# Nur einmalig prüfen mit bestimmtem Subtask
node bot.js --once --subtask 190

# Subtasks auflisten
node bot.js --list
```

---

## 📱 Telegram-Benachrichtigung einrichten (Optional)

Wenn du unterwegs auf deinem Handy alarmiert werden möchtest:

1. Öffne Telegram und suche nach `@BotFather`.
2. Sende `/newbot` und folge den Schritten, um ein Bot-Token zu erhalten.
3. Trage das Token in der `.env` unter `TELEGRAM_BOT_TOKEN=` ein.
4. Suche nach `@userinfobot` in Telegram und klicke auf Start, um deine persönliche `Id` zu erfahren.
5. Trage deine ID in der `.env` unter `TELEGRAM_CHAT_ID=` ein.
6. Fertig! Sobald ein Termin frei wird, vibriert dein Handy mit direktem Buchungslink.
