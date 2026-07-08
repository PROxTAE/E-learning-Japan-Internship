# 📖 เอกสารรายละเอียดระบบ E-Learning Quiz Platform & System Specification

> **อัปเดตล่าสุด:** 19 มิถุนายน 2026 — อ้างอิงจากโค้ดจริงใน `backend/` และ `frontend/` ณ ปัจจุบัน
>
> **ของใหม่ในรอบนี้:** 
> - **Progress Roadmap (แผนผังความก้าวหน้า):** จอ Projector แบบแยกหน้า (`/present/[quizId]`) พร้อมแผนผังความก้าวหน้าและ Leaderboard สด เพื่อสร้าง Gamification
> - **Custom Avatar & UI:** ปรับปรุง UI หน้าห้องรอของนักเรียนและใช้ Avatar แบบปรับแต่งได้ (รูปภาพหรือตัวย่อบนพื้นหลัง Gradient)
> - **Load Testing:** เพิ่มสคริปต์ `loadtest-students.js` จำลองบอทนักเรียนเข้าห้องพร้อมกันจำนวนมาก
> - **Performance & AI Fixes:** อัปเกรดประสิทธิภาพและแก้ไขการทำงานของ AI Assistant
> - (เดิม): Waiting Room (ห้องรอ) + ปุ่มพร้อม, ครูลบนักเรียนออกจากเซสชันได้, ระบบ Round Token แยกรอบสอบ, AI วิเคราะห์รายบุคคลแบบ Streaming (NDJSON) + Queue + Cache

เอกสารนี้รวบรวมสถาปัตยกรรม ฟีเจอร์ทั้งหมด วิธีการใช้งาน ตัวอย่าง Use Case และ Flow การไหลของข้อมูลของระบบ ทั้งฝั่ง **Frontend**, **Backend**, **Database/Cache** และ **AI Engine**

---

## 🛠️ 1. ภาพรวมระบบ & เทคโนโลยีที่ใช้ (System Overview & Tech Stack)

ระบบนี้คือ **Interactive Real-time Quiz Platform** สำหรับห้องเรียนสด (Live Classroom) ช่วยให้อาจารย์สร้างข้อสอบ จัดสอบ ติดตามการตอบของนักเรียนแบบวินาทีต่อวินาที ตรวจจับความสับสน (Confusion Detection) บันทึกพฤติกรรมการทำข้อสอบระดับ Interaction และวิเคราะห์ผลด้วย **AI (Local LLM ผ่าน Ollama)** ทั้งระดับห้องเรียน รายบุคคล และข้ามเซสชัน

### Tech Stack (ตามโค้ดปัจจุบัน)

| Layer | เทคโนโลยี |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4, HeroUI 3, Zustand 5 (State), Framer Motion, Recharts (กราฟ), dnd-kit (Drag & Drop), qrcode (QR Join Code), react-markdown, socket.io-client, i18n Context (TH/EN/JA), next-themes (Dark/Light) |
| **Backend** | Node.js, Express 5, Socket.IO 4.8, JWT (jsonwebtoken) + bcryptjs (Auth), Multer (อัปโหลดรูป), Mongoose 9 |
| **Database** | **MongoDB** — ข้อมูลถาวร: ควิซ, ครู, ผลสอบที่จบแล้ว (QuizSessionResult), Interaction Log |
| **Cache** | **Redis 5** — สถานะห้องสอบสด (นักเรียนออนไลน์, คำตอบรายข้อ, ประวัติการเปลี่ยนคำตอบ, สถิติ) พร้อม TTL และระบบ **In-memory Fallback** อัตโนมัติหาก Redis ล่ม |
| **AI Engine** | **Ollama (Local LLM)** — ตั้งผ่าน `OLLAMA_MODEL` (ปัจจุบันใช้ `qwen3:4b-instruct`), `OLLAMA_HOST`; Backend สตรีมผลแบบ SSE; Frontend API Routes ตรวจจับโมเดลที่ติดตั้งอัตโนมัติผ่าน `/api/tags` (fallback `qwen3:4b-instruct`) และจำกัด concurrency ด้วย `AI_MAX_CONCURRENCY` |

### บทบาทผู้ใช้ (Roles)

* **Super Admin** — ล็อกอินผ่าน `/api/admin/login` จัดการบัญชีอาจารย์ (สร้าง/แก้ไข/ปิดใช้งาน)
* **Teacher (อาจารย์)** — ล็อกอินด้วย JWT สร้าง/จัดการควิซ คุมสอบสด ดูประวัติและรายงาน AI
* **Student (นักเรียน)** — ไม่ต้องสมัครสมาชิก เข้าห้องสอบด้วย **Join Code 6 หลัก** หรือ QR Code แล้วกรอกชื่อ

---

## 🏗️ 2. สถาปัตยกรรมและการไหลของข้อมูล (Architecture & Data Flow)

ระบบสื่อสารกัน 4 ช่องทางหลัก:

1. **REST API (HTTP/JSON)** — Frontend services (`services/*.ts`) เรียก Express Backend (`/api/...`) สำหรับ CRUD ควิซ, Auth, Dashboard, ประวัติเซสชัน, Interaction Log
2. **WebSocket (Socket.IO)** — ใช้เฉพาะ "ห้องสอบสด": นักเรียนส่งคำตอบ → Server บันทึกลง Redis → broadcast ไปยังห้องของครู (`teacher:{sessionId}`) แบบเรียลไทม์
3. **SSE (Server-Sent Events)** — Backend สตรีมข้อความวิเคราะห์จาก Ollama กลับมาทีละ token (AI Summary ของ Session History)
4. **Next.js API Routes → Ollama** — Frontend มี API ภายในของตัวเอง (`app/api/chat`, `app/api/analyze-quiz-log`) ที่เรียก Ollama โดยตรง สำหรับ AI Assistant และการวิเคราะห์ Log รายบุคคล — ตัววิเคราะห์ Log สตรีมกลับเป็น **NDJSON** (เฟรม `meta`/`queue`/`token`/`done`) พร้อมคิวจำกัด concurrency และ cache ผลลง MongoDB

```
                ┌────────────────────── REST (CRUD/Auth/History) ─────────────────────┐
                │                                                                      ▼
┌──────────────┐    Socket.IO (live answers/control)    ┌──────────────┐   Mongoose   ┌─────────┐
│   Frontend   │ ◄────────────────────────────────────► │   Backend    │ ◄──────────► │ MongoDB │
│  (Next.js)   │                                        │ (Express +   │              └─────────┘
│              │ ◄───────────── SSE (AI tokens) ─────── │  Socket.IO)  │   Redis client ┌───────┐
└──────┬───────┘                                        └──────┬───────┘ ◄────────────► │ Redis │
       │  Next.js API Routes (chat / analyze-quiz-log)         │  HTTP /api/generate    └───────┘
       └──────────────────────► ┌────────┐ ◄──────────────────┘
                                │ Ollama │  (Local LLM: qwen3:8b ฯลฯ)
                                └────────┘
```

