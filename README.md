# Skill Stack

ศูนย์รวมสำหรับติดตั้งและจัดการ skills ที่ใช้กับ coding agents หลายตัวบนเครื่องใหม่

เป้าหมายคือให้ติดตั้ง skills ชุดเดียวกันบน **Codex, Pi, Hermes และ Claude Code** ได้ง่าย โดยใช้ `npx skills` เป็น installer กลาง และให้ระบบจัดการ source กับ symlink ผ่าน `~/.agents/skills` ตามมาตรฐานของ skills CLI

ผลสำรวจสำหรับ [Issue #4](https://github.com/PeeraphatN/skill-stack/issues/4) อยู่ใน [วิธีติดตั้งและความเข้ากันได้ของ skills MVP](docs/install-methods.md) พร้อมคำสั่ง ชื่อ skills และหลักฐาน upstream โดย CLI รุ่นที่ตรวจรองรับ `codex`, `pi`, `hermes-agent` และ `claude-code` Codex/Pi อ่าน `~/.agents/skills` โดยตรง, Hermes ใช้ `~/.hermes/skills` และ Claude Code ใช้ `~/.claude/skills`

## ปัญหา

เวลาย้ายเครื่องทำงานต้องติดตั้ง skills ทีละรายการด้วยมือ วิธีติดตั้งของแต่ละ skill ก็ไม่เหมือนกัน และแต่ละ OS อาจมี path หรือคำสั่งต่างกัน

## เป้าหมาย

- ติดตั้ง skills ที่ใช้งานประจำด้วยคำสั่งเดียว
- รองรับ Linux, macOS และ Windows
- ใช้งานกับ Codex, Pi, Hermes และ Claude Code เป็นหลัก
- เก็บรายการ skills ไว้ใน manifest เดียว
- ใช้ symlink ที่ skills CLI จัดการให้
- เพิ่ม custom skills ของตัวเองได้ในอนาคต
- ทำให้ custom skills publish เป็น public skills และติดตั้งผ่าน `npx skills` ได้

## MVP

MVP จะเริ่มจาก skills ที่ติดตั้งผ่าน `npx skills add` ได้ง่ายก่อน:

- [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop)
- [mattpocock/skills](https://github.com/mattpocock/skills)
- [thananon/9arm-skills](https://github.com/thananon/9arm-skills)

เพิ่มอีกสี่แหล่งใน Issue #11 โดยติดตั้งเฉพาะ skills ที่เลือกผ่าน `npx skills` ไม่รัน native plugin, hook หรือ setup ของ upstream อัตโนมัติ ดูข้อจำกัดแต่ละแหล่งใน [คู่มือ adapters](docs/adapters.md):

- [trailhq/Trail-Code](https://github.com/trailhq/Trail-Code)
- [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)
- [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki)
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)

## แนวทางการทำงาน

```text
skill-stack repository
        |
        v
  install.mjs
        |
        v
npx skills add --global
        |
        v
~/.agents/skills/<skill>
        |
        v
Codex / Pi อ่านโดยตรง
Hermes อ่านผ่าน symlink ที่ ~/.hermes/skills/<skill>
```

โปรเจกต์นี้จะไม่จัดการ symlink เอง เพราะ `npx skills` มีหน้าที่ดูแล global skills และ agent directories อยู่แล้ว

## โครงสร้างที่วางแผนไว้

```text
skill-stack/
├── manifest.json
├── install.mjs
├── install.sh
├── install.ps1
└── README.md
```

## Manifest

[manifest.json](manifest.json) เลือก 29 skills จากแปดแหล่งให้ `codex`, `pi`, `hermes-agent` และ `claude-code`
โดยระบุชื่อ skill ที่ต้องการจากแต่ละ repository อย่างชัดเจน อ่านรูปแบบและกติกาได้ที่
[Manifest contract](docs/manifest.md) และข้อจำกัดของแหล่งที่เพิ่มใน [คู่มือ adapters](docs/adapters.md)

ตรวจ manifest โดยไม่ติดตั้ง และรันทดสอบด้วย Node.js >=22.20.0:

```bash
node scripts/validate-manifest.mjs
node --test
```

## ติดตั้ง skills

```bash
node install.mjs
```

บน Linux/macOS เรียกผ่าน shell wrapper ได้:

```sh
./install.sh
# หรือ
sh install.sh
```

ถ้าอยู่ directory อื่น ให้เรียก `sh "/path/to/skill-stack/install.sh"` โดยใช้ path ของ checkout จริง
wrapper เรียก `install.mjs` ข้างตัวเองและคืน exit code เดียวกัน ต้องมี Node.js ใน PATH เช่นเดิม

บน Windows เรียกผ่าน PowerShell ได้ด้วย:

```powershell
.\install.ps1
```

ถ้าอยู่ directory อื่น ใช้ `& 'C:\path with spaces\skill-stack\install.ps1'`
wrapper เรียก `install.mjs` ข้างตัวเองและคืน exit code เดียวกัน โดยต้องมี `node` ใน PATH
ถ้า execution policy ไม่อนุญาตให้รันสคริปต์ ใช้ `node 'C:\path with spaces\skill-stack\install.mjs'`
ได้โดยไม่ต้องเปลี่ยน policy อ่านรายละเอียดใน [คู่มือ installer](docs/installer.md)

ในอนาคตอาจรองรับการเรียกผ่าน package โดยตรง:

```bash
npx github:<owner>/skill-stack
```

เรียกด้วย absolute path จาก directory อื่นได้ สคริปต์หา manifest ข้างตัวเองเสมอ

ตรวจสถานะ skills ใน manifest โดยไม่ดาวน์โหลดหรือติดตั้ง:

```bash
node install.mjs status
```

อัปเดตเฉพาะ skills ใน manifest ที่ติดตั้งครบแล้ว:

```bash
node install.mjs update
```

อ่านการตรวจผล การรันซ้ำ และวิธีแก้ปัญหาได้ที่ [คู่มือ installer](docs/installer.md)

## ข้อกำหนดเบื้องต้น

- Node.js >=22.20.0 พร้อม npm และ npx ใน PATH
- Git ใน PATH และเชื่อมต่อ npm registry กับ public GitHub repositories ได้
- สิทธิ์เขียน home และ agent destinations ของผู้ใช้ปัจจุบัน

installer เรียก `skills@1.7.2` ผ่าน npx โดยไม่ต้องติดตั้ง skills CLI ล่วงหน้า
บน Windows ต้องเป็นการติดตั้ง Node.js/npm ที่มี `node_modules/npm/bin/npm-cli.js` และ `npx-cli.js`
ข้าง Node หรือใน directory ของ PATH เพื่อเรียกผ่าน Node โดยไม่ใช้ shell

## Roadmap

1. สรุป install method และชื่อ agent ที่รองรับจริง — เสร็จ
2. เพิ่ม `manifest.json` และ `install.mjs` — เสร็จ
3. เพิ่ม wrapper สำหรับ shell และ PowerShell — เสร็จ
4. เพิ่มคำสั่งตรวจสอบสถานะและ update (#10) — เสร็จ
5. เพิ่ม selected skills จาก Trail-Code และอีกสามแหล่ง (#11) — เสร็จแบบ skills-only
6. ทดสอบติดตั้งจริงครบสาม OS และยืนยันการค้นพบใน agents (#9) — ยังไม่เสร็จ
7. เพิ่ม custom skills ส่วนตัวและ publish ผ่าน `npx skills` — ยังไม่เริ่ม

## สถานะ

ข้อกำหนดผลิตภัณฑ์และเกณฑ์ตรวจรับ MVP: [PRD](docs/PRD.md)

มี manifest, validator, installer และคำสั่ง `status`/`update` พร้อม automated tests แล้ว ผล [Issue #9: cross-platform validation](docs/cross-platform-validation.md) เป็นหลักฐานของชุดเดิม 23 skills บน macOS และ Windows; ยังไม่มีผลติดตั้งจริงสำหรับ manifest ปัจจุบัน 29 skills, Linux native หรือการยืนยัน discovery ภายใน agents จึงยังไม่ถือว่าตรวจรับครบสาม OS.

ข้อกำหนดระบบและเกณฑ์ตรวจรับ MVP อยู่ใน [SRS](docs/SRS.md) สำหรับ [issue #3](https://github.com/PeeraphatN/skill-stack/issues/3)
