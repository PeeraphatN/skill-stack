# แหล่ง skills เพิ่มเติม (Issue #11)

Skill Stack เลือกเฉพาะไฟล์ `SKILL.md` จากสี่แหล่งนี้ แล้วส่งการติดตั้งให้ `npx skills@1.7.2` จัดการ global destinations และ links ตาม agents ใน manifest ไม่มี custom copy/symlink logic และไม่รันคำสั่งติดตั้งเฉพาะของ upstream โดยอัตโนมัติ

รายการใน [manifest.json](../manifest.json) คือ:

| แหล่ง | Skills ที่เลือก | ขอบเขตที่ติดตั้ง |
|---|---|---|
| [`trailhq/Trail-Code`](https://github.com/trailhq/Trail-Code) | `graft` | Skill เดียวที่ upstream เปิดให้ skills CLI ค้นพบ ณ snapshot ที่ตรวจ |
| [`ayghri/i-have-adhd`](https://github.com/ayghri/i-have-adhd) | `i-have-adhd` | Markdown skill; ไม่รวม extension หรือ native plugin |
| [`Ar9av/obsidian-wiki`](https://github.com/Ar9av/obsidian-wiki) | `wiki-setup`, `wiki-capture`, `wiki-query` | เลือกสาม workflows; ไม่ติดตั้ง Python CLI, hooks, config หรือ skills อื่น |
| [`multica-ai/andrej-karpathy-skills`](https://github.com/multica-ai/andrej-karpathy-skills) | `karpathy-guidelines` | Markdown skill; ไม่ติดตั้ง Claude Code plugin หรือเขียน `CLAUDE.md` ใน project |

เลือกชื่อจากรายการที่ skills CLI ค้นพบ ไม่ติดตั้งทุก skill ใน upstream โดยปริยาย

## วิธีติดตั้งต่างจาก upstream native setup

- **Trail-Code:** skill `graft` ใช้คำสั่ง `graft`/`trail` และ graft map ใน repository เป้าหมาย การติดตั้ง skill อย่างเดียวไม่ได้ติดตั้ง CLI หรือรัน `trail init` ให้ติดตั้ง `@trailhq/trail-code` และตั้งค่าแต่ละ repository ตาม [upstream README](https://github.com/trailhq/Trail-Code#quick-start) หากต้องการ workflow เต็ม
- **i-have-adhd:** ติดตั้งเฉพาะ `SKILL.md` ผ่าน skills CLI ไม่ได้ลง Claude Code plugin, Pi extension หรือ hooks ตาม [upstream installation guide](https://github.com/ayghri/i-have-adhd/blob/main/INSTALL.md)
- **obsidian-wiki:** upstream ระบุ Skills CLI เป็นวิธีติดตั้งแบบ partial/deprecated การใช้ผ่าน Skill Stack ได้เฉพาะไฟล์ skills ที่เลือก; ไม่มี vault path, global config, Python package, hooks หรือ bootstrap ที่ `obsidian-wiki setup` ทำให้ ดู [upstream installation guide](https://github.com/Ar9av/obsidian-wiki/blob/main/docs/installation.md)
- **Andrej Karpathy:** ติดตั้ง skill ผ่าน skills CLI ไปยัง agents ทั้งสี่ ไม่ได้ติดตั้ง plugin ของ Claude Code หรือเพิ่ม guideline ให้ทำงานตลอดเวลาผ่าน `CLAUDE.md` ตาม [upstream README](https://github.com/multica-ai/andrej-karpathy-skills#install)

การติดตั้งผ่าน Skill Stack จึงรับรองเพียงว่ามีไฟล์ skill ใน global destinations และตรวจ link/copy ได้ ไม่ได้ติดตั้ง dependency, เปิด hook หรือยืนยันว่า agent ใช้ workflow ได้ครบ

## หลักฐานการค้นพบ

วันที่ 30 ต.ค. 2026 ใช้ Node.js v22.23.2 และ `skills@1.7.2` รัน `add <local clone> --list` กับ repository ที่ clone จาก upstream แล้วพบชื่อดังนี้ จากนั้นรัน `npx --yes skills@1.7.2 add <owner/repo> --list` กับทั้งสี่ GitHub sources โดยตรงอีกครั้ง; CLI ค้นพบชื่อที่เลือกครบ (Obsidian Wiki พบ 40 skills ทั้งหมด):

- Trail-Code, commit `a44da3dfb5894c8e316e320526041ef8e5ddbb8c`: `graft`
- i-have-adhd, commit `1ecea1993b7fce257ffbd686c070948b5e07eda6`: `i-have-adhd`
- obsidian-wiki, commit `4f457e154653756b04802d5aeb25c20f42b4770c`: มี skill หลายสิบรายการ; เลือกเพียงสามชื่อข้างต้น
- andrej-karpathy-skills, commit `2c606141936f1eeef17fa3043a72095b4765b9c2`: `karpathy-guidelines`

การตรวจนี้เป็น discovery-only; ไม่ได้ติดตั้ง upstream skills จริงหรือเปิด runtime ของ agents การตรวจติดตั้งจริงและ discovery ของ agents ทุกตัวเป็นงานที่ยังค้างใน Issue #9
