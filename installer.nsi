; InterTeste Agent - Instalador NSIS
; Interface Automação
; Versão: 2.1.0

!define APP_NAME "InterTeste Agent"
!ifndef APP_VERSION_OVERRIDE
  !define APP_VERSION "2.1.0"
!else
  !define APP_VERSION "${APP_VERSION_OVERRIDE}"
!endif
!define APP_PUBLISHER "Interface Automação"
!define APP_URL "https://www.interfaceautomacao.com.br"
!define APP_EXE "interteste-agent.bat"
!define INSTALL_DIR "$PROGRAMFILES64\InterTeste Agent"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\InterTesteAgent"

; Configurações gerais
Name "${APP_NAME} v${APP_VERSION}"
OutFile "InterTeste-Agent-Setup-v${APP_VERSION}.exe"
; Nota: o nome do arquivo de saída é definido automaticamente pela variável APP_VERSION
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "Software\InterTesteAgent" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma

; Includes modernos
!include "MUI2.nsh"
!include "LogicLib.nsh"

; Configurações da interface MUI2
!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao instalador do ${APP_NAME}"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá instalar o ${APP_NAME} v${APP_VERSION} no seu computador.$\r$\n$\r$\nO agente permite comunicação local com inversores de frequência e equipamentos industriais via Modbus TCP, Modbus RTU Serial e CANopen.$\r$\n$\r$\nClique em Próximo para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\interteste-agent.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar ${APP_NAME} agora"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_LINK "Acesse a plataforma InterTeste"
!define MUI_FINISHPAGE_LINK_LOCATION "https://www.interfaceautomacao.com.br"

; Páginas do instalador
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Páginas do desinstalador
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Idioma
!insertmacro MUI_LANGUAGE "PortugueseBR"

; ==================== SEÇÃO PRINCIPAL ====================
Section "InterTeste Agent" SecMain
  SectionIn RO  ; Obrigatório

  SetOutPath "$INSTDIR"

  ; Copiar todos os arquivos do agente
  File "index.js"
  File "package.json"
  File "package-lock.json"
  File "icon.ico"

  ; Copiar node_modules completo
  File /r "node_modules"

  ; Criar o script de inicialização .bat
  FileOpen $0 "$INSTDIR\interteste-agent.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "title InterTeste Agent v${APP_VERSION}$\r$\n"
  FileWrite $0 "cd /d $\"%~dp0\%\"$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo  =========================================$\r$\n"
  FileWrite $0 "echo   InterTeste Agent v${APP_VERSION}$\r$\n"
  FileWrite $0 "echo   Interface Automacao$\r$\n"
  FileWrite $0 "echo  =========================================$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "node index.js$\r$\n"
  FileWrite $0 "pause$\r$\n"
  FileClose $0

  ; Criar atalho no Desktop
  CreateShortcut "$DESKTOP\InterTeste Agent.lnk" "$INSTDIR\interteste-agent.bat" "" "$INSTDIR\icon.ico" 0

  ; Criar atalho no Menu Iniciar
  CreateDirectory "$SMPROGRAMS\InterTeste Agent"
  CreateShortcut "$SMPROGRAMS\InterTeste Agent\InterTeste Agent.lnk" "$INSTDIR\interteste-agent.bat" "" "$INSTDIR\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\InterTeste Agent\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"

  ; Registrar no Adicionar/Remover Programas
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME} v${APP_VERSION}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "Publisher" "${APP_PUBLISHER}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "URLInfoAbout" "${APP_URL}"
  WriteRegStr HKLM "${UNINSTALL_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTALL_KEY}" "NoRepair" 1

  ; Salvar diretório de instalação
  WriteRegStr HKLM "Software\InterTesteAgent" "InstallDir" "$INSTDIR"

  ; Criar desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

; ==================== SEÇÃO DESINSTALADOR ====================
Section "Uninstall"
  ; Remover arquivos
  RMDir /r "$INSTDIR\node_modules"
  Delete "$INSTDIR\index.js"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\package-lock.json"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\interteste-agent.bat"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  ; Remover atalhos
  Delete "$DESKTOP\InterTeste Agent.lnk"
  Delete "$SMPROGRAMS\InterTeste Agent\InterTeste Agent.lnk"
  Delete "$SMPROGRAMS\InterTeste Agent\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\InterTeste Agent"

  ; Remover entradas do registro
  DeleteRegKey HKLM "${UNINSTALL_KEY}"
  DeleteRegKey HKLM "Software\InterTesteAgent"

SectionEnd
