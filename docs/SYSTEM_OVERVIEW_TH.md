# WhisperX Builder MAX — System Overview (TH)

## ภาพรวมระบบ
WhisperX Builder MAX คือ Full-stack AI IDE ที่มีโมดูลหลักสำหรับ AI Chat, Vision-to-Code, Builder Wizard, Skill Engineering, Documentation Workspace, Theme System และ GitHub Integration โดยแอปใช้ React + TypeScript + Zustand ฝั่ง client และ Express + JWT ฝั่ง server.

## สรุปองค์ประกอบระบบทั้งหมด
- **Frontend Core**: `src/App.tsx` คุม auth gate, routing ระดับโมดูล, auto-save heartbeat, restore state หลัง login.
- **State Management**: `src/store.ts` รวม state ทุก feature (auth, github, lockspec, docs, vision, skills, tasks) พร้อม persistence localforage.
- **AI Engine**: `src/lib/gemini.ts` รองรับ text, stream, json และ image part สำหรับ vision pipeline.
- **Backend API**: `server.ts` มี auth, protected db, github oauth, repo sync endpoint, payload validation, rate limiting, token expiry.
- **Design System**: `src/index.css` ใช้ Corporate Brutalism tokens และ component classes (`btn`, `panel`, hard shadow).

## สรุปฟีเจอร์ + สถานะใช้งานจริง (Implemented)

### 1) Authentication + Security
- สมัคร/ล็อกอินด้วย bcrypt hash และ JWT ที่มีอายุ 12 ชั่วโมง.
- ตรวจ payload ด้วย zod.
- มี auth rate limit เพื่อลด brute-force.
- บังคับใช้ `JWT_SECRET` ใน production environment.

**ไฟล์:** `server.ts`

### 2) Auto-save + Restore
- Auto-save ทุก 30 วินาทีไป `/api/db`.
- มี retry backoff เมื่อ network fail.
- หลัง login ระบบ hydrate state จาก server อัตโนมัติ (restore-on-login).

**ไฟล์:** `src/App.tsx`

### 3) Ghost Team (9 Agents)
- เลือก agent persona และ chat แบบ streaming.
- รองรับ markdown output + copy data.

**ไฟล์:** `src/components/GhostTeam.tsx`

### 4) Vision Pipeline
- อัปโหลดภาพและ generate code จาก vision prompt.
- parse code block อัตโนมัติก่อน export ลด noise จาก markdown wrapper.

**ไฟล์:** `src/components/VisionPipeline.tsx`

### 5) Builder Studio
- มี wizard สร้าง lockspec จาก template.
- validation ขั้นพื้นฐานก่อน finalize.
- generate blueprint ผ่าน stream output.

**ไฟล์:** `src/components/BuilderStudio.tsx`

### 6) Skill Forge
- สร้าง/แก้ skill + test cases.
- เพิ่ม quick eval mode (heuristic) เพื่อให้รันทดสอบได้ทันที พร้อมคะแนนและสถานะ.

**ไฟล์:** `src/components/SkillForge.tsx`

### 7) Doc Atelier
- จัดโครงเอกสารและ sections.
- เพิ่ม search/filter โปรเจกต์.
- เพิ่ม Preview modal และ Export corpus (markdown) เพื่อพร้อมใช้งานจริงทันที.

**ไฟล์:** `src/components/DocAtelier.tsx`

### 8) Theme Lab
- แสดง palette + interaction simulation + UI controls สำหรับธีม.

**ไฟล์:** `src/components/ThemeLab.tsx`

### 9) GitHub Forge
- OAuth connect/disconnect.
- load repos พร้อม metadata.
- token ย้ายจาก localStorage ไป sessionStorage เพื่อลด persistence risk.

**ไฟล์:** `src/components/GitHubModule.tsx`

## วิธีใช้งานระบบจริงทันที (Runbook)
1. ตั้งค่า environment ตาม `.env.example`.
2. ติดตั้ง dependencies: `npm install`.
3. รัน dev server: `npm run dev`.
4. สำหรับ production build: `npm run build` แล้ว `npm run start`.

**ไฟล์:** `.env.example`, `package.json`
