Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Trading Journal Pro.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)

' Get the current directory where this script is located
scriptPath = WScript.ScriptFullName
scriptDir = Left(scriptPath, InStrRev(scriptPath, "\"))

' Set shortcut properties
oLink.TargetPath = scriptDir & "start-trading-journal.bat"
oLink.WorkingDirectory = scriptDir
oLink.Description = "Trading Journal Pro - Your Personal Trading Analytics Platform"
oLink.WindowStyle = 1
oLink.Save

WScript.Echo "Desktop shortcut created successfully!" & vbCrLf & vbCrLf & "You can now double-click 'Trading Journal Pro' on your desktop to start the app."
