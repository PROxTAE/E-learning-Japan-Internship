const path = require("path");
const fs = require("fs");
const G = "C:/Users/nithi/AppData/Roaming/npm/node_modules/docx";
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat, FootnoteReferenceRun,
  TabStopType, TabStopPosition, SectionType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageNumber, ExternalHyperlink,
} = require(G);

const DIR = path.resolve(".");
const CAP = path.join(DIR, "capture screen");
const img = (f) => fs.readFileSync(path.join(CAP, f));
const local = (f) => fs.readFileSync(path.join(DIR, f));

const FONT = "Times New Roman";
const BODY = 20;     // 10pt
const SMALL = 17;    // 8.5pt

// ---------- helpers ----------
function body(text, { indent = true, after = 80, align = AlignmentType.JUSTIFIED } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { after, line: 252 },
    indent: indent ? { firstLine: 300 } : undefined,
    children: [new TextRun({ text, size: BODY, font: FONT })],
  });
}
// rich body from array of runs (objects {t, b, i})
function bodyR(runs, { indent = true, after = 80 } = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after, line: 252 },
    indent: indent ? { firstLine: 300 } : undefined,
    children: runs.map(r => new TextRun({ text: r.t, bold: r.b, italics: r.i, size: BODY, font: FONT })),
  });
}
function h1(num, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, size: BODY, font: FONT, allCaps: true })],
  });
}
function h2(letter, text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 140, after: 80 },
    children: [new TextRun({ text: `${letter}. ${text}`, bold: true, italics: true, size: BODY, font: FONT })],
  });
}
function figure(file, num, caption, { width = 3.05, local: isLocal = false, ratio = 1080/1920 } = {}) {
  const data = isLocal ? local(file) : img(file);
  const w = Math.round(width * 96);
  const h = Math.round(width * ratio * 96);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [new ImageRun({
        type: "png", data,
        transformation: { width: w, height: h },
        altText: { title: `Figure ${num}`, description: caption, name: `figure${num}` },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({ text: `Figure ${num}. `, bold: true, size: SMALL, font: FONT }),
        new TextRun({ text: caption, size: SMALL, font: FONT }),
      ],
    }),
  ];
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bul", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 50, line: 252 },
    children: [new TextRun({ text, size: BODY, font: FONT })],
  });
}
function ref(n, text) {
  return new Paragraph({
    spacing: { after: 40, line: 240 },
    indent: { left: 300, hanging: 300 },
    children: [new TextRun({ text: `[${n}] ${text}`, size: SMALL, font: FONT })],
  });
}

// ---------- table style ----------
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
      new TextRun({ text: `Table ${num}. `, bold: true, size: SMALL, font: FONT }),
      new TextRun({ text, size: SMALL, font: FONT }),
    ],
  });
}

// ===================== CONTENT =====================

