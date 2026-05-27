// ─────────────────────────────────────────────────────────────
//  seed.js  — Seed realistic mock data into MongoDB
//
//  Usage:  node seed.js
//  Requires: MONGO_URI in .env (same as server)
// ─────────────────────────────────────────────────────────────
require("dotenv").config();
const mongoose = require("mongoose");
const Quiz = require("./src/models/Quiz.model");
const QuizSessionResult = require("./src/models/QuizSessionResult.model");

// ── Emoji + gradient lookup by category ─────────────────────
const CATEGORY_META = {
  Mathematics:       { emoji: "📐", gradient: "from-violet-500 to-purple-700" },
  Science:           { emoji: "🔬", gradient: "from-blue-500 to-cyan-600" },
  English:           { emoji: "📖", gradient: "from-emerald-500 to-teal-600" },
  History:           { emoji: "🏛️", gradient: "from-amber-500 to-orange-600" },
  "Computer Science":{ emoji: "💻", gradient: "from-indigo-500 to-blue-700" },
  Chemistry:         { emoji: "⚗️", gradient: "from-cyan-500 to-sky-600" },
  Physics:           { emoji: "⚡", gradient: "from-yellow-500 to-orange-500" },
  Biology:           { emoji: "🌱", gradient: "from-green-500 to-emerald-600" },
};

