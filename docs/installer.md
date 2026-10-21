# ใช้ installer ของ Skill Stack

เริ่มด้วย Node.js >=22.20.0, npm/npx และ Git ที่เรียกได้ใน PATH เครื่องต้องเชื่อมต่อ npm registry
และ public GitHub repositories ได้ รวมถึงเขียน home กับ agent destinations ของผู้ใช้ปัจจุบันได้
ไม่ต้องติดตั้ง skills CLI ล่วงหน้า สคริปต์ตรวจ `skills@1.7.2` ก่อนเริ่มติดตั้งและใช้รุ่นนี้ทุกรายการ
โดยยึด flags และ agent paths จาก [ผลสำรวจ upstream](install-methods.md)

```bash
node install.mjs
```

เรียก `node /path/to/skill-stack/install.mjs` จาก directory อื่นได้เช่นกัน รวมถึง path ที่มีช่องว่าง
หรืออักษรไทย สคริปต์อ่าน `manifest.json` ข้างตัวเอง ไม่อ่าน manifest ใน working directory
รายการ source, skills และ agents มาจาก manifest ทั้งหมด ดูกติกาที่ [Manifest contract](manifest.md)

## เรียกผ่าน shell บน Linux/macOS

จาก checkout ใช้ `./install.sh` หรือ `sh install.sh` ได้ หากอยู่ directory อื่น ให้ระบุ path ของ checkout:

```sh
sh "/path/to/skill-stack/install.sh"
```

`install.sh` ใช้ POSIX `sh` ไม่ต้องมี Bash โดยหา `install.mjs` จาก directory ของ wrapper
แล้วส่งต่อให้ `node` ใน PATH ด้วย `exec` จึงคืน exit code และแสดงผลของ installer โดยตรง
ไม่เปลี่ยน working directory ของ installer และไม่มีรายการ skills หรือตรรกะติดตั้งแยกอีกชุด
รองรับ path ที่มีช่องว่างและอักษรไทย เมื่อเรียกด้วย path ให้ครอบด้วยเครื่องหมายคำพูด
ควรเรียกไฟล์ wrapper ใน checkout โดยตรง ไม่ใช่ symlink ที่วางแยกจาก `install.mjs`

arguments ถูกส่งต่อแบบเดิมทุกตัว แต่ `install.mjs` ปัจจุบันยังไม่มี command-line options
ถ้าขึ้น `node: not found` ให้ติดตั้ง Node.js >=22.20.0 หรือเพิ่ม Node.js ใน PATH แล้วเรียกใหม่
wrapper จะจบด้วยสถานะไม่สำเร็จเมื่อหา Node.js ไม่พบ และไม่ติดตั้ง Node.js ให้เอง

บน Windows ใช้ Node เรียก `npm-cli.js` และ `npx-cli.js` โดยตรง เพราะ `.cmd` ต้องใช้ shell
สคริปต์หาสองไฟล์นี้ใต้ `node_modules/npm/bin` ข้าง Node executable หรือในแต่ละ directory ของ PATH
ถ้าไม่พบให้ติดตั้ง Node.js พร้อม npm ให้ครบหรือเพิ่ม directory ที่มีโครงสร้างนี้เข้า PATH
ไม่มีการเรียก shell string, Bash, PowerShell, sudo หรือขอสิทธิ์ administrator

## เรียกผ่าน PowerShell บน Windows

ใช้ `install.ps1` เป็นทางเลือกจาก PowerShell 5.1 ขึ้นไป โดยต้องมี `node` ใน PATH:

```powershell
.\install.ps1
```

จาก directory อื่น รวมถึง checkout ที่มีช่องว่างหรืออักษรไทย ใช้ call operator `&`:

```powershell
& 'C:\งานของฉัน\skill stack\install.ps1'
$LASTEXITCODE
```

wrapper หา `install.mjs` จาก directory ของตัวเอง ส่ง arguments ต่อให้ Node ด้วย `@args`
และคืน exit code ของ Node ตามจริง โดยไม่เปลี่ยน working directory ดังนั้น `HERMES_HOME`
ที่เป็น relative path ยังอิง directory ที่เรียกเหมือนใช้ Node โดยตรง ปัจจุบัน `install.mjs`
ยังไม่มี CLI options; การส่ง arguments ต่อไม่ได้เพิ่มคำสั่งหรือ flags ให้ installer
ถ้าเรียก Node ไม่ได้ wrapper จะหยุดด้วย error และสถานะไม่สำเร็จ ให้ติดตั้ง Node.js หรือแก้ PATH ก่อนลองใหม่
ตรรกะตรวจ prerequisites, manifest และติดตั้งทั้งหมดอยู่ใน Node ไม่มีรายการ skills ซ้ำใน wrapper

