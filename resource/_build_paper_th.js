const path = require("path");
const fs = require("fs");
const G = "C:/Users/nithi/AppData/Roaming/npm/node_modules/docx";
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat,
  SectionType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber,
} = require(G);

const DIR = path.resolve(".");
const CAP = path.join(DIR, "capture screen");
const img = (f) => fs.readFileSync(path.join(CAP, f));
const local = (f) => fs.readFileSync(path.join(DIR, f));

const FONT = "TH SarabunPSK";
const BODY = 28;     // 14pt
const SMALL = 24;    // 12pt
const LINE = 264;

// ---------- helpers ----------
function body(text, { indent = true, after = 80, align = AlignmentType.JUSTIFIED } = {}) {
  return new Paragraph({
    alignment: align, spacing: { after, line: LINE },
    indent: indent ? { firstLine: 340 } : undefined,
    children: [new TextRun({ text, size: BODY, font: FONT })],
  });
}
function bodyR(runs, { indent = true, after = 80 } = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after, line: LINE },
    indent: indent ? { firstLine: 340 } : undefined,
    children: runs.map(r => new TextRun({ text: r.t, bold: r.b, italics: r.i, size: BODY, font: FONT })),
  });
}
function h1(num, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, size: BODY, font: FONT })],
  });
}
function h2(letter, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 140, after: 70 },
    children: [new TextRun({ text: `${letter}. ${text}`, bold: true, size: BODY, font: FONT })],
  });
}
function figure(file, num, caption, { width = 3.05, local: isLocal = false, ratio = 1080/1920 } = {}) {
  const data = isLocal ? local(file) : img(file);
  const w = Math.round(width * 96), h = Math.round(width * ratio * 96);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 30 },
      children: [new ImageRun({ type: "png", data, transformation: { width: w, height: h },
        altText: { title: `รูปที่ ${num}`, description: caption, name: `figure${num}` } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 140 },
      children: [
        new TextRun({ text: `รูปที่ ${num}. `, bold: true, size: SMALL, font: FONT }),
        new TextRun({ text: caption, size: SMALL, font: FONT }),
      ],
    }),
  ];
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bul", level: 0 }, alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 50, line: LINE },
    children: [new TextRun({ text, size: BODY, font: FONT })],
  });
}
function ref(n, text) {
  return new Paragraph({
    spacing: { after: 40, line: 240 }, indent: { left: 300, hanging: 300 },
    children: [new TextRun({ text: `[${n}] ${text}`, size: SMALL, font: FONT })],
  });
}
const bd = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
function tcell(text, { w, head = false, bold = false, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA },
    shading: head ? { fill: "E6E6E6", type: ShadingType.CLEAR } : undefined,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    children: [new Paragraph({ alignment: align, spacing: { after: 0 },
      children: [new TextRun({ text, bold: head || bold, size: SMALL, font: FONT })] })],
  });
}
function tableCaption(num, text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
    children: [
      new TextRun({ text: `ตารางที่ ${num}. `, bold: true, size: SMALL, font: FONT }),
      new TextRun({ text, size: SMALL, font: FONT }),
    ],
  });
}