// ── Quiz seed data ───────────────────────────────────────────
const QUIZ_SEEDS = [
  {
    title: "Algebra Fundamentals",
    description: "Test your knowledge of basic algebraic expressions, equations, and inequalities. Covers linear equations, quadratic equations, and graphing.",
    category: "Mathematics",
    difficulty: "easy",
    durationMinutes: 30,
    status: "published",
    tags: ["algebra", "equations", "basics"],
    questions: [
      { text: "What is the value of x in: 2x + 4 = 10?", order: 0, type: "multiple_choice", choices: [
        { text: "2", isCorrect: false }, { text: "3", isCorrect: true },
        { text: "4", isCorrect: false }, { text: "5", isCorrect: false },
      ]},
      { text: "Which of these is a quadratic equation?", order: 1, type: "multiple_choice", choices: [
        { text: "y = 2x + 1", isCorrect: false }, { text: "y = x² + 3x + 2", isCorrect: true },
        { text: "y = 1/x", isCorrect: false }, { text: "y = √x", isCorrect: false },
      ]},
      { text: "The slope of a horizontal line is 0.", order: 2, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "What is 3² + 4²?", order: 3, type: "multiple_choice", choices: [
        { text: "25", isCorrect: true }, { text: "14", isCorrect: false },
        { text: "49", isCorrect: false }, { text: "12", isCorrect: false },
      ]},
      { text: "Simplify: (x + 2)(x - 2)", order: 4, type: "multiple_choice", choices: [
        { text: "x² - 4", isCorrect: true }, { text: "x² + 4", isCorrect: false },
        { text: "x² - 4x", isCorrect: false }, { text: "x² + 4x", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Cell Biology Basics",
    description: "Explore fundamental structures and functions of cells, including organelles, cell division, and membrane transport.",
    category: "Science",
    difficulty: "medium",
    durationMinutes: 25,
    status: "published",
    tags: ["biology", "cells", "science"],
    questions: [
      { text: "Which organelle is called the 'powerhouse of the cell'?", order: 0, type: "multiple_choice", choices: [
        { text: "Nucleus", isCorrect: false }, { text: "Mitochondria", isCorrect: true },
        { text: "Ribosome", isCorrect: false }, { text: "Golgi apparatus", isCorrect: false },
      ]},
      { text: "Plant cells have a cell wall, animal cells do not.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "DNA is stored in the:", order: 2, type: "multiple_choice", choices: [
        { text: "Cytoplasm", isCorrect: false }, { text: "Nucleus", isCorrect: true },
        { text: "Cell membrane", isCorrect: false }, { text: "Vacuole", isCorrect: false },
      ]},
      { text: "Which process allows cells to divide?", order: 3, type: "multiple_choice", choices: [
        { text: "Osmosis", isCorrect: false }, { text: "Mitosis", isCorrect: true },
        { text: "Diffusion", isCorrect: false }, { text: "Photosynthesis", isCorrect: false },
      ]},
    ],
  },
  {
    title: "English Grammar Mastery",
    description: "A comprehensive quiz on English grammar rules, tenses, and sentence structure for intermediate learners.",
    category: "English",
    difficulty: "medium",
    durationMinutes: 40,
    status: "published",
    tags: ["grammar", "english", "tenses"],
    questions: [
      { text: "Which sentence is grammatically correct?", order: 0, type: "multiple_choice", choices: [
        { text: "She don't like apples.", isCorrect: false },
        { text: "She doesn't like apples.", isCorrect: true },
        { text: "She not like apples.", isCorrect: false },
        { text: "She no like apples.", isCorrect: false },
      ]},
      { text: "The past tense of 'go' is 'went'.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "Choose the correct article: ___ apple a day keeps the doctor away.", order: 2, type: "multiple_choice", choices: [
        { text: "A", isCorrect: false }, { text: "An", isCorrect: true },
        { text: "The", isCorrect: false }, { text: "No article", isCorrect: false },
      ]},
    ],
  },
  {
    title: "World War II History",
    description: "Key events, battles, and figures of the Second World War covering 1939–1945.",
    category: "History",
    difficulty: "hard",
    durationMinutes: 45,
    status: "published",
    tags: ["WWII", "history", "wars"],
    questions: [
      { text: "In which year did World War II begin?", order: 0, type: "multiple_choice", choices: [
        { text: "1937", isCorrect: false }, { text: "1939", isCorrect: true },
        { text: "1941", isCorrect: false }, { text: "1942", isCorrect: false },
      ]},
      { text: "The D-Day invasion took place in Normandy, France.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "Who was the Prime Minister of the UK during most of WWII?", order: 2, type: "multiple_choice", choices: [
        { text: "Clement Attlee", isCorrect: false }, { text: "Winston Churchill", isCorrect: true },
        { text: "Neville Chamberlain", isCorrect: false }, { text: "Anthony Eden", isCorrect: false },
      ]},
      { text: "The atomic bombs were dropped on Hiroshima and Nagasaki.", order: 3, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "Which country was NOT part of the Allied Powers?", order: 4, type: "multiple_choice", choices: [
        { text: "USA", isCorrect: false }, { text: "UK", isCorrect: false },
        { text: "Germany", isCorrect: true }, { text: "Soviet Union", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Python Programming Basics",
    description: "Introduction to Python: variables, loops, functions, and data structures for beginners.",
    category: "Computer Science",
    difficulty: "easy",
    durationMinutes: 35,
    status: "draft",
    tags: ["python", "programming", "basics"],
    questions: [
      { text: "Which keyword is used to define a function in Python?", order: 0, type: "multiple_choice", choices: [
        { text: "func", isCorrect: false }, { text: "def", isCorrect: true },
        { text: "function", isCorrect: false }, { text: "define", isCorrect: false },
      ]},
      { text: "Python is an interpreted language.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "What is the output of: print(type(3.14))?", order: 2, type: "multiple_choice", choices: [
        { text: "<class 'int'>", isCorrect: false }, { text: "<class 'float'>", isCorrect: true },
        { text: "<class 'str'>", isCorrect: false }, { text: "<class 'double'>", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Advanced Calculus",
    description: "Derivatives, integrals, limits, and real-world applications of calculus for advanced students.",
    category: "Mathematics",
    difficulty: "hard",
    durationMinutes: 50,
    status: "published",
    tags: ["calculus", "advanced", "math"],
    questions: [
      { text: "What is the derivative of x²?", order: 0, type: "multiple_choice", choices: [
        { text: "x", isCorrect: false }, { text: "2x", isCorrect: true },
        { text: "x²", isCorrect: false }, { text: "2", isCorrect: false },
      ]},
      { text: "∫2x dx = x² + C", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "What is the limit of (sin x)/x as x→0?", order: 2, type: "multiple_choice", choices: [
        { text: "0", isCorrect: false }, { text: "1", isCorrect: true },
        { text: "∞", isCorrect: false }, { text: "undefined", isCorrect: false },
      ]},
      { text: "The chain rule is used for differentiating composite functions.", order: 3, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Data Structures & Algorithms",
    description: "Arrays, linked lists, trees, graphs, sorting and searching algorithms.",
    category: "Computer Science",
    difficulty: "hard",
    durationMinutes: 60,
    status: "archived",
    tags: ["dsa", "algorithms", "cs"],
    questions: [
      { text: "What is the time complexity of binary search?", order: 0, type: "multiple_choice", choices: [
        { text: "O(n)", isCorrect: false }, { text: "O(log n)", isCorrect: true },
        { text: "O(n²)", isCorrect: false }, { text: "O(1)", isCorrect: false },
      ]},
      { text: "A stack follows LIFO (Last In, First Out) principle.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "Which sorting algorithm has O(n log n) worst case?", order: 2, type: "multiple_choice", choices: [
        { text: "Bubble Sort", isCorrect: false }, { text: "Merge Sort", isCorrect: true },
        { text: "Selection Sort", isCorrect: false }, { text: "Insertion Sort", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Chemical Reactions",
    description: "Types of chemical reactions, balancing equations, and reaction rate concepts.",
    category: "Chemistry",
    difficulty: "medium",
    durationMinutes: 28,
    status: "draft",
    tags: ["chemistry", "reactions", "science"],
    questions: [
      { text: "Which type of reaction releases heat?", order: 0, type: "multiple_choice", choices: [
        { text: "Endothermic", isCorrect: false }, { text: "Exothermic", isCorrect: true },
        { text: "Photosynthesis", isCorrect: false }, { text: "Decomposition", isCorrect: false },
      ]},
      { text: "H₂O is the chemical formula for water.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Newton's Laws of Motion",
    description: "Understanding the three laws that govern how objects move and interact.",
    category: "Physics",
    difficulty: "medium",
    durationMinutes: 30,
    status: "published",
    tags: ["physics", "newton", "mechanics"],
    questions: [
      { text: "Newton's first law is also known as:", order: 0, type: "multiple_choice", choices: [
        { text: "Law of Gravity", isCorrect: false }, { text: "Law of Inertia", isCorrect: true },
        { text: "Law of Action-Reaction", isCorrect: false }, { text: "Law of Acceleration", isCorrect: false },
      ]},
      { text: "F = ma is Newton's Second Law.", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
      { text: "For every action, there is an equal and opposite reaction — Newton's ___ law?", order: 2, type: "multiple_choice", choices: [
        { text: "First", isCorrect: false }, { text: "Second", isCorrect: false },
        { text: "Third", isCorrect: true }, { text: "Fourth", isCorrect: false },
      ]},
    ],
  },
  {
    title: "Photosynthesis & Cellular Respiration",
    description: "How plants make food and how cells produce energy from glucose.",
    category: "Biology",
    difficulty: "medium",
    durationMinutes: 35,
    status: "published",
    tags: ["biology", "photosynthesis", "energy"],
    questions: [
      { text: "Where does photosynthesis take place in plant cells?", order: 0, type: "multiple_choice", choices: [
        { text: "Mitochondria", isCorrect: false }, { text: "Chloroplasts", isCorrect: true },
        { text: "Nucleus", isCorrect: false }, { text: "Ribosome", isCorrect: false },
      ]},
      { text: "Glucose + Oxygen → Carbon dioxide + Water + Energy", order: 1, type: "true_false", choices: [
        { text: "True", isCorrect: true }, { text: "False", isCorrect: false },
      ]},
    ],
  },
];

// ── Helper: generate realistic session results ───────────────
function makeCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function makeStudents(count, score_range) {
  const names = [
    "Yuki Tanaka","Priya Sharma","Akira Sato","Maria Lopez","James Wong",
    "Nadia Hassan","Kenji Ito","Emma Clarke","Ravi Patel","Chloe Martin",
    "Hiroshi Kato","Sofia Rossi","Omar Khalid","Lily Zhang","Tom Baker",
    "Aisha Ndiaye","Lucas Müller","Hana Kimura","Carlos Silva","Mei Lin",
  ];
  const shuffled = [...names].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((name, i) => ({
    studentId: `student-${i + 1}`,
    name,
    score: Math.round(score_range[0] + Math.random() * (score_range[1] - score_range[0])),
    joinedAt: new Date(Date.now() - Math.random() * 3600_000),
  }));
}

function makeSessionResult(quizId, weekOffset, studentCount, scoreRange, completionRate) {
  const startedAt = new Date(Date.now() - weekOffset * 7 * 24 * 3600_000 - Math.random() * 86_400_000);
  const endedAt   = new Date(startedAt.getTime() + 30 * 60_000);
  const students  = makeStudents(studentCount, scoreRange);
  const avgScore  = Math.round(students.reduce((s, st) => s + st.score, 0) / students.length);
  return {
    sessionId:  `quiz-session-${quizId}-w${weekOffset}-${makeCode(4)}`,
    quizId,
    teacherId:  "teacher",
    startedAt,
    endedAt,
    stats: {
      totalStudents:        studentCount,
      averageScore:         avgScore,
      completionPercentage: completionRate,
    },
    students,
    answers: [],
  };
}

// ── Main seed function ──────────────────────────────────────
async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected:", mongoose.connection.host);

  // ── Wipe existing data ──────────────────────────────────
  const existingCount = await Quiz.countDocuments();
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing quizzes.`);
    console.log("   Skipping quiz seed (data already exists). Use --force to override.");
    if (!process.argv.includes("--force")) {
      // Still seed sessions if missing
      await seedSessions();
      await mongoose.disconnect();
      return;
    }
    await Quiz.deleteMany({});
    await QuizSessionResult.deleteMany({});
    console.log("🗑️  Cleared existing quizzes and sessions.");
  }

  // ── Ensure accessCode index is sparse (drop + recreate if needed) ──
  try {
    const collection = mongoose.connection.db.collection("quizzes");
    const indexes    = await collection.indexes();
    const codeIdx    = indexes.find((ix) => ix.key && ix.key.accessCode !== undefined);
    if (codeIdx && !codeIdx.sparse) {
      console.log("🔧  Re-creating accessCode index as sparse...");
      await collection.dropIndex("accessCode_1").catch(() => {});
      await collection.createIndex({ accessCode: 1 }, { sparse: true, unique: true, name: "accessCode_1" });
      console.log("   ✔ accessCode index fixed.");
    }
  } catch (e) {
    console.warn("   ⚠️  Could not fix accessCode index:", e.message);
  }

  // ── Seed quizzes ────────────────────────────────────────
  console.log(`\n📝 Seeding ${QUIZ_SEEDS.length} quizzes...`);
  const createdQuizzes = [];

  for (const seed of QUIZ_SEEDS) {
    const meta = CATEGORY_META[seed.category] || { emoji: "📄", gradient: "from-gray-500 to-slate-600" };
    const code = seed.status === "published" ? makeCode() : undefined;
    const quiz = await Quiz.create({
      ...seed,
      accessCode: code,
      emoji: meta.emoji,
      gradient: meta.gradient,
    });
    createdQuizzes.push(quiz);
    console.log(`  ✔ [${seed.status.padEnd(9)}] ${seed.title}`);
  }

  // ── Seed session results ────────────────────────────────
  await seedSessions(createdQuizzes);

  console.log("\n✅ Seed complete!");
  await mongoose.disconnect();
}

async function seedSessions(quizzes) {
  // Get published quizzes only
  const publishedQuizzes = quizzes
    ? quizzes.filter((q) => q.status === "published")
    : await Quiz.find({ status: "published" }).lean();

  if (publishedQuizzes.length === 0) {
    console.log("⚠️  No published quizzes found — skipping session seed.");
    return;
  }

  const existingSessions = await QuizSessionResult.countDocuments();
  if (existingSessions > 0 && !process.argv.includes("--force")) {
    console.log(`ℹ️  ${existingSessions} session results already exist — skipping.`);
    return;
  }

  if (process.argv.includes("--force")) {
    await QuizSessionResult.deleteMany({});
  }

  console.log("\n🎯 Seeding session results (8 weeks of data)...");

  // Session configs per quiz: [weekOffset, studentCount, [minScore, maxScore], completionRate]
  const SESSION_PLANS = [
    // week 8 (oldest) → week 1 (most recent)
    [8, 12, [55, 85], 80],
    [7, 18, [60, 88], 82],
    [6, 22, [58, 82], 78],
    [5, 28, [62, 90], 85],
    [4, 35, [65, 92], 88],
    [3, 31, [60, 88], 84],
    [2, 42, [68, 95], 90],
    [1, 50, [70, 98], 92],
  ];

  let total = 0;
  for (const quiz of publishedQuizzes) {
    // Pick 3–6 random sessions for this quiz across weeks
    const picks = SESSION_PLANS
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 4));

    for (const [week, students, scoreRange, completion] of picks) {
      try {
        await QuizSessionResult.create(
          makeSessionResult(quiz._id || quiz.id, week, students, scoreRange, completion)
        );
        total++;
      } catch (e) {
        // Skip duplicates
        if (e.code !== 11000) throw e;
      }
    }
  }

  console.log(`  ✔ Created ${total} session results across ${publishedQuizzes.length} quizzes`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
