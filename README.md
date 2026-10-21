# Skill Stack

ศูนย์รวมสำหรับติดตั้งและจัดการ skills ที่ใช้กับ coding agents หลายตัวบนเครื่องใหม่

เป้าหมายคือให้ติดตั้ง skills ชุดเดียวกันบน **Codex, Pi และ Hermes** ได้ง่าย โดยใช้ `npx skills` เป็น installer กลาง และให้ระบบจัดการ source กับ symlink ผ่าน `~/.agents/skills` ตามมาตรฐานของ skills CLI

ผลสำรวจสำหรับ [Issue #4](https://github.com/PeeraphatN/skill-stack/issues/4) อยู่ใน [วิธีติดตั้งและความเข้ากันได้ของ skills MVP](docs/install-methods.md) พร้อมคำสั่ง ชื่อ skills และหลักฐาน upstream โดย CLI รุ่นที่ตรวจใช้ชื่อ agent `codex`, `pi` และ `hermes-agent` ส่วน Codex กับ Pi อ่าน `~/.agents/skills` โดยตรง ไม่ต้องมี symlink แยก

## ปัญหา

เวลาย้ายเครื่องทำงานต้องติดตั้ง skills ทีละรายการด้วยมือ วิธีติดตั้งของแต่ละ skill ก็ไม่เหมือนกัน และแต่ละ OS อาจมี path หรือคำสั่งต่างกัน

## เป้าหมาย

- ติดตั้ง skills ที่ใช้งานประจำด้วยคำสั่งเดียว
- รองรับ Linux, macOS และ Windows
- ใช้งานกับ Codex, Pi และ Hermes เป็นหลัก
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

รายการที่เกี่ยวข้องแต่จะเพิ่มในระยะถัดไป เพราะใช้วิธีติดตั้งเฉพาะ:

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

[manifest.json](manifest.json) เลือก 23 skills จากสี่แหล่ง MVP ให้ `codex`, `pi` และ `hermes-agent`
โดยระบุชื่อ skill ที่ต้องการจากแต่ละ repository อย่างชัดเจน อ่านรูปแบบและกติกาได้ที่
[Manifest contract](docs/manifest.md)

ตรวจ manifest โดยไม่ติดตั้ง และรันทดสอบด้วย Node.js >=22.20.0:

```bash
node scripts/validate-manifest.mjs
node --test
```

## ติดตั้ง skills

```bash
node install.mjs
```

ในอนาคตอาจรองรับการเรียกผ่าน package โดยตรง:

```bash
npx github:<owner>/skill-stack
```

เรียกด้วย absolute path จาก directory อื่นได้ สคริปต์หา manifest ข้างตัวเองเสมอ
อ่านการตรวจผล การรันซ้ำ และวิธีแก้ปัญหาได้ที่ [คู่มือ installer](docs/installer.md)

## ข้อกำหนดเบื้องต้น

- Node.js >=22.20.0 พร้อม npm และ npx ใน PATH
- Git ใน PATH และเชื่อมต่อ npm registry กับ public GitHub repositories ได้
- สิทธิ์เขียน home และ agent destinations ของผู้ใช้ปัจจุบัน

installer เรียก `skills@1.7.2` ผ่าน npx โดยไม่ต้องติดตั้ง skills CLI ล่วงหน้า
บน Windows ต้องเป็นการติดตั้ง Node.js/npm ที่มี `node_modules/npm/bin/npm-cli.js` และ `npx-cli.js`
ข้าง Node หรือใน directory ของ PATH เพื่อเรียกผ่าน Node โดยไม่ใช้ shell

## Roadmap

1. สรุป install method และชื่อ agent ที่รองรับจริง
2. เพิ่ม `manifest.json`
3. เขียน `install.mjs` สำหรับ MVP
4. เพิ่ม wrapper สำหรับ shell และ PowerShell
5. ทดสอบบน macOS, Linux และ Windows
6. เพิ่มคำสั่งตรวจสอบสถานะและ update
7. เพิ่ม Trail-Code และ skills ที่ใช้ installer เฉพาะ
8. เพิ่ม custom skills ส่วนตัว
9. publish custom skills ให้ติดตั้งผ่าน `npx skills` ได้

## สถานะ

ข้อกำหนดผลิตภัณฑ์และเกณฑ์ตรวจรับ MVP: [PRD](docs/PRD.md)

มี manifest, validator และ `install.mjs` พร้อม automated tests แล้ว การติดตั้งจริงและการค้นพบ skills บน Linux/macOS/Windows native ยังต้องตรวจใน Issue #9; wrappers เป็นงานแยก

ข้อกำหนดระบบและเกณฑ์ตรวจรับ MVP อยู่ใน [SRS](docs/SRS.md) สำหรับ [issue #3](https://github.com/PeeraphatN/skill-stack/issues/3)