// ---- Title block (single column section) ----
const titleBlock = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 160 },
    children: [new TextRun({
      text: "An AI-Augmented Real-time Quiz Platform for Monitoring and Analyzing Students’ Understanding in Live Classrooms",
      bold: true, size: 32, font: FONT,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 20 },
    children: [
      new TextRun({ text: "Pratya Intern", size: 22, font: FONT }),
      new TextRun({ text: "1", size: 14, font: FONT, superScript: true }),
      new TextRun({ text: " and Hideyuki Takajo", size: 22, font: FONT }),
      new TextRun({ text: "1", size: 14, font: FONT, superScript: true }),
      new TextRun({ text: "∗", size: 22, font: FONT }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 40 },
    children: [new TextRun({
      text: "1Department of Communication Network Engineering, Kagawa College, National Institute of Technology, 551 Kohda, Takuma, Mitoyo, Kagawa, Japan",
      italics: true, size: 18, font: FONT,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 160 },
    children: [new TextRun({ text: "∗Corresponding author’s e-mail: takajo@cn.kagawa-nct.ac.jp", size: 16, font: FONT })],
  }),
  // Abstract
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 252 },
    indent: { left: 360, right: 360 },
    children: [
      new TextRun({ text: "Grasping students’ understanding level during a class — rather than after it — remains a central challenge in classroom teaching. Building on an earlier real-time monitoring system, we developed an AI-augmented, web-based quiz platform that lets teachers observe every student’s answer second-by-second, detect hidden confusion, and obtain automated pedagogical analysis without sending any student data outside the classroom. The platform combines four communication channels — REST for persistent data, WebSocket (Socket.IO) for live answers, Server-Sent Events for streamed analysis, and direct calls from the web tier to a local large language model (LLM) served by Ollama. A document database (MongoDB) stores quizzes, archived results, and event-level interaction logs, while an in-memory store (Redis) holds live session state with an automatic in-memory fallback for fault tolerance. Beyond binary correctness, a Confusion Detection Engine infers genuine understanding from answer-change behaviour and response time, and a three-level AI analysis pipeline (per-student, per-class, and cross-session) produces multilingual reports through a queue–stream–cache mechanism that supports an entire class requesting analysis at once. We describe the architecture, data flow, and core algorithms in detail, report a classroom demonstration with Japanese students, and extend the previously proposed ", size: BODY, font: FONT }),
      new TextRun({ text: "Test-Driven Education", italics: true, size: BODY, font: FONT }),
      new TextRun({ text: " method into an AI-assisted formative-feedback loop.", size: BODY, font: FONT }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, indent: { left: 360, right: 360 },
    children: [
      new TextRun({ text: "Keywords:  ", bold: true, size: BODY, font: FONT }),
      new TextRun({ text: "real-time monitoring; formative assessment; confusion detection; local large language model; WebSocket; learning analytics", italics: true, size: BODY, font: FONT }),
    ],
  }),
];

// ---- Section 2 (two-col): Introduction + Methods intro ----
const part1 = [
  h1("I", "Introduction"),
  body("Tablets and personal devices are now common in places of education, and a large body of work has examined how mobile and computer-based tools affect learning. Existing e-learning systems already provide quiz tests, content management, and grade management, and students can use them both in class and at home. In practice, however, teachers seldom consult quiz results during the lesson itself: with paper tests, marking is slow, so explanations of misunderstood points are postponed to the next class; with conventional online tests, answers are typically transmitted only after the student presses a final “submit” button, so the teacher cannot see how understanding evolves question by question."),
  body("An earlier prototype from our laboratory addressed part of this gap by monitoring students’ answers in real time over a two-way (WebSocket) channel, allowing a teacher to re-explain difficult points within the same class. That system established the value of immediacy, but it was limited to four-choice questions, reported only correct/incorrect status, and offered no automated interpretation of the data it collected. Two developments since then motivate the present work. First, classroom analytics has moved from simply scoring answers toward understanding the learning process — a great deal of research now estimates students’ affective and cognitive states from eye movement, facial expression, physiological signals, or mouse and keystroke dynamics. Many of these signals, however, require additional sensors or cameras and raise privacy concerns. Second, large language models (LLMs) have made it feasible to turn raw interaction data into readable pedagogical advice, but cloud-hosted models conflict with the privacy expectations of a classroom that handles minors’ data."),
  bodyR([
    { t: "In this paper we present a real-time quiz platform, hereafter referred to as the " },
    { t: "system", i: true },
    { t: ", that advances the earlier prototype in three directions. (1) It infers " },
    { t: "genuine understanding", i: true },
    { t: " rather than mere correctness, through a Confusion Detection Engine driven by behavioural signals (answer changes and timing) that need no extra hardware. (2) It performs automated pedagogical analysis at three levels — individual student, whole class, and across repeated sessions — using a " },
    { t: "local", i: true },
    { t: " LLM, so that no student data leaves the laboratory network. (3) It is engineered for real classroom use at scale, with a fault-tolerant cache, a waiting-room and gamified projector view to organise the class, and a queue–stream–cache pipeline that lets a whole class request AI feedback simultaneously without overloading the model. We describe the system architecture and the data flow in detail, and we extend our previously proposed teaching method, " },
    { t: "Test-Driven Education", i: true },
    { t: ", into an AI-assisted feedback loop." },
  ]),

  h1("II", "Materials and Method"),
  h2("A", "System Overview and Architecture"),
  bodyR([
    { t: "As shown in Figure 1, the system is a web application composed of a front-end tier, a back-end tier, two data stores, and a local AI engine. The front end is built with Next.js and React and is served to ordinary web browsers, so teachers and students need no native application — a tablet, laptop, or smartphone browser is sufficient. The back end is a Node.js server using the Express framework together with Socket.IO. As in the earlier prototype, the server runtime is single-threaded with non-blocking I/O, which gives quick processing and response under many concurrent connections. Two NoSQL data stores are used for complementary purposes: " },
    { t: "MongoDB", b: true },
    { t: ", a document-oriented database that stores hierarchically structured data in JSON form (quizzes, archived results, and interaction logs), and " },
    { t: "Redis", b: true },
    { t: ", an in-memory key-value store used for live session state that must be read and written the instant a student answers." },
  ]),
  body("A distinctive feature of the system is that it uses four cooperating communication channels rather than a single request–response protocol, each matched to a different need:"),
  bullet("REST over HTTP/JSON for create–read–update–delete operations on quizzes, authentication (JSON Web Tokens), dashboards, and session history;"),
  bullet("WebSocket (Socket.IO) for the live examination room, where each answer is pushed to the server and broadcast to the teacher’s screen in real time;"),
  bullet("Server-Sent Events (SSE) for streaming AI-generated text from the back end token by token, so a teacher sees an analysis appear progressively rather than after a long wait; and"),
  bullet("direct calls from the Next.js server tier to the local LLM for the in-app assistant and per-student analysis, streamed back to the browser as newline-delimited JSON (NDJSON)."),
  body("The technologies adopted in each layer are summarised in Table 1. All of them are open-source and run on commodity hardware inside the classroom or laboratory."),
];

// ---- Figure 1 full width section ----
const fig1 = figure("fig1_architecture.png", 1, "System architecture. Four communication channels connect the browser clients, the Next.js front end, the Express/Socket.IO back end, and the data and AI tiers (MongoDB, Redis, and a local Ollama LLM).", { local: true, width: 6.3, ratio: 5.6/9.2 });

// ---- Table 1: tech stack ----
const W = 8800;
const c1 = 2200, c2 = W - c1;
const techRows = [
  ["Layer", "Technology"],
  ["Front end", "Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Zustand, Recharts, socket.io-client"],
  ["Back end", "Node.js, Express 5, Socket.IO 4.8, JWT + bcrypt, Mongoose"],
  ["Database", "MongoDB — quizzes, archived session results, interaction logs"],
  ["Cache", "Redis — live session state with automatic in-memory fallback"],
  ["AI engine", "Ollama (local LLM, e.g. qwen3) streamed via SSE / NDJSON"],
];
const table1 = new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [c1, c2],
  rows: techRows.map((r, i) => new TableRow({
    children: [tcell(r[0], { w: c1, head: i === 0, bold: i !== 0 }), tcell(r[1], { w: c2, head: i === 0 })],
  })),
});

