Set WshShell = CreateObject("WScript.Shell")
' Startet den Bot komplett unsichtbar im Hintergrund
WshShell.Run "node bot.js", 0, False
MsgBox "CleverQ Termin-Bot wurde im Hintergrund gestartet!" & vbCrLf & "VS Code kann geschlossen werden." & vbCrLf & vbCrLf & "Zum Beenden doppelklicke auf 'bot-stoppen.bat'.", vbInformation, "CleverQ Bot aktiv"