// ===================== CONTENT (ภาษาไทย) =====================
const titleBlock = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 160 },
    children: [new TextRun({
      text: "ระบบแพลตฟอร์มแบบทดสอบเรียลไทม์เสริมด้วยปัญญาประดิษฐ์ สำหรับการติดตามและวิเคราะห์ความเข้าใจของนักเรียนในชั้นเรียนสด",
      bold: true, size: 40, font: FONT,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 20 },
    children: [
      new TextRun({ text: "ปรัชญา (ผู้ฝึกงาน)", size: 28, font: FONT }),
      new TextRun({ text: "1", size: 18, font: FONT, superScript: true }),
      new TextRun({ text: " และ Hideyuki Takajo", size: 28, font: FONT }),
      new TextRun({ text: "1", size: 18, font: FONT, superScript: true }),
      new TextRun({ text: "∗", size: 28, font: FONT }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({
      text: "1ภาควิชาวิศวกรรมเครือข่ายการสื่อสาร, Kagawa College, National Institute of Technology, 551 Kohda, Takuma, Mitoyo, Kagawa, ประเทศญี่ปุ่น",
      italics: true, size: 24, font: FONT,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 140 },
    children: [new TextRun({ text: "∗อีเมลผู้รับผิดชอบบทความ: takajo@cn.kagawa-nct.ac.jp", size: 22, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new TextRun({ text: "บทคัดย่อ", bold: true, size: BODY, font: FONT })],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: LINE },
    indent: { left: 360, right: 360 },
    children: [
      new TextRun({ text: "การรับรู้ระดับความเข้าใจของนักเรียน “ในระหว่างคาบเรียน” แทนที่จะรู้หลังจบคาบ ยังคงเป็นความท้าทายสำคัญของการสอนในชั้นเรียน งานวิจัยนี้ต่อยอดจากระบบติดตามผลแบบเรียลไทม์ที่พัฒนาขึ้นก่อนหน้า โดยพัฒนาแพลตฟอร์มแบบทดสอบบนเว็บที่เสริมด้วยปัญญาประดิษฐ์ (AI) ซึ่งช่วยให้อาจารย์เห็นคำตอบของนักเรียนทุกคนแบบวินาทีต่อวินาที ตรวจจับความสับสนที่ซ่อนอยู่ และได้รับผลวิเคราะห์เชิงการสอนแบบอัตโนมัติ โดยไม่ส่งข้อมูลของนักเรียนออกนอกห้องเรียน ระบบผสานช่องทางสื่อสารสี่ช่องทาง ได้แก่ REST สำหรับข้อมูลถาวร, WebSocket (Socket.IO) สำหรับคำตอบสด, Server-Sent Events สำหรับสตรีมผลวิเคราะห์ และการเรียก Large Language Model (LLM) ภายในเครื่องผ่าน Ollama โดยตรง ฐานข้อมูลเชิงเอกสาร (MongoDB) เก็บควิซ ผลสอบที่จบแล้ว และบันทึกพฤติกรรมระดับเหตุการณ์ ขณะที่ฐานข้อมูลในหน่วยความจำ (Redis) เก็บสถานะห้องสอบสดพร้อมกลไกสำรองในหน่วยความจำอัตโนมัติเพื่อความทนทานต่อความผิดพลาด นอกเหนือจากการบอกถูก/ผิด ระบบยังมีกลไกตรวจจับความสับสน (Confusion Detection Engine) ที่อนุมานความเข้าใจที่แท้จริงจากพฤติกรรมการเปลี่ยนคำตอบและเวลาที่ใช้ และมีกระบวนการวิเคราะห์ด้วย AI สามระดับ (รายบุคคล รายห้อง และข้ามรอบสอบ) ที่ผลิตรายงานหลายภาษาผ่านกลไกคิว–สตรีม–แคช ซึ่งรองรับการที่นักเรียนทั้งห้องขอผลวิเคราะห์พร้อมกันได้ บทความนี้อธิบายสถาปัตยกรรม การไหลของข้อมูล และอัลกอริทึมหลักอย่างละเอียด รายงานผลการสาธิตในชั้นเรียนกับนักเรียนชาวญี่ปุ่น และขยายแนวคิดการสอนที่เคยเสนอไว้คือ ", size: BODY, font: FONT }),
      new TextRun({ text: "Test-Driven Education", italics: true, size: BODY, font: FONT }),
      new TextRun({ text: " ให้กลายเป็นวงจรป้อนกลับเชิงประเมินที่มี AI ช่วย", size: BODY, font: FONT }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, indent: { left: 360, right: 360 },
    children: [
      new TextRun({ text: "คำสำคัญ:  ", bold: true, size: BODY, font: FONT }),
      new TextRun({ text: "การติดตามผลแบบเรียลไทม์; การประเมินเพื่อพัฒนาการเรียนรู้; การตรวจจับความสับสน; โมเดลภาษาขนาดใหญ่ภายในเครื่อง; WebSocket; การวิเคราะห์การเรียนรู้", italics: true, size: BODY, font: FONT }),
    ],
  }),
];

const part1 = [
  h1("I", "บทนำ"),
  body("ปัจจุบันแท็บเล็ตและอุปกรณ์ส่วนตัวถูกนำมาใช้ในสถานศึกษาอย่างแพร่หลาย และมีงานวิจัยจำนวนมากที่ศึกษาผลของเครื่องมือบนอุปกรณ์พกพาและคอมพิวเตอร์ต่อการเรียนรู้ ระบบ e-learning ที่มีอยู่เดิมก็มีฟังก์ชันแบบทดสอบ การจัดการเนื้อหา และการจัดการคะแนนอยู่แล้ว นักเรียนสามารถใช้ทั้งในห้องเรียนและที่บ้านได้ อย่างไรก็ตาม ในทางปฏิบัติอาจารย์มักไม่ได้ดูผลแบบทดสอบในระหว่างคาบเรียน เพราะข้อสอบกระดาษใช้เวลาตรวจนาน การอธิบายจุดที่เข้าใจผิดจึงถูกเลื่อนไปคาบถัดไป ส่วนข้อสอบออนไลน์ทั่วไปก็มักส่งคำตอบเมื่อนักเรียนกดปุ่ม “ส่ง” ครั้งสุดท้ายเท่านั้น ทำให้อาจารย์ไม่เห็นพัฒนาการความเข้าใจทีละข้อ"),
  body("ต้นแบบรุ่นก่อนหน้าจากห้องปฏิบัติการของเราได้แก้ปัญหานี้บางส่วน ด้วยการติดตามคำตอบของนักเรียนแบบเรียลไทม์ผ่านช่องทางสื่อสารสองทาง (WebSocket) ทำให้อาจารย์อธิบายจุดที่ยากซ้ำได้ภายในคาบเดียวกัน ระบบดังกล่าวพิสูจน์คุณค่าของความทันท่วงที แต่ยังจำกัดอยู่ที่ข้อสอบแบบสี่ตัวเลือก รายงานเพียงสถานะถูก/ผิด และไม่มีการตีความข้อมูลโดยอัตโนมัติ มีพัฒนาการสองด้านนับแต่นั้นที่เป็นแรงผลักดันงานวิจัยนี้ ประการแรก การวิเคราะห์ในชั้นเรียนได้เคลื่อนจากการเพียงให้คะแนนคำตอบ ไปสู่การเข้าใจกระบวนการเรียนรู้ มีงานวิจัยจำนวนมากที่ประเมินสภาวะทางอารมณ์และการรับรู้ของนักเรียนจากการเคลื่อนไหวของดวงตา การแสดงสีหน้า สัญญาณทางสรีรวิทยา หรือพฤติกรรมการใช้เมาส์และคีย์บอร์ด แต่สัญญาณเหล่านี้จำนวนมากต้องใช้เซ็นเซอร์หรือกล้องเพิ่มเติม และก่อให้เกิดความกังวลด้านความเป็นส่วนตัว ประการที่สอง โมเดลภาษาขนาดใหญ่ (LLM) ทำให้สามารถแปลงข้อมูลพฤติกรรมดิบให้กลายเป็นคำแนะนำเชิงการสอนที่อ่านเข้าใจได้ แต่โมเดลที่โฮสต์บนคลาวด์ขัดกับความคาดหวังด้านความเป็นส่วนตัวของห้องเรียนที่จัดการข้อมูลของผู้เยาว์"),
  bodyR([
    { t: "บทความนี้นำเสนอแพลตฟอร์มแบบทดสอบเรียลไทม์ (ต่อไปเรียกว่า " },
    { t: "ระบบ", i: true },
    { t: ") ที่ต่อยอดจากต้นแบบเดิมในสามทิศทาง (1) ระบบอนุมาน" },
    { t: "ความเข้าใจที่แท้จริง", i: true },
    { t: " แทนที่จะดูเพียงความถูกต้อง ผ่านกลไกตรวจจับความสับสน (Confusion Detection Engine) ที่ขับเคลื่อนด้วยสัญญาณเชิงพฤติกรรม (การเปลี่ยนคำตอบและเวลา) ซึ่งไม่ต้องใช้ฮาร์ดแวร์เพิ่ม (2) ระบบทำการวิเคราะห์เชิงการสอนแบบอัตโนมัติสามระดับ ได้แก่ รายบุคคล รายห้อง และข้ามรอบสอบ โดยใช้ LLM " },
    { t: "ภายในเครื่อง", i: true },
    { t: " เพื่อให้ข้อมูลของนักเรียนไม่ออกนอกเครือข่ายของห้องปฏิบัติการ (3) ระบบถูกออกแบบมาเพื่อใช้งานจริงในชั้นเรียนระดับห้อง ด้วยแคชที่ทนต่อความผิดพลาด ห้องรอและจอโปรเจกเตอร์แบบเกม เพื่อจัดระเบียบชั้นเรียน และกลไกคิว–สตรีม–แคชที่ให้นักเรียนทั้งห้องขอผลวิเคราะห์ AI พร้อมกันได้โดยไม่ทำให้โมเดลล่ม เราอธิบายสถาปัตยกรรมและการไหลของข้อมูลอย่างละเอียด พร้อมขยายวิธีการสอนที่เคยเสนอไว้คือ " },
    { t: "Test-Driven Education", i: true },
    { t: " ให้เป็นวงจรป้อนกลับที่มี AI ช่วย" },
  ]),

  h1("II", "วัสดุและวิธีการ"),
  h2("A", "ภาพรวมระบบและสถาปัตยกรรม"),
  bodyR([
    { t: "ดังแสดงในรูปที่ 1 ระบบเป็นเว็บแอปพลิเคชันที่ประกอบด้วยส่วนหน้า (front end) ส่วนหลัง (back end) ฐานข้อมูลสองชนิด และเครื่องมือ AI ภายในเครื่อง ส่วนหน้าพัฒนาด้วย Next.js และ React และให้บริการผ่านเว็บเบราว์เซอร์ทั่วไป อาจารย์และนักเรียนจึงไม่ต้องติดตั้งแอปเฉพาะ ใช้เพียงเบราว์เซอร์บนแท็บเล็ต โน้ตบุ๊ก หรือสมาร์ตโฟนก็พอ ส่วนหลังเป็นเซิร์ฟเวอร์ Node.js ที่ใช้เฟรมเวิร์ก Express ร่วมกับ Socket.IO เช่นเดียวกับต้นแบบเดิม รันไทม์ของเซิร์ฟเวอร์เป็นแบบเธรดเดียวที่มี I/O แบบไม่บล็อก จึงประมวลผลและตอบสนองได้รวดเร็วภายใต้การเชื่อมต่อพร้อมกันจำนวนมาก ระบบใช้ฐานข้อมูล NoSQL สองชนิดเพื่อวัตถุประสงค์ที่เสริมกัน ได้แก่ " },
    { t: "MongoDB", b: true },
    { t: " ฐานข้อมูลเชิงเอกสารที่เก็บข้อมูลโครงสร้างลำดับชั้นในรูปแบบ JSON (ควิซ ผลสอบที่จบแล้ว และบันทึกพฤติกรรม) และ " },
    { t: "Redis", b: true },
    { t: " ฐานข้อมูลแบบ key-value ในหน่วยความจำ ที่ใช้เก็บสถานะห้องสอบสดซึ่งต้องอ่าน-เขียนทันทีที่นักเรียนตอบ" },
  ]),
  body("จุดเด่นของระบบคือการใช้ช่องทางสื่อสารสี่ช่องทางที่ทำงานร่วมกัน แทนการใช้โพรโทคอลร้องขอ-ตอบกลับเพียงแบบเดียว โดยแต่ละช่องทางเหมาะกับความต้องการที่ต่างกัน:"),
  bullet("REST บน HTTP/JSON สำหรับการสร้าง-อ่าน-แก้ไข-ลบควิซ การยืนยันตัวตน (JSON Web Token) แดชบอร์ด และประวัติเซสชัน"),
  bullet("WebSocket (Socket.IO) สำหรับห้องสอบสด ที่ทุกคำตอบจะถูกส่งไปยังเซิร์ฟเวอร์และกระจายไปยังหน้าจอของอาจารย์แบบเรียลไทม์"),
  bullet("Server-Sent Events (SSE) สำหรับสตรีมข้อความที่ AI สร้างจากส่วนหลังทีละ token อาจารย์จึงเห็นผลวิเคราะห์ทยอยปรากฏแทนที่จะต้องรอนาน และ"),
  bullet("การเรียก LLM ภายในเครื่องจากชั้นเซิร์ฟเวอร์ Next.js โดยตรง สำหรับผู้ช่วย AI ในแอปและการวิเคราะห์รายบุคคล โดยสตรีมกลับสู่เบราว์เซอร์เป็น NDJSON (newline-delimited JSON)"),
  body("เทคโนโลยีที่ใช้ในแต่ละชั้นสรุปไว้ในตารางที่ 1 ทั้งหมดเป็นซอฟต์แวร์โอเพนซอร์สและรันบนฮาร์ดแวร์ทั่วไปภายในห้องเรียนหรือห้องปฏิบัติการได้"),
];

const fig1 = figure("fig1_architecture.png", 1, "สถาปัตยกรรมของระบบ ช่องทางสื่อสารสี่ช่องทางเชื่อมต่อไคลเอนต์ (เบราว์เซอร์) ส่วนหน้า Next.js ส่วนหลัง Express/Socket.IO และชั้นข้อมูลกับ AI (MongoDB, Redis และ LLM ภายในเครื่องผ่าน Ollama)", { local: true, width: 6.3, ratio: 5.6/9.2 });

const W = 8800, c1 = 2200, c2 = W - c1;
const techRows = [
  ["ชั้น", "เทคโนโลยี"],
  ["ส่วนหน้า (Front end)", "Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Zustand, Recharts, socket.io-client"],
  ["ส่วนหลัง (Back end)", "Node.js, Express 5, Socket.IO 4.8, JWT + bcrypt, Mongoose"],
  ["ฐานข้อมูล", "MongoDB — ควิซ ผลสอบที่จบแล้ว และบันทึกพฤติกรรม"],
  ["แคช", "Redis — สถานะห้องสอบสด พร้อมกลไกสำรองในหน่วยความจำอัตโนมัติ"],
  ["เครื่องมือ AI", "Ollama (LLM ภายในเครื่อง เช่น qwen3) สตรีมผ่าน SSE / NDJSON"],
];
const table1 = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [c1, c2],
  rows: techRows.map((r, i) => new TableRow({
    children: [tcell(r[0], { w: c1, head: i === 0, bold: i !== 0 }), tcell(r[1], { w: c2, head: i === 0 })],
  })),
});

const part2 = [
  h2("B", "การสร้างข้อสอบและผู้ช่วย AI Quiz Copilot"),
  bodyR([
    { t: "ก่อนการสอบทุกครั้ง อาจารย์จะสร้างข้อสอบใน " },
    { t: "Quiz Builder", b: true },
    { t: " เฉพาะ (รูปที่ 2) ข้อสอบแต่ละชุดมีชื่อ คำอธิบาย วิชา บท ระดับความยาก (ง่าย/กลาง/ยาก) การจำกัดเวลาและระยะเวลา (ถ้ามี) แท็กอิสระ และสวิตช์ควบคุมว่าจะเฉลยให้นักเรียนหลังทำเสร็จหรือไม่ คำถามเป็นแบบหลายตัวเลือกหรือถูก/ผิด อาจารย์สามารถแนบรูปภาพให้คำถามหรือตัวเลือกแต่ละข้อ กำหนดตัวเลือกที่ถูก และลากจัดลำดับข้อด้วยการลาก-วาง พร้อมโหมดแสดงตัวอย่าง (preview) และการจัดการสถานะฝั่งไคลเอนต์อย่างต่อเนื่อง ทำให้ฟอร์มตอบสนองได้ดีแม้ขณะประกอบข้อสอบขนาดใหญ่" },
  ]),
  bodyR([
    { t: "เพื่อเร่งการสร้างข้อสอบ ตัวสร้างได้ฝัง" },
    { t: "ผู้ช่วย AI Quiz Copilot", b: true },
    { t: " ไว้ เป็นแชทที่ขับเคลื่อนด้วย LLM ภายในเครื่องตัวเดียวกัน (ในที่นี้คือ qwen3) อาจารย์พิมพ์คำสั่งภาษาธรรมชาติ เช่น “สร้างคำถาม 5 ข้อเรื่องพื้นฐานเว็บแอปพลิเคชัน” แล้วผู้ช่วยจะตอบกลับด้วยบล็อกข้อมูลเชิงโครงสร้างที่ส่วนหน้าแยกวิเคราะห์เป็นการ์ดสรุป การกดเพียงครั้งเดียวจะเทข้อมูลทั้งชุด ทั้งคำถาม ตัวเลือก เฉลย วิชา และบท ลงในฟอร์ม (รูปที่ 2) เนื่องจากโมเดลรันภายในเครื่อง ร่างข้อสอบจึงถูกสร้างขึ้นโดยไม่ส่ง prompt ออกไปยังบริการภายนอก จากนั้นอาจารย์ตรวจทานและแก้ไขร่าง ปรับเฉลยตามต้องการ และเผยแพร่ข้อสอบ ซึ่งจะสร้างรหัสเข้าห้องหกตัวอักษรและ QR Code สำหรับให้นักเรียนเข้าร่วม" },
  ]),
  ...figure("Screenshot 2026-06-17 143030.png", 2, "Quiz Builder พร้อมผู้ช่วย AI Quiz Copilot คำสั่งภาษาธรรมชาติถูกแปลงโดย LLM ภายในเครื่องเป็นร่างข้อสอบเชิงโครงสร้างที่นำเข้าฟอร์มได้ในคลิกเดียว จากนั้นอาจารย์ตรวจทาน แก้เฉลย และเผยแพร่"),

  h2("C", "การแบ่งการจัดเก็บข้อมูลถาวรและข้อมูลสด"),
  body("ระบบจงใจแยกข้อมูลถาวรออกจากสถานะสดที่เปลี่ยนแปลงตลอดเวลา ควิซที่อาจารย์สร้าง ผลสอบที่จบแล้ว และบันทึกพฤติกรรมระดับเหตุการณ์ ถูกเก็บถาวรใน MongoDB ส่วนสถานะของการสอบที่กำลังดำเนินอยู่ ได้แก่ ใครออนไลน์ ใครตอบอะไรในแต่ละข้อ เปลี่ยนคำตอบกี่ครั้ง และสถิติที่กำลังเดินอยู่ ถูกเก็บใน Redis เหตุผลสอดคล้องกับต้นแบบเดิม คือฐานข้อมูลในหน่วยความจำเข้าถึงได้เร็วพอที่จะบันทึกคำตอบทันทีที่นักเรียนเลือกตัวเลือก อาจารย์จึงติดตามชั้นเรียนได้แบบวินาทีต่อวินาที ทุกคีย์สดมีอายุ (TTL) 24 ชั่วโมงที่ต่ออายุเมื่อมีกิจกรรม เมื่ออาจารย์จบเซสชัน สถานะสดจะถูกย้ายไปเก็บถาวรใน MongoDB และล้างคีย์ใน Redis ทิ้ง"),
  body("การบันทึกทุกคำตอบทันทียังให้ความทนทานต่อความผิดพลาด หากหน้าจอของอาจารย์ขาดการเชื่อมต่อชั่วขณะหรือรีเฟรชหน้า ระบบสามารถสร้างแดชบอร์ดทั้งหมดขึ้นใหม่จาก Redis ทำให้ติดตามผลต่อได้โดยไม่สูญเสียข้อมูล หาก Redis เองใช้งานไม่ได้ เซิร์ฟเวอร์จะสลับไปใช้แมปในหน่วยความจำที่เทียบเท่าโดยอัตโนมัติ และการสอบดำเนินต่อไปได้ ส่วน Redis จะถูกอุ่นเครื่องใหม่ในเบื้องหลัง ที่สำคัญ เซิร์ฟเวอร์จะไม่เชื่อค่าความถูกต้องที่ไคลเอนต์ส่งมา ทุกคำตอบที่ส่งเข้ามาจะถูกตรวจสอบใหม่กับเฉลยจริงในฐานข้อมูลก่อนบันทึกเสมอ"),

  h2("D", "การติดตามผลสดแบบเรียลไทม์และ Answer Popover"),
  bodyR([
    { t: "เมื่อเผยแพร่ควิซ ระบบจะสร้างรหัสเข้าห้องหกตัวอักษร (ตัดอักษรที่สับสนง่าย เช่น I, O, 0 และ 1 ออก) พร้อม QR Code นักเรียนเปิดลิงก์ กรอกชื่อ และเข้าร่วมได้โดยไม่ต้องสมัครบัญชี บนอุปกรณ์ของนักเรียน แต่ละข้อตอบด้วยการแตะเพียงครั้งเดียวโดยไม่มีปุ่มส่ง คำตอบถูกส่งทันทีที่เลือก (รูปที่ 4) การเปลี่ยนใจจึงถูกบันทึกขณะเกิดขึ้นจริง ไม่ใช่เฉพาะตอนจบ ทุกคำตอบเดินทางผ่าน WebSocket ไปยังเซิร์ฟเวอร์ ซึ่งตรวจสอบกับเฉลย บันทึกลง Redis คำนวณสถิติห้องใหม่ และกระจายการอัปเดตไปยังห้องของอาจารย์ คอนโซลของอาจารย์มีศูนย์กลางอยู่ที่ " },
    { t: "Matrix Grid", b: true },
    { t: " ซึ่งแต่ละแถวคือนักเรียนหนึ่งคน และแต่ละคอลัมน์คือข้อสอบหนึ่งข้อ เซลล์แสดงสถานะคำตอบ (ถูก ผิด กำลังทำ หรือยังไม่ถึง) นอกจากนี้ยังมี Leaderboard สด แผงสถิติ (คะแนนเฉลี่ย ความคืบหน้า อัตราการตอบถูก ประสิทธิภาพ) และกราฟไทม์ไลน์คำตอบที่อัปเดตต่อเนื่อง และแดชบอร์ดทั้งหมดกู้คืนได้จาก Redis อาจารย์จึงรีเฟรชหน้าได้ทุกเมื่อโดยไม่เสียมุมมองเดิม" },
  ]),
  bodyR([
    { t: "การคลิกที่เซลล์ใดก็ตามจะเปิด " },
    { t: "Answer Popover (Student Analytics)", b: true },
    { t: " ของนักเรียนและข้อนั้น แทนที่จะเป็นเพียงเครื่องหมายถูก/ผิด ป๊อปอัปจะรายงานข้อความคำถามและตัวเลือกที่นักเรียนเลือกเทียบกับเฉลย " },
    { t: "เวลาที่ใช้ตอบ", i: true },
    { t: " จำนวน" },
    { t: "ครั้งที่เปลี่ยนคำตอบ", i: true },
    { t: " ผลความถูกต้อง และป้าย" },
    { t: "ความสับสน", i: true },
    { t: "ระดับสูง/ต่ำ พร้อม" },
    { t: "ไทม์ไลน์วิวัฒนาการของคำตอบ", i: true },
    { t: " (answer-evolution timeline) ที่แสดงทุกการเปลี่ยนคำตอบตลอดการทำข้อนั้น เซลล์เดียวจึงกลายเป็นบันทึกรายละเอียดว่าได้คำตอบมาอย่างไร เช่น คำตอบที่ถูกแต่ถูกเปลี่ยนถึง 6 ครั้งภายใน 27 วินาทีจะถูกตั้งธงเป็นความสับสนสูง ซึ่งเป็นข้อมูลกระบวนการที่ข้อสอบแบบ “ส่งทีเดียวตอนจบ” ทั่วไปทิ้งไป" },
  ]),

  h2("E", "กลไกตรวจจับความสับสน (Confusion Detection Engine)"),
  body("ข้อจำกัดสำคัญของการรายงานเพียงถูก/ผิด คือคำตอบที่ถูกไม่จำเป็นต้องสะท้อนความเข้าใจ ระบบจึงประเมินระดับความสับสนของทุกคำตอบจากสัญญาณเชิงพฤติกรรมสองอย่างที่ไม่ต้องใช้ฮาร์ดแวร์เพิ่ม ได้แก่ จำนวนครั้งที่นักเรียนเปลี่ยนคำตอบ และเวลาที่ใช้ตอบ กฎถูกออกแบบให้เรียบง่ายและโปร่งใส เพื่อให้อาจารย์ตีความได้:"),
  new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { before: 40, after: 80 }, indent: { left: 200 },
    children: [new TextRun({ text: "ถ้า changes ≥ 2 หรือ time > 60 วินาที → high;  มิฉะนั้นถ้า changes ≥ 1 หรือ time > 30 วินาที → low;  นอกนั้น → none.", font: "Consolas", size: 22 })],
  }),
  body("ระดับที่ได้จะแสดงเป็นป้าย (badge) ใน Grid สะสมเป็นจำนวนความสับสนรายข้อในข้อมูลที่เก็บถาวร และบันทึกไว้กับทุกคำตอบใน Interaction Log ซึ่งภายหลังกลายเป็นอินพุตของการวิเคราะห์ด้วย AI สิ่งนี้ทำให้สามารถระบุนักเรียนที่ตอบถูกหลังจากเปลี่ยนคำตอบหลายครั้ง ซึ่งน่าจะเป็นสัญญาณของการเดาหรือความเข้าใจที่เปราะบาง และชี้ข้อสอบที่ทำให้นักเรียนส่วนใหญ่สับสนแม้ในที่สุดจะตอบถูกก็ตาม"),

  h2("F", "การบันทึกพฤติกรรมระดับเหตุการณ์"),
  body("ขณะที่นักเรียนทำข้อสอบ ฝั่งไคลเอนต์จะบันทึกทุกเหตุการณ์ของแต่ละข้อ ได้แก่ การเปิดดูโจทย์ การเลือกครั้งแรก การเปลี่ยนคำตอบทุกครั้ง (เก็บทั้งตัวเลือกเดิมและตัวเลือกใหม่) การยกเลิกการเลือก และสัญญาณ heartbeat ที่บอกสถานะ on-task/off-task เป็นระยะ พร้อมเวลาประทับและเวลาที่ใช้ในแต่ละข้อ เมื่อส่งข้อสอบ เหตุการณ์เหล่านี้จะถูกรวมเป็นเอกสาร JSON ก้อนเดียว (ข้อมูลเซสชัน บันทึกคำตอบรายข้อ และบทสรุป) ส่งไปยังเซิร์ฟเวอร์ ซึ่งจะตรวจสอบทุกคำตอบกับเฉลยจริงอีกครั้งก่อนจัดเก็บ บันทึกเหล่านี้เป็นวัตถุดิบของการวิเคราะห์รายบุคคลด้วย AI เช่น การใช้เวลานานในข้อหนึ่งพร้อมกับ heartbeat แบบ off-task ต่อเนื่อง บ่งชี้ถึงการวอกแวกมากกว่าความยากของโจทย์ ซึ่งเป็นความแตกต่างที่อาจารย์มองไม่เห็นด้วยวิธีอื่น"),

  h2("G", "การวิเคราะห์ด้วย AI สามระดับด้วย LLM ภายในเครื่อง"),
  bodyR([
    { t: "ระบบแปลงข้อมูลที่เก็บได้ให้เป็นคำแนะนำเชิงการสอนในสามระดับ ทั้งหมดสร้างโดย LLM " },
    { t: "ภายในเครื่อง", i: true },
    { t: " ที่ให้บริการผ่าน Ollama เพื่อให้ข้อมูลนักเรียนไม่ออกนอกเครือข่ายภายใน (1) " },
    { t: "การวิเคราะห์รายบุคคล", b: true },
    { t: " สร้าง prompt เชิงโครงสร้างจาก Interaction Log ของนักเรียน ได้แก่ คะแนน เวลา อัตราความสับสน และ flag รายข้อ เช่น “ตอบเร็วผิดปกติ” หรือ “ลังเล” แล้วส่งคืนรายงานห้าส่วน (ภาพรวม จุดแข็ง จุดอ่อน คำแนะนำการเรียน และกำลังใจ) (2) " },
    { t: "การวิเคราะห์รายห้อง", b: true },
    { t: " สรุปทั้งเซสชัน ได้แก่ ภาพรวม สามข้อที่ยากที่สุดพร้อมเหตุผล สามข้อที่ทำได้ดีที่สุด คำแนะนำการสอนที่เป็นรูปธรรม และกลยุทธ์สำหรับคาบถัดไป (3) " },
    { t: "การวิเคราะห์ข้ามรอบสอบ", b: true },
    { t: " เปรียบเทียบการสอบควิซเดียวกันซ้ำในหลายห้อง เพื่อเผยว่าแนวคิดใด “ยากเป็นสากล” หรือเฉพาะกับห้องใดห้องหนึ่ง ทุกรายงานสร้างได้ทั้งภาษาไทย อังกฤษ และญี่ปุ่น โดยภาษาที่เลือกถูกบังคับส่งต่อไปยัง prompt ของโมเดล" },
  ]),
  body("ความท้าทายเชิงปฏิบัติคือ นักเรียนทั้งห้องอาจขอผลวิเคราะห์พร้อมกัน ซึ่งโมเดลภายในเครื่องตัวเดียวให้บริการพร้อมกันไม่ได้ ระบบจึงแก้ด้วยสามกลไกที่ทำงานร่วมกัน แคชจะเก็บทุกรายงานที่สร้างแล้ว (ต่อบันทึกและต่อภาษา) ลง MongoDB การกดซ้ำหรือรีเฟรชจึงได้ผลเดิมทันทีโดยไม่แตะโมเดล คิวแบบ semaphore จำกัดจำนวนคำขอที่เข้าถึงโมเดลพร้อมกัน พร้อมสตรีมลำดับคิวสดให้ผู้ที่รอเห็น ส่วนการสตรีมเองจะส่งคำตอบทีละ token เป็น NDJSON ผู้ใช้กลุ่มแรกจึงเห็นข้อความปรากฏทันที ขณะที่ผู้อื่นรอในคิวอย่างเป็นระเบียบ เมื่อรายงานเสร็จก็จะถูกเขียนลงแคช กลไกเหล่านี้รวมกันทำให้นักเรียนทั้งห้อง 25 คนขอผลพร้อมกันได้โดยโมเดลไม่ล่ม"),

  h2("H", "วงจรชีวิตเซสชัน: ห้องรอ จอโปรเจกเตอร์ และการเริ่มรอบใหม่อย่างสะอาด"),
  bodyR([
    { t: "ก่อนเริ่มควิซ นักเรียนจะเข้าสู่" },
    { t: "ห้องรอ (waiting room)", b: true },
    { t: " ที่แสดงรายชื่อผู้เข้าร่วมแบบสดพร้อม Avatar และปุ่มสลับสถานะ “พร้อม” อาจารย์จึงรอจนชั้นเรียนพร้อมก่อนเริ่มทุกคนพร้อมกันได้ นอกจากนี้ยังมี" },
    { t: "จอโปรเจกเตอร์", b: true },
    { t: " แบบเต็มจอแยกต่างหาก ที่ฉายขึ้นจอหน้าห้อง แสดงข้อมูลเดียวกัน และระหว่างสอบยังแสดงแผนผังความก้าวหน้าแบบเกมและ Leaderboard สด เพื่อสร้างแรงจูงใจให้ชั้นเรียน การสอบแต่ละครั้งระบุด้วย session token ของตัวเอง เมื่ออาจารย์จบเซสชัน ระบบจะเก็บผลถาวรและหมุน token ใหม่ รอบถัดไปจึงเริ่มอย่างสะอาดโดยไม่มีชื่อหรือคำตอบเก่าค้าง อาจารย์ยังสามารถลบนักเรียนที่ซ้ำหรือค้างออกจากเซสชัน เพื่อให้กริดและสถิติถูกต้องอยู่เสมอ" },
  ]),
];

const part3 = [
  h1("III", "ผลการทดลองและการอภิปราย"),
  body("เราประเมินระบบด้วยการสาธิตกับนักเรียนชาวญี่ปุ่น โดยใช้ควิซเรื่องสารสนเทศพื้นฐานและเครือข่าย ควิซถูกเตรียมไว้ล่วงหน้าใน Quiz Builder อาจารย์เผยแพร่ควิซหนึ่งชุด นักเรียนเข้าร่วมจากเบราว์เซอร์ของตนเองด้วยรหัสเข้าห้องหรือ QR Code (รูปที่ 3 แสดงห้องรอ) แล้วเริ่มสอบพร้อมกันทั้งห้อง ฝั่งนักเรียนตอบแต่ละข้อด้วยการแตะเพียงครั้งเดียวโดยไม่มีปุ่มส่ง (รูปที่ 4) ทุกการเลือกและการเปลี่ยนใจจึงถึงเซิร์ฟเวอร์ทันที ตลอดเซสชัน Matrix Grid ของอาจารย์ (รูปที่ 5) อัปเดตทันทีที่นักเรียนแต่ละคนตอบ โดยสีของเซลล์เปลี่ยนทันทีระหว่างสถานะถูก ผิด และกำลังทำ เช่นเดียวกับต้นแบบเดิม ความทันท่วงทีนี้ทำให้อาจารย์ระบุข้อที่ชั้นเรียนติดขัดและอธิบายซ้ำได้ภายในคาบเดียวกัน แต่ระบบปัจจุบันเพิ่มความสามารถหลายอย่างที่ต้นแบบเดิมไม่มี"),
  ...figure("Screenshot 2026-06-17 140349.png", 3, "ห้องรอ (Waiting Room) นักเรียนปรากฏแบบสดพร้อม Avatar เมื่อเข้าร่วมผ่านรหัสเข้าห้องหรือ QR Code อาจารย์กดเริ่มพร้อมกันทั้งห้อง"),
  ...figure("Screenshot 2026-06-17 140742.png", 4, "หน้าจอทำข้อสอบของนักเรียน แต่ละข้อตอบด้วยการแตะเพียงครั้งเดียวโดยไม่มีปุ่มส่ง คำตอบและการเปลี่ยนคำตอบจึงถูกส่งไปยังเซิร์ฟเวอร์ทันทีที่เลือก"),
  ...figure("Screenshot 2026-06-17 140709.png", 5, "หน้าจอคุมสอบสดของอาจารย์ Matrix Grid (นักเรียน × ข้อสอบ) อัปเดตทันทีที่มีคำตอบเข้ามา พร้อมสถิติสดและ Leaderboard การคลิกเซลล์จะเปิด Answer Popover ที่แสดงเวลาตอบ จำนวนครั้งที่เปลี่ยนคำตอบ และความสับสน"),
  body("ประการแรก กลไกตรวจจับความสับสนเผยให้เห็นนักเรียนที่คำตอบถูกแต่ซ่อนความเข้าใจที่อ่อน นักเรียนหลายคนตอบถูกหลังจากเปลี่ยนคำตอบตั้งแต่สองครั้งขึ้นไป ทำให้เกิดป้ายความสับสนสูงใน Answer Popover (เช่น คำตอบที่ถูกแต่ถูกเปลี่ยนถึง 6 ครั้งภายใน 27 วินาที) หากไม่มีสัญญาณนี้ อาจารย์คงตัดสินว่าพวกเขาเข้าใจข้อนั้นแล้ว ประการที่สอง หลังจบควิซ ทั้งนักเรียนและอาจารย์สามารถขอผลวิเคราะห์ด้วย AI รูปที่ 6 แสดงรายงานรายบุคคลที่สร้างภายในเครื่องจาก Interaction Log ของนักเรียน และรูปที่ 7 แสดงบทสรุประดับห้องที่สตรีมทีละ token เนื่องจากโมเดลรันภายในเครื่อง รายงานเหล่านี้จึงถูกสร้างขึ้นโดยไม่ส่งข้อมูลคำตอบออกนอกห้องเลย"),
  ...figure("Screenshot 2026-06-17 141023.png", 6, "การวิเคราะห์รายบุคคลด้วย AI สร้างจาก Interaction Log ภายในเครื่อง: ภาพรวม จุดแข็ง จุดอ่อน คำแนะนำการเรียน และกำลังใจ"),
  ...figure("Screenshot 2026-06-17 141632.png", 7, "บทสรุประดับชั้นเรียนด้วย AI สตรีมทีละ token ผ่าน SSE: ข้อที่ยากที่สุด ข้อที่ทำได้ดี และคำแนะนำการสอน"),
  body("ประการที่สาม ห้องรอและจอโปรเจกเตอร์แบบเกม (รูปที่ 8) ช่วยจัดระเบียบชั้นเรียนและรักษาความมีส่วนร่วม ซึ่งตอบโจทย์ข้อสังเกตที่รู้กันดีว่าความแปลกใหม่เพียงอย่างเดียวไม่อาจรักษาความสนใจของนักเรียนไว้ได้ สุดท้าย เมื่อรันควิซเดียวกันกับมากกว่าหนึ่งกลุ่ม การเปรียบเทียบข้ามรอบสอบ (รูปที่ 9) และการวิเคราะห์แนวโน้มด้วย AI ช่วยแยกแนวคิดที่ยากสำหรับทุกกลุ่มออกจากแนวคิดที่ยากเฉพาะกับห้องใดห้องหนึ่ง ขณะที่หน้าสรุปผลของนักเรียนเอง (รูปที่ 10) ปิดวงจรด้วยการแสดงคะแนนและการทบทวนรายข้อแก่ผู้เรียนแต่ละคนทันที"),
  ...figure("Screenshot 2026-06-17 140953.png", 8, "จอโปรเจกเตอร์แบบ Gamification: Leaderboard และแผนผังความก้าวหน้าแบบสด ฉายขึ้นจอหน้าห้องเพื่อจัดระเบียบและสร้างแรงจูงใจ"),
  ...figure("Screenshot 2026-06-17 141706.png", 9, "การเปรียบเทียบข้ามรอบสอบ: อัตราการตอบถูกรายข้อข้ามหลายรอบของควิซเดียวกัน พร้อมการวิเคราะห์แนวโน้มด้วย AI"),
  ...figure("Screenshot 2026-06-16 232859.png", 10, "หน้าสรุปผลของนักเรียนที่แสดงทันทีหลังทำควิซเสร็จ พร้อมคะแนนและการทบทวนรายข้อ"),
  body("มีข้อสังเกตเชิงวิศวกรรมสองประการที่ควรกล่าวถึง กลไกสำรองในหน่วยความจำอัตโนมัติทำให้ปัญหาแคชชั่วคราวไม่ขัดจังหวะการสอบ และการตรวจสอบทุกคำตอบใหม่ที่ฝั่งเซิร์ฟเวอร์ช่วยป้องกันสถิติจากไคลเอนต์ที่ถูกดัดแปลง ส่วนกลไกคิว–สตรีม–แคชทำให้นักเรียนทั้งห้องขอผล AI พร้อมกันได้ คำขอกลุ่มแรกเริ่มสตรีมทันที กลุ่มถัดมาเห็นลำดับคิวที่ลดลงเรื่อยๆ และคำขอที่ซ้ำได้ผลทันทีจากแคช คุณสมบัติเหล่านี้สำคัญต่อการใช้งานจริงในชั้นเรียน ที่ความน่าเชื่อถือภายใต้ภาระพร้อมกันสำคัญไม่น้อยไปกว่าตัวผลวิเคราะห์เอง"),
];

const part4 = [
  h1("IV", "สรุปผล"),
  body("เราได้พัฒนาและสาธิตแพลตฟอร์มแบบทดสอบบนเว็บที่เสริมด้วย AI ซึ่งติดตามความเข้าใจของนักเรียนแบบเรียลไทม์ในระหว่างคาบเรียน นอกเหนือจากการรายงานความถูกต้อง ระบบยังอนุมานความเข้าใจที่แท้จริงผ่านกฎตรวจจับความสับสนที่โปร่งใส บันทึกพฤติกรรมระดับเหตุการณ์ และผลิตผลวิเคราะห์เชิงการสอนหลายภาษาทั้งระดับนักเรียนรายบุคคล ระดับห้อง และข้ามรอบสอบ โดยใช้ LLM ภายในเครื่อง เพื่อให้ข้อมูลนักเรียนไม่ออกนอกเครือข่ายของห้องเรียน แคชที่ทนต่อความผิดพลาด การตรวจสอบใหม่ฝั่งเซิร์ฟเวอร์ ห้องรอและจอโปรเจกเตอร์แบบเกม และกลไกคิว–สตรีม–แคช ทำให้แพลตฟอร์มใช้งานได้จริงกับนักเรียนทั้งห้องพร้อมกัน ในการสาธิต เราเห็นได้ว่าส่วนใดของบทเรียนที่นักเรียนเข้าใจดีและส่วนใดที่ยังไม่เข้าใจ ระบุความสับสนที่ซ่อนอยู่หลังคำตอบที่ถูก และได้รับคำแนะนำการสอนภายในคาบเดียวกัน ซึ่งเป็นผลลัพธ์ที่ทำได้ยากด้วยเครื่องมือ e-learning ทั่วไป"),
  body("แพลตฟอร์มนี้ยังขยายวิธีการสอนที่เราเคยเสนอไว้คือ Test-Driven Education ซึ่งเทียบเคียงกระบวนการพัฒนาซอฟต์แวร์กับการสอนในชั้นเรียน (ตารางที่ 2) ในการพัฒนาแบบทดสอบนำ (test-driven development) นักพัฒนาจะเขียนชุดทดสอบก่อน แล้วจึงเขียนโค้ดให้ผ่าน และปรับปรุงโค้ดด้วยการทำซ้ำ เทียบกันแล้ว อาจารย์เตรียมควิซสั้นๆ ที่ใช้เพื่อติดตามผล ไม่ใช่เพื่อให้คะแนน และด้วยการทำซ้ำวงจร “ทดสอบสั้น-อธิบาย” อาจารย์ค่อยๆ สอนเนื้อหาที่ลึกขึ้นตามระดับความเข้าใจของชั้นเรียน ระบบปัจจุบันเสริมวงจรนี้สองทาง คือสัญญาณความสับสนบอกอาจารย์ไม่เพียงว่าตอบอะไร แต่ตอบด้วยความมั่นใจเพียงใด และ AI ภายในเครื่องแปลงข้อมูลของแต่ละรอบเป็นคำแนะนำที่นำไปใช้ได้ทันที งานในอนาคต เราจะศึกษาประสิทธิผลของ Test-Driven Education ที่มี AI ช่วยในชั้นเรียนปกติ ขยายชนิดข้อสอบให้เกินกว่าแบบหลายตัวเลือก และประเมินแพลตฟอร์มในการบรรยายทางไกลและแบบผสม ซึ่งการป้อนกลับสองทางทันทีมีคุณค่าเป็นพิเศษ"),
  tableCaption(2, "การเปรียบเทียบกระบวนการพัฒนาซอฟต์แวร์กับการสอนในชั้นเรียน และการขยายเป็นวงจรป้อนกลับแบบ Test-Driven"),
];

const tcols = [Math.round(W/3), Math.round(W/3), W - 2*Math.round(W/3)];
const tdRows = [
  ["การพัฒนาซอฟต์แวร์", "ชั้นเรียนแบบดั้งเดิม", "วงจร Test-Driven"],
  ["กำหนดความต้องการ", "กำหนดเนื้อหาของคาบเรียน", "เตรียมควิซสั้น"],
  ["ออกแบบ", "วางแผนการสอน", "วางแผนวงจรทดสอบ-อธิบาย"],
  ["เขียนโปรแกรม", "สอนในชั้นเรียน", "สอน แล้วอธิบายซ้ำ"],
  ["ทดสอบ", "การสอบ (ควิซ)", "ติดตามความเข้าใจ แล้วทำซ้ำ"],
];
const table2 = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: tcols,
  rows: tdRows.map((r, i) => new TableRow({
    children: r.map((c, j) => tcell(c, { w: tcols[j], head: i === 0, align: AlignmentType.LEFT })),
  })),
});