// ---- Section after fig1: rest of methods ----
const part2 = [
  h2("B", "Quiz Authoring and the AI Quiz Copilot"),
  bodyR([
    { t: "Before any examination, a teacher authors quizzes in a dedicated " },
    { t: "Quiz Builder", b: true },
    { t: " (Figure 2). Each quiz carries a title, description, subject, chapter, difficulty (easy / medium / hard), an optional time limit and duration, free-form tags, and a switch controlling whether answers are revealed to students after the quiz. Questions are either multiple-choice or true / false; the teacher can attach an image to a question or to an individual choice, mark the correct choice, and reorder questions by drag-and-drop. A live preview and continuous client-side state management keep the form responsive while a large quiz is being assembled." },
  ]),
  bodyR([
    { t: "To accelerate authoring, the builder embeds an " },
    { t: "AI Quiz Copilot", b: true },
    { t: " — a chat assistant backed by the same local LLM (here, qwen3). The teacher types a natural-language instruction such as “create five questions about web application basics,” and the assistant replies with a structured block that the front end parses into a summary card; a single click pours the entire set — questions, choices, correct answers, subject, and chapter — into the form (Figure 2). Because the model runs locally, quiz drafts are produced without sending the prompt to any external service. The teacher then reviews and edits the draft, adjusts the answer key where needed, and publishes the quiz, which generates the six-character access code and QR code used by students to join." },
  ]),
  ...figure("Screenshot 2026-06-17 143030.png", 2, "Quiz Builder with the AI Quiz Copilot. A natural-language request is turned by the local LLM into a structured draft that is applied to the form in one click; the teacher then reviews, edits the answer key, and publishes."),

  h2("C", "Persistent and Live Data: Division of Storage"),
  body("The system deliberately separates durable data from volatile live state. Quizzes authored by teachers, archived results of finished examinations, and the event-level interaction logs are stored permanently in MongoDB. The state of an examination that is currently in progress — who is online, what each student has answered to each question, how many times they changed their mind, and the running statistics — is kept in Redis. The reason mirrors the rationale of the earlier prototype: an in-memory store can be accessed fast enough to record an answer the moment a student selects a choice, so the teacher can monitor the class second-by-second. Each live key carries a 24-hour time-to-live that is refreshed on activity; when the teacher ends the session, the live state is archived to MongoDB and the Redis keys are cleared."),
  body("Storing every answer immediately also provides resilience. If the teacher’s screen momentarily loses the connection or the page is refreshed, the full dashboard can be reconstructed from Redis, so monitoring continues without data loss. Should Redis itself become unavailable, the server transparently falls back to an equivalent in-memory map and the examination proceeds; Redis is warmed up again in the background. Crucially, the server never trusts a correctness flag sent by the client: every submitted answer is re-validated against the authoritative answer key in the database before it is recorded."),

  h2("D", "Real-time Live Monitoring and the Answer Popover"),
  bodyR([
    { t: "When a quiz is published, the system generates a six-character access code (ambiguous characters such as I, O, 0 and 1 are removed) and a QR code; students open the link, enter a name, and join without creating an account. On the student’s device each question is answered by a single tap, with no submit button — the answer is sent the instant a choice is made (Figure 4) — so changes of mind are captured as they happen rather than only at the end. Each answer travels over WebSocket to the server, which validates it against the key, stores it in Redis, recomputes class statistics, and broadcasts the update to the teacher’s room. The teacher’s console centres on a " },
    { t: "Matrix Grid", b: true },
    { t: " in which each row is a student and each column is a question; a cell encodes the answer state (correct, incorrect, in progress, or not yet reached). Alongside the grid, a live leaderboard, a statistics panel (average score, progress, correct ratio, efficiency), and answer-timeline charts update continuously, and the whole dashboard is recoverable from Redis so the teacher may refresh the page at any time without losing the view." },
  ]),
  bodyR([
    { t: "Clicking any cell opens an " },
    { t: "Answer Popover (Student Analytics)", b: true },
    { t: " for that student and question. Rather than a single correct/incorrect mark, the popover reports the question text and the student’s selected choice against the key, the " },
    { t: "response time", i: true },
    { t: ", the number of " },
    { t: "answer changes", i: true },
    { t: ", an accuracy verdict, and a high / low " },
    { t: "confusion", i: true },
    { t: " badge, together with an " },
    { t: "answer-evolution timeline", i: true },
    { t: " that plots every change the student made over the course of the question. A single cell therefore becomes a detailed record of how an answer was reached — for example, a correct answer that was changed six times over twenty-seven seconds is flagged as high-confusion — which is precisely the kind of process information that conventional “submit at the end” tests discard." },
  ]),

  h2("E", "Confusion Detection Engine"),
  body("A central limitation of correct/incorrect reporting is that a correct answer does not necessarily indicate understanding. The system therefore estimates a confusion level for every answer from two behavioural signals that require no additional hardware: the number of times the student changed the answer, and the time taken to answer. The rule is intentionally simple and transparent so that teachers can interpret it:"),
  new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { before: 40, after: 80 }, indent: { left: 200 },
    children: [new TextRun({ text: "if changes ≥ 2 or time > 60 s → high;  else if changes ≥ 1 or time > 30 s → low;  otherwise → none.", font: "Consolas", size: 17 })],
  }),
  body("The resulting level is shown as a badge in the grid, accumulated per question as a confusion count in the archive, and recorded for each answer in the interaction log, where it later becomes an input to the AI analysis. This makes it possible to identify a student who reaches the correct answer only after repeated changes — a likely sign of guessing or fragile understanding — and to single out questions that confuse much of the class even when most students eventually answer them correctly."),

  h2("F", "Event-level Interaction Logging"),
  body("While a student works, the client records every event for each question — viewing the question, the first selection, each change (keeping both the previous and new choice), de-selection, and periodic on-task / off-task heartbeats — each with a timestamp and the time spent on the question. On submission, the events are assembled into a single JSON document (session metadata, per-question answer logs, and a summary) and sent to the server, which again re-validates every answer against the official key before storing it. These logs are the raw material for individual AI analysis: for example, a long time on one question accompanied by repeated off-task heartbeats indicates distraction rather than a hard question, a distinction the teacher could not otherwise make."),

  h2("G", "Three-level AI Analysis with a Local LLM"),
  bodyR([
    { t: "The system turns the data it collects into pedagogical advice at three levels, all produced by a " },
    { t: "local", i: true },
    { t: " LLM served by Ollama so that student data never leaves the local network. (1) " },
    { t: "Per-student analysis", b: true },
    { t: " builds a structured prompt from a student’s interaction log — score, timing, confusion rate, and per-question flags such as “answered unusually fast” or “hesitated” — and returns a five-part report (overall assessment, strengths, weak areas, study recommendations, and encouragement). (2) " },
    { t: "Per-class analysis", b: true },
    { t: " summarises a whole session: an overview, the three hardest questions with reasons, the three best-answered questions, concrete teaching recommendations, and a strategy for the next lesson. (3) " },
    { t: "Cross-session analysis", b: true },
    { t: " compares repeated runs of the same quiz across different classes to reveal whether a concept is “universally difficult” or specific to one group. Every report can be generated in Thai, English, or Japanese, the chosen language being forced through to the model’s prompt." },
  ]),
  body("A practical difficulty is that an entire class may request analysis at the same moment, which a single local model cannot serve concurrently. The system addresses this with three combined mechanisms. A cache stores each generated report (per log and per language) in MongoDB, so a repeat or refresh returns the previous result instantly without touching the model. A semaphore queue limits how many requests reach the model at once and streams a live queue position to those waiting. Streaming itself delivers the answer token by token as NDJSON, so the first users see text appear immediately while the rest wait in an orderly queue; when a report finishes, it is written to the cache. Together these let a class of twenty-five students request feedback at once without the model failing."),

  h2("H", "Session Lifecycle: Waiting Room, Projector View, and Clean Rounds"),
  bodyR([
    { t: "Before a quiz begins, students enter a " },
    { t: "waiting room", b: true },
    { t: " that shows the live list of participants with their avatars and a “ready” toggle, so the teacher can wait until the class is assembled before starting everyone simultaneously. A separate full-screen " },
    { t: "projector view", b: true },
    { t: " can be cast to a classroom screen, presenting the same information — and, during the quiz, a gamified progress roadmap and a live leaderboard — to motivate the class. Each examination is identified by its own session token; when the teacher ends a session, the system archives the results and rotates the token, so the next round starts cleanly without stale names or answers carried over. The teacher may also remove a duplicate or stuck student from the session, keeping the grid and statistics accurate." },
  ]),
];

