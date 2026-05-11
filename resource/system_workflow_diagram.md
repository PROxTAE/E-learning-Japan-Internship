# E-Learning System Workflow (Activity Diagram Flow)

นี่คือ Flow การทำงานของระบบ E-Learning สำหรับการนำไปวาด Activity Diagram (แบบแยก Swimlane) โดยเน้นกระบวนการและจังหวะการรับส่งข้อมูลระหว่าง `Client (Student)`, `Client (Teacher)`, `Backend (Node.js/Socket.io)`, `MongoDB`, และ `Redis` (In-memory session)

---

## 🌟 1. Flow การสร้างแบบทดสอบและเปิดห้องสอบ (Quiz Creation & Open Session)
**เป้าหมาย:** ครูสร้าง Quiz, สร้าง Access Code, และเข้ามาที่หน้า Monitoring Dashboard เพื่อรอเด็กนักเรียน

1. **Client (Teacher):** กรอกข้อมูลสร้าง/แก้ไขแบบทดสอบ และกดบันทึก
2. **Backend:** รับคำสั่ง (REST API: `POST` หรือ `PUT` `/api/quizzes`)
3. **MongoDB:** บันทึกข้อมูล Quiz (โจทย์, ตัวเลือก, เฉลย) ลงฐานข้อมูล
4. **Client (Teacher):** กดสร้างรหัสเข้าห้องสอบ (Generate Access Code)
5. **Backend:** สร้างรหัส (เช่น RX-9201) และบันทึกลง **MongoDB**
6. **Client (Teacher):** เข้าสู่หน้า Monitoring Dashboard (ระบบเชื่อมต่อ WebSocket อัตโนมัติ `JOIN_QUIZ` โดยส่ง `role="teacher"`)
7. **Backend:** ตรวจสอบว่ามีห้องสอบ (Session) หรือยัง และทำการเชื่อมต่อ Socket
8. **Redis:** ดึงข้อมูลสถานะห้องสอบปัจจุบัน (จำนวนเด็ก, คำตอบ) หากเพิ่งเปิดห้อง จะสร้าง Session เปล่าๆ ไว้
9. **MongoDB:** ดึงข้อมูล Quiz มาเผื่อไว้สำหรับโชว์ให้ครู
10. **Backend:** ส่ง Event `SESSION_JOINED` กลับไป
11. **Client (Teacher):** หน้าจอพร้อมใช้งาน (แสดงห้องว่างๆ รอนักเรียนเข้า)

---

## 🌟 2. Flow การเข้าร่วมห้องสอบของนักเรียน (Student Join Session)
**เป้าหมาย:** นักเรียนกรอกโค้ดและเข้ามาในห้องสอบ ครูจะเห็นนักเรียนเด้งขึ้นมาในหน้า Dashboard แบบ Real-time

1. **Client (Student):** กรอก Access Code เข้ามาที่หน้า Play
2. **Backend:** ตรวจสอบ Access Code ผ่าน REST API (`GET /api/play/:code`)
3. **MongoDB:** ค้นหา Quiz ด้วย Access Code และส่งข้อมูลกลับไป
4. **Client (Student):** โหลดหน้าจอและยิง WebSocket ยืนยันการเข้าห้อง (`JOIN_QUIZ` ส่ง `role="student"`)
5. **Backend:** รับข้อมูลนักเรียน
6. **Redis:** บันทึกข้อมูลนักเรียนใหม่/อัปเดตสถานะ (Upsert Student) ลงใน Session เช่น ชื่อ, รูป Avatar, และตั้งสถานะ `isOnline = true`
7. **Redis:** คำนวณ Stats รวมของห้องสอบใหม่ (เช่น จำนวนคนทั้งหมด)
8. **Backend:** ส่ง Event `SESSION_JOINED` คืนให้ **Client (Student)** เพื่อเริ่มทำข้อสอบ
9. **Backend:** ยิง Event (Broadcast) `STUDENT_JOINED` ไปให้ห้องของครู
10. **Client (Teacher):** UI อัปเดตรายชื่อนักเรียนและจำนวนนักเรียนที่ออนไลน์ทันที

---

## 🌟 3. Flow การทำข้อสอบและส่งคำตอบแบบ Real-time (Gameplay & Answer Submission)
**เป้าหมาย:** นักเรียนกดตอบคำถาม ข้อมูลวิ่งไปเก็บและคำนวณ คะแนน/ความสับสน แล้วไปโผล่ที่หน้าจอครูทันที

