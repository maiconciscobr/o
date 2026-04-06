' Starts the Ō server hidden (no console window)
' Used by Task Scheduler to auto-start on login

Dim projectDir
projectDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
projectDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(projectDir)

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = projectDir
shell.Run "cmd /c npm run dev -w apps/server > data\server.log 2>&1", 0, False