### หลักการแบ่งหน้าที่เก็บข้อมูล

| ข้อมูล | ที่เก็บ | เหตุผล |
|---|---|---|
| ควิซ คำถาม เฉลย รูปภาพ | MongoDB (`quizzes`) + โฟลเดอร์ `/uploads` | ข้อมูลถาวร แก้ไขผ่าน CRUD |
| บัญชีครู/แอดมิน | MongoDB (`teachers`) | รหัสผ่าน hash ด้วย bcrypt (cost 12) |
| สถานะห้องสอบสด (ใครออนไลน์ ตอบอะไร เปลี่ยนคำตอบกี่ครั้ง) | **Redis** (Hash ต่อ session + TTL) | เร็ว รองรับ State Recovery เมื่อรีเฟรชหน้า, ล้างทิ้งเมื่อจบสอบ |
| ผลสอบที่จบแล้ว (สถิติ, คะแนนรายคน, questionStats) | MongoDB (`quizsessionresults`) | ย้ายจาก Redis → MongoDB ตอนครูกด End Session |
| Interaction Log ระดับเหตุการณ์ (view/select/change/heartbeat) | MongoDB (`quizinteractionlogs`) | ใช้เป็น input ให้ LLM วิเคราะห์รายบุคคล |

> **Fault Tolerance:** Server เปิดได้แม้ Redis ล่ม — `redisService` จะสลับไปใช้ `sessionManager` (in-memory Map) อัตโนมัติ และ Redis จะ warm-up แบบ background ตอน start server

---

## 💾 3. โครงสร้างข้อมูล (Database & Cache Schema)

### 3.1 MongoDB Collections

#### **1) Quiz (`Quiz.model.js`)** — คอลเลกชัน `quizzes`
* `title`, `description`, `category`, `tags[]`, `subject` (วิชา), `chapter` (บท)
* `difficulty`: `easy | medium | hard`
* `durationMinutes` (1–300), `hasTimeLimit`, `showAnswersAfterQuiz`
* `status`: `draft | published | archived`
* `accessCode`: รหัสเข้าห้อง 6 ตัวอักษร (unique + sparse index, สร้างเมื่อ publish)
* `questions[]` (embedded): `text`, `type` (`multiple_choice | true_false`), `order`, `imageUrl`, `choices[]` (`text`, `isCorrect`, `imageUrl`)
* `emoji`, `gradient`: metadata สำหรับการ์ด UI
* `createdBy`, `timestamps` — มี `toJSON` transform แปลง `_id` → `id` ทุกระดับ (quiz/question/choice)

#### **2) Teacher (`Teacher.model.js`)** — คอลเลกชัน `teachers`
* `name`, `email` (unique), `passwordHash` (bcrypt, ไม่ส่งออก JSON), `isActive`, `role`, `avatarUrl`, `department`
* methods: `verifyPassword()`, statics: `hashPassword()`

#### **3) QuizSessionResult (`QuizSessionResult.model.js`)** — คอลเลกชัน `quizsessionresults` (Archive ผลสอบ)
* `sessionId`, `quizId` (ref Quiz), `teacherId`, `sessionLabel` (ครูตั้งชื่อรอบสอบ เช่น "ห้อง 1 - บทที่ 1"), `startedAt`, `endedAt`
* `stats`: `totalStudents`, `averageScore`, `completionPercentage`, `correctAnswers`, `totalAnswers`
* `students[]`: `studentId`, `name`, `score`, `scorePercent`, `progress`, `joinedAt`
* `answers[]`: `studentId`, `questionId`, `choiceId/Text`, `isCorrect`, `responseTime`, `confusionLevel`, `changeCount`, `submittedAt`
* `questionStats[]` (pre-computed สำหรับเรนเดอร์กราฟเร็ว): `correctPercent`, `avgResponseTime`, `confusionCount`, การแจกแจงตัวเลือก `choices[]`

#### **4) QuizInteractionLog (`QuizInteractionLog.model.js`)** — คอลเลกชัน `quizinteractionlogs`
บันทึกพฤติกรรมระดับเหตุการณ์ของนักเรียน 1 คน ต่อ 1 การทำควิซ (ออกแบบมาเพื่อให้ LLM วิเคราะห์):
* `session_metadata`: `student_id`, `student_name`, `quiz_id`, `quiz_title`, `device_info`, `start_timestamp`, `lang`
* `answer_logs[]` ต่อข้อ: `interactions[]` (`action`: `view | select | change | deselect | heartbeat` + timestamp + option), `final_answer[]`, `correct_answers[]`, `is_correct`, `time_spent_seconds`, `is_confused`
* `summary`: `total_score`, `full_score`, `completion_time_seconds`, `average_confusion_rate` (0.0–1.0)
* `ai_analyses[]` (cache ผลวิเคราะห์ AI): ต่อภาษา `lang`, `content` (Markdown), `model`, `createdAt` — เก็บไว้เพื่อ generate ครั้งเดียวต่อนักเรียน/ภาษา กดซ้ำหรือรีเฟรชได้ผลเดิมทันที (ดู Feature 10)

> ฝั่ง Server จะ **ตรวจคำตอบใหม่กับเฉลยจริงใน MongoDB เสมอ** (ไม่เชื่อ flag จาก client) ก่อนบันทึก

### 3.2 Redis Keys (สถานะห้องสอบสด — `redisService.js`)

> `sessionId` ของห้องสอบมีรูปแบบ `quiz-session-{quizId}` (REST monitoring รองรับส่ง accessCode 6 ตัวแล้ว resolve ให้อัตโนมัติ)

| Key | ชนิด | เก็บอะไร |
|---|---|---|
| `quiz:{sessionId}:session` | Hash | `quizId`, **`sessionToken`** (รหัสรอบสอบ หมุนใหม่ทุกครั้งที่ End), `isPaused`, `isLocked`, `isTeacherLed`, `currentQuestionIndex`, `timer`, `timerActive`, `startedAt`, `totalQuestions` |
| `quiz:{sessionId}:students` | Hash (studentId → JSON) | ต่อคน: `studentId`, `name`, `avatar` (DiceBear auto), `isOnline`, **`isReady`** (สถานะพร้อมในห้องรอ), `score`, `progress`, `socketId`, `joinedAt` |
| `quiz:{sessionId}:quiz_cache` | String (JSON) | สำเนาควิซแคชไว้ระหว่างเซสชัน เพื่อตรวจเฉลย `submit_answer` ได้เร็วโดยไม่ยิง MongoDB ทุกครั้ง |
| `quiz:{sessionId}:answers:{studentId}` | Hash (questionId → JSON) | ต่อข้อ: `state`, `finalAnswer(Text)`, `isCorrect`, `responseTime`, `history[]` (ทุกการเปลี่ยนคำตอบ), `confusionLevel`, `updatedAt` |

ทุก key มี **TTL 24 ชั่วโมง** (ต่ออายุทุกครั้งที่มี activity) — จบสอบแล้ว `deleteSession()` ล้างทั้งหมดทันที

