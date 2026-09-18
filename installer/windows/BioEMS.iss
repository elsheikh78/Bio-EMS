#ifndef StageRoot
  #error StageRoot must point to a validated DEP-01 staging directory
#endif
#ifndef ProductVersion
  #error ProductVersion must be supplied by the controlled build
#endif

#define ProductName "BIO-EMS"

[Setup]
AppId={{7F182A31-C831-4CCF-965B-BF40A54D14C3}
AppName={#ProductName}
AppVersion={#ProductVersion}
DefaultDirName={autopf}\BIO-EMS
DefaultGroupName=BIO-EMS
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
OutputDir={#StageRoot}\output
OutputBaseFilename=BIO-EMS-Setup-{#ProductVersion}-x64
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern dynamic windows11
UseSetupLdr=x64
RedirectionGuard=yes
Uninstallable=yes
SetupLogging=yes
CloseApplications=yes
RestartApplications=no

[Dirs]
Name: "{commonappdata}\BIO-EMS"
Name: "{commonappdata}\BIO-EMS\data"
Name: "{commonappdata}\BIO-EMS\logs"
Name: "{commonappdata}\BIO-EMS\backups"
Name: "{commonappdata}\BIO-EMS\licensing"

[Files]
Source: "{#StageRoot}\package-manifest.json"; DestDir: "{app}\manifest"; Flags: ignoreversion notimestamp
Source: "{#StageRoot}\payload\manufacturer-owner-trust.json"; DestDir: "{commonappdata}\BIO-EMS\licensing"; Flags: ignoreversion notimestamp skipifsourcedoesntexist
Source: "{#StageRoot}\payload\backend.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\frontend.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\node-v22.22.0-win-x64.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\influxdb2-2.9.1-windows_amd64.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\mosquitto-2.1.2-install-windows-x64.exe"; DestDir: "{app}\vendor"; Flags: ignoreversion notimestamp
Source: "{#StageRoot}\payload\WinSW-x64.exe"; DestDir: "{app}\runtime\service-wrapper"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Install-DEP0103Services.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-BackendPreStart.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Test-PostInstallHealth.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Initialize-PilotAdmin.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; Flags: dontcopy

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\backend.zip' -DestinationPath '{app}\\backend' -Force"""; StatusMsg: "Extracting BIO-EMS backend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\frontend.zip' -DestinationPath '{app}\\frontend' -Force"""; StatusMsg: "Extracting BIO-EMS frontend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\node-v22.22.0-win-x64.zip' -DestinationPath '{app}\\runtime\\node' -Force"""; StatusMsg: "Extracting Node.js runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\influxdb2-2.9.1-windows_amd64.zip' -DestinationPath '{app}\\runtime\\influxdb' -Force"""; StatusMsg: "Extracting InfluxDB runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\influxdb2-client-2.8.0-windows-amd64.zip' -DestinationPath '{app}\\runtime\\influx-cli' -Force"""; StatusMsg: "Extracting InfluxDB backup CLI..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Install-DEP0103Services.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -ProductVersion ""{#ProductVersion}"" -CustomerName ""{code:GetCustomerName}"" -CustomerCode ""{code:GetCustomerCode}"" -SiteName ""{code:GetSiteName}"" -SiteCode ""{code:GetSiteCode}"" -SiteLocation ""{code:GetSiteLocation}"" -ContactName ""{code:GetContactName}"" -ContactEmail ""{code:GetContactEmail}"" -ContactPhone ""{code:GetContactPhone}"" -PilotMode"; StatusMsg: "Configuring protected BIO-EMS services..."; Flags: runhidden waituntilterminated; Check: IsFreshInstall
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Initialize-PilotAdmin.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -CredentialFile ""{tmp}\bioems-admin-bootstrap.txt"""; StatusMsg: "Creating the customer administrator account..."; Flags: runhidden waituntilterminated logoutput; Check: ShouldInitializeAdmin; BeforeInstall: PrepareAdminBootstrap; AfterInstall: ClearAdminBootstrap
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Test-PostInstallHealth.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -PilotMode"; StatusMsg: "Verifying BIO-EMS installation health..."; Flags: runhidden waituntilterminated logoutput; Check: IsFreshInstall
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Invoke-DEP0105Lifecycle.ps1"" -Mode PostUpdate -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"""; StatusMsg: "Verifying update and rollback safety..."; Flags: runhidden waituntilterminated; Check: WasExistingInstall
Filename: "https://localhost/"; Description: "Open BIO-EMS"; Flags: postinstall shellexec skipifsilent nowait

[UninstallRun]
; Uninstall lifecycle is executed from InitializeUninstall below so a non-zero
; lifecycle exit code can abort removal instead of Inno continuing and reporting
; a false successful uninstall.

[Icons]
Name: "{group}\BIO-EMS"; Filename: "https://localhost/"
Name: "{commondesktop}\BIO-EMS"; Filename: "https://localhost/"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a BIO-EMS desktop shortcut"

[Code]
var
  ExistingInstallAtStart: Boolean;
  ServicesPresentAtStart: Boolean;
  AdminPage: TInputQueryWizardPage;
  IdentityPage: TInputQueryWizardPage;
  InstallModePage: TInputOptionWizardPage;
  NewInstallCleanupRequired: Boolean;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
  ScriptPath: String;
  Params: String;
begin
  Result := False;
  ScriptPath := ExpandConstant('{app}\installer\Invoke-DEP0105Lifecycle.ps1');

  if not FileExists(ScriptPath) then begin
    MsgBox('BIO-EMS uninstall lifecycle script is missing. Removal has been stopped to protect customer data.', mbError, MB_OK);
    Exit;
  end;

  Params :=
    '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath +
    '" -Mode Uninstall -ApplicationRoot "' + ExpandConstant('{app}') +
    '" -PersistentRoot "' + ExpandConstant('{commonappdata}\BIO-EMS') + '"';

  if (not Exec('powershell.exe', Params, '', SW_HIDE, ewWaitUntilTerminated, ResultCode)) or
     (ResultCode <> 0) then begin
    MsgBox(
      'BIO-EMS uninstall preparation failed (exit code ' + IntToStr(ResultCode) +
      '). Removal has been stopped. Customer data has not been intentionally deleted.',
      mbError, MB_OK
    );
    Exit;
  end;

  Result := True;
end;

function HasUppercase(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= 'A') and (Value[I] <= 'Z') then begin Result := True; Exit; end;
end;

function HasLowercase(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= 'a') and (Value[I] <= 'z') then begin Result := True; Exit; end;
end;

function HasDigit(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= '0') and (Value[I] <= '9') then begin Result := True; Exit; end;
end;

procedure InitializeWizard();
begin
  if not WizardSilent then begin
    InstallModePage := CreateInputOptionPage(wpSelectTasks, 'Installation Mode',
      'Choose how BIO-EMS should be installed',
      'New Install creates a new installation identity. Reinstall / Repair preserves the existing customer, site, readings, identity, and configuration.', True, False);
    InstallModePage.Add('New Install');
    InstallModePage.Add('Reinstall / Repair');
    if ExistingInstallAtStart or ServicesPresentAtStart then InstallModePage.SelectedValueIndex := 1
    else InstallModePage.SelectedValueIndex := 0;

    IdentityPage := CreateInputQueryPage(InstallModePage.ID, 'Customer and Site',
      'Configure this BIO-EMS installation',
      'Enter the customer and site identity. BIO-EMS generates the Installation ID automatically.');
    IdentityPage.Add('Customer name:', False);
    IdentityPage.Add('Customer code:', False);
    IdentityPage.Add('Site name:', False);
    IdentityPage.Add('Site code:', False);
    IdentityPage.Add('Site location (optional):', False);
    IdentityPage.Add('Contact name (optional):', False);
    IdentityPage.Add('Contact email (optional):', False);
    IdentityPage.Add('Contact phone (optional):', False);

    AdminPage := CreateInputQueryPage(IdentityPage.ID, 'Customer Administrator',
      'Create the customer Admin account',
      'Enter credentials for the customer Admin. SYSTEM_OWNER is not created or displayed by this Setup.');
    AdminPage.Add('Admin username:', False);
    AdminPage.Add('Admin email (optional):', False);
    AdminPage.Add('Admin password:', True);
    AdminPage.Add('Confirm Admin password:', True);
    AdminPage.Values[0] := 'admin';
  end;
end;


function IdentityValue(Index: Integer; const EnvironmentName: String): String;
begin
  if WizardSilent then Result := GetEnv(EnvironmentName)
  else if IdentityPage <> nil then Result := Trim(IdentityPage.Values[Index])
  else Result := '';
end;

function GetCustomerName(Param: String): String; begin Result := IdentityValue(0, 'BIOEMS_CI_CUSTOMER_NAME'); end;
function GetCustomerCode(Param: String): String; begin Result := IdentityValue(1, 'BIOEMS_CI_CUSTOMER_CODE'); end;
function GetSiteName(Param: String): String; begin Result := IdentityValue(2, 'BIOEMS_CI_SITE_NAME'); end;
function GetSiteCode(Param: String): String; begin Result := IdentityValue(3, 'BIOEMS_CI_SITE_CODE'); end;
function GetSiteLocation(Param: String): String; begin Result := IdentityValue(4, 'BIOEMS_CI_SITE_LOCATION'); end;
function GetContactName(Param: String): String; begin Result := IdentityValue(5, 'BIOEMS_CI_CONTACT_NAME'); end;
function GetContactEmail(Param: String): String; begin Result := IdentityValue(6, 'BIOEMS_CI_CONTACT_EMAIL'); end;
function GetContactPhone(Param: String): String; begin Result := IdentityValue(7, 'BIOEMS_CI_CONTACT_PHONE'); end;

function IsNewInstallSelected(): Boolean; forward;
function IsRepairSelected(): Boolean; forward;

function NextButtonClick(CurPageID: Integer): Boolean;
var Password: String;
begin
  Result := True;
  if (InstallModePage <> nil) and (CurPageID = InstallModePage.ID) and IsNewInstallSelected() and
     (ExistingInstallAtStart or ServicesPresentAtStart or DirExists(ExpandConstant('{commonappdata}\\BIO-EMS'))) then begin
    Result := MsgBox('Existing BIO-EMS state was detected. New Install will replace the existing BIO-EMS installation identity and customer data after controlled cleanup. Continue only when this is intentionally a fresh installation.', mbConfirmation, MB_YESNO) = IDYES;
    NewInstallCleanupRequired := Result;
  end;
  if Result and (IdentityPage <> nil) and (CurPageID = IdentityPage.ID) and IsNewInstallSelected() then begin
    if Trim(IdentityPage.Values[0]) = '' then begin
      MsgBox('Customer name is required.', mbError, MB_OK); Result := False;
    end else if Trim(IdentityPage.Values[1]) = '' then begin
      MsgBox('Customer code is required.', mbError, MB_OK); Result := False;
    end else if Trim(IdentityPage.Values[2]) = '' then begin
      MsgBox('Site name is required.', mbError, MB_OK); Result := False;
    end else if Trim(IdentityPage.Values[3]) = '' then begin
      MsgBox('Site code is required.', mbError, MB_OK); Result := False;
    end;
  end;
  if Result and (AdminPage <> nil) and (CurPageID = AdminPage.ID) then begin
    Password := AdminPage.Values[2];
    if Trim(AdminPage.Values[0]) = '' then begin
      MsgBox('Admin username is required.', mbError, MB_OK); Result := False;
    end else if Password <> AdminPage.Values[3] then begin
      MsgBox('The Admin passwords do not match.', mbError, MB_OK); Result := False;
    end else if (Length(Password) < 12) or (not HasUppercase(Password)) or
      (not HasLowercase(Password)) or (not HasDigit(Password)) then begin
      MsgBox('The password must contain at least 12 characters, an uppercase letter, a lowercase letter, and a digit.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

procedure PrepareAdminBootstrap();
var Username, Password, Email: String;
begin
  if WizardSilent then begin
    Username := GetEnv('BIOEMS_CI_ADMIN_USERNAME');
    Password := GetEnv('BIOEMS_CI_ADMIN_PASSWORD');
    Email := GetEnv('BIOEMS_CI_ADMIN_EMAIL');
  end else begin
    Username := Trim(AdminPage.Values[0]);
    Email := Trim(AdminPage.Values[1]);
    Password := AdminPage.Values[2];
  end;
  SaveStringToFile(
    ExpandConstant('{tmp}\bioems-admin-bootstrap.txt'),
    Username + #13#10 + Email + #13#10 + Password,
    False
  );
end;

procedure ClearAdminBootstrap();
begin
  DeleteFile(ExpandConstant('{tmp}\bioems-admin-bootstrap.txt'));
  if AdminPage <> nil then begin
    AdminPage.Values[2] := '';
    AdminPage.Values[3] := '';
  end;
end;

function ControlledServicePresent(): Boolean;
begin
  Result :=
    RegKeyExists(HKLM, 'SYSTEM\\CurrentControlSet\\Services\\BIOEMS-Backend') or
    RegKeyExists(HKLM, 'SYSTEM\\CurrentControlSet\\Services\\BIOEMS-InfluxDB') or
    RegKeyExists(HKLM, 'SYSTEM\\CurrentControlSet\\Services\\BIOEMS-MQTT');
end;

function InstallResiduePresent(): Boolean;
begin
  Result := ExistingInstallAtStart or ServicesPresentAtStart or
    DirExists(ExpandConstant('{commonappdata}\\BIO-EMS'));
end;

function InitializeSetup(): Boolean;
var
  SilentMode: String;
begin
  ExistingInstallAtStart := RegKeyExists(HKLM64, 'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{7F182A31-C831-4CCF-965B-BF40A54D14C3}_is1');
  ServicesPresentAtStart := ControlledServicePresent();
  NewInstallCleanupRequired := False;

  if WizardSilent then begin
    SilentMode := Lowercase(Trim(GetEnv('BIOEMS_CI_INSTALL_MODE')));
    if (SilentMode <> 'new') and (SilentMode <> 'repair') then begin
      Log('BIO-EMS silent Setup rejected: BIOEMS_CI_INSTALL_MODE must be new or repair.');
      Result := False;
      Exit;
    end;
    if (SilentMode = 'new') and InstallResiduePresent() then begin
      if CompareText(Trim(GetEnv('BIOEMS_CI_CONFIRM_NEW_INSTALL_CLEANUP')), 'YES') <> 0 then begin
        Log('BIO-EMS silent New Install rejected: explicit cleanup confirmation is required.');
        Result := False;
        Exit;
      end;
      NewInstallCleanupRequired := True;
    end;
  end;

  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then begin
    ExtractTemporaryFile('backend.zip');
    ExtractTemporaryFile('frontend.zip');
    ExtractTemporaryFile('node-v22.22.0-win-x64.zip');
    ExtractTemporaryFile('influxdb2-2.9.1-windows_amd64.zip');
    ExtractTemporaryFile('influxdb2-client-2.8.0-windows-amd64.zip');
  end;
end;

function IsNewInstallSelected(): Boolean;
begin
  if WizardSilent then Result := CompareText(Trim(GetEnv('BIOEMS_CI_INSTALL_MODE')), 'new') = 0
  else Result := (InstallModePage <> nil) and (InstallModePage.SelectedValueIndex = 0);
end;

function IsRepairSelected(): Boolean;
begin
  Result := not IsNewInstallSelected();
end;

function IsFreshInstall(): Boolean;
begin
  Result := IsNewInstallSelected();
end;

function ShouldInitializeAdmin(): Boolean;
begin
  Result := IsFreshInstall() and (
    (not WizardSilent) or
    ((Trim(GetEnv('BIOEMS_CI_ADMIN_USERNAME')) <> '') and
     (GetEnv('BIOEMS_CI_ADMIN_PASSWORD') <> ''))
  );
end;

function WasExistingInstall(): Boolean;
begin
  Result := IsRepairSelected() and ExistingInstallAtStart and ServicesPresentAtStart;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ScriptPath: String;
begin
  Result := '';
  if IsNewInstallSelected() and NewInstallCleanupRequired then begin
    ExtractTemporaryFile('Invoke-DEP0105Lifecycle.ps1');
    ScriptPath := ExpandConstant('{tmp}\\Invoke-DEP0105Lifecycle.ps1');
    if not Exec('powershell.exe', '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath + '" -Mode NewInstallCleanup -ApplicationRoot "' + ExpandConstant('{app}') + '" -PersistentRoot "' + ExpandConstant('{commonappdata}\\BIO-EMS') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) or (ResultCode <> 0) then begin
      Result := 'BIO-EMS controlled New Install cleanup failed. No fresh installation was started.';
      Exit;
    end;
  end;
  if IsRepairSelected() and ExistingInstallAtStart and ServicesPresentAtStart then begin
    ExtractTemporaryFile('Invoke-DEP0105Lifecycle.ps1');
    ScriptPath := ExpandConstant('{tmp}\Invoke-DEP0105Lifecycle.ps1');
    if not Exec('powershell.exe', '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath + '" -Mode PreUpdate -ApplicationRoot "' + ExpandConstant('{app}') + '" -PersistentRoot "' + ExpandConstant('{commonappdata}\BIO-EMS') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) or (ResultCode <> 0) then
      Result := 'BIO-EMS verified pre-update backup failed.';
  end;
end;
