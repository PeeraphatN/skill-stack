# Software Requirements Specification: Skill Stack MVP

เอกสารนี้กำหนดสิ่งที่ Skill Stack MVP ต้องทำและวิธีตรวจรับ สำหรับ [issue #3](https://github.com/PeeraphatN/skill-stack/issues/3) โดยอ้างอิง [README](../README.md) และ [issue #1: Skill Stack MVP](https://github.com/PeeraphatN/skill-stack/issues/1) เป็นหลัก ข้อกำหนดที่ใช้คำว่า “ต้อง” เป็นเงื่อนไขตรวจรับ ไม่ใช่รายงานความสามารถที่ทดสอบแล้ว

สถานะ: ข้อกำหนดสำหรับนำไปออกแบบและพัฒนา ยังไม่มี installer หรือผลทดสอบข้ามแพลตฟอร์ม เอกสารนี้ไม่เปลี่ยนขอบเขตของ issue อื่นและไม่ถือว่าปิดงานเหล่านั้นแล้ว

## 1. เป้าหมายและขอบเขต

ผู้ใช้ที่ย้ายเครื่องหรือเตรียมเครื่องใหม่ต้องติดตั้ง skills ชุดเดียวกันให้ Codex, Pi และ Hermes ได้ด้วย `node install.mjs` จาก repository ที่ดาวน์โหลดแล้ว โดยอ่านรายการจาก `manifest.json` และเรียก `npx skills` เป็น installer กลาง

MVP ครอบคลุม Linux, macOS และ Windows แบบ native รวมถึง wrapper `install.sh` สำหรับ Linux/macOS และ `install.ps1` สำหรับ Windows โดย wrapper เป็นทางเลือกในการเรียก installer ตัวเดียวกัน ไม่ใช่เงื่อนไขของคำสั่งหลัก

แหล่ง skills ที่ต้องครอบคลุมมีสี่ repository:

- `DietrichGebert/ponytail`
- `petergyang/no-ai-slop`
- `mattpocock/skills`
- `thananon/9arm-skills`

การครอบคลุม repository ไม่ได้หมายถึงติดตั้งทุก skill ในนั้นโดยปริยาย ต้องเลือกรายการ skill อย่างชัดเจนใน manifest ตามผลยืนยันวิธีติดตั้งใน #4 และการออกแบบ manifest ใน #5

สิ่งที่อยู่นอก MVP ได้แก่ คำสั่ง status/update/uninstall ของ Skill Stack, installer เฉพาะสำหรับ Trail-Code หรือ skill adapters อื่น, private repositories และการจัดการ credentials, การสร้างหรือ publish custom skills, GUI, การแจกจ่ายผ่าน `npx github:<owner>/skill-stack` และการ rollback ทั้งชุดแบบ transaction การตรวจผลหลังติดตั้งเป็นส่วนหนึ่งของ installer แต่ไม่ใช่คำสั่ง status แยกต่างหาก

## 2. คำศัพท์และขอบเขตความรับผิดชอบ

**Source repository** คือแหล่งดาวน์โหลด skill บน GitHub ส่วน **skill** คือหน่วยที่มี `SKILL.md` และไฟล์ประกอบ หนึ่ง repository อาจมีหลาย skill จึงต้องแยกชื่อรายการใน manifest ออกจากชื่อ skill ที่ส่งให้ CLI

**Global source** คือพื้นที่ `~/.agents/skills/<skill>` ที่ skills CLI จัดการใน home ของผู้ใช้ปัจจุบัน เครื่องหมาย `~` ในเอกสารหมายถึง home directory ไม่ใช่ข้อความ path ที่นำไปส่งให้ shell ตรง ๆ

**Agent destination** คือ directory ที่แต่ละ agent ใช้อ่าน skill อาจเป็น symlink ไปยัง global source หรืออ่าน global source โดยตรงหาก skills CLI รองรับและยืนยันแล้วใน #4 ทั้งสองกรณีต้องใช้ source ร่วมกัน ไม่มีสำเนาแยกที่ Skill Stack ดูแลเอง

Skill Stack รับผิดชอบอ่านและตรวจ manifest, ตรวจ prerequisites, เรียก CLI, ตรวจผล และรายงานสถานะ ส่วน skills CLI รับผิดชอบดาวน์โหลด source, จัดวาง global skills และสร้างหรือจัดการ symlink/junction/copy fallback ไม่อนุญาตให้ Skill Stack สร้าง symlink, junction หรือ copy เอง

## 3. Functional requirements

### FR-01: ติดตั้งด้วยคำสั่งเดียว

เมื่อผู้ใช้มี prerequisites ครบและดาวน์โหลด repository แล้ว `node install.mjs` ต้องเริ่มติดตั้งทั้งชุดโดยไม่ต้องแก้คำสั่งแยกตาม OS และไม่ต้องตอบเมนูเลือก skill หรือ agent ระหว่างทำงาน ผลต้องครอบคลุม agent ทั้งสามที่ระบุใน manifest ไม่ใช่เฉพาะ agent ที่ CLI ตรวจพบอัตโนมัติ

### FR-02: ใช้ manifest เป็นแหล่งข้อมูลเดียว

รายการ repository, skill ที่เลือก และ agents ต้องมาจาก `manifest.json` เท่านั้น การเพิ่มรายการจาก repository ที่รองรับอยู่ต้องทำได้โดยไม่แก้ installer หรือ wrapper ห้ามมีรายการติดตั้งอีกชุดซ่อนอยู่ในสคริปต์

### FR-03: ตรวจข้อมูลทั้งหมดก่อนเปลี่ยนเครื่อง

ก่อนเรียกคำสั่งติดตั้งใด ๆ ต้องอ่านและตรวจ manifest ทั้งไฟล์ รวมถึงตรวจ prerequisites และความสามารถที่จำเป็นของ CLI หากไม่ผ่านต้องหยุดด้วย exit code ที่ไม่ใช่ศูนย์และบอกตำแหน่งข้อมูลหรือสิ่งที่ขาด โดยยังไม่เรียกติดตั้งรายการใด การตรวจนี้ไม่รับประกันว่าเครือข่ายหรือ repository จะพร้อมตลอดการรัน

### FR-04: ติดตั้งผ่าน skills CLI

installer ต้องเรียก `npx skills add` ใน global scope พร้อมระบุรายการ skill และ agents อย่างชัดเจน ใช้โหมดที่ไม่ต้องตอบเมนูและใช้ source ร่วมกันผ่าน symlink model ตามข้อ 6 ห้ามเขียน downloader หรือระบบกระจายไฟล์แทน CLI

ชื่อ agent identifier, flags, รูปแบบเลือกหลาย skill และวิธีบังคับใช้ model นี้ต้องยืนยันใน #4 ก่อน implement เอกสารนี้ไม่สมมติว่า CLI รุ่นปัจจุบันรองรับสิ่งเหล่านี้ครบแล้ว

### FR-05: ประมวลผลและรายงานผลที่ตรวจสอบได้

ต้องติดตั้งตามลำดับรายการใน manifest เพื่อให้ตรวจปัญหาซ้ำได้ เมื่อรายการใดล้มเหลวให้บันทึกผลแล้วทำรายการถัดไปต่อจนจบ โดยไม่หยุดทั้งชุด รายการก่อนหน้าที่สำเร็จแล้วคงอยู่ได้ และต้องแสดงว่าส่วนใดสำเร็จ ส่วนใดใช้ fallback เป็น copy ส่วนใดล้มเหลว และส่วนใดยังไม่ได้ทำ หากมีรายการล้มเหลวให้คืน exit code ที่ไม่ใช่ศูนย์หลังพยายามครบทุกรายการ

เมื่อ CLI คืนความสำเร็จ ต้องตรวจว่ารายการ skill ที่คาดหวังมี `SKILL.md` ใน global source และเข้าถึงได้จาก destination ของ agents ที่ร้องขอ ก่อนรายงานว่ารายการนั้นสำเร็จ หาก CLI คืนศูนย์แต่ผลไม่ครบ ต้องนับเป็นความล้มเหลว

### FR-06: ติดตั้งซ้ำโดยไม่ทำลายของเดิม

การรันซ้ำด้วย manifest เดิมต้องไม่เพิ่ม skill ซ้ำ, ทำให้ link ใช้งานไม่ได้, ลบ skill นอก manifest หรือทำลายไฟล์ที่ผู้ใช้มีอยู่ หาก destination มีไฟล์จริงหรือ link ไป source อื่น ต้องระบุ path และแนวทางให้ผู้ใช้จัดการเอง ห้ามใช้ force หรือ overwrite อัตโนมัติ หาก CLI fallback จาก symlink/junction เป็น copy ให้ยอมรับได้ แต่ต้องรายงานเป็น warning พร้อมชื่อ skill และ path

installer ต้องตรวจ conflict ที่ระบุได้ก่อนเริ่มติดตั้ง และใช้พฤติกรรมของ CLI ที่ยืนยันแล้วว่าไม่ทำลายข้อมูล หาก CLI ทำตามเงื่อนไขนี้ไม่ได้ ต้องรายงานปัญหาและทำรายการอื่นต่อโดยไม่แก้ด้วยการเขียนระบบ symlink เอง การรันซ้ำไม่ได้รับประกัน content รุ่นเดิมหาก upstream เปลี่ยน เพราะการ pin revision และคำสั่ง update อยู่นอก MVP

### FR-07: ตรวจปัญหาและบอกวิธีแก้

ต้องแยกข้อความผิดพลาดให้เห็นอย่างน้อยว่าเกิดจาก manifest, prerequisites/CLI ที่ไม่รองรับ, เครือข่ายหรือดาวน์โหลด, สิทธิ์หรือ destination conflict และการตรวจผลหลังติดตั้ง โดยแสดงรายการที่เกี่ยวข้องและวิธีลองใหม่หลังแก้ปัญหา ไม่แสดงความสำเร็จทั้งชุดเมื่อทำได้เพียงบางส่วน

### FR-08: Wrapper ใช้พฤติกรรมเดียวกัน

`install.sh` และ `install.ps1` ต้องส่งต่อการทำงานให้ `install.mjs` โดยค้นหาไฟล์จากตำแหน่ง wrapper และส่ง exit code กลับตามจริง ห้ามมีตรรกะติดตั้งอีกชุด ผู้ใช้ต้องเรียก wrapper ด้วย path ของสคริปต์จาก working directory อื่นได้

## 4. Manifest contract

ส่วนนี้กำหนดข้อมูลและกติกาที่จำเป็น ส่วน schema และรูปแบบสุดท้ายเป็นงาน #5 ตัวอย่างด้านล่างเป็นข้อเสนอที่ขยายจาก README ไม่ใช่ไฟล์ `manifest.json` ที่พร้อมใช้งาน

```json
{
  "agents": ["codex", "pi", "hermes"],
  "skills": [
    {
      "name": "no-ai-slop",
      "repo": "petergyang/no-ai-slop",
      "installer": "npx-skills",
      "skills": ["no-ai-slop"]
    }
  ]
}
```

`agents` ต้องเป็นรายการที่ไม่ว่างและไม่มีค่าซ้ำ สำหรับ manifest ที่ส่งมอบใน MVP ต้องมี Codex, Pi และ Hermes ครบ ชื่อข้างต้นเป็น logical names จาก README การส่งชื่อไป CLI ต้องผ่าน mapping ที่ยืนยันใน #4 ไม่ส่งชื่อโดยเดา

`skills` ระดับบนต้องเป็นรายการที่ไม่ว่าง แต่ละรายการต้องมี `name` สำหรับอ้างอิงใน log ที่ไม่ซ้ำ, `repo` แบบ `owner/repository`, `installer` และรายชื่อ skill ที่เลือกอย่างชัดเจน ไม่อนุญาต wildcard หรือเลือกทุก skill โดยปริยาย `skills` ภายในรายการในตัวอย่างคือแนวทางเสนอสำหรับการเลือกนี้ ชื่อจริงและวิธีระบุให้ CLI ต้องยืนยันก่อนใช้งาน

MVP ยอมรับเฉพาะ `installer: "npx-skills"` และ public GitHub repository แบบ `owner/repository` ไม่ยอมรับ local path, URL รูปแบบอื่น, shell command หรือ flags เพิ่มเติมจาก manifest การเผื่อ custom skills ทำโดยเพิ่มรายการที่ใช้ contract เดียวกันได้ ไม่ใช่การเปิดให้รัน arbitrary installer

validator ต้องปฏิเสธ JSON ที่อ่านไม่ได้, key ที่ไม่รู้จัก, field ที่ขาด, ชนิดข้อมูลผิด, string ว่าง, agent ที่ไม่มี mapping, installer ที่ไม่รองรับ และรายการ skill ซ้ำทั้งภายในและข้าม entry หากสอง repository จะลง destination ชื่อเดียวกัน ต้องถือเป็น conflict และไม่เลือกผู้ชนะตามลำดับติดตั้ง

ข้อความผิดพลาดต้องชี้ field เช่น `skills[0].repo` พร้อมเหตุผล และห้ามนำค่าจาก manifest ไปต่อเป็นคำสั่ง shell หากเลือกใช้ schema version ใน #5 ต้องระบุพฤติกรรมเมื่อเจอ version ที่ไม่รองรับด้วย

## 5. Installer และพฤติกรรมข้ามแพลตฟอร์ม

### CP-01: Prerequisites

ต้องมี Node.js, npm/npx และสิทธิ์เขียนใน home ของผู้ใช้ รวมถึงเข้าถึง npm registry และ public GitHub repositories ได้ในรอบที่ต้องดาวน์โหลด หาก CLI ต้องการเครื่องมือเพิ่มเติม เช่น Git ต้องตรวจและระบุในเอกสารติดตั้งด้วย

รุ่นขั้นต่ำของ Node.js, รุ่น skills CLI ที่ใช้ตรวจรับ และ prerequisites ที่แน่นอนต้องบันทึกหลังยืนยันใน #4 ต้องไม่ถือว่า `npx skills` จะติดตั้งอยู่บนเครื่องล่วงหน้าโดยไม่มีการตรวจสอบ และไม่ติดตั้ง Node.js/npm หรือยกระดับสิทธิ์ให้อัตโนมัติ

### CP-02: การเรียก process และการหาไฟล์

`install.mjs` ต้องใช้ Node.js เป็นแกนเดียวทั้งสาม OS หา manifest เทียบกับตำแหน่งไฟล์ installer ไม่ใช่ current working directory และประกอบ path ด้วย API ของ Node.js ต้องรองรับ path ที่มีช่องว่างและอักษรไทย รวมถึงรูปแบบ separator ของ Windows

การเรียก child process ต้องแยก executable ออกจาก arguments และเลือกวิธีเรียก npm/npx ให้เหมาะกับแต่ละ OS ห้ามให้ค่าใน manifest ถูกตีความเป็น shell syntax ตัว installer ต้องไม่พึ่ง Bash บน Windows หรือ PowerShell บน Linux/macOS

### CP-03: Home และ agent destinations

ต้อง resolve home ของผู้ใช้ที่รันจริงด้วย API ของระบบผ่าน Node.js ไม่ hardcode `/Users`, `/home` หรือ `C:\Users` และไม่ติดตั้งเข้า home ของ administrator/root แทนผู้ใช้โดยอัตโนมัติ ตำแหน่ง agent directories และผลของ environment overrides ต้องบันทึกตามที่ CLI รองรับจริงจาก #4 ไม่เดา path หรือกำหนด path เอง

### CP-04: Symlink และสิทธิ์บน Windows

หากระบบหรือสิทธิ์ปัจจุบันไม่รองรับ link ที่ CLI จำเป็นต้องสร้าง ให้ยอมรับ fallback ที่ CLI เลือกใช้ เช่น copy หรือ junction แต่ต้องรายงานสถานะและ path หลังติดตั้ง ห้าม fallback เป็น copy โดยเงียบ ๆ ห้ามเปิด Developer Mode, เปลี่ยน policy หรือขอ administrator เอง

WSL ถือเป็นสภาพแวดล้อม Linux แยกต่างหาก การผ่านบน WSL ไม่ทดแทนการทดสอบ Windows native และไม่ต้องแชร์ skill installation ระหว่างสองระบบใน MVP

## 6. Symlink model และสิ่งที่ต้องคงจริง

โครงสร้างต่อไปนี้เป็นข้อกำหนดเชิงตรรกะ ไม่ใช่รายการ agent paths ที่ยืนยันแล้ว:

```text
manifest.json -> install.mjs -> npx skills add (global)
                                    |
                                    v
                         <user-home>/.agents/skills/<skill>
                                    ^
                                    |
                agent destination -> source ร่วมกัน
```

สำหรับแต่ละ skill ต้องมี global source ที่เข้าถึงได้ และ agent ทั้งสามต้องเห็น skill ครบ เมื่อใช้ symlink หรือ junction ต้องตรวจว่า link resolve ไปยัง source ที่ถูกต้องและไม่ dangling เมื่อ CLI ใช้ copy fallback ต้องตรวจว่าไฟล์ปลายทางครบและรายงานว่าเป็นสำเนา เมื่อ agent อ่าน global source โดยตรงต้องตรวจเส้นทางนั้นแทน

การตรวจรับต้องพิสูจน์ว่าการเปลี่ยนไฟล์ทดสอบใน source สะท้อนผ่าน destination โดยไม่ต้องคัดลอกซ้ำ และแก้ไฟล์ทดสอบกลับหลังตรวจเสร็จ ต้องตรวจการค้นพบ skill ของ agents ตามวิธีที่บันทึกไว้ใน #4 ด้วย การมี directory หรือ symlink อย่างเดียวไม่เพียงพอที่จะยืนยันว่าใช้งานกับ agent ได้

หาก skills CLI ไม่รองรับ agent ใดหรือไม่สามารถรักษา model นี้ได้ ต้องรายงานเป็นข้อจำกัดที่ขวางการตรวจรับ MVP และทบทวนข้อกำหนดผ่าน issue ที่เกี่ยวข้อง ห้ามลดเป้าหมายเหลือสอง agents หรือสร้างระบบ link เสริมเอง

## 7. Non-functional requirements

### NFR-01: ความปลอดภัยของข้อมูลและการรันคำสั่ง

ต้องไม่ลบหรือแก้ skills นอก manifest ไม่ overwrite conflict และไม่ทำให้ manifest เป็นช่องทางรัน shell command การติดตั้งต้องอยู่ใน user scope ห้ามใช้ `sudo` หรือเปลี่ยนสิทธิ์ระบบอัตโนมัติ หากติดตั้งบางส่วนล้มเหลว ต้องคงผลที่สำเร็จและรายงานตาม FR-05 โดยไม่อ้างว่า rollback แล้ว

### NFR-02: ความสม่ำเสมอและตรวจสอบซ้ำได้

manifest เดียวกันต้องเลือก repository, skill และ agents ชุดเดียวกันบนทั้งสาม OS โดยความต่างจำกัดอยู่ที่ path และวิธีเรียก process ผลทดสอบต้องบันทึก OS, Node.js, npm, skills CLI version และ upstream revision ที่ใช้ทดสอบเมื่อหาได้ ความสม่ำเสมอของรายการไม่ใช่การรับประกัน content แบบ byte-for-byte จาก upstream ที่เปลี่ยนได้

### NFR-03: การใช้งานและการรายงาน

log ต้องอ่านได้ใน terminal ธรรมดาโดยไม่ต้องพึ่งสี ระบุรายการที่กำลังทำและผลสุดท้าย พร้อม exit code ศูนย์เฉพาะเมื่อทุก skill ผ่านการตรวจ source และ agent destinations ต้องมีคำแนะนำแก้ปัญหา prerequisites, network, permission และ conflict ในเอกสารใช้งานก่อนตรวจรับ MVP

### NFR-04: การดูแลรักษาและขอบเขตเวลา

ตรรกะติดตั้งและตรวจ manifest ต้องอยู่ใน Node.js โดย wrappers มีหน้าที่ส่งต่อเท่านั้น ต้องไม่รอ prompt โต้ตอบหรือ retry แบบไม่สิ้นสุด เงื่อนไขหมดเวลาและการ retry หากมีต้องกำหนดและบันทึกก่อนส่งมอบ installer ส่วน MVP ยังไม่กำหนด SLA ของเวลา download เพราะขึ้นกับเครือข่ายและ upstream

### NFR-05: ทดสอบโดยไม่กระทบเครื่องทำงาน

กรณีติดตั้งจริงต้องใช้บัญชีทดสอบ, VM หรือสภาพแวดล้อมที่แยก home และ agent destinations ได้ตาม CLI รองรับ ต้องเก็บ manifest, คำสั่ง, exit code และผลตรวจ path เป็นหลักฐาน โดยไม่ใช้ skills ส่วนตัวของผู้ทดสอบเป็นพื้นที่ทดลอง

## 8. Acceptance criteria

ทุกกรณีต่อไปนี้เป็นเกณฑ์สำหรับ implementation ในอนาคต ไม่ใช่ผลทดสอบของเอกสารฉบับนี้ การตรวจรับต้องอ้าง requirement ID เพื่อย้อนกลับได้

### AC-01: ติดตั้งชุด MVP บนเครื่องใหม่

บน Linux, macOS และ Windows native ที่ prerequisites ครบ ให้รัน `node install.mjs` กับ manifest ที่มีรายการเลือกจากทั้งสี่ repositories ต้องไม่ถามเลือก skill/agent ระหว่างทำงาน, exit code เป็นศูนย์, global source มี `SKILL.md` ครบ และ Codex/Pi/Hermes ค้นพบ skill ที่เลือกครบตามหลักฐานจาก #4 (FR-01, FR-02, FR-04, FR-05, CP-01, NFR-02)

### AC-02: ตรวจ manifest ก่อนติดตั้ง

ทดสอบ JSON เสีย, field ขาดหรือชนิดผิด, key ที่ไม่รู้จัก, agents/skills ว่าง, agent/installer ไม่รองรับ, repo ผิดรูปแบบ, wildcard, รายการซ้ำ และ destination ชื่อชนกัน แต่ละกรณีต้องได้ exit code ที่ไม่ใช่ศูนย์, ระบุ field หรือ conflict ที่เกี่ยวข้อง และไม่มีคำสั่งติดตั้งถูกเรียก ค่า shell syntax ต้องถูกปฏิเสธหรือส่งเป็นข้อมูลตาม contract โดยไม่มีคำสั่งแทรกถูกรัน (FR-02, FR-03, FR-07, NFR-01)

### AC-03: ติดตั้งซ้ำและเจอของเดิม

รัน manifest เดิมสองรอบแล้วต้องไม่มี directory/link ซ้ำและ agents ยังอ่าน skill ได้ วางไฟล์จริงหรือ link ไป source อื่นใน destination แล้วรันใหม่ ต้องหยุดด้วย exit code ที่ไม่ใช่ศูนย์และข้อมูลเดิมยังอยู่ ตรวจด้วยว่า skill นอก manifest ไม่เปลี่ยนตลอดการทดสอบ (FR-06, NFR-01)

### AC-04: ความล้มเหลวระหว่างติดตั้ง

จำลอง network/download failure ระหว่างรายการที่สองหลังรายการแรกสำเร็จ ต้องรายงานรายการแรกว่าสำเร็จ รายการที่สองว่าล้มเหลว และรายการถัดไปว่ายังไม่ได้ทำ พร้อมทำรายการถัดไปต่อจนจบและคืน exit code ที่ไม่ใช่ศูนย์ หลังแก้ต้นเหตุแล้วรันซ้ำต้องครบได้โดยไม่ทำให้ผลเดิมเสีย หากพบ fallback เป็น copy ต้องรายงานเป็น warning แต่ไม่หยุดรายการถัดไป จำลอง CLI คืนศูนย์แต่ source หรือ agent destination ขาด ต้องไม่รายงานสำเร็จทั้งชุด (FR-05, FR-06, FR-07, NFR-03)

### AC-05: Prerequisites และ permission errors

ทดสอบขาด npm/npx, CLI ไม่รองรับความสามารถที่จำเป็น และ home เขียนไม่ได้ ต้องรายงานปัญหาอย่างชัดเจน โดยไม่ติดตั้ง dependency ของระบบหรือยกระดับสิทธิ์เอง บน Windows ให้ทดสอบสภาพแวดล้อมที่สร้าง link ไม่ได้ ต้องรายงานว่าใช้ copy/junction fallback หรือ failed ตามผลจริง และไม่ซ่อนสถานะนั้น (FR-03, FR-07, CP-01, CP-04, NFR-01)

### AC-06: Path และ wrappers

ติดตั้งจาก checkout และ home ที่มีช่องว่างกับอักษรไทย โดยเรียก installer และ wrapper ด้วย path จาก working directory อื่น ต้องอ่าน manifest ถูกไฟล์และติดตั้งใน home ที่ตั้งใจ ทดสอบ `install.sh` บน Linux/macOS และ `install.ps1` บน Windows native ทั้งกรณีสำเร็จและล้มเหลว ต้องได้ผลและ exit code ตรงกับการเรียก Node.js โดยตรง (FR-08, CP-02, CP-03, NFR-04)

### AC-07: Source ร่วมกันและเอกสารใช้งาน

บนแต่ละ OS ตรวจ source และ destination ครบสาม agents ตามข้อ 6 รวมถึงการสะท้อนการแก้ไฟล์ทดสอบและการค้นพบ skill ต้องไม่มี dangling link หรือสำเนาที่ Skill Stack สร้างเอง README ของ implementation ต้องมี prerequisites, คำสั่งติดตั้ง, วิธีตรวจผล, พฤติกรรมติดตั้งซ้ำ และวิธีแก้ปัญหาที่ตรงกับผลทดสอบ (FR-04, FR-05, FR-07, NFR-03, NFR-05)

## 9. งานที่ต้องยืนยันก่อน implement และตรวจรับ

**#4 — Install method และชื่อ agent จริง:** ต้องบันทึก CLI version, Node.js ขั้นต่ำ, executable/prerequisites, skill identifiers ที่เลือกจากทั้งสี่ repositories, flags สำหรับ global/agents/การไม่ตอบเมนู/symlink, destination paths และวิธีตรวจการค้นพบ skill ของแต่ละ agent รวมถึงพฤติกรรม conflict และการรันซ้ำ หากข้อใดไม่รองรับให้ระบุ requirement ที่ติดขัดก่อนเดินหน้าต่อ

**#5 — Manifest:** ต้องสรุป schema และ validation ตามข้อ 4 รวมถึงวิธีเลือก skill จาก repository หลาย skills และการตรวจ destination ชนกัน โดยไม่เพิ่ม shell commands หรือ installer เฉพาะเข้ามาใน MVP

**#6–#8 — Installer และ wrappers:** ต้องนำ FR/CP/NFR ไป implement พร้อมกำหนด timeout/retry ที่ชัดเจนและเอกสารใช้งาน โดยใช้ผลยืนยันจาก #4–#5

**#9 — Cross-platform validation:** ต้องรัน AC-01–AC-07 บน Linux, macOS และ Windows native พร้อมบันทึก versions, log, exit codes และผลตรวจ source/agents การตรวจเอกสารหรือผ่านบน OS เดียวไม่ถือว่าผ่าน MVP

งาน #10–#11 และการสร้างหรือ publish custom skills ยังคงอยู่นอกขอบเขตเอกสารและ MVP นี้