---

## 🔌 4. แคตตาล็อก REST API (Express Routes)

| Method & Path | Auth | หน้าที่ |
|---|---|---|
| `POST /api/auth/login` | — | ครูล็อกอิน → รับ JWT |
| `GET /api/auth/me` | Teacher | ดึงโปรไฟล์ครูจาก token |
| `POST /api/admin/login` | — | แอดมินล็อกอิน |
| `GET/POST /api/admin/teachers`, `PUT/DELETE /api/admin/teachers/:id` | Admin | จัดการบัญชีอาจารย์ (DELETE = deactivate) |
| `GET/POST /api/quizzes`, `GET/PUT/DELETE /api/quizzes/:id` | Teacher | CRUD ควิซ |
| `PATCH /api/quizzes/:id/status` | Teacher | เปลี่ยนสถานะ draft/published/archived |
| `POST /api/quizzes/:id/generate-code` | Teacher | สุ่ม Join Code 6 ตัวใหม่ |
| `POST /api/quizzes/images/upload`, `DELETE /api/quizzes/images/:filename` | Teacher | อัปโหลด/ลบรูปประกอบ (Multer → `/uploads`) |
| `GET /api/play/:code` | — (Public) | นักเรียนดึงควิซจาก Join Code |
| `GET /api/dashboard/stats` | — | สถิติแดชบอร์ดครู (จำนวนควิซ, attempts, คะแนนเฉลี่ยถ่วงน้ำหนัก, Weekly Performance 8 สัปดาห์, Top Quizzes, Activity ล่าสุด) |
| `GET /api/monitoring/:sessionId`, `GET /api/monitoring/:sessionId/stats` | — | snapshot สถานะห้องสอบสดจาก Redis (รองรับทั้ง accessCode และ sessionId เต็ม) |
| `GET /api/monitoring/quiz/:quizId/sessions` | — | รายการเซสชันที่จบแล้วของควิซ |
| `GET /api/monitoring/sessions/:sessionId/export` | — | **Export CSV** ผลสอบ — รองรับทั้งเซสชันสด (Redis) และเซสชันที่จบแล้ว (MongoDB) |
| `POST /api/quiz-logs` | — | นักเรียนส่ง Interaction Log ทั้งชุดหลังทำเสร็จ (server ตรวจเฉลยใหม่) |
| `GET /api/quiz-logs`, `GET /api/quiz-logs/:logId`, `GET /api/quiz-logs/student/:studentId/quiz/:quizId` | — | ครู/ระบบดึง Log มาดูหรือส่งให้ AI |
| `GET /api/quiz-logs/:logId/analysis?lang=` | — | ดึงผลวิเคราะห์ AI ที่ cache ไว้ (ต่อภาษา) — ใช้ข้าม Ollama เมื่อกดซ้ำ/รีเฟรช |
| `PUT /api/quiz-logs/:logId/analysis` | — | บันทึกผลวิเคราะห์ AI ลง cache (เรียกจาก Next.js route หลัง generate เสร็จ) |
| `GET /api/session-history/all` | — | ทุกเซสชันที่จบแล้ว (ทุกควิซ) |
| `GET /api/session-history/quiz/:quizId` | — | เซสชันย้อนหลังของควิซ |
| `GET /api/session-history/quiz/:quizId/aggregate` | — | สถิติเปรียบเทียบข้ามเซสชัน (per-question correct% / confusion trend) |
| `GET /api/session-history/:id`, `PATCH /api/session-history/:id/label`, `DELETE /api/session-history/:id` | — | รายละเอียดเต็ม / แก้ชื่อ label รอบสอบ / ลบประวัติเซสชัน |
| `POST /api/session-history/:id/ai-summary` | — | 🤖 สตรีม AI สรุประดับห้องเรียน (SSE, เลือกภาษา th/en/ja) |
| `POST /api/session-history/:id/ai-student/:studentId` | — | 🤖 สตรีม AI วิเคราะห์รายนักเรียน (SSE) |
| `POST /api/session-history/quiz/:quizId/ai-cross-session` | — | 🤖 สตรีม AI เปรียบเทียบข้ามห้อง/รอบสอบ (SSE) |
| `GET /api/health` | — | Health check (สถานะ server + socket.io) |

### Next.js API Routes (Frontend → Ollama โดยตรง)

| Path | หน้าที่ |
|---|---|
| `POST /api/chat` | AI Assistant แชทช่วยครู (auto-detect โมเดล Ollama, system prompt รองรับ `json_quiz_update` สำหรับแก้ควิซอัตโนมัติ) |
| `POST /api/analyze-quiz-log` | สร้าง prompt จาก Interaction Log → Ollama → คำแนะนำการเรียนรายบุคคล **แบบ NDJSON streaming + Queue (semaphore) + Cache** (ดู Feature 10) |
| `GET/POST /api/quiz-logs`, `/api/quiz-logs/[logId]`, `/api/quiz-logs/student/[studentId]/quiz/[quizId]` | proxy ไปยัง Backend |

---

## 📡 5. แคตตาล็อกเหตุการณ์ WebSocket (Socket.IO Event Catalog)

ห้อง (Rooms): `session:{id}` (ทุกคน), `teacher:{id}` (เฉพาะครู), `students:{id}`

