# Manifest contract สำหรับ MVP

เอกสารนี้สรุป contract สุดท้ายของ [Issue #5](https://github.com/PeeraphatN/skill-stack/issues/5)
ตาม [SRS ข้อ 4](SRS.md#4-manifest-contract) โดยใช้ชื่อ agent และ skill ที่ตรวจใน
[ผลสำรวจวิธีติดตั้ง](install-methods.md) รายการติดตั้งจริงมีแห่งเดียวคือ [manifest.json](../manifest.json)
ส่วนเอกสารนี้อธิบายกติกา ไม่ใช่รายการติดตั้งอีกชุด

หมายเหตุ: manifest ปัจจุบันมี 29 skills จากแปด repositories หลังทำ Issue #11 โดยสี่แหล่งที่เพิ่มใช้การแจกจ่ายแบบ skills-only ผ่าน `npx skills`; ข้อจำกัดอยู่ใน [คู่มือ adapters](adapters.md)

## รูปแบบข้อมูล

ไฟล์ต้องเป็น JSON object ที่มีสอง field เท่านั้น คือ `agents` และ `skills` ไม่มี schema version
สำหรับ MVP ดังนั้น `version`, `schemaVersion` หรือ field อื่นที่ไม่ได้ระบุจะถูกปฏิเสธ ไม่เดารุ่นหรือข้าม field เงียบ ๆ

`agents` เป็น array ที่ไม่ว่างและไม่มีค่าซ้ำ ใช้ CLI identifiers โดยตรง ได้แก่ `codex`, `pi`,
`hermes-agent` และ `claude-code` เท่านั้น ไม่รับ alias `hermes` จึงไม่ต้องมี mapping อีกชุดใน installer
manifest ที่ส่งมอบเลือกครบทั้งสี่ ส่วน contract ยอมให้ผู้ดูแลเลือกรายการย่อยที่ไม่ว่างได้

`skills` ระดับบนเป็น array ของรายการ source ที่ไม่ว่าง ลำดับใน array คือลำดับที่ installer ต้องประมวลผล
แต่ละรายการต้องมี field ต่อไปนี้ครบและห้ามมี field เพิ่ม:

- `name` เป็นชื่อรายการสำหรับ log ต้องไม่ซ้ำทั้ง manifest ไม่ใช่ชื่อที่ใช้เลือก skill จาก CLI
- `repo` เป็น public GitHub repository รูปแบบ `owner/repository` เท่านั้น ตัว owner ยาว 1–39 ตัว
  เริ่มและจบด้วยตัวอักษรอังกฤษหรือตัวเลข ภายในใช้ขีดกลางได้ ส่วน repository เริ่มด้วยตัวอักษรอังกฤษ
  หรือตัวเลข ตามด้วยตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือ underscore ได้ ไม่รับ URL, local path, revision, flags หรือคำสั่ง shell
- `installer` ต้องเป็น string `npx-skills` เท่านั้น ไม่เปิดให้ใส่ executable หรือคำสั่งเอง
- `skills` ภายในเป็น array ที่ไม่ว่างของชื่อจาก frontmatter `SKILL.md` ที่เลือกอย่างชัดเจน
  ไม่รับ wildcard และไม่ติดตั้งทุกชื่อใน repository โดยปริยาย

`name` และชื่อ skill ใช้ตัวอักษรอังกฤษพิมพ์เล็กหรือตัวเลข คั่นด้วยขีดกลางเดี่ยวได้
เช่น `9arm-skills` และ `ponytail-audit` ไม่รับช่องว่าง จุด slash ตัวพิมพ์ใหญ่ หรือชื่อที่ขึ้นต้นด้วย `-`
ค่าไม่ถูก trim, เปลี่ยนตัวพิมพ์ หรือ sanitize ให้โดยอัตโนมัติ ชื่อที่ผ่านกติกาจึงใช้เทียบ destination ได้ตรงตัว

ชื่อ skill ต้องไม่ซ้ำทั้งภายในรายการและข้ามทุกรายการ เพราะทุก source ลงชื่อเดียวกันที่ global destination
ถ้าชนกันจะปฏิเสธทั้งหมด โดยบอกทั้งตำแหน่งที่ซ้ำและตำแหน่งแรก ไม่เลือกผู้ชนะตามลำดับติดตั้ง
repository เดียวปรากฏหลายรายการได้เมื่อ `name` และชื่อ skill ที่เลือกไม่ซ้ำ

เพิ่ม public source ในอนาคตได้ด้วยรายการรูปแบบเดียวกัน ไม่ต้องเพิ่มรายชื่อ repository หรือ skill ใน validator
ชุดที่เลือกไม่ได้รวม skills อื่นใน upstream โดยอัตโนมัติ รวมถึง skills ที่เพิ่มใน Issue #11

## วิธีตรวจและนำไปใช้

ใช้ Node.js ตามรุ่นที่กำหนดในผลสำรวจ (`>=22.20.0`) โดยไม่ต้องติดตั้ง dependencies:

```bash
node scripts/validate-manifest.mjs
node scripts/validate-manifest.mjs path/to/manifest.json
node --test
```

คำสั่งแรกหา manifest เทียบกับตำแหน่งสคริปต์ จึงเรียกด้วย absolute path จาก directory อื่นได้
เมื่อระบุไฟล์เอง path สัมพัทธ์จะอิง working directory ปัจจุบัน ผ่านแล้วพิมพ์ `Manifest valid` และคืน exit code 0
ถ้าอ่านไฟล์ไม่ได้, JSON เสีย หรือข้อมูลผิด จะพิมพ์เหตุผลทาง stderr และคืน exit code 1
ข้อผิดพลาดข้อมูลระบุ field เช่น `skills[0].repo` ส่วน JSON เสียเริ่มด้วย `manifest: invalid JSON`
ตัวตรวจหยุดที่ข้อผิดพลาดแรก ผู้ดูแลแก้แล้วเรียกตรวจซ้ำได้

installer ใน Issue #6 ใช้ `parseManifest(text)` จาก `lib/manifest.mjs` เพื่ออ่าน JSON และตรวจทั้งชุด
หรือใช้ `validateManifest(data)` เมื่อตีความ JSON มาแล้ว ทั้งคู่คืน object ที่ผ่านการตรวจโดยไม่แก้ค่า
และ throw `Error` เมื่อไม่ผ่าน ต้องตรวจให้ผ่านก่อนเริ่มติดตั้งรายการใด

validator ไม่เรียก process ไม่ดาวน์โหลด ไม่ติดตั้ง และไม่เปลี่ยนไฟล์ของผู้ใช้ การตรวจแบบ offline
ยืนยันได้เพียงรูปแบบ source ไม่สามารถพิสูจน์ว่า repo เป็น public, มีอยู่จริง หรือมีชื่อ skill ที่เลือกอยู่
การตรวจ availability, prerequisites และผลติดตั้งยังเป็นหน้าที่ของ installer
ค่าจาก manifest ต้องส่งเป็น arguments แยกจาก executable ตาม SRS ห้ามนำไปต่อเป็นคำสั่ง shell

MVP ไม่ pin revision ของ skills และไม่มี field สำหรับ version/ref การรันซ้ำจึงเลือกชื่อเดิมแต่เนื้อหา upstream
อาจเปลี่ยนได้ รุ่น skills CLI ที่ใช้เป็นนโยบายของ installer ตามผลสำรวจ ไม่ใช่ field ที่ผู้ดูแลเติมใน manifest
การทดสอบชุดนี้ครอบคลุม contract และการเลือกชุด MVP ยังไม่ใช่ผลตรวจติดตั้งจริงข้าม OS ใน Issue #9
