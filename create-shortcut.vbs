Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Trading Journal Pro.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
oLink.TargetPath = ScriptDir & "\start-app.bat"
oLink.WorkingDirectory = ScriptDir
oLink.Description = "Trading Journal Pro - Offline Desktop App"
oLink.WindowStyle = 1
oLink.Save

sLinkFile2 = oWS.SpecialFolders("Programs") & "\Trading Journal Pro.lnk"
Set oLink2 = oWS.CreateShortcut(sLinkFile2)
oLink2.TargetPath = ScriptDir & "\start-app.bat"
oLink2.WorkingDirectory = ScriptDir
oLink2.Description = "Trading Journal Pro - Offline Desktop App"
oLink2.WindowStyle = 1
oLink2.Save

MsgBox "Shortcuts created successfully!" & vbCrLf & vbCrLf & "You can now launch Trading Journal Pro from your desktop or start menu.", vbInformation, "Trading Journal Pro"