| ทิศทาง | Event | หน้าที่ | Payload สำคัญ |
|---|---|---|---|
| Client → Server | `join_quiz` | นักเรียน/ครูเข้าห้องสอบ — สร้าง session ใน Redis ถ้ายังไม่มี; เช็ก `isLocked` ก่อนรับนักเรียน | `sessionId`, `quizId`, `studentId`, `name`, `avatar`, `role` |
| Client → Server | `submit_answer` | นักเรียนส่ง/เปลี่ยนคำตอบ — server ตรวจเฉลยจาก MongoDB, บันทึก history ลง Redis, คำนวณ confusion | `questionId`, `choiceId`, `choiceText`, `responseTime` |
| Client → Server | `control_session` | ครูสั่งควบคุมห้อง | `action`: `pause`, `resume`, `lock`, `unlock`, `teacher_led`, `set_question_index`, `set_timer`, `reset_student`, **`remove_student`** (เตะนักเรียนออก), **`start`** (เริ่มควิซจากห้องรอ), `regenerate_code`, `end` (+`sessionLabel` → Archive + หมุน `sessionToken` ใหม่) |
| Client → Server | `set_ready` | นักเรียนกดสลับสถานะ "พร้อม" ในห้องรอ | `sessionId`, `studentId`, `isReady` |
| Client → Server | `get_lobby` | ขอรายชื่อในห้องรอล่าสุด | `sessionId` |
| Client → Server | `leave_quiz` | นักเรียนออกจากห้องรอ — **ลบระเบียนทิ้งจริง** (กันชื่อค้าง/ซ้ำ) | `sessionId`, `studentId` |
| Client → Server | `get_session_state` | ครูรีเฟรชหน้า → ขอ snapshot เต็มเพื่อกู้คืนแดชบอร์ด | `sessionId` |
| Server → Client | `session_joined` | ตอบรับการ join (ครูได้ students+answers+stats+quiz, นักเรียนได้สถานะ teacher-led/timer) | — |
| Server → Client | `session_state` | snapshot เต็มตอบ `get_session_state` หรือหลัง `reset_student` | students, answers, stats |
| Server → Teacher | `student_joined` / `student_left` | นักเรียนเข้า/หลุดการเชื่อมต่อ (disconnect = set offline ไม่ลบข้อมูล) | `student`, `stats` |
| Server → Teacher + Student | `answer_update` | broadcast คำตอบใหม่ + สถิติห้องล่าสุดให้ครู / ack กลับให้นักเรียน | `answer`, `stats` |
| Server → ทั้งห้อง | `session_control` | กระจายคำสั่งครูไปทุกหน้าจอ (`pause` ล็อกหน้านักเรียน, `start` พานักเรียนเข้าควิซ, `remove_student` เตะคนนั้นออก, `end` หมุนรอบใหม่) | `action` + payload (+`newSessionToken` ตอน end) |
| Server → ทั้งห้อง | `lobby_update` | broadcast รายชื่อ + สถานะพร้อมในห้องรอ ให้ทุกคนใน session (นักเรียนเห็นกันเอง + ครู) | `students[]` |
| Server → Teacher | `student_removed` | นักเรียนถูกลบถาวร (ออกเอง/ครูเตะ) → ลบแถวออกจากกริด | `studentId`, `stats` |
| Server → Client | `error` | เช่น `ROOM_LOCKED`, "Session is paused" | `message` |

---

## ⚡ 6. เจาะลึกฟีเจอร์ & โฟลว์ระบบ (Features, Data Flow & Use Cases)

---

### Feature 1: Teacher Authentication & Admin Management (ระบบยืนยันตัวตนและจัดการบัญชี)

* **รายละเอียด:** อาจารย์ล็อกอินที่ `/teacher/login` ด้วย email/password → Backend ตรวจกับ `passwordHash` (bcrypt) → ออก **JWT** ให้ Frontend เก็บและแนบใน header ทุก request (`requireTeacher` middleware) ส่วน Super Admin มีหน้าจอ `/admin` สำหรับสร้าง/แก้ไข/ปิดใช้งาน (soft-delete) บัญชีอาจารย์
* **การส่งข้อมูล:** Frontend (`authApi.ts`, `adminApi.ts`) → REST → Express → MongoDB (`teachers`)
* **Use Case:** ภาควิชาเพิ่มอาจารย์ใหม่ 3 ท่าน — แอดมินล็อกอินเข้า `/admin` กดสร้างบัญชี กรอกชื่อ-อีเมล-รหัสผ่าน อาจารย์ใหม่ล็อกอินใช้งานได้ทันที ภายหลังอาจารย์ลาออก แอดมินกดปิดใช้งาน (`isActive = false`) โดยข้อมูลควิซเดิมยังอยู่ครบ

---

### Feature 2: Teacher Dashboard & Statistics (แดชบอร์ดภาพรวมของอาจารย์)

* **รายละเอียด:** หน้า `/teacher` แสดงภาพรวม: จำนวนควิซ (แยก draft/published/archived), จำนวนผู้เข้าสอบสะสม, คะแนนเฉลี่ยถ่วงน้ำหนักตามจำนวนนักเรียน, กราฟ **Weekly Performance ย้อนหลัง 8 สัปดาห์** (Recharts), Top Performing Quizzes และ Activity Feed ล่าสุด
* **การส่งข้อมูล:** `dashboardApi.ts` → `GET /api/dashboard/stats` → Backend aggregate จาก `quizzes` + `quizsessionresults` ใน MongoDB → JSON ก้อนเดียวกลับมาเรนเดอร์
* **Use Case:** ต้นสัปดาห์ อาจารย์เปิดแดชบอร์ดเห็นว่าคะแนนเฉลี่ยสัปดาห์ที่แล้วตก จาก 72% เหลือ 61% และควิซ "บทที่ 4" มี completion ต่ำสุด จึงวางแผนทบทวนบทนั้นก่อนสอนต่อ

---

### Feature 3: Quiz Builder + AI Quiz Copilot (ระบบสร้างข้อสอบ)

* **รายละเอียด:** หน้า `/teacher/create-quiz` สร้างข้อสอบ Multiple Choice / True-False กำหนดวิชา บท ความยาก เวลา แท็ก การแสดงเฉลย แนบรูปประกอบทั้งระดับคำถามและตัวเลือก (อัปโหลดผ่าน Multer) ลากจัดลำดับข้อด้วย dnd-kit มีโหมด Preview และจัดการ state ทั้งหมดผ่าน Zustand (`useQuizBuilder`)
  **AI Quiz Copilot:** ปุ่ม AI Assistant ให้แชทสั่งงาน เช่น "ออกข้อสอบ 5 ข้อเรื่อง Python" — AI ตอบกลับด้วยบล็อก ```json_quiz_update``` ที่ Frontend parse แล้วแสดงการ์ดสรุป กดปุ่มเดียวเพื่อเทข้อมูลทั้งชุดลงฟอร์มอัตโนมัติ
* **การส่งข้อมูล:**
  * บันทึกควิซ: Zustand Store → `quizApi.ts` → `POST/PUT /api/quizzes` (JWT) → MongoDB
  * รูปภาพ: `POST /api/quizzes/images/upload` (multipart) → เก็บไฟล์ใน `backend/uploads` → เสิร์ฟผ่าน `/uploads/...`
  * AI: หน้าเว็บ → `POST /api/chat` (Next.js route) → Ollama `/api/chat` → ตอบ JSON → เทเข้า Store
* **Use Case:** อาจารย์มีเวลา 10 นาทีก่อนเข้าสอน พิมพ์สั่ง AI ให้ร่างข้อสอบ 5 ข้อเรื่อง "ตัวแปรใน Python" ตรวจแก้เฉลย 1 ข้อ เพิ่มรูปประกอบ แล้วกด Publish รับ Join Code ไปแปะหน้าห้องได้ทันเวลา

---

### Feature 4: Publish, Join Code & Student Join Flow (การเผยแพร่และการเข้าห้องสอบ)