// ---- Results & Discussion (two-col) with screenshot figures ----
const part3 = [
  h1("III", "Result and Discussion"),
  body("We evaluated the system in a demonstration with Japanese students using quizzes on basic information and networking. Quizzes were prepared in advance in the Quiz Builder; the teacher published one, students joined from their own browsers using the access code or QR code (Figure 3 shows the waiting room), and the examination was started for everyone at once. On the student side, each question was answered by a single tap with no submit button (Figure 4), so every selection — and every change of mind — reached the server immediately. Throughout the session the teacher’s Matrix Grid (Figure 5) updated the instant each student answered, with cell colours changing immediately between correct, incorrect, and in-progress states. As with the earlier prototype, this immediacy let the teacher identify which questions the class struggled with and re-explain them during the same lesson — but the present system added several capabilities the prototype lacked."),
  ...figure("Screenshot 2026-06-17 140349.png", 3, "Waiting room. Students appear live with avatars as they join via the access code or QR code; the teacher starts the quiz for everyone at once."),
  ...figure("Screenshot 2026-06-17 140742.png", 4, "Student’s answering view. Each question is answered by a single tap with no submit button, so the choice — and any later change — is sent to the server the moment it is made."),
  ...figure("Screenshot 2026-06-17 140709.png", 5, "Teacher’s live monitoring console. The Matrix Grid (students × questions) updates the moment each answer arrives, alongside live statistics and a leaderboard; clicking a cell opens the Answer Popover with response time, answer changes, and confusion."),
  body("First, the Confusion Detection Engine surfaced students whose correct answers concealed weak understanding. Several students reached a correct answer only after two or more changes, raising a high-confusion badge in the Answer Popover (for instance, a correct answer changed six times over twenty-seven seconds); without this signal the teacher would have judged them to have mastered the question. Second, after the quiz, students and teacher could request AI analysis. Figure 6 shows a per-student report generated locally from a student’s interaction log, and Figure 7 shows a class-level summary streamed token by token. Because the model runs locally, these reports were produced without sending any answer data outside the room."),
  ...figure("Screenshot 2026-06-17 141023.png", 6, "Personalised AI analysis for one student, generated locally from the interaction log: overall assessment, strengths, weak areas, study recommendations, and encouragement."),
  ...figure("Screenshot 2026-06-17 141632.png", 7, "Class-level AI summary, streamed token by token over SSE: hardest questions, best-answered questions, and concrete teaching recommendations."),
  body("Third, the waiting room and the gamified projector view (Figure 8) helped organise the class and sustain engagement, addressing the well-known observation that novelty alone does not keep students interested. Finally, when the same quiz was run for more than one group, the cross-session comparison (Figure 9) and its AI trend analysis distinguished concepts that were difficult for every group from those specific to one class. The student’s own result screen (Figure 10) closed the loop by showing each learner their score and per-question review immediately."),
  ...figure("Screenshot 2026-06-17 140953.png", 8, "Gamified projector view: a live leaderboard and progress roadmap cast to the classroom screen to organise and motivate the class."),
  ...figure("Screenshot 2026-06-17 141706.png", 9, "Cross-session comparison: per-question correct rates across repeated runs of the same quiz, with AI trend analysis identifying universally difficult concepts."),
  ...figure("Screenshot 2026-06-16 232859.png", 10, "Student result screen shown immediately after the quiz, with score and per-question review."),
  body("Two engineering observations are worth noting. The automatic in-memory fallback meant that a transient cache problem did not interrupt an examination, and server-side re-validation of every answer guarded the statistics against manipulated clients. The queue–stream–cache pipeline allowed a whole class to request AI feedback at once: the first requests began streaming immediately, later ones displayed a decreasing queue position, and any repeated request returned instantly from cache. These properties matter for real classroom use, where reliability under simultaneous load is as important as the analysis itself."),
];