1. **Client (Student):** เลือกคำตอบและส่งคำตอบผ่าน Socket (`SUBMIT_ANSWER` โดยมีข้อมูล รหัสนักเรียน, ข้อ, คำตอบ, เวลาที่ใช้)
2. **Backend:** รับคำตอบ
3. **MongoDB:** (Optional) ค้นหาข้อสอบเพื่อเทียบว่าคำตอบที่ส่งมาถูกต้องหรือไม่ (`isCorrect`)
4. **Redis:** บันทึกคำตอบ (`recordAnswer`) และคำนวณ 2 อย่าง:
   - **Confusion Level (ระดับความสับสน):** คำนวณจากจำนวนครั้งที่เปลี่ยนคำตอบและระยะเวลาที่ใช้ (high, low, none)
   - **Score (คะแนนล่าสุด):** อัปเดตคะแนนของนักเรียนคนนั้น
5. **Redis:** คำนวณ Stats รวมของห้องใหม่ (`calcStats`) เช่น ค่าเฉลี่ย, เปอร์เซ็นต์ข้อที่ตอบถูก
6. **Backend:** ส่งคำตอบที่ประมวลผลแล้ว กลับไปยืนยันให้ **Client (Student)** ทราบผ่าน Event `ANSWER_UPDATE`
7. **Backend:** บรอดแคสต์ (Broadcast) ข้อมูลผ่าน Event `ANSWER_UPDATE` ไปยัง **Client (Teacher)**
8. **Client (Teacher):** หน้า Monitoring กราฟ Timeline ขยับ, คะแนนเด็กอัปเดต, และโชว์สถานะ Confusion ของนักเรียนคนนั้นทันที

---

## 🌟 4. Flow การควบคุมห้องสอบและการออกจากระบบ (Session Control & Disconnect)

**กรณีครูควบคุมห้องสอบ (Pause/Resume):**
1. **Client (Teacher):** กดปุ่ม Pause หรือ Resume ห้องสอบ
2. **Backend:** รับ Event `CONTROL_SESSION` (action: "pause" / "resume")
3. **Redis:** อัปเดตสถานะ `isPaused` ของ Session นั้น
4. **Backend:** บรอดแคสต์ Event `SESSION_CONTROL` ให้ทุกคนในห้อง
5. **Client (Student):** หน้าจอข้อสอบจะถูกล็อกหรือปลดล็อกตามคำสั่งทันที

**กรณีนักเรียนหลุดการเชื่อมต่อ (Disconnect):**
1. **Client (Student):** ปิดเบราว์เซอร์, เน็ตหลุด, หรือเปลี่ยนหน้าเว็บ
2. **Backend:** ตัว Socket จับเหตุการณ์ `disconnect` ได้
3. **Redis:** อัปเดตสถานะนักเรียนคนนั้นเป็น `isOnline = false` และคำนวณ Stats ห้องใหม่ (Active users ลดลง)
4. **Backend:** บรอดแคสต์ Event `STUDENT_LEFT` ไปที่ห้องของครู
5. **Client (Teacher):** หน้าปัดรายชื่อจะแสดงว่านักเรียนคนนี้ Offline/สีเทาไป

---

### 💡 คำแนะนำสำหรับการเขียน Activity Diagram / Swimlane
* แนะนำให้แบ่งเลน (Swimlanes) เป็น **Student | Teacher | Backend | MongoDB | Redis**
* การดึงข้อมูลแบบ Persistent (เก็บถาวร เช่น ข้อมูลข้อสอบ, รหัสห้อง) ให้ชี้เส้นไปที่ **MongoDB**
* การดึง/เก็บข้อมูลแบบ Real-time Live Session (คะแนนแบบสดๆ, การเข้าออกห้อง, คำตอบรายข้อ) ให้ชี้เส้นไปที่ **Redis** (หรือระบบ In-memory)
* ให้เน้นลูกศรระหว่าง `Backend` กับ `Teacher` ในกระบวนการที่ 3 (การส่งคำตอบ) ว่าเป็นเส้นแบบ **Asynchronous/Broadcast** เพราะครูจะนั่งรอข้อมูล (Listening) ไม่ได้เป็นคนส่ง Request ไปขอข้อมูล