* **รายละเอียด:** เมื่อกด Publish ระบบสุ่ม **Access Code 6 ตัวอักษร** (ตัดอักษรที่สับสนง่าย เช่น I, O, 0, 1 ออก, unique ทั้งระบบ) พร้อม **QR Code** และลิงก์ `/play/{code}` ให้แชร์ นักเรียนเปิดลิงก์ → กรอกชื่อใน `StudentNameModal` (avatar สุ่มจาก DiceBear) → เข้าห้องสอบโดยไม่ต้องมีบัญชี ครูสามารถ `regenerate_code` กลางคันเพื่อกันคนนอกได้
* **การส่งข้อมูล:** นักเรียน → `GET /api/play/:code` (ดึงโจทย์จาก MongoDB) → เปิด Socket `join_quiz` → Redis สร้าง/อัปเดต session → broadcast `student_joined` ให้ครู
* **Use Case:** ครูฉายสไลด์ที่มี QR Code นักเรียน 40 คนสแกนเข้าผ่านมือถือภายใน 1 นาที ชื่อทยอยเด้งขึ้นบนแดชบอร์ดครูแบบเรียลไทม์ เมื่อครบแล้วครูกด **Lock** ห้องเพื่อไม่ให้คนเข้าเพิ่ม

---

### Feature 5: Real-time Live Monitoring & Matrix Grid (ระบบคุมสอบสด)

* **รายละเอียด:** หน้า `/teacher/monitoring/[quizId]` คือศูนย์บัญชาการสด:
  * **Matrix Grid** — แถว = นักเรียน (พร้อม progress และคะแนน), คอลัมน์ = ข้อสอบ, เซลล์ = สถานะคำตอบ (🟩 ถูก / 🟥 ผิด / 🟨 กำลังทำ / ⬜ ยังไม่ถึง) คลิกเซลล์เปิด **Answer Popover** ดูไทม์ไลน์การคลิกตอบทุกครั้ง
  * **Live Leaderboard** จัดอันดับสด, **Live Stats Panel** (คะแนนเฉลี่ย, % ความคืบหน้า, จำนวนถูก/ตอบทั้งหมด), **Visual Analytics + Answer Timeline Chart**
  * **State Recovery** — ครูรีเฟรชหน้าได้โดยไม่เสียข้อมูล (`get_session_state` ดึง snapshot จาก Redis กลับมาเต็ม)
* **การส่งข้อมูล:** นักเรียนกดตอบ → `submit_answer` → Backend ตรวจเฉลยจาก MongoDB → บันทึก + push history ลง Redis → `calcStats` → broadcast `answer_update` ไปห้อง `teacher:{sessionId}` → `useMonitoringSocket` + `monitoringStore` (Zustand) อัปเดต UI ทันที
* **Use Case:** ระหว่างสอบ ครูเห็นจาก Grid ว่าข้อ 7 ทั้งคอลัมน์แดงเกินครึ่งห้อง จึงกด Pause อธิบายโจทย์เพิ่มหน้าชั้น แล้ว Resume ให้ทำต่อ — โดยไม่ต้องรอตรวจหลังสอบ

---

### Feature 6: Confusion Detection Engine (ระบบตรวจจับความสับสน)

* **รายละเอียด:** ทุกคำตอบจะถูกคำนวณระดับความสับสนอัตโนมัติจาก (1) จำนวนครั้งที่เปลี่ยนคำตอบ (history) และ (2) เวลาที่ใช้:

  ```javascript
  function _calcConfusion(history, responseTime) {
    const changes = history.length - 1;
    if (changes >= 2 || responseTime > 60) return "high";
    if (changes >= 1 || responseTime > 30) return "low";
    return "none";
  }
  ```

  ผลแสดงเป็น **Confusion Badge** ใน Grid/Popover, สะสมเป็น `confusionCount` ราย question ใน archive และเป็น `is_confused` / `average_confusion_rate` ใน Interaction Log ซึ่งถูกส่งให้ AI ใช้วิเคราะห์ต่อ
* **Use Case:** นักเรียน A ตอบข้อ 3 "ถูก" แต่ badge ขึ้น High Confusion (เปลี่ยนคำตอบ 4 รอบ) — ครูรู้ว่าน่าจะเดาถูก ไม่ได้เข้าใจจริง จึงเรียกมาติวเพิ่ม ทั้งที่ระบบทั่วไปจะมองว่านักเรียนคนนี้ผ่าน

---

### Feature 7: Live Session Controller (แผงควบคุมห้องสอบ)

* **รายละเอียด:** ครูส่ง `control_session` ได้หลาย action:
  * `pause` / `resume` — ล็อก/ปลดล็อกการส่งคำตอบทั้งห้อง (Backend ปฏิเสธ `submit_answer` ระหว่าง pause)
  * `lock` / `unlock` — ปิด/เปิดรับนักเรียนใหม่ (join จะได้ `ROOM_LOCKED`)
  * `teacher_led` + `set_question_index` + `set_timer` — **โหมดครูนำ (Teacher-paced)**: ทุกจอของนักเรียนเลื่อนไปข้อเดียวกันพร้อมตัวจับเวลาที่ครูควบคุม
  * `reset_student` — ล้างคำตอบของนักเรียนรายคน (เช่น เครื่องค้าง ขอเริ่มใหม่)
  * `remove_student` — **เตะนักเรียนออกจากเซสชันถาวร** (ลบทั้งระเบียน+คำตอบ) ใช้เก็บกวาดชื่อซ้ำ/แถวค้าง — มี modal ยืนยันก่อน, นักเรียนคนนั้นเด้งหน้า "ถูกนำออก"
  * `regenerate_code` — สุ่ม Join Code ใหม่กลางคัน
  * `end` (+ `sessionLabel`) — จบสอบ, Archive และ **หมุน `sessionToken` รอบใหม่**
* **Flow ตอนจบเซสชัน (Archiving + Round Rotation):** `end` → Backend ดึง snapshot เต็มจาก Redis → คำนวณคะแนนรายคน (`scorePercent`, `progress`), สถิติรวม และ `questionStats` รายข้อ → บันทึกเป็นเอกสาร `QuizSessionResult` ใน MongoDB → `deleteSession()` ล้าง Redis → **สร้าง session ใหม่พร้อม `sessionToken` ใหม่** (รอบถัดไปสะอาด ไม่จำค่าเดิม) → broadcast `session_control(end)` พร้อม `newSessionToken` ให้นักเรียนเคลียร์ตัวเองและพร้อมเข้ารอบใหม่ (ดู Feature 17)
* **Use Case:** สอบเก็บคะแนนแบบ "ครูนำ" — ครูเปิด Teacher-led กดเดินทีละข้อ ข้อละ 30 วินาที นักเรียนทุกคนเห็นข้อเดียวกันพร้อมกัน หมดเวลาแล้วครูกด End พร้อมตั้ง label "ห้อง 2 - Midterm" เพื่อให้ค้นหาย้อนหลังง่าย

---

### Feature 8: Student Result Screen (หน้าสรุปผลของนักเรียน)

* **รายละเอียด:** จบข้อสุดท้ายแล้ว Frontend เปลี่ยนวิวเป็น `StudentResultScreen`: **ResultScoreCard** (คะแนน %, ถูก/ผิด, เวลาเฉลี่ยต่อข้อ) และ **AnswerReviewList** ไล่ดูเฉลยรายข้อ (แสดงเฉพาะเมื่อครูเปิด `showAnswersAfterQuiz`)
* **การส่งข้อมูล:** ใช้ข้อมูลคำตอบที่สะสมใน state ฝั่ง client + ack จาก socket; พร้อมกันนั้น `useQuizInteractionLog` จะส่ง Log ทั้งชุดขึ้น `POST /api/quiz-logs`
* **Use Case:** นักเรียนทำเสร็จเห็นทันทีว่าได้ 80% ผิดข้อ 4 กับข้อ 9 เปิดดูเฉลยและรู้ว่าตัวเองสับสนเรื่อง scope ของตัวแปร ก่อนออกจากห้องเรียน

