# ผลสำรวจวิธีติดตั้ง skills สำหรับ MVP

สำรวจสำหรับ GitHub Issue #4 เมื่อ 18 ตุลาคม 2026 โดยอ่าน README, เอกสารติดตั้ง และ source ของ upstream สี่ repository ตาม MVP ใน README ของโปรเจกต์นี้ ลิงก์ที่มี commit SHA ระบุ snapshot ที่ตรวจ เพื่อให้ย้อนดูหลักฐานได้เมื่อ upstream เปลี่ยน

คำว่า “ติดตั้งได้” ในเอกสารนี้หมายถึง installer พบและวางไฟล์ skill ได้ ส่วน “ใช้งานได้ครบ” ต้องรวมเครื่องมือ, hooks, extension และบริการที่เนื้อหา skill เรียกใช้ด้วย การมี `SKILL.md` อย่างเดียวไม่ใช่หลักฐานว่า workflow ทั้งหมดผ่านบน Codex, Pi, Hermes และ Claude Code แล้ว รอบนี้ไม่มีการติดตั้งลงโฟลเดอร์ agent จริงหรือทดสอบเรียก skill กับโมเดล

## ชื่อ agent และตำแหน่งติดตั้งที่ยืนยันได้

ตรวจ npm package [`skills@1.7.2`](https://www.npmjs.com/package/skills/v/1.7.2) เทียบกับ source ของ release ที่ npm ระบุใน `gitHead`: [`671e8c320810d36fed80fac5f1a2c1bf7e82d812`](https://github.com/vercel-labs/skills/tree/671e8c320810d36fed80fac5f1a2c1bf7e82d812) รุ่นนี้ต้องใช้ **Node.js >=22.20.0** ตาม [`package.json`](https://github.com/vercel-labs/skills/blob/671e8c320810d36fed80fac5f1a2c1bf7e82d812/package.json) จึงไม่ควรถือว่า Node.js รุ่นใดก็ใช้ได้ คำสั่งในเอกสาร pin รุ่น CLI เพื่อให้ตรวจซ้ำได้; ไม่ได้ pin revision ของ skills เว้นแต่ระบุ URL snapshot เอง

ชื่อสำหรับ `skills add --agent` ต้องเป็นตัวพิมพ์เล็กตาม [`src/agents.ts`](https://github.com/vercel-labs/skills/blob/671e8c320810d36fed80fac5f1a2c1bf7e82d812/src/agents.ts):

1. **Codex → `codex`** ใช้ `.agents/skills/` ระดับ project และ `~/.agents/skills/` ระดับผู้ใช้ อ่านตำแหน่งกลางโดยตรง ไม่ต้องสร้างลิงก์ไป `~/.codex/skills/` เอกสาร [OpenAI: Where Codex loads local skills](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills) ยืนยันตำแหน่งนี้และการอ่าน symlink
2. **Pi → `pi`** ใช้ `.agents/skills/` และ `~/.agents/skills/` เช่นเดียวกับ Codex ใน CLI รุ่นนี้ ไม่ต้องสร้างลิงก์ไป `~/.pi/agent/skills/` เอกสาร [Pi: Add it to Pi](https://github.com/earendil-works/pi/blob/482c1381a00d8d00bc81697e4a980c593db6803e/packages/coding-agent/docs/skills.md#add-it-to-pi) ยืนยันการอ่าน shared directories และการค้นหา `SKILL.md` แบบ recursive
3. **Hermes → `hermes-agent`** ใช้ `.hermes/skills/` ระดับ project และ `~/.hermes/skills/` ระดับผู้ใช้ (หรือ `$HERMES_HOME/skills/` เมื่อกำหนด environment variable) ชื่อ `hermes` ไม่อยู่ใน registry นี้ และ CLI จะปฏิเสธ agent ที่ไม่รู้จัก ตาม [`src/add.ts`](https://github.com/vercel-labs/skills/blob/671e8c320810d36fed80fac5f1a2c1bf7e82d812/src/add.ts)
4. **Claude Code → `claude-code`** ใช้ `.claude/skills/` ระดับ project และ `~/.claude/skills/` ระดับผู้ใช้ ตาม agent registry ของ `skills@1.7.2` (`skillsDir: .claude/skills`, `globalSkillsDir: ~/.claude/skills`).

ใน global install แบบปกติ CLI คัดลอก skills ลง `~/.agents/skills/<ชื่อ>` และสร้าง symlink ให้ Hermes และ Claude Code ส่วน Codex กับ Pi ใช้ global source โดยตรง จึงต้องแก้ภาพใน README เดิมที่แสดงว่าทั้งสามตัวต้องมี symlink ตามพฤติกรรม [`src/installer.ts`](https://github.com/vercel-labs/skills/blob/671e8c320810d36fed80fac5f1a2c1bf7e82d812/src/installer.ts) ถ้าสร้างลิงก์ไม่สำเร็จ CLI จะ fallback เป็น copy; บน Windows ใช้ junction เมื่อสร้างลิงก์ directory จึงยังรับรองไม่ได้ว่าจะมีไฟล์กลางชุดเดียวทุกกรณี `--copy` เลือกสำเนาแยกโดยตั้งใจได้

เอกสาร [Hermes Skills System](https://github.com/NousResearch/hermes-agent/blob/5f274827ffcdf5f0686e7c86d5667b8f8e26a6e6/website/docs/user-guide/features/skills.md) ระบุ primary directory เป็น `~/.hermes/skills/` และรองรับ external directories ที่ต้องตั้งค่าเพิ่ม สำหรับ project skills มีทั้ง `.hermes/skills/` และ `.agents/skills/` แต่ต้อง trust project ก่อน นี่ไม่ใช่หลักฐานว่า Hermes จะอ่าน **global** `~/.agents/skills/` โดยอัตโนมัติ MVP จึงควรให้ CLI จัดการลิงก์และไม่ต้องเพิ่ม external_dirs เอง ทั้งนี้แต่ละ Hermes profile มี home ของตัวเอง ต้องส่ง `HERMES_HOME` ให้ตรง profile ที่จะใช้

## คำสั่งกลางสำหรับสี่ agents

ตัวเลือก `--global`, `--agent`, `--skill`, `--list`, `--yes` อ้างอิงจาก [skills CLI README](https://github.com/vercel-labs/skills/blob/671e8c320810d36fed80fac5f1a2c1bf7e82d812/README.md#options) ใช้ `--list` เพื่อตรวจชื่อก่อน และระบุ agents ทั้งสี่ให้ชัดเพื่อไม่พึ่งการตรวจหาโปรแกรมที่ติดตั้งอยู่:

```bash
npx --yes skills@1.7.2 add DietrichGebert/ponytail --list
npx --yes skills@1.7.2 add petergyang/no-ai-slop --list
npx --yes skills@1.7.2 add mattpocock/skills --list
npx --yes skills@1.7.2 add thananon/9arm-skills --list
```

คำสั่งติดตั้งตัวอย่างที่นำไปใช้ต่อได้ด้านล่าง **ยังไม่ได้รันติดตั้งจริง** `--yes` หน้าชื่อ package ตอบรับ npm ส่วนท้ายตอบรับ skills CLI; `--skill` เลือกจากชื่อใน frontmatter ไม่ใช่ชื่อ repo:

```bash
npx --yes skills@1.7.2 add DietrichGebert/ponytail --global --agent codex pi hermes-agent claude-code --skill ponytail ponytail-audit ponytail-debt --yes
npx --yes skills@1.7.2 add petergyang/no-ai-slop --global --agent codex pi hermes-agent claude-code --skill no-ai-slop --yes
npx --yes skills@1.7.2 add mattpocock/skills --global --agent codex pi hermes-agent claude-code --skill code-review codebase-design domain-modeling grill-with-docs implement improve-codebase-architecture pr research retro tdd to-spec to-tickets triage wayfinder writing-for-agents --yes
npx --yes skills@1.7.2 add thananon/9arm-skills --global --agent codex pi hermes-agent claude-code --skill debug-mantra post-mortem scrutinize management-talk --yes
```

คำสั่งด้านบนระบุเฉพาะชุด MVP ที่เลือกไว้ใน [manifest.json](../manifest.json) ตาม Issue #5
ไม่ได้เลือกทุก skill ในแต่ละ repo โดยเฉพาะ `qwen-agent` กับ `qwenchance` ซึ่งมี dependency ตามหัวข้อด้านล่าง
คำสั่งเหล่านี้ยังไม่ใช่หลักฐานว่าติดตั้งหรือใช้งาน workflow จริงครบแล้ว

## DietrichGebert/ponytail

ตรวจที่ commit [`09c434ab73ca43761c5d8b0c5d341926c2fba710`](https://github.com/DietrichGebert/ponytail/tree/09c434ab73ca43761c5d8b0c5d341926c2fba710) (`package.json` ระบุ 5.3.2) มีหก skill จริงใน [`skills/`](https://github.com/DietrichGebert/ponytail/tree/09c434ab73ca43761c5d8b0c5d341926c2fba710/skills): `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review` ไม่ควรนับสำเนาใน `.openclaw/skills/` ซ้ำ

[`INSTALL.md` หัวข้อ Skills CLI](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/INSTALL.md#skills-cli) ให้คำสั่ง:

```bash
npx skills add DietrichGebert/ponytail
```

เอกสารเดียวกันระบุให้เลือก agent ด้วย `--agent`, เลือกทั้งหกด้วย `--skill '*'` และใช้ `--global` เมื่อต้องการติดตั้งระดับผู้ใช้ วิธีนี้คัดลอกเฉพาะ skills ไม่ติดตั้งระบบเปิดใช้อัตโนมัติทุก session, lifecycle hooks หรือ extension ของแต่ละ agent ถ้าต้องการพฤติกรรมครบให้ใช้ native install หรือเพิ่ม `AGENTS.md` ตาม upstream โดยพิจารณาเนื้อหาเดิมของโปรเจกต์ก่อน

### Codex, Pi, Hermes และ Claude Code

Upstream มี adapter สำหรับ Codex, Pi และ Hermes โดยตรง ตาม [`INSTALL.md`](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/INSTALL.md) และ [`docs/agent-portability.md`](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/docs/agent-portability.md) คำสั่งเหล่านี้เป็น native install ที่แยกจากแนวทาง skills-only ของ MVP:

```bash
# Codex: จาก terminal
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail

# Pi: package ที่มีทั้ง skills และ extension
pi install git:github.com/DietrichGebert/ponytail

# Hermes: plugin ที่มี hooks ของ Hermes
hermes plugins install DietrichGebert/ponytail --enable
```

Codex ต้องเปิด `/hooks`, ตรวจและ trust lifecycle hooks สองตัว แล้วเริ่ม thread ใหม่; desktop app ต้อง restart หลังติดตั้ง Hooks ต้องมี `node` ใน PATH ของ non-interactive shell ด้วย ส่วน Pi มี extension ที่ inject rules ทุก turn และลงทะเบียนคำสั่ง ตาม [`package.json` ช่อง `pi`](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/package.json)

Hermes มีข้อจำกัดที่ upstream บันทึกไว้: install อาจปฏิเสธ root `plugin.json` ด้วยข้อความ `plugin.json declares an unsupported or missing Agent Plugins schema` ระหว่างรอแก้ upstream เสนอวิธีสำรองต่อไปนี้ และบันทึกว่าได้ตรวจด้วย Hermes Agent v0.21.7 แล้ว นี่เป็นผลทดสอบของผู้พัฒนา upstream ไม่ใช่ผลทดสอบของโปรเจกต์นี้:

```bash
git clone https://github.com/DietrichGebert/ponytail.git ~/.hermes/plugins/ponytail
hermes plugins enable ponytail
```

ต้อง restart Hermes; plugin expose skills เป็น `ponytail:<skill>` และ mode เป็น state ระดับ process ถ้าใช้ gateway ร่วมกัน upstream แนะนำจำกัดสิทธิ์คำสั่ง `/ponytail` สำหรับผู้ใช้ที่ไว้ใจได้ การติดตั้งผ่าน `npx skills` ไม่ได้ให้ hooks เหล่านี้ ส่วน band/board ใน README เป็นฟีเจอร์เฉพาะ Claude Code ไม่ใช่ฟีเจอร์ที่ได้บนทั้งสาม agent ([แหล่งอ้างอิง](https://github.com/DietrichGebert/ponytail/blob/09c434ab73ca43761c5d8b0c5d341926c2fba710/README.md#new-in-53-the-band))

## petergyang/no-ai-slop

ตรวจที่ commit [`000650b156983f5159695b441477f4e63b25dc85`](https://github.com/petergyang/no-ai-slop/tree/000650b156983f5159695b441477f4e63b25dc85) มี skill เดียวคือ [`no-ai-slop`](https://github.com/petergyang/no-ai-slop/blob/000650b156983f5159695b441477f4e63b25dc85/skills/no-ai-slop/SKILL.md) ชื่อ repo กับชื่อ skill ตรงกันในกรณีนี้

[`README.md`](https://github.com/petergyang/no-ai-slop/blob/000650b156983f5159695b441477f4e63b25dc85/README.md#how-to-install-no-ai-slop) ระบุคำสั่งตรงกับแนวทาง MVP:

```bash
npx skills add petergyang/no-ai-slop --skill no-ai-slop --global --yes
```

README เสนออีกทางให้พิมพ์ `Install the /no-ai-slop skill globally from https://github.com/petergyang/no-ai-slop` ใน ChatGPT, Claude Code, Codex หรือ coding agent อื่น วิธีนี้เป็นคำขอให้ agent จัดการติดตั้ง ไม่ใช่ CLI contract ที่ควรนำไปเรียกจาก installer

Codex ถูกเอ่ยชื่อในวิธีติดตั้งโดยตรง และ repository มี [Codex/ChatGPT plugin metadata](https://github.com/petergyang/no-ai-slop/blob/000650b156983f5159695b441477f4e63b25dc85/.codex-plugin/plugin.json) แต่ไม่ได้ให้ native CLI install ใน README นี้ สำหรับ Pi และ Hermes ไม่พบคำสั่งหรือผลทดสอบเฉพาะ host ใน README การใช้ทั้งสองจึงพึ่ง skill loader และ agent target ของ skills CLI; ยังไม่ยืนยันการเรียก `/no-ai-slop` หรือผล editing workflow บนสอง host นี้

## mattpocock/skills

ตรวจที่ commit [`49dd158d1076134a641b33efb035946536778336`](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336) repo นี้เป็นชุดหลาย skills จึงไม่มี skill ชื่อ `skills` หรือ `mattpocock-skills` ให้ใช้แทนทั้งชุด ชื่อหลังเป็นชื่อ plugin

[`README.md` หัวข้อ Installation](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/README.md#installation-30-second-setup) ให้เลือกติดตั้งเพียงวิธีเดียวต่อ agent เพื่อไม่ให้แต่ละ skill ปรากฏซ้ำ:

```bash
# Codex native plugin: upstream ระบุว่าอัปเดตเมื่อ startup
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock

# Agent อื่น หรือเมื่อต้องการ editable files
npx skills@latest add mattpocock/skills -a <agent>
```

`<agent>` เป็น placeholder ที่ต้องแทนก่อนรัน README ยก `pi` เป็นตัวอย่างโดยตรง วิธี skills CLI ใช้ได้กับแนวทาง MVP แต่ผู้ใช้ต้อง update เองด้วย `npx skills@latest update` และรัน `add` อีกครั้งเพื่อรับ skills ที่เพิ่มใหม่ Upstream ให้เลือก `setup-matt-pocock-skills` ไปด้วย แล้วเรียก `/setup-matt-pocock-skills` หนึ่งครั้งต่อ repository เพื่อกำหนด issue tracker, triage labels และที่เก็บเอกสาร

### รายชื่อจริงและขอบเขตการเลือก

อ่านชื่อจาก frontmatter ของ `SKILL.md` ณ snapshot นี้ พบ 38 ชื่อ ไม่ใช่รายการเดียวกับทุกเวอร์ชันก่อนหน้า ใน README มีชุด engineering/productivity ที่ใช้งานปกติรวม 27 ชื่อ:

- Engineering 20 ชื่อ: `ask-matt`, `code-review`, `codebase-design`, `diagnosing-bugs`, `domain-modeling`, `grill-with-docs`, `implement`, `implement-spec`, `improve-codebase-architecture`, `pr`, `prototype`, `research`, `retro`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `triage`, `wayfinder`, `wizard` ([source tree](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336/skills/engineering))
- Productivity 7 ชื่อ: `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, `writing-for-agents` ([source tree](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336/skills/productivity))
- Misc 4 ชื่อที่มีไฟล์อยู่จริงแต่ไม่ได้อยู่ใน reference ชุดหลัก: `git-guardrails-claude-code`, `migrate-to-shoehorn`, `scaffold-exercises`, `setup-pre-commit` ([source tree](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336/skills/misc))
- In-progress 7 ชื่อ: `chief-of-staff`, `claude-handoff`, `loop-me`, `setup-ts-deep-modules`, `writing-beats`, `writing-fragments`, `writing-shape` ([source tree](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336/skills/in-progress))

ผลรัน `skills@1.7.2 add <local-clone> --list` พบครบทั้ง 38 ชื่อ รวม misc และ in-progress ด้วย จึงยืนยันได้ว่า discovery ไม่ได้คัดเฉพาะชุดหลักของ README การกำหนด manifest ใน issue ถัดไปต้องเลือกชื่อให้ชัด โดยเฉพาะ drafts และ skill ที่ชื่อระบุ host เช่น `git-guardrails-claude-code`

### Codex, Pi, Hermes และ Claude Code

Codex มีคำสั่ง native plugin ชัดเจน; Pi มีตัวอย่าง `-a pi` ใน README; Hermes ไม่ถูกเอ่ยเฉพาะชื่อ จึงยืนยันได้เพียงแนวทางติดตั้งสำหรับ agent อื่นผ่าน skills CLI ตามชื่อ target ที่ CLI รองรับ ไม่ได้มีผลทดสอบ workflow ของ Hermes ใน README นี้

แม้ README บอกว่าใช้ได้กับทุก model ก็ไม่ได้รับรองว่า tools ของทุก host เท่ากัน ตัวอย่าง [`research`](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/research/SKILL.md) ต้องมี background agent, [`code-review`](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/code-review/SKILL.md) ต้องมี parallel subagents และ [`implement-spec`](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/implement-spec/SKILL.md) ต้องจัดการ subagents กับ worktrees การติดตั้งไฟล์ไม่เพิ่ม capability เหล่านี้ให้ host ส่วน [`setup-matt-pocock-skills`](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/setup-matt-pocock-skills/SKILL.md) อาจต้องใช้ `gh` หรือ `glab` และสิทธิ์ issue tracker ตามที่เลือก ยังต้องทดสอบ workflow จริงแยกตาม agent

## thananon/9arm-skills

ตรวจที่ commit [`a1fc303b274ed06c32d405ba5a6db00ded6e5663`](https://github.com/thananon/9arm-skills/tree/a1fc303b274ed06c32d405ba5a6db00ded6e5663) มีหกชื่อจริง: `debug-mantra`, `post-mortem`, `qwen-agent`, `scrutinize` ใน [`skills/engineering/`](https://github.com/thananon/9arm-skills/tree/a1fc303b274ed06c32d405ba5a6db00ded6e5663/skills/engineering) และ `management-talk`, `qwenchance` ใน [`skills/productivity/`](https://github.com/thananon/9arm-skills/tree/a1fc303b274ed06c32d405ba5a6db00ded6e5663/skills/productivity) ไม่มี skill ชื่อ `9arm-skills`

[`README.md`](https://github.com/thananon/9arm-skills/blob/a1fc303b274ed06c32d405ba5a6db00ded6e5663/README.md#install) แนะนำ:

```bash
npx skills add thananon/9arm-skills
```

README ระบุว่าเป็นวิธีสำหรับทุก agent แต่บทนำยังอธิบายว่าเป็น skills ที่โหลดโดย Claude Code จึงควรอ่านคำกล่าวนั้นว่าเป็นช่องทางแจกไฟล์ ไม่ใช่หลักฐานว่าได้ทดสอบ runtime ของ Codex/Pi/Hermes ทั้งหมดแล้ว ทั้งสามใช้ช่องทาง skills CLI ได้เมื่อ CLI รองรับ target นั้น แต่ไม่มีผลทดสอบเฉพาะ host ใน README นี้

ทางเลือก `./scripts/link-skills.sh` เป็น dev loop สำหรับ symlink ไป `~/.claude/skills/` เท่านั้น จึงไม่ใช่วิธีติดตั้งข้ามสาม agent ของ MVP และ [script](https://github.com/thananon/9arm-skills/blob/a1fc303b274ed06c32d405ba5a6db00ded6e5663/scripts/link-skills.sh) จะลบโฟลเดอร์จริงชื่อซ้ำก่อนสร้าง symlink ไม่ควรนำไปใช้แทน installer กลาง ส่วน `./scripts/list-skills.sh` เป็นคำสั่งอ่านรายชื่อไฟล์อย่างเดียว

มีข้อจำกัดของเนื้อหาสองจุดที่ installer ไม่สามารถแก้ให้:

1. [`qwen-agent`](https://github.com/thananon/9arm-skills/blob/a1fc303b274ed06c32d405ba5a6db00ded6e5663/skills/engineering/qwen-agent/SKILL.md) เรียก `claude-9arm` ซึ่งเป็น shell alias ของ Claude Code ที่ใช้ model `qwen3.6-35b-a3b` ผ่าน 9arm gateway การติดตั้ง skill ไม่ได้ติดตั้ง alias, CLI, credentials หรือ gateway และคำสั่งอนุญาต tools เป็นของ Claude Code จึงใช้ไม่ได้ทันทีบนเครื่องใหม่ของทั้งสาม agent
2. [`qwenchance`](https://github.com/thananon/9arm-skills/blob/a1fc303b274ed06c32d405ba5a6db00ded6e5663/skills/productivity/qwenchance/SKILL.md) อิงสัญญาณ context ของ Claude Code และให้เรียก `handoff` เมื่อ context ใกล้เต็ม แต่ repo นี้ไม่มี `handoff` ต้องมี skill นั้นจากแหล่งอื่น และตรวจพฤติกรรมกับ host ที่ใช้ก่อน

## วิธีตรวจ upstream ที่ทำจริง

เปิดหน้า GitHub ผ่าน web และ shallow-clone ทั้งสี่ repo ลง temporary directory เพื่ออ่าน source โดยไม่ติดตั้ง skills คำสั่งด้านล่างแสดงขั้นตอนที่ทำจริง โดยชื่อ checkout ของ Matt ในรอบตรวจจริงคือ `skills` แต่แสดงเป็น `mattpocock-skills` เพื่อให้แยกจากชื่อ CLI ได้ชัด:

```bash
git clone --depth 1 https://github.com/DietrichGebert/ponytail.git ponytail
git clone --depth 1 https://github.com/petergyang/no-ai-slop.git no-ai-slop
git clone --depth 1 https://github.com/mattpocock/skills.git mattpocock-skills
git clone --depth 1 https://github.com/thananon/9arm-skills.git 9arm-skills
git -C ponytail rev-parse HEAD
git -C no-ai-slop rev-parse HEAD
git -C mattpocock-skills rev-parse HEAD
git -C 9arm-skills rev-parse HEAD
```

อ่าน `README.md`, `INSTALL.md`, `package.json`, เอกสาร adapters และ `SKILL.md`; ดึงชื่อจาก YAML frontmatter และนับแยกตาม directory รายการ command ในส่วนติดตั้งข้างบนเป็นคำสั่งที่เอกสาร upstream แนะนำ ไม่ใช่คำสั่งที่นำมาติดตั้งจริงระหว่างการสำรวจนี้

### ผลตรวจ discovery ด้วย CLI จริง

ตรวจรุ่นและ source ของ installer ด้วยคำสั่งต่อไปนี้ พร้อมอ่าน `src/agents.ts`, `src/add.ts` และ `src/installer.ts` ที่ release commit ข้างต้นเทียบกับไฟล์ที่แจกใน npm:

```bash
npm view skills version dist.tarball
npm view skills@1.7.2 gitHead
npm view skills@1.7.2 engines --json
npm pack skills@1.7.2 --pack-destination <temporary-directory>
node /tmp/issue4-research.BOM3cX/package/bin/cli.mjs --version
```

ค่า version ที่ได้คือ `1.7.2`, `gitHead` คือ `671e8c320810d36fed80fac5f1a2c1bf7e82d812` และ engines คือ `node >=22.20.0` ระหว่างเตรียม CLI การเรียกจาก tarball เปล่าล้มเหลวเพราะไม่มี dependency `yaml`; ติดตั้ง production dependencies ลง temporary package directory ด้วย `npm install --prefix <temporary-package-directory> --omit=dev --ignore-scripts --no-audit --no-fund` แล้วจึงตรวจ discovery สำเร็จ ไม่ใช่ปัญหาของ skill หรือผลการทดสอบติดตั้งจริง

ใช้ Node v22.23.2, npm 12.0.2 และ package `skills@1.7.2` ที่ดาวน์โหลดพร้อม production dependencies ใน temporary directory รัน `--list` กับ local clones ที่ SHA ตรงกับแต่ละหัวข้อ เพื่อตรวจว่า installer อ่านโครงสร้าง nested skills ได้จริง ตั้ง `DISABLE_TELEMETRY=1` ทุกครั้ง คำสั่งที่รันจริงมีรูปแบบนี้ โดยแทน `<local-clone>` ด้วย absolute path ของแต่ละ checkout:

```bash
DISABLE_TELEMETRY=1 NO_COLOR=1 node /tmp/issue4-research.BOM3cX/package/bin/cli.mjs add <local-clone> --list
```

ผลทุกคำสั่งจบด้วย exit code `0` และชื่อที่แสดงตรงกับรายการในแต่ละหัวข้อ:

- `DietrichGebert/ponytail`: `Found 6 skills` ไม่ได้นับสำเนา OpenClaw ซ้ำ
- `petergyang/no-ai-slop`: `Found 1 skill`
- `mattpocock/skills`: `Found 38 skills` แบ่งเป็นกลุ่ม `Mattpocock Skills` 27 และ `General` 11
- `thananon/9arm-skills`: `Found 6 skills`

CLI พิมพ์ `codex Agent detected — installing non-interactively` จาก environment ของ session แต่เมื่อใช้ `--list` จะจบหลังแสดงรายการ ไม่มีขั้นตอนติดตั้งในรอบตรวจนี้ หากต้องการทำซ้ำหลัง temporary directory ถูกลบ ใช้ `DISABLE_TELEMETRY=1 npx --yes skills@1.7.2 add <local-clone> --list` หลัง checkout SHA ที่บันทึกไว้ วิธีเรียกผ่าน `npx` นี้เป็นคำสั่งสำหรับทำซ้ำ ไม่ใช่วิธีเรียกที่ใช้ในการตรวจ local clones รอบนี้

## ข้อจำกัดของผลสำรวจและขอบเขตงานถัดไป

หลักฐานรอบนี้ครอบคลุมเอกสาร upstream, ชื่อ agent ใน CLI, เส้นทางและพฤติกรรมจาก source และ discovery ของ skills จริงบน macOS เท่านั้น ยังไม่ได้ทดสอบ global install, ลิงก์จริง, การโหลดเข้าโมเดล, hooks, native plugins, update หรือการติดตั้งซ้ำ บน macOS/Linux/Windows การที่ CLI รู้จัก target ทั้งสามไม่ได้รับรองว่า skill ทุกตัวใช้ tools ของ host ได้ครบ หรือว่าแต่ละ host รองรับ Windows แบบ native เท่ากัน

Issue #4 จบที่เอกสารนี้และการแก้ชื่อ agent/ภาพเส้นทางใน README ไม่มี manifest หรือ installer เพิ่มเข้ามา การเลือกชุด skills เป็นงาน [Issue #5](https://github.com/PeeraphatN/skill-stack/issues/5), การเรียก installer เป็น [Issue #6](https://github.com/PeeraphatN/skill-stack/issues/6) และการทดสอบติดตั้งจริงข้าม OS เป็น [Issue #9](https://github.com/PeeraphatN/skill-stack/issues/9)