// ---- Conclusion / TDD extension ----
const part4 = [
  h1("IV", "Conclusion"),
  body("We have developed and demonstrated an AI-augmented, web-based quiz platform that monitors students’ understanding in real time during a class. Beyond reporting correctness, the system infers genuine understanding through a transparent confusion-detection rule, logs interaction at the event level, and produces multilingual pedagogical analysis at the level of the individual student, the whole class, and across repeated sessions — all using a local LLM, so that student data never leaves the classroom network. A fault-tolerant cache, server-side re-validation, a waiting room and gamified projector view, and a queue–stream–cache pipeline make the platform usable for an entire class at once. In the demonstration we could see which parts of the lesson the students understood and which they did not, identify confusion hidden behind correct answers, and obtain teaching recommendations during the same class — outcomes that were difficult with conventional e-learning tools."),
  body("The platform also extends a teaching method we previously proposed, Test-Driven Education, which draws an analogy between software development and classroom teaching (Table 2). In test-driven development, a developer first writes a test, then writes code to pass it, and improves the code by repetition; by analogy, a teacher prepares short quizzes — used for monitoring, not grading — and, by repeating brief quiz-and-explain cycles, gradually teaches more advanced content according to the class’s understanding. The present system strengthens this loop in two ways: the confusion signal tells the teacher not only what was answered but how confidently, and the local AI converts each cycle’s data into immediate, actionable feedback. As future work we will study the effectiveness of this AI-assisted Test-Driven Education in regular classes, broaden the question types beyond multiple choice, and evaluate the platform in remote and hybrid lectures, for which immediate two-way feedback is especially valuable."),

  tableCaption(2, "Analogy between the software-development process and a class, extended with the test-driven feedback loop."),
];