---

### Feature 8.1: Presentation & Progress Roadmap (จอโปรเจกเตอร์และแผนผังความก้าวหน้า)

* **รายละเอียด:** หน้าจอสำหรับเปิดฉายขึ้นโปรเจกเตอร์ (`/present/[quizId]`) แยกจากจอคุมสอบของครู เพื่อแสดงสถานะแบบสดของทั้งห้อง โดยมีโหมด **Progress Roadmap** ที่แสดงแผนผังความก้าวหน้าของนักเรียนแต่ละคน (แทนที่ด้วย Avatar) และ **Leaderboard** แบบเรียลไทม์ (Gamification)
* **การส่งข้อมูล:** ดึงข้อมูลผ่าน Socket.IO เหมือนแดชบอร์ดครู แต่เน้นการแสดงผลที่สวยงาม
* **Use Case:** ครูเปิดหน้าจอนี้ทิ้งไว้บนจอใหญ่หน้าห้อง เพื่อให้นักเรียนเห็นความคืบหน้าของตนเองและเพื่อนๆ ว่าใครทำถึงข้อไหนแล้ว เป็นการสร้างบรรยากาศสนุกสนานในห้องเรียน

---

### Feature 9: Quiz Interaction Log System (บันทึกพฤติกรรมการสอบระดับเหตุการณ์)

* **รายละเอียด:** ระหว่างทำข้อสอบ hook `useQuizInteractionLog` บันทึกทุกเหตุการณ์ต่อข้อ: `view` (เปิดดูโจทย์), `select` (เลือกครั้งแรก), `change` (เปลี่ยนคำตอบ — เก็บ from→to), `deselect`, `heartbeat` (สถานะ on_task/off_task เป็นระยะ) พร้อม timestamp และเวลาที่ใช้ต่อข้อ เมื่อส่งข้อสอบ ระบบรวมเป็น JSON ก้อนเดียว (`session_metadata` + `answer_logs` + `summary`) ส่งขึ้น Backend ซึ่ง **ตรวจคำตอบใหม่กับเฉลยจริงทุกข้อ** ก่อนเก็บลง `quizinteractionlogs`
* **การส่งข้อมูล:** Client (in-memory log) → `POST /api/quiz-logs` → MongoDB → ครูเรียกดูผ่าน `GET /api/quiz-logs/...` หรือส่งต่อให้ AI
* **Use Case:** ครูสงสัยว่าทำไมนักเรียน B ใช้เวลาข้อ 5 ไปเกือบ 3 นาที — เปิด Log เห็นว่ามี heartbeat `off_task` ต่อเนื่อง (สลับแท็บหรือวางมือถือ) ไม่ใช่เพราะโจทย์ยาก

---

### Feature 10: Personalized AI Analysis per Student (AI วิเคราะห์และแนะแนวรายบุคคล)

