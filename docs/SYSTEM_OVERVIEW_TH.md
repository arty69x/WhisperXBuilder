# WhisperX Builder MAX — System Overview (TH)

## 1) ภาพรวมระบบ
WhisperX Builder MAX เป็น **Full-stack AI IDE** ที่รวม 7 โมดูลหลักไว้ในหน้าเดียว โดยใช้ React + TypeScript + Zustand ที่ฝั่ง client และ Express + JWT ที่ฝั่ง server.

โครงหลักของระบบ:
- Frontend: Vite + React + TypeScript + Tailwind v4
- Backend: Express (รันผ่าน `tsx server.ts`), มี auth, DB API, GitHub OAuth
- AI Core: Gemini ผ่าน `@google/genai`
- Persistence: localforage (client) + JSON file (`data/db.json`) บน server

## 2) สถาปัตยกรรมแบบ End-to-End

### Frontend Layer
- จุดเริ่มแอปอยู่ที่ `src/main.tsx` และ render `App`.
- `src/App.tsx` เป็น orchestrator ของทุกโมดูล พร้อม header, sidebar และ auto-save 30 วินาที.
- state ทั้งหมดถูกจัดการด้วย Zustand ใน `src/store.ts`.

### Backend Layer
- `server.ts` เปิด API สำหรับ:
  - `/api/auth/register`, `/api/auth/login` (JWT auth)
  - `/api/auth/github/url`, `/api/auth/github/callback` (GitHub OAuth)
  - `/api/github/repos` (โหลด repo ของผู้ใช้)
  - `/api/db` (GET/POST ข้อมูลผู้ใช้แบบ protected)
- persistence เป็นไฟล์ JSON ใต้ `data/`.

### AI Layer
- `src/lib/gemini.ts` ครอบการเรียก Gemini ทั้งแบบ text, stream, และ json.
- หลายโมดูลเรียก `geminiStream` เพื่อแสดงผลแบบ streaming real-time.

### Design System Layer
- `src/index.css` กำหนดธีม Corporate Brutalism: ขาว/ดำ, border หนา, hard shadow, ตัวพิมพ์ใหญ่.
- มี utility classes เช่น `.btn`, `.panel-holo`, `.grid-bg`, markdown overrides.

## 3) สรุปทุก Feature และวิธีทำให้ใช้งานจริง (Production-ready)

## 3.1 Authentication + Session
### ตอนนี้ระบบทำอะไรได้
- สมัคร/ล็อกอินด้วย email + password (`/api/auth/register`, `/api/auth/login`)
- hash password ด้วย bcrypt
- ออก JWT token แล้วเก็บใน store ฝั่ง client
- ใช้ token เรียก API protected (`/api/db`)

### วิธีทำให้ใช้งานจริง
1. ย้าย `JWT_SECRET` เป็น secret จริงใน environment (ห้าม fallback default ตอน production)
2. เพิ่ม expiry + refresh token strategy
3. ย้าย token จาก client state ไป HttpOnly secure cookie
4. เพิ่ม rate limit + brute-force protection ใน auth routes
5. ตรวจ input ด้วย schema validator (เช่น zod)

## 3.2 Auto-save / Persistence
### ตอนนี้ระบบทำอะไรได้
- `App.tsx` ยิง heartbeat ทุก 30 วินาทีไป `/api/db`
- เก็บ lockspecs, gallery, tasks, skills, docs, visionSessions, theme, sidebarOpen
- backend บันทึกแยกตาม `userId`

### วิธีทำให้ใช้งานจริง
1. เปลี่ยน storage จากไฟล์ JSON เป็น PostgreSQL/MongoDB
2. เพิ่ม optimistic concurrency (versioning)
3. แยก snapshot / incremental update ลด payload
4. ใส่ telemetry กรณี save fail พร้อม retry backoff
5. เพิ่ม restore-on-login โดยโหลด `/api/db` แล้ว hydrate state อัตโนมัติ

## 3.3 Ghost Team (AI Chat 9 Agents)
### ตอนนี้ระบบทำอะไรได้
- มี 9 agent persona (REX, ARIA, KODE ฯลฯ)
- เลือก agent และคุยแบบ streaming
- รองรับ markdown output และ copy message
- เก็บ history ใน store

### วิธีทำให้ใช้งานจริง
1. เพิ่ม conversation ID + backend message store
2. เพิ่ม token accounting / usage quota ต่อ user
3. แยก system prompts ต่อ use-case และใส่ guardrails
4. เพิ่ม moderation + PII redaction
5. เพิ่ม fallback model chain (ถ้ารุ่นหลักล้มเหลว)

## 3.4 Vision Pipeline (Screenshot to Code)
### ตอนนี้ระบบทำอะไรได้
- รับไฟล์ภาพ, แปลง base64, เปิด vision session
- เรียก Gemini พร้อม image input
- stream ผลลัพธ์เป็น markdown code
- ดาวน์โหลด output ได้