const tcols = [W/3, W/3, W/3].map(Math.round);
const tdRows = [
  ["Software development", "Traditional class", "Test-driven loop"],
  ["Define requirements", "Determine class contents", "Prepare short quizzes"],
  ["Design", "Plan a class", "Plan a quiz-and-explain cycle"],
  ["Programming", "Give a class", "Teach, then re-explain"],
  ["Test", "Examination (quiz)", "Monitor understanding, repeat"],
];
const table2 = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: tcols,
  rows: tdRows.map((r, i) => new TableRow({
    children: r.map(c => tcell(c, { w: tcols[0], head: i === 0, align: AlignmentType.LEFT })),
  })),
});

const part5 = [
  h1("V", "Acknowledgement"),
  body("This study was carried out in the Department of Communication Network Engineering, Kagawa College, National Institute of Technology. The system reported here has been developed using many open-source projects, including Node.js, Next.js, React, Express, Socket.IO, MongoDB, Redis, and Ollama. We thank their authors and communities."),
  h1("VI", "References"),
];

const refs = [
  "Algoufi, R 2016, ‘Using Tablet on Education’, World Journal of Education, vol. 6, no. 3, pp. 113-119.",
  "Beck, K 2003, Test-driven development by example, Addison-Wesley, Boston.",
  "Bell, TE & Thayer, TA 1976, ‘Software requirements: Are they really a problem?’, Proceedings of the 2nd International Conference on Software Engineering (ICSE ’76), pp. 61-68.",
  "Brown, E 2014, Web Development with Node and Express, O’Reilly Media, Sebastopol, CA.",
  "Chua, YP 2012, ‘Effects of computer-based testing on test performance and testing motivation’, Computers in Human Behavior, vol. 28, no. 5, pp. 1580-1586.",
  "Crompton, H & Burke, D 2018, ‘The use of mobile learning in higher education: A systematic review’, Computers & Education, vol. 123, pp. 53-64.",
  "Deshmukh, SP, Patwardhan, MS & Mahajan, AR 2018, ‘Feedback based real time facial and head gesture recognition for e-learning’, Proceedings of the ACM India Joint International Conference on Data Science and Management of Data (CoDS-COMAD ’18), pp. 360-363.",
  "Fette, I & Melnikov, A 2011, The WebSocket Protocol, RFC 6455, viewed 6 July 2019, <https://tools.ietf.org/html/rfc6455>.",
  "Khanam, Z & Ahsan, MN 2017, ‘Evaluating the Effectiveness of Test Driven Development: Advantages and Pitfalls’, International Journal of Applied Engineering Research, vol. 12, no. 18, pp. 7705-7716.",
  "Major, L, Haßler, B & Hennessy, S 2017, ‘Tablet Use in Schools: Impact, Affordances and Considerations’, in Handbook on Digital Learning for K-12 Schools, Springer, Cham, pp. 115-128.",
  "Muldner, K, Christopherson, R, Atkinson, R & Burleson, W 2009, ‘Investigating the Utility of Eye-Tracking Information on Affect and Reasoning for User Modeling’, in User Modeling, Adaptation, and Personalization (UMAP 2009), LNCS, Springer, vol. 5535, pp. 138-149.",
  "Nash, SS & Rice, W 2018, Moodle 3 E-Learning Course Development, 4th edn, Packt Publishing, Birmingham, UK.",
  "Nassr, RM, Saleh, AH, Dao, H & Saadat, MN 2019, ‘Emotion-Aware Educational System: The Lecturers and Students Perspectives in Malaysia’, in Proceedings of IMCOM 2019, Advances in Intelligent Systems and Computing, Springer, vol. 935, pp. 618-628.",
  "Salmeron-Majadas, S, Santos, OC & Boticario, JG 2014, ‘An evaluation of mouse and keyboard interaction indicators towards non-intrusive and low cost affective modeling in an educational context’, Procedia Computer Science, vol. 35, pp. 691-700.",
  "Sarrafzadeh, A, Hosseini, HG, Fan, C & Overmyer, SP 2003, ‘Facial expression analysis for estimating learner’s emotional state in intelligent tutoring systems’, Proceedings 3rd IEEE International Conference on Advanced Technologies, pp. 336-337.",
  "Tawatsuji, Y, Uno, T, Fang, S & Matsui, T 2018, ‘Real-time estimation of learners’ mental states from physiological information using deep learning’, Proceedings of the 26th International Conference on Computers in Education, pp. 107-109.",
  "Ueno, M 2005, ‘Web based Computerized Testing System for Distance Education’, Educational Technology Research, vol. 28, no. 1, pp. 59-69.",
  "Vaswani, A, Shazeer, N, Parmar, N, Uszkoreit, J, Jones, L, Gomez, AN, Kaiser, Ł & Polosukhin, I 2017, ‘Attention Is All You Need’, Advances in Neural Information Processing Systems 30, pp. 5998-6008.",
  "Wang, AI & Tahir, R 2020, ‘The effect of using Kahoot! for learning – A literature review’, Computers & Education, vol. 149, 103818.",
  "Weng, C, Otanga, S, Weng, A & Cox, J 2018, ‘Effects of interactivity in E-textbooks on 7th graders science learning and cognitive load’, Computers & Education, vol. 120, pp. 172-184.",
];