const part5 = [
  h1("V", "กิตติกรรมประกาศ"),
  body("งานวิจัยนี้ดำเนินการ ณ ภาควิชาวิศวกรรมเครือข่ายการสื่อสาร Kagawa College, National Institute of Technology ระบบที่รายงานในบทความนี้พัฒนาขึ้นโดยใช้โครงการโอเพนซอร์สจำนวนมาก ได้แก่ Node.js, Next.js, React, Express, Socket.IO, MongoDB, Redis และ Ollama ผู้วิจัยขอขอบคุณผู้พัฒนาและชุมชนของโครงการเหล่านั้น"),
  h1("VI", "เอกสารอ้างอิง"),
];

const refs = [
  "Algoufi, R 2016, ‘Using Tablet on Education’, World Journal of Education, vol. 6, no. 3, pp. 113-119.",
  "Beck, K 2003, Test-driven development by example, Addison-Wesley, Boston.",
  "Bell, TE & Thayer, TA 1976, ‘Software requirements: Are they really a problem?’, Proceedings of the 2nd International Conference on Software Engineering (ICSE ’76), pp. 61-68.",
  "Brown, E 2014, Web Development with Node and Express, O’Reilly Media, Sebastopol, CA.",
  "Chua, YP 2012, ‘Effects of computer-based testing on test performance and testing motivation’, Computers in Human Behavior, vol. 28, no. 5, pp. 1580-1586.",
  "Crompton, H & Burke, D 2018, ‘The use of mobile learning in higher education: A systematic review’, Computers & Education, vol. 123, pp. 53-64.",
  "Deshmukh, SP, Patwardhan, MS & Mahajan, AR 2018, ‘Feedback based real time facial and head gesture recognition for e-learning’, Proceedings of CoDS-COMAD ’18, pp. 360-363.",
  "Fette, I & Melnikov, A 2011, The WebSocket Protocol, RFC 6455, viewed 6 July 2019, <https://tools.ietf.org/html/rfc6455>.",
  "Khanam, Z & Ahsan, MN 2017, ‘Evaluating the Effectiveness of Test Driven Development: Advantages and Pitfalls’, International Journal of Applied Engineering Research, vol. 12, no. 18, pp. 7705-7716.",
  "Major, L, Haßler, B & Hennessy, S 2017, ‘Tablet Use in Schools: Impact, Affordances and Considerations’, in Handbook on Digital Learning for K-12 Schools, Springer, Cham, pp. 115-128.",
  "Muldner, K, Christopherson, R, Atkinson, R & Burleson, W 2009, ‘Investigating the Utility of Eye-Tracking Information on Affect and Reasoning for User Modeling’, UMAP 2009, LNCS, Springer, vol. 5535, pp. 138-149.",
  "Nash, SS & Rice, W 2018, Moodle 3 E-Learning Course Development, 4th edn, Packt Publishing, Birmingham, UK.",
  "Nassr, RM, Saleh, AH, Dao, H & Saadat, MN 2019, ‘Emotion-Aware Educational System: The Lecturers and Students Perspectives in Malaysia’, IMCOM 2019, AISC, Springer, vol. 935, pp. 618-628.",
  "Salmeron-Majadas, S, Santos, OC & Boticario, JG 2014, ‘An evaluation of mouse and keyboard interaction indicators towards non-intrusive and low cost affective modeling in an educational context’, Procedia Computer Science, vol. 35, pp. 691-700.",
  "Sarrafzadeh, A, Hosseini, HG, Fan, C & Overmyer, SP 2003, ‘Facial expression analysis for estimating learner’s emotional state in intelligent tutoring systems’, Proceedings 3rd IEEE International Conference on Advanced Technologies, pp. 336-337.",
  "Tawatsuji, Y, Uno, T, Fang, S & Matsui, T 2018, ‘Real-time estimation of learners’ mental states from physiological information using deep learning’, Proceedings of ICCE 2018, pp. 107-109.",
  "Ueno, M 2005, ‘Web based Computerized Testing System for Distance Education’, Educational Technology Research, vol. 28, no. 1, pp. 59-69.",
  "Vaswani, A, Shazeer, N, Parmar, N, Uszkoreit, J, Jones, L, Gomez, AN, Kaiser, Ł & Polosukhin, I 2017, ‘Attention Is All You Need’, Advances in Neural Information Processing Systems 30, pp. 5998-6008.",
  "Wang, AI & Tahir, R 2020, ‘The effect of using Kahoot! for learning – A literature review’, Computers & Education, vol. 149, 103818.",
  "Weng, C, Otanga, S, Weng, A & Cox, J 2018, ‘Effects of interactivity in E-textbooks on 7th graders science learning and cognitive load’, Computers & Education, vol. 120, pp. 172-184.",
];