หาก execution policy บล็อกไฟล์ `.ps1` ให้ใช้ทางเข้าหลักแทนโดยไม่ต้องเปลี่ยน policy หรือขอ administrator:

```powershell
node 'C:\งานของฉัน\skill stack\install.mjs'
```

## สิ่งที่สคริปต์ทำ

สคริปต์ตรวจ manifest ทั้งชุดก่อนเรียก process จากนั้นตรวจ Node, สิทธิ์เขียน home, npm/npx,
Git และรุ่น skills CLI การตรวจ CLI อาจดาวน์โหลด package เข้า npm cache แต่ยังไม่ติดตั้ง skills
หาก prerequisites ไม่ผ่าน ทุก entry เป็น `skipped` และคืน exit code 1

ก่อนเริ่มติดตั้ง สคริปต์ตรวจ destination ของทุกรายการเพื่อหลีกเลี่ยง overwrite จาก CLI
แล้วประมวลผลตามลำดับ manifest โดยส่ง arguments แยกจาก executable รูปแบบต่อไปนี้:

```text
npx --yes skills@1.7.2 add <repo> --global --agent <agents> --skill <selected skills> --yes
```

Codex และ Pi อ่าน global source ที่ `<home>/.agents/skills/<skill>` โดยตรง ส่วน Hermes ใช้
`<home>/.hermes/skills/<skill>` หรือ `<HERMES_HOME>/skills/<skill>` ถ้าตั้งตัวแปรไว้
ค่า HERMES_HOME ถูก trim ตาม CLI และถ้าเป็น relative path จะอิง working directory
CODEX_HOME ไม่เปลี่ยน global shared destination ใน CLI รุ่นนี้

แต่ละ prerequisite process มี timeout 60 วินาที แต่ละคำสั่งติดตั้งมี timeout 300 วินาที
ไม่มี automatic retry เมื่อหมดเวลาสคริปต์หยุด process tree ด้วย process group บน Unix
หรือ `taskkill.exe /T /F` บน Windows และทำ entry ถัดไป ผลสำเร็จก่อนหน้ายังคงอยู่ ไม่มี rollback
บน Windows ต้องเรียก taskkill.exe ได้เพื่อหยุดลูกของ npm/skills/Git ครบทั้งต้นไม้

## อ่านผลและติดตั้งซ้ำ

`linked` หมายถึงตรวจพบ SKILL.md ใน global source และทุก agent destination แล้ว
Codex/Pi ใช้ source โดยตรง ส่วน Hermes ต้องเป็น symlink หรือ junction ที่ resolve ไป source เดียวกัน
หาก CLI คืนศูนย์แต่ไฟล์หายหรือ link ผิด สคริปต์นับเป็น `failed` แทนความสำเร็จ

`copied` พร้อม WARNING หมายถึง CLI สร้าง directory จริงแทน link สคริปต์เทียบโครงสร้างและเนื้อหา
ทุกไฟล์กับ global source ก่อนยอมรับ และแสดงชื่อ agent กับ path สำเนานี้ไม่สะท้อนการแก้ source
อัตโนมัติ จึงยังไม่ใช่หลักฐานว่าผ่านเกณฑ์ source ร่วมกันของ MVP

`skipped` มีสองกรณี: ถ้าของเดิมครบและตรวจผ่าน จะข้ามโดยไม่เรียกติดตั้งใหม่และถือว่าสำเร็จ
กรณีสำเนาเดิมต้องตรงกับ global source ทั้งต้นไม้และยังแสดง WARNING หากยังไม่ครบ มีไฟล์ชนกัน
link ผิดหรือ dangling หรือ parent directory เป็น link สคริปต์จะข้ามพร้อมเหตุผลและถือว่าไม่สำเร็จ
เพื่อไม่ให้ CLI ล้างไฟล์เดิม ถ้า entry มีบาง skill ติดตั้งแล้วและบาง skill ยังไม่มี จะข้าม entry ทั้งชุด
พร้อมขอให้ตรวจและย้ายรายการที่ชนกันเองก่อนลองใหม่ สคริปต์ไม่ลบ ไม่ย้าย และไม่สร้าง link/copy เอง

