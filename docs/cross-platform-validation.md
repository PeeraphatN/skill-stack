# ผลตรวจข้ามแพลตฟอร์ม — Issue #9

ตรวจเมื่อ 21 ตุลาคม 2026 จาก integration snapshot `bd72fd9` สำหรับ [Issue #9](https://github.com/PeeraphatN/skill-stack/issues/9)
โดยอ่าน [PRD](PRD.md), [SRS](SRS.md), [ผลสำรวจ upstream](install-methods.md), [manifest contract](manifest.md)
และ [คู่มือ installer](installer.md) ก่อนรัน ไม่มีการแก้ installer, wrappers หรือ manifest ที่ส่งมอบ

รอบนี้ **ยังไม่ผ่านการตรวจรับ MVP ข้ามสาม OS** แม้ macOS ติดตั้งชุดจริงครบแล้ว เพราะยังขาดผล Linux native
และหลักฐานว่า Codex, Pi, Hermes โหลด skills ได้จริง การตรวจไฟล์กับลิงก์ไม่ทดแทนการเปิด agent
หรือทดสอบ hooks, plugins และเครื่องมือที่เนื้อหา skill เรียกใช้

## macOS: ติดตั้งจริงครบ 23 skills

ใช้ macOS 26.6.2 build 25G83, arm64, Node v22.23.2, npm/npx 12.0.2, Git 2.50.1 (Apple Git-155)
และ skills CLI 1.7.2 ติดตั้งทั้งสี่ repositories และ 23 skills จาก manifest จริง ไม่ลดรายการ
หลักฐานอยู่ใน [macOS summary](validation/issue-9/macos-summary.json), [manifest ที่ใช้](validation/issue-9/manifest.json),
[log ติดตั้งครั้งแรก](validation/issue-9/macos-first-install.log) และ [ผลตรวจ paths ทั้ง 23 ชื่อ](validation/issue-9/macos-paths.json)

checkout, home และ working directory แยกอยู่ใต้ temporary root เดียวกัน ชื่อ checkout/home มีช่องว่างกับอักษรไทย
ใช้ environment ใหม่ที่ไม่ส่งค่า agent overrides จาก session จริง และกำหนด HOME, HERMES_HOME, CODEX_HOME,
npm cache กับ TMPDIR ให้อยู่ใน root ชั่วคราว ใช้ Git config ว่างและปิด telemetry ไม่เปิด agent
จึงไม่มีการติดตั้งหรือแก้ skills ส่วนตัวของผู้ใช้ ในหลักฐานแทน temporary prefix ด้วย `$SMOKE_ROOT` เพื่อให้อ่านง่าย

เรียก `node <temporary-checkout>/install.mjs` จาก directory อื่น ได้ exit 0 และ `linked` ครบสี่ entries
มี transparent `npx` launcher ชั่วคราวที่บันทึก argv แล้วส่งต่อให้ npx จริงด้วย arguments เดิมและ `shell: false`
ไม่มี process จำลองในรอบติดตั้งนี้ summary เก็บ argv กับ exit code จากคำสั่งจริง โดยคำสั่งแต่ละ entry เป็น:

```text
npx --yes skills@1.7.2 add <repo> --global --agent codex pi hermes-agent --skill <selected skills> --yes
```

Codex/Pi ใช้ `.agents/skills/<skill>` ตรงกันทั้ง 23 ชื่อ ส่วน Hermes มี symlink 23 ตัวที่ `realpath`
ตรงกับ source ไม่มี dangling link สร้างไฟล์ probe ใน source แล้วอ่านผ่าน Hermes ได้ตรงกันทุกชื่อ
ก่อนลบ probe ออก ความสำเร็จนี้ยืนยันการใช้ไฟล์ร่วมกัน แต่ยังไม่ยืนยัน discovery ภายใน agent

1. รันซ้ำผ่าน Node, `sh install.sh` และ executable `install.sh` จาก directory อื่น ได้ exit 0 ทั้งสามแบบ
   ทุก entry เป็น `skipped: already installed and verified` ตรวจ snapshot ชื่อไฟล์ เนื้อหาและ link targets
   ก่อน/หลังตรงกัน รวมถึง sentinel skill นอก manifest ดู [log shell rerun](validation/issue-9/macos-rerun-sh.log)
2. ใน home ชั่วคราว ย้าย link ของ `no-ai-slop` ออกแล้ววางไฟล์จริงชื่อชนกัน รัน shell wrapper ได้ exit 1
   พร้อม `destination conflict` เนื้อหา sentinel ยังอยู่ entries อื่นยังผ่าน จากนั้นคืน link เดิมและตรวจ snapshot ตรงเดิม
   ดู [conflict log](validation/issue-9/macos-conflict.log)
3. อีก home ชั่วคราวเรียก CLI จริงด้วย `--copy` สำหรับ `no-ai-slop` ได้ exit 0 และ Hermes เป็น directory จริง
   จากนั้นใช้ installer เดิมกับ manifest ชั่วคราวที่เลือกเฉพาะ entry นี้ ได้ exit 0 พร้อม `WARNING ... copied fallback`
   ดู [copy rerun log](validation/issue-9/macos-copy-rerun.log) นี่เป็นการบังคับโหมด copy ของ CLI เพื่อยืนยันการตรวจและคำเตือน
   ไม่ใช่หลักฐาน permission fallback อัตโนมัติหรือการผ่านเกณฑ์ source ร่วมกัน

CLI ไม่ pin upstream revision และลบ temporary clone หลังติดตั้ง จึงไม่ทราบ commit SHA ที่ดาวน์โหลดแน่นอน
เก็บ [skill lock ที่ CLI สร้าง](validation/issue-9/macos-skills-lock.json) ไว้พร้อม `source`, `skillPath`, `skillFolderHash`
และเวลาติดตั้งแทน ค่า folder hash ไม่ใช่ commit SHA ของ repository และห้ามใช้แทนกัน

## Automated suite และ shell syntax

รันจาก checkout นี้ด้วย environment ที่แยก home หลังตรวจ source ของ tests ว่าใช้ temporary filesystem
และ injected runners โดยไม่ดาวน์โหลดหรือติดตั้ง upstream ผ่าน tests ไม่มีการเพิ่ม tests จึงไม่ได้ใช้ TDD skill

```sh
node --test
node scripts/validate-manifest.mjs
sh -n install.sh
bash -n install.sh
```

ทุกคำสั่ง exit 0; suite **25 passed, 0 failed, 0 skipped** ดู [TAP log](validation/issue-9/macos-automated.log)
ครอบคลุม invalid manifest, prerequisites, argv literal, wrong/dangling links, copy verification, conflict preservation,
partial/download failures, Windows npm JS entry-point resolution แบบจำลอง และ timeout ที่หยุด descendants
PowerShell test เป็น static contract เท่านั้น ส่วน shell wrapper ใช้ installer จำลองเพื่อพิสูจน์ path/argv/exit forwarding
จึงต้องแยกผลนี้ออกจากการติดตั้งจริงข้างบน และไม่ถือว่า Windows/Linux ผ่านเพราะ suite ผ่านบน macOS

## Windows native: ตรวจผ่าน Orca

ผล probe ยืนยันว่ามี connected Windows native ผ่าน Orca environment `home-pc` ไม่ใช่ WSL:
`orca status --environment home-pc --json` ได้ runtime `ready`, `reachable: true`, app 1.4.237
สร้าง terminal สำหรับ probe โดยเฉพาะ ได้ `hostPlatform: win32` และรัน Node พบ
`{"platform":"win32","node":"v24.11.0","arch":"x64"}`
ไม่ส่งคำสั่งเข้า terminal ของ agent ที่ทำงานอื่นอยู่

ใช้ Orca binary จริง `/Applications/Orca.app/Contents/Resources/bin/orca` เพราะ `/usr/local/bin/orca`
ตอบ `Unable to determine Orca.app path from symlink` คำสั่ง inventory ที่ใช้คือ:

```sh
/Applications/Orca.app/Contents/Resources/bin/orca environment list --json
/Applications/Orca.app/Contents/Resources/bin/orca status --environment home-pc --json
/Applications/Orca.app/Contents/Resources/bin/orca terminal list --environment home-pc --json
```

ทดสอบบน Windows NT 10.0.26300 x64, Node v24.11.0, npm/npx 11.6.1, Git 2.49.0.windows.1,
PowerShell 5.1.26100.9711 และ skills CLI 1.7.2 ส่งสำเนา installer/lib/manifest เดียวกับ macOS
เข้า temporary directory ผ่าน terminal ที่สร้างใหม่ ไม่แก้ checkout ของงานอื่นหรือ skills จริง

รอบแรกใช้ `runInstaller({ manifestPath, home, env, run })` จาก Node harness ชั่วคราว โดย `run` บันทึก arguments
แล้วส่งต่อให้ `runProcess` จริง ไม่มีผลลัพธ์จำลอง กำหนด USERPROFILE และ HOME ไป home ชั่วคราวเดียวกัน
พร้อม HERMES_HOME, CODEX_HOME และ npm cache ที่แยกไว้ แล้วตรวจยืนยันด้วยการเรียก `node install.mjs`
จริงใน child process อีกครั้งจาก working directory อื่น ไม่มีการเปลี่ยน execution policy หรือขอ administrator

ติดตั้งครบ 23 skills ได้ `linked` ทั้งสี่ entries และ exit 0 ตรวจ `lstat().isSymbolicLink()` กับ `realpath`
ของ Hermes ครบ 23 ชื่อและไฟล์ probe สะท้อนจาก source ครบ ลิงก์ directory บน Windows ยอมรับ junction
ตาม CLI; หลักฐานนี้ไม่แยก reparse tag ว่าเป็น junction หรือ symbolic link แบบใด
ดู [Windows summary และ paths](validation/issue-9/windows-summary.json), [commands/versions](validation/issue-9/windows-commands.json)
และ [first-install log](validation/issue-9/windows-first-install.log)

เรียก Node CLI ซ้ำได้ exit 0 และเรียก wrapper จริงด้วยคำสั่งต่อไปนี้ใน PowerShell จาก directory อื่น
ได้ exit 0 พร้อม `skipped` ทั้งสี่ entries ดู [Node rerun](validation/issue-9/windows-rerun-node.log)
และ [PowerShell rerun](validation/issue-9/windows-rerun-ps1.log):

```powershell
& '<temporary-root>\checkout ไทย spaces\install.ps1'
exit $LASTEXITCODE
```

เพิ่ม sentinel skill นอก manifest แล้วรัน wrapper ซ้ำ ตรวจ hash snapshot ทุกไฟล์และ link targets ไม่เปลี่ยน
ทดสอบไฟล์จริงชื่อชนกับ Hermes `no-ai-slop` ใน home ชั่วคราว ได้ exit 1 และเก็บเนื้อหาไฟล์เดิมครบ
คืน link เดิมแล้ว snapshot ตรงก่อนทดสอบ จากนั้นทำ manifest ชั่วคราวเป็น JSON เสีย ได้ wrapper exit 1
พร้อม `Manifest failed` แล้วคืน manifest เดิม ดู [Windows negative checks](validation/issue-9/windows-extra-summary.json)

Windows **ผ่านเฉพาะ installation/filesystem/rerun/conflict และ wrapper success/failure ที่ระบุ**
ยังไม่ได้รัน automated suite บน Windows, fresh install ผ่าน wrapper, permission-denied fallback หรือ agent discovery
จึงยังไม่ผ่าน SRS AC ทั้งชุด การเตรียม Node harness มี URL-path decoding และ syntax error สองครั้งก่อนเริ่มติดตั้ง
แก้เฉพาะ harness ชั่วคราวแล้วรันใหม่ ไม่ใช่ failure ของ installer และไม่มี product code เปลี่ยน

## ตรวจซ้ำโดยไม่แตะ home จริง

บน macOS/Linux ใช้ temporary checkout กับ manifest เดิม และแยก environment ทุกครั้ง อย่ารัน installer
จาก checkout จริงโดยไม่ได้ครอบ environment ตัวอย่างนี้ไม่มี transparent tracing launcher แต่เรียก installer/CLI รูปแบบเดียวกัน:

```sh
SMOKE_ROOT=$(mktemp -d)
mkdir -p "$SMOKE_ROOT/checkout ไทย spaces" "$SMOKE_ROOT/home ไทย spaces" "$SMOKE_ROOT/other cwd" "$SMOKE_ROOT/cache" "$SMOKE_ROOT/tmp"
cp install.mjs install.sh install.ps1 manifest.json "$SMOKE_ROOT/checkout ไทย spaces/"
cp -R lib "$SMOKE_ROOT/checkout ไทย spaces/"
cd "$SMOKE_ROOT/other cwd"
env -i PATH="$PATH" HOME="$SMOKE_ROOT/home ไทย spaces" \
  HERMES_HOME="$SMOKE_ROOT/home ไทย spaces/.hermes" CODEX_HOME="$SMOKE_ROOT/home ไทย spaces/.codex" \
  npm_config_cache="$SMOKE_ROOT/cache" TMPDIR="$SMOKE_ROOT/tmp" \
  DISABLE_TELEMETRY=1 NO_COLOR=1 CI=1 GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 \
  node "$SMOKE_ROOT/checkout ไทย spaces/install.mjs"
printf 'exit=%s\n' "$?"
```

เรียก environment เดิมซ้ำโดยเปลี่ยนท้ายเป็น `sh "$SMOKE_ROOT/checkout ไทย spaces/install.sh"`
และ executable wrapper เก็บ exit ทันทีทุกครั้ง ตรวจ SKILL.md, `lstat`, `realpath` ของทุกชื่อใน manifest
ตรวจ source reflection ด้วยไฟล์ probe แล้วลบเฉพาะ probe รวมถึง hash snapshot ก่อน/หลังและ sentinel นอก manifest
ห้ามใช้ไฟล์ส่วนตัวเป็น conflict fixture และไม่ต้องเปิด agent จนกว่าจะตั้ง isolation ของ host นั้นครบ

บน Windows เปิด PowerShell สำหรับทดสอบโดยเฉพาะก่อนใช้คำสั่งต่อไปนี้ แทน `$checkout` ด้วยสำเนา snapshot
ที่อยู่ใต้ temporary root เช่นเดียวกับรอบจริง ตั้ง USERPROFILE ด้วย เพราะ Node บน Windows ไม่ใช้ HOME เพียงตัวเดียว:

```powershell
$smokeRoot = Join-Path ([IO.Path]::GetTempPath()) ('skill-stack-issue9-' + [guid]::NewGuid())
$testHome = Join-Path $smokeRoot 'home ไทย spaces'
New-Item -ItemType Directory -Path $testHome -Force | Out-Null
$env:USERPROFILE = $testHome
$env:HOME = $testHome
$env:HERMES_HOME = Join-Path $testHome '.hermes'
$env:CODEX_HOME = Join-Path $testHome '.codex'
$env:npm_config_cache = Join-Path $smokeRoot 'cache'
$env:DISABLE_TELEMETRY = '1'
$env:GIT_CONFIG_GLOBAL = 'NUL'
$env:GIT_CONFIG_NOSYSTEM = '1'
node -e "console.log(require('os').homedir())"
node (Join-Path $checkout 'install.mjs')
$LASTEXITCODE
& (Join-Path $checkout 'install.ps1')
$LASTEXITCODE
```

เก็บผล home probe ก่อนเริ่ม ต้องตรง `$testHome` แล้วตรวจ link และ probe แบบเดียวกับ macOS
หาก policy บล็อก wrapper ให้เก็บ error และใช้ Node entry point โดยไม่เปลี่ยน policy เมื่อจบปิดเฉพาะ shell ทดสอบนี้
อย่านำ shell ที่เปลี่ยน USERPROFILE/HOME แล้วกลับไปใช้เป็น session ทำงานปกติ

## หลักฐานที่ยังต้องเก็บเพื่อปิดเกณฑ์ SRS

**AC-01/AC-06:** ต้องติดตั้ง manifest เต็มบน Linux native และบันทึกรุ่น OS/Node/npm/Git/CLI, stdout/stderr,
exit code, source/destinations และ shell wrapper ทั้งสำเร็จ/ล้มเหลว macOS ผ่านส่วนติดตั้งและ path/wrapper แล้ว
แต่ AC-01 ยังไม่ครบจนมี discovery ของทั้งสาม agents

**AC-02/AC-03/AC-04:** automated suite มีหลักฐาน validation/conflict/partial failure แบบจำลองแล้ว
macOS มี rerun/conflict จริงเพิ่ม ต้องเก็บผลเทียบเท่าบน OS ที่เหลือ รวมถึง network failure ระหว่าง entries,
รายการหลัง failure ที่ยังทำต่อ และการแก้สาเหตุแล้วรันซ้ำโดยไม่ทำลายรายการเดิม

**AC-05:** ยังต้องทดสอบ Windows ที่สร้าง link ไม่ได้โดยไม่ยกระดับสิทธิ์ ไม่เปิด Developer Mode และไม่เปลี่ยน execution policy
บันทึกว่า CLI เลือก junction/copy หรือ failed ถ้าเป็น copy ต้องตรวจต้นไม้และเห็น warning ห้ามนับเป็น source reflection pass
รวมถึงกรณี npm/npx หาย, CLI version ไม่ตรง และ home/destination เขียนไม่ได้บน OS จริง

**AC-07:** เปิด Codex, Pi, Hermes ในบัญชีทดสอบหรือ VM ที่แยก home ถูกต้อง บันทึก version ของ agent และหลักฐาน discovery
ที่แสดงชื่อครบ manifest (เช่น skill picker/catalog ของแต่ละรุ่น) พร้อมอ่าน SKILL.md จาก path ที่ติดตั้งจริง
จากนั้นทดสอบเรียก skill ที่เลือกหนึ่งรายการต่อ agent โดยไม่เปลี่ยน repo/credentials ส่วนตัว การเห็น directory อย่างเดียวไม่ผ่านข้อนี้
หาก host ใดไม่รองรับ Windows native ต้องระบุชื่อ agent รุ่นและ error เป็น blocker แทนการใช้ WSL มาทดแทน
