; Remove Pip's hooks from Claude Code's settings when Pip is uninstalled.
!macro customUnInstall
  ExecWait '"$INSTDIR\Pip.exe" --uninstall-hooks'
!macroend