`failed` หมายถึงคำสั่งติดตั้งหรือการตรวจผลไม่ผ่าน โดยจะทำ entry ถัดไปต่อจนจบ
exit code เป็น 0 เฉพาะเมื่อทุก entry ผ่านหรือข้ามเพราะของเดิมครบแล้ว หากมี failed หรือ skipped
ที่ยังไม่สำเร็จจะคืน 1 การรันซ้ำไม่ทำ update ของเดิมที่ครบ และไม่ลบ skills นอก manifest
skills ที่ดาวน์โหลดใหม่ยังไม่ได้ pin upstream revision

## แก้ปัญหาแล้วลองใหม่

ถ้าข้อความขึ้นต้น `Manifest failed` ให้แก้ field ที่ระบุแล้วรัน `node scripts/validate-manifest.mjs`
ถ้าเป็น `Prerequisites failed` ให้ตรวจรุ่น Node, npm/npx/Git ใน PATH, network และสิทธิ์ของ home
แล้วเรียก `node install.mjs` อีกครั้ง ไม่ต้องเพิ่มสิทธิ์ทั้งระบบ

เมื่อพบ destination conflict ให้เปิด path ใน summary สำรองหรือย้ายไฟล์ที่ชนกันด้วยตนเองก่อนลองใหม่
ห้ามล้าง skills directory ทั้งก้อน เพราะอาจมี skills นอก MVP อยู่ด้วย ถ้ามี copy fallback เดิมที่แก้ไขแล้ว
สคริปต์จะไม่ตัดสินใจแทนว่าควรเก็บ source หรือสำเนา ให้เลือกและจัดการเฉพาะชื่อที่รายงานเอง

ถ้า CLI/download ล้มเหลว ให้ตรวจ npm registry, GitHub, Git และสิทธิ์ของ destination ตามข้อความ CLI
ถ้าเป็น post-install verification failure ให้ตรวจ SKILL.md, supporting files และปลายทาง link
การรันที่สำเร็จบางส่วนไม่ต้องล้าง entry ที่ตรวจครบแล้ว แต่ entry ที่สำเร็จไม่ครบอาจต้องแก้ conflict ก่อน

## ขอบเขตที่ตรวจแล้ว

รัน `node --test` เพื่อตรวจ manifest, installer ผ่าน injected process runner, filesystem ชั่วคราว,
CLI จาก directory อื่น, arguments ที่ไม่ผ่าน shell, Windows npm resolution และ timeout process tree
เทสต์ไม่ติดตั้ง skills เข้า home จริงและไม่เรียก npx ดาวน์โหลด upstream skills

เทสต์ shell wrapper บนระบบที่ไม่ใช่ Windows เรียกทั้งผ่าน `sh` และไฟล์ executable จาก directory อื่น
โดยใช้ installer จำลองข้าง wrapper เพื่อตรวจ path ที่มีช่องว่างและอักษรไทย, arguments,
working directory และ exit code ทั้งสำเร็จและล้มเหลว เทสต์นี้ไม่ยืนยันผลติดตั้ง skills จริงบน Linux/macOS

สำหรับ `install.ps1` มี static contract test ตรวจ path ที่อิง `$PSScriptRoot`, การส่ง arguments,
การคืน exit code, การหยุดเมื่อเรียก Node ไม่ได้ และการไม่เปลี่ยน working directory
เทสต์นี้ผ่านบน macOS โดยไม่ต้องมี PowerShell ส่วน [Issue #9](cross-platform-validation.md) มีผลรัน wrapper จริง
บน Windows native/PowerShell 5.1 แล้ว ทั้ง rerun สำเร็จและ conflict/manifest failure ใน temporary home
พร้อม checkout path ที่มีช่องว่างและอักษรไทย ยังไม่ได้ตรวจ fresh install ผ่าน PowerShell wrapper

การตรวจไฟล์ไม่ได้ยืนยันว่า agent โหลด skill หรือเรียก workflow ได้ครบ รวมถึง hooks, native plugins
และเครื่องมือภายนอกที่ skill ต้องใช้ [ผล Issue #9](cross-platform-validation.md) ตรวจ global install จริงครบ 23 skills และการเปลี่ยนไฟล์แล้วสะท้อนผ่าน link
บน macOS กับ Windows native แล้ว พร้อม rerun/conflict และ copy warning บน macOS ส่วน Linux,
permission fallback ของ Windows และการค้นพบ skills ภายใน agents ยังขาดหลักฐาน จึงยังไม่มีผลตรวจรับ MVP ครบทุก OS
`install.sh` เพิ่มใน Issue #7 และ `install.ps1` เพิ่มใน Issue #8 ส่วนคำสั่ง status/update เป็นงาน Issue #10
