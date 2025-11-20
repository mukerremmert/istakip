; NSIS Custom Installer Script
; Kurulum dizinini "Program Files\Connex İş Takip Sistemi" olarak ayarla
; Alt klasör oluşturulmasını tamamen engelle

!macro preInit
  ; En önce çalışır - Registry'yi ayarla
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\Connex İş Takip Sistemi"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$PROGRAMFILES64\Connex İş Takip Sistemi"
!macroend

!macro customInit
  ; Kurulum dizinini direkt olarak ayarla - alt klasör eklenmeden
  StrCpy $INSTDIR "$PROGRAMFILES64\Connex İş Takip Sistemi"
!macroend

!macro customInstall
  ; Kurulum sonrası işlemler
!macroend

!macro customHeader
  ; NSIS header'da InstallDir'i override et
  !ifdef MUI_PAGE_DIRECTORY
    !define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Kurulum Dizini"
    !define MUI_DIRECTORYPAGE_TEXT_TOP "Program aşağıdaki klasöre kurulacak."
  !endif
!macroend

; electron-builder'ın oluşturduğu alt klasörü override et
!macro customRemoveFiles
  ; Alt klasör varsa içeriği bir üst klasöre taşı
!macroend