// ===================== ASSEMBLE =====================
const pageProps = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
};
const headerFor = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 2 } },
    children: [new TextRun({ text: "ASM Science Journal — Special Issue, Real-time Educational Technology", italics: true, size: 15, font: FONT })],
  })],
});
const footerFor = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, font: FONT })],
  })],
});

const twoCol = { count: 2, space: 480, equalWidth: true, separate: false };

const doc = new Document({
  creator: "Takajo Laboratory",
  title: "An AI-Augmented Real-time Quiz Platform for Monitoring and Analyzing Students’ Understanding in Live Classrooms",
  numbering: {
    config: [{
      reference: "bul",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 200 } } } }],
    }],
  },
  styles: {
    default: { document: { run: { font: FONT, size: BODY } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: BODY, bold: true, font: FONT }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: BODY, bold: true, italics: true, font: FONT }, paragraph: { outlineLevel: 1 } },
    ],
  },
  sections: [
    // S1 single column: title + abstract
    {
      properties: { page: pageProps, column: { count: 1 } },
      headers: { default: headerFor() }, footers: { default: footerFor() },
      children: titleBlock,
    },
    // S2 two columns: intro + methods intro
    {
      properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol },
      children: part1,
    },
    // S3 single column: Figure 1 + Table 1
    {
      properties: { type: SectionType.CONTINUOUS, page: pageProps, column: { count: 1 } },
      children: [
        ...fig1,
        tableCaption(1, "Technologies adopted in each layer of the system."),
        table1,
        new Paragraph({ spacing: { after: 80 }, children: [] }),
      ],
    },
    // S4 two columns: rest of methods + results
    {
      properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol },
      children: [...part2, ...part3],
    },
    // S5 single column: conclusion + table2
    {
      properties: { type: SectionType.CONTINUOUS, page: pageProps, column: { count: 1 } },
      children: [...part4, table2, new Paragraph({ spacing: { after: 60 }, children: [] })],
    },
    // S6 two columns: ack + references
    {
      properties: { type: SectionType.CONTINUOUS, page: pageProps, column: twoCol },
      children: [...part5, ...refs.map((r, i) => ref(i + 1, r))],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(DIR, "Paper_QUIZU_Realtime_AI_E-Learning.docx");
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});