### วิธีทำให้ใช้งานจริง
1. เพิ่ม image validation (type, size, dimensions)
2. แยก stages จริงให้ละเอียด (upload → blueprint → codegen → refine)
3. เพิ่ม post-processing เพื่อ extract code block อัตโนมัติ
4. เพิ่ม lint/format/check generated code ก่อนให้ดาวน์โหลด
5. เก็บ artifact ต่อรอบพร้อม metadata (model, latency, prompt hash)

## 3.5 Builder Studio (Lockspec + Wizard)
### ตอนนี้ระบบทำอะไรได้
- มี Project Wizard เลือก template, stack, objective, modules
- สร้าง lockspec แล้ว generate blueprint ผ่าน Gemini
- stream output ลง terminal-like panel และดาวน์โหลดได้

### วิธีทำให้ใช้งานจริง
1. นิยาม lockspec schema ที่ strict และ versioned
2. เพิ่ม validator ก่อน generate
3. เพิ่ม execution engine แยก stage จริง (audit/types/components/tests/build)
4. เพิ่ม dry-run mode + diff preview ก่อน apply
5. ผูกกับ CI pipeline เพื่อเช็คว่า blueprint deploy ได้จริง

## 3.6 Skill Forge
### ตอนนี้ระบบทำอะไรได้
- สร้าง skill draft, แก้ชื่อ/description/body
- เพิ่ม test cases (prompt/expected behavior)
- ลบ skill และจัดการรายการใน store

### วิธีทำให้ใช้งานจริง
1. เพิ่ม runner สำหรับ eval test cases อัตโนมัติ
2. เก็บ score/latency/cost เป็น metric ต่อเวอร์ชัน
3. เพิ่ม publish workflow (draft → ready → packaged)
4. เพิ่ม access control (private/team/public)
5. เพิ่ม import/export `.skill.json`

## 3.7 Doc Atelier
### ตอนนี้ระบบทำอะไรได้
- สร้าง doc project, จัด sections, แก้ markdown
- ตั้ง type ของเอกสาร (guide/api/whitepaper)
- มีปุ่ม preview/deploy (UI พร้อม แต่ backend action ยังไม่เชื่อม)

### วิธีทำให้ใช้งานจริง
1. เพิ่ม markdown-to-site pipeline (MDX/Nextra/Docusaurus)
2. ต่อ preview server จริง
3. deploy ไป static hosting (Vercel/Cloudflare Pages/S3)
4. เพิ่ม versioning และ review workflow
5. ใส่ search index (lunr/algolia)

## 3.8 Theme Lab
### ตอนนี้ระบบทำอะไรได้
- แสดง palette, interaction preview, simulation panel
- มีธีมใน store และสั่ง setTheme ได้

### วิธีทำให้ใช้งานจริง
1. ขยาย theme tokens ให้ครบระบบ (surface, text, border, states)
2. bind theme กับ CSS vars ที่ใช้งานจริงทุก component
3. เพิ่ม contrast/accessibility checks
4. เพิ่ม export theme preset
5. sync theme กับ lockspec/doc templates

## 3.9 GitHub Forge
### ตอนนี้ระบบทำอะไรได้
- OAuth ผ่าน popup
- ดึง repos ของ user แล้วแสดง metadata
- disconnect ได้

### วิธีทำให้ใช้งานจริง
1. ย้าย token เก็บแบบ secure server-side (ไม่ใช้ localStorage)
2. จำกัด scopes ตาม least privilege
3. เพิ่ม webhook sync (push/PR/events)
4. รองรับ pagination + repo filters
5. เพิ่ม actions จริงในปุ่ม Synchronize

## 4) Gap สำคัญที่ควรปิดก่อนเปิดใช้งานจริง
1. Security hardening (JWT, token storage, rate limiting, CORS/CSRF)
2. Database migration (จาก JSON file → managed DB)
3. Observability (structured logs, traces, metrics, error tracking)
4. CI/CD + tests (typecheck/lint/build/test + e2e)
5. Runtime resilience (retry policy, circuit breakers, timeouts)

## 5) Production Rollout Plan (แนะนำ)
1. **Phase 1: Security + Infra**
   - Secret management, HTTPS, secure cookie, DB migration
2. **Phase 2: Core Reliability**
   - Autosave robustness, restore flow, monitoring
3. **Phase 3: Feature Completeness**
   - Skill eval runner, Doc deploy pipeline, GitHub synchronize actions
4. **Phase 4: Quality & Scale**
   - e2e tests, perf tuning, quota/cost controls, SLOs

## 6) คำสั่งใช้งานระบบ (ปัจจุบัน)
```bash
npm install
npm run dev
```

สำหรับ build production:
```bash
npm run build
npm run start
```