* **รายละเอียด:** นำ Interaction Log มาสร้าง prompt โครงสร้าง (คะแนน, เวลา, confusion rate, สรุปรายข้อพร้อม flag "ตอบเร็วผิดปกติ/ลังเล") ส่งให้ Ollama วิเคราะห์ ตอบเป็น 5 ส่วน: Overall Assessment / Strengths / Weak Areas / Study Recommendations / Encouragement — เลือกภาษาได้ (TH/EN/JA)
* **รองรับนักเรียนจำนวนมากกดพร้อมกัน (สำคัญ):** หน้าผลของนักเรียนทุกคนมีปุ่มนี้ ถ้า 20+ คนกดพร้อมกันจะใช้ 3 กลไกประกอบกัน:
  1. **Cache** — ถ้า log+ภาษานี้เคยวิเคราะห์แล้ว (`ai_analyses[]` ใน MongoDB) จะสตรีมผลเดิมกลับทันที ไม่แตะ Ollama
  2. **Queue (Semaphore)** — จำกัดให้เข้า Ollama พร้อมกันได้ตาม `AI_MAX_CONCURRENCY` (default 1) ที่เหลือเข้าคิว พร้อมส่งเฟรม **"ลำดับคิว"** สดให้ผู้รอเห็น (#1, #2 … ลดลงเรื่อยๆ)
  3. **Streaming** — ตอบกลับเป็น **NDJSON** ทีละเฟรม (`meta` / `queue` / `token` / `error` / `done`) ฝั่ง UI พิมพ์ทีละ token; เมื่อ generate จบจะ `PUT` เก็บผลลง cache ให้ครั้งต่อไปเป็น cache hit
* **การส่งข้อมูล:** UI → `POST /api/analyze-quiz-log` (Next.js route) → เช็ก cache (Backend) → ถ้าไม่มี: ดึง log + build prompt → เข้าคิว → Ollama `/api/chat` (stream) → สตรีม NDJSON กลับ + บันทึก cache
* **Use Case:** จบสอบทั้งห้อง 25 คนกดวิเคราะห์พร้อมกัน — 2–3 คนแรกเริ่มพิมพ์ทันที ที่เหลือเห็นป้าย "อยู่ในคิว #N" แล้วทยอยได้ผลทีละคน เครื่อง Ollama ไม่ล่ม; ใครรีเฟรช/กดซ้ำได้ผลเดิมทันทีจาก cache

---

### Feature 11: AI Assistant (ผู้ช่วย AI ในแอป)

* **รายละเอียด:** `AIAssistant.tsx` คือแชทลอยที่ใช้ได้ทั้งระบบ — ถามตอบทั่วไป ช่วยวิเคราะห์ข้อมูลในหน้าที่เปิดอยู่ และสั่งสร้าง/แก้ไขควิซผ่านบล็อก `json_quiz_update` ระบบ auto-detect โมเดล Ollama ที่ติดตั้งในเครื่อง (`/api/tags`) โดยไม่ต้องตั้งค่า
  **🎯 UI Inspection Mode** (`useContextSelector`): กดปุ่ม Target ในแชทแล้วคลิกเลือก component บนหน้าจอ (การ์ดนักเรียน, การ์ดควิซ ฯลฯ ที่ติด attribute `data-ai-context-type/name/data`) — ระบบไฮไลต์กรอบม่วงตอน hover, ดึง JSON context จาก DOM มาแปะเป็น Context Badge เหนือช่องแชท ทำให้ AI ตอบเจาะจงกับข้อมูลชิ้นนั้นได้
* **การส่งข้อมูล:** UI (messages + context จาก DOM + lang) → `POST /api/chat` → Ollama → คำตอบ (ถ้ามี json_quiz_update → ปุ่ม Apply เทลง Quiz Builder)
* **Use Case:** ครูเห็นนักเรียนคนหนึ่งคะแนนต่ำและ confusion สูง — กด 🎯 คลิกการ์ดของนักเรียนคนนั้น แล้วถาม AI ว่า "ช่วยออกแบบโจทย์ฝึกหัดสำหรับเด็กคนนี้" AI อ่านประวัติคำตอบจาก context แล้วสร้างโจทย์เจาะจุดอ่อนให้ทันที

---

### Feature 12: Session History, Analytics & AI Insights (ประวัติการสอบและรายงานวิเคราะห์)

* **รายละเอียด:** หน้า `/teacher/quizzes/[quizId]/history` แสดงเซสชันย้อนหลังทั้งหมด (ตั้ง/แก้ `sessionLabel` และลบเซสชันที่ไม่ต้องการได้) คลิกเข้ารายเซสชันเพื่อดู:
  * กราฟ **Score Distribution**, **Question Breakdown** (correct% รายข้อ), **Confusion Heatmap**, ตารางคะแนนรายคน
  * **AI Summary Panel** — สตรีมบทวิเคราะห์ระดับห้องเรียนจาก Ollama แบบ SSE (พิมพ์ทีละ token): สรุปภาพรวม, 3 ข้อที่ยากสุดพร้อมเหตุผล, 3 ข้อที่ทำได้ดี, คำแนะนำการสอน 3–5 ข้อ, กลยุทธ์คาบถัดไป — เลือกภาษา TH/EN/JA
  * **AI รายนักเรียน** ในเซสชันนั้น และ **Export CSV** รายเซสชัน
* **การส่งข้อมูล:** `sessionHistoryApi.ts` → REST → MongoDB (`quizsessionresults`); AI = Backend build prompt จากข้อมูลเซสชัน → Ollama → SSE → UI
* **Use Case:** จบเทอม ครูเปิดประวัติ "Quiz บทที่ 3" 4 รอบสอบ กด AI Summary ของรอบล่าสุด ได้รายงานภาษาไทยว่าทั้งห้องอ่อนเรื่อง pointer พร้อมข้อเสนอวิธีสอนใหม่ นำไปแนบรายงานผลการสอนได้ทันที

---

### Feature 13: Cross-Session Comparison & AI Trends (เปรียบเทียบข้ามรอบสอบ)

* **รายละเอียด:** หน้า `history/compare` รวมทุกเซสชันของควิซเดียวกัน: กราฟแนวโน้มคะแนนเฉลี่ยต่อรอบ, ตาราง per-question correct% เทียบทุกห้อง, confusion สะสม และปุ่ม **AI Cross-Session** ให้ LLM วิเคราะห์ว่าแนวโน้มดีขึ้น/แย่ลง คอนเซปต์ไหน "ยากสากล" ทุกห้อง
* **การส่งข้อมูล:** `GET /api/session-history/quiz/:quizId/aggregate` (MongoDB aggregate ในแอป) + `POST .../ai-cross-session` (SSE จาก Ollama)
* **Use Case:** ครูสอน 3 ห้องด้วยควิซเดียวกัน พบจากกราฟว่าห้อง 2 คะแนนต่ำกว่าอย่างมีนัย และ AI ชี้ว่าข้อเรื่อง recursion ผิดมากทุกห้อง (avg 31%) — สรุปได้ว่าปัญหาอยู่ที่เนื้อหา/วิธีสอน ไม่ใช่ตัวห้องเรียน

---

### Feature 14: Multilingual (TH/EN/JA) & Dark/Light Theme

* **รายละเอียด:** ทุกหน้าจอรองรับ 3 ภาษาผ่าน i18n Context + `LanguageSwitcher` และสลับธีมด้วย next-themes ภาษาที่เลือกถูกส่งต่อไปถึง **AI ทุกตัว** (prompt บังคับให้ตอบภาษานั้น) ทำให้รายงาน AI ออกมาเป็นไทย อังกฤษ หรือญี่ปุ่นตามผู้ใช้
* **Use Case:** ใช้งานในแล็บที่ญี่ปุ่น — อาจารย์ญี่ปุ่นใช้ UI ภาษา JA และได้รายงาน AI เป็นภาษาญี่ปุ่น ขณะที่นักศึกษาแลกเปลี่ยนใช้ EN ในเครื่องตนเองพร้อมกัน

---

### Feature 15: Waiting Room / Lobby (ห้องรอก่อนเริ่มสอบ)

* **รายละเอียด:** หลังกรอกชื่อ นักเรียนจะเข้า **ห้องรอ** (แทนที่จะเริ่มทำทันที) เห็นรายชื่อ + Avatar ของทุกคนที่เข้ามาแบบสด มีปุ่ม **"ฉันพร้อมแล้ว"** สลับสถานะ (ขอบ/วงแหวนเขียวเมื่อพร้อม) และตัวนับ "เข้าร่วม X คน / พร้อม Y คน" — อาจารย์เข้าหน้าเดียวกันได้ (มีปุ่ม **Start Quiz**) component เดียว (`WaitingRoom.tsx`) ใช้ได้ทั้ง 2 บทบาท ต่างกันแค่ footer
* **การส่งข้อมูล:** นักเรียน join → `lobby_update` broadcast รายชื่อให้ทั้งห้อง (`session:{id}`); กดพร้อม → `set_ready` → broadcast ใหม่; กดออก → `leave_quiz` (ลบระเบียนจริง); ครูกด Start → `control_session(start)` → ทุกจอนักเรียนเข้าสู่ควิซพร้อมกัน
* **คงสถานะเมื่อรีเฟรช:** สถานะห้องรอ (ชื่อ/พร้อม) เก็บใน `localStorage` คีย์ตาม **round token** — รีเฟรชแล้วกลับเข้าห้องรอเดิม ไม่หลุด
* **Use Case:** ก่อนเริ่มสอบ อาจารย์ฉายห้องรอขึ้นจอ เห็นนักเรียนทยอยเข้าจนครบ 30 คน รอจนเกือบทุกคนกด "พร้อม" แล้วจึงกด Start ให้เริ่มพร้อมกัน

---

### Feature 16: Projector / Presentation View (จอแสดงผลแยกสำหรับห้องเรียน)

* **รายละเอียด:** หน้า `/present/[quizId]` เป็นจอ **เต็มหน้าจอแยกออกจาก Layout ของอาจารย์** (ไม่มี sidebar/topbar) ออกแบบมาเพื่อเอาขึ้น Projector ให้นักเรียนดู — แสดงห้องรอแบบ display-only (ซ่อนปุ่ม Start/Leave), avatar ใหญ่, กริดสูงสุด 6 คอลัมน์, ข้อความ "กำลังรออาจารย์เริ่ม…" ตัวใหญ่ มี auth guard ในตัว เปิดได้จากปุ่ม **"เปิดหน้าจอ Projector"** ทั้งในหน้า monitoring และหน้าห้องรอของอาจารย์ (เปิดแท็บใหม่)
* **การส่งข้อมูล:** ใช้ teacher socket (อ่านอย่างเดียว) รับ `lobby_update` มาเรนเดอร์รายชื่อสด
* **Use Case:** อาจารย์เปิด `/present/...` บนจอโปรเจกเตอร์หน้าห้อง นักเรียนเห็นชื่อตัวเองเด้งขึ้นจอเมื่อเข้าห้องสำเร็จ สร้างบรรยากาศและยืนยันว่าเข้าถูกห้อง

---

### Feature 17: Session Replay & Round Token (เริ่มรอบสอบใหม่แบบสะอาด)

* **รายละเอียด:** แต่ละ "รอบสอบ" มี **`sessionToken`** ของตัวเอง พอครูกด **End Session** ระบบ Archive รอบเก่า แล้ว **หมุน token ใหม่** ทันที — ฝั่งนักเรียน `localStorage` ผูกกับ token เดิม (`quiz_session_{quizId}_{token}`) จึง **ใช้ไม่ได้กับรอบใหม่อัตโนมัติ** ไม่จำค่าเก่า; นักเรียนที่ค้างอยู่จะถูกเคลียร์ identity (ตัด socket) ไม่ค้างในกริดครู กด "เล่นอีกครั้ง" จะ refetch ควิซ (ได้ token ใหม่) กลับไปหน้าใส่ชื่อเพื่อเข้ารอบใหม่
* **การส่งข้อมูล:** `GET /api/play/:code` แนบ `sessionToken` ปัจจุบันให้นักเรียน; `control_session(end)` ส่ง `newSessionToken` กลับทุกจอ
* **Use Case:** อาจารย์ให้ห้องทำควิซเดียวกัน 2 รอบ — กด End รอบแรก (เก็บเข้า history แยกรอบ) แล้วให้ทุกคนทำใหม่ ระบบเริ่มสด ไม่มีคำตอบ/ชื่อเก่าค้าง

---

### Feature 18: Remove Student from Session (ครูลบนักเรียนออกจากเซสชัน)

* **รายละเอียด:** ในกริด monitoring แต่ละแถวมีปุ่ม **ลบ (UserX สีแดง)** โผล่ตอน hover ใช้ได้กับทุกแถวรวมถึงที่ disconnected/ชื่อซ้ำ มี **modal ยืนยันก่อนลบ** (แสดงชื่อนักเรียน) — กดแล้วส่ง `control_session(remove_student)` → ลบระเบียน+คำตอบออกจาก Redis → `student_removed` ลบแถวจากกริด + แจ้งนักเรียนคนนั้นให้เด้งหน้า "ถูกนำออกจากเซสชัน"
* **การส่งข้อมูล:** Monitoring UI → Socket `control_session(remove_student, {studentId})` → Backend `removeStudent` → `student_removed` (ครู) + `session_control` (นักเรียนเป้าหมาย)
* **Use Case:** นักเรียนเข้าซ้ำ 3 แถวชื่อ "asd" เพราะกดเข้าหลายครั้ง — อาจารย์ลบแถวซ้ำทิ้งให้เหลือคนจริง กริดสะอาด สถิติไม่เพี้ยน

---

## 🏁 7. สรุปความสัมพันธ์ของข้อมูล (System Integration Matrix)

| เหตุการณ์ | Frontend | ช่องทาง | Backend | เก็บที่ | AI |
|---|---|---|---|---|---|
| สร้าง/แก้ควิซ | Quiz Builder (Zustand) | REST + JWT | quiz.controller | MongoDB `quizzes` | Copilot ผ่าน `/api/chat` |
| นักเรียนเข้าห้อง | `/play/[code]` | REST + Socket | quizHandlers | Redis (live) | — |
| ห้องรอ / กดพร้อม | WaitingRoom (นักเรียน+ครู+Projector) | Socket `set_ready`/`leave_quiz` → `lobby_update` | quizHandlers | Redis `students` (`isReady`) | — |
| ตอบคำถามสด | Play UI | Socket `submit_answer` | ตรวจเฉลย MongoDB → Redis | Redis (history + confusion) | — |
| คุมสอบ / เตะนักเรียน | Monitoring UI | Socket `control_session` (`start`/`remove_student`/…) | quizHandlers | Redis meta + `student_removed` | — |
| จบสอบ (End) + หมุนรอบ | Monitoring UI | Socket `end` | Archive snapshot + rotate `sessionToken` | MongoDB `quizsessionresults` → ล้าง+สร้าง Redis ใหม่ | — |
| วิเคราะห์ AI รายบุคคล (สเกล) | Result Screen | Next route (NDJSON stream) | proxy + cache | MongoDB `ai_analyses[]` | Ollama (queue+stream+cache) |
| ส่ง Interaction Log | `useQuizInteractionLog` | REST | quizLog.controller (re-validate) | MongoDB `quizinteractionlogs` | input ของ AI รายบุคคล |
| รายงานย้อนหลัง | Session History UI | REST | session-history routes | MongoDB | AI Summary / per-student / cross-session ผ่าน SSE |
| แดชบอร์ดครู | Dashboard UI | REST | dashboard.controller | MongoDB (aggregate) | — |

### จุดเด่นของระบบ (Highlights)

1. **Real-time ครบวงจร** — เห็นทุกคลิกของนักเรียนสด ๆ ผ่าน Socket.IO + Redis พร้อมกู้คืนสถานะเมื่อรีเฟรช
2. **Confusion Detection** — วัด "ความเข้าใจจริง" ไม่ใช่แค่ถูก/ผิด จากพฤติกรรมเปลี่ยนคำตอบและเวลา
3. **AI ทำงานบนเครื่อง (Local LLM)** — ข้อมูลนักเรียนไม่ออกนอกเครื่อง/แล็บ ใช้ Ollama ได้หลายโมเดล สตรีมผลแบบ SSE
4. **วิเคราะห์ 3 ระดับ** — รายบุคคล (Interaction Log) → รายห้อง (Session Summary) → ข้ามรอบสอบ (Cross-Session Trends)
5. **Resilient Architecture** — Redis ล่มก็สอบต่อได้ (in-memory fallback), Server ตรวจเฉลยเองเสมอ ไม่เชื่อ client
6. **Multilingual ถึงระดับ AI** — TH/EN/JA ทั้ง UI และรายงาน AI
7. **Waiting Room + Projector** — รวมพลก่อนเริ่มสอบ เห็นชื่อ/Avatar/สถานะพร้อมสด ฉายขึ้นจอแยกได้
8. **รองรับโหลดสูง** — AI วิเคราะห์รายบุคคลแบบ Queue + Stream + Cache รับนักเรียนกดพร้อมกันได้โดย Ollama ไม่ล่ม
9. **แยกรอบสอบสะอาด** — Round Token หมุนทุกครั้งที่ End เริ่มรอบใหม่ไม่จำค่าเก่า + ครูลบนักเรียนซ้ำได้