const pageProps = { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } };
const headerFor = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 2 } },
    children: [new TextRun({ text: "ASM Science Journal — ฉบับพิเศษ เทคโนโลยีการศึกษาแบบเรียลไทม์", italics: true, size: 20, font: FONT })],
  })],
});
const footerFor = () => new Footer({
  children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 22, font: FONT })] })],
});
const twoCol = { count: 2, space: 480, equalWidth: true, separate: false };

const doc = new Document({
  creator: "Takajo Laboratory",
  title: "ระบบแพลตฟอร์มแบบทดสอบเรียลไทม์เสริมด้วยปัญญาประดิษฐ์",
  numbering: { config: [{ reference: "bul",
    levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 200 } } } }] }] },
  styles: {
    default: { document: { run: { font: FONT, size: BODY } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: BODY, bold: true, font: FONT }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: BODY, bold: true, font: FONT }, paragraph: { outlineLevel: 1 } },
    ],
  },
  sections: [
    { properties: { page: pageProps, column: { count: 1 } },
      headers: { default: headerFor() }, footers: { default: footerFor() }, children: titleBlock },
    { properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol }, children: part1 },
    { properties: { type: SectionType.CONTINUOUS, page: pageProps, column: { count: 1 } },
      children: [...fig1, tableCaption(1, "เทคโนโลยีที่ใช้ในแต่ละชั้นของระบบ"), table1,
        new Paragraph({ spacing: { after: 80 }, children: [] })] },
    { properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol }, children: [...part2, ...part3] },
    { properties: { type: SectionType.CONTINUOUS, page: pageProps, column: { count: 1 } },
      children: [...part4, table2, new Paragraph({ spacing: { after: 60 }, children: [] })] },
    { properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol },
      children: [...part5, ...refs.map((r, i) => ref(i + 1, r))] },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(DIR, "Paper_QUIZU_Realtime_AI_E-Learning_TH.docx");
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});
