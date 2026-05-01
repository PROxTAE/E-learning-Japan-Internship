export type Language = "en" | "th" | "ja";

export const LANGUAGES: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧", nativeName: "English" },
  { code: "th", label: "Thai", flag: "🇹🇭", nativeName: "ภาษาไทย" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
];

const en = {
  nav: {
    brand: "E-Learning", portalSubtitle: "Teacher Portal",
    dashboard: "Dashboard", quizzes: "Quizzes", students: "Students",
    calendar: "Calendar", reports: "Reports", settings: "Settings", logout: "Logout",
  },
  topbar: {
    searchPlaceholder: "Search quizzes, categories...",
    myProfile: "My Profile", settings: "Settings", logout: "Logout",
  },
  header: {
    title: "Quiz Management",
    subtitle: (n: number) => `${n} quiz${n !== 1 ? "zes" : ""} in your library`,
    newQuiz: "+ New Quiz",
    periods: ["All time", "This week", "This month", "This year"],
  },
  stats: {
    totalQuizzes: "Total Quizzes", drafts: (n: number) => `${n} drafts`,
    published: "Published", activeAccessible: "Active & accessible",
    totalAttempts: "Total Attempts", byAllStudents: "By all students",
    avgScore: "Avg. Score", acrossAll: "Across all quizzes",
  },
  categories: { title: "CATEGORIES", active: "Active", quizzes: (n: number) => `${n} quizzes` },
  quizSection: {
    title: "QUIZZES",
    filteredBy: "— filtered by",
    results: (n: number) => `${n} results`,
    noQuizzes: "No quizzes found",
    noQuizzesDesc: "Try adjusting your filters or create a new quiz.",
    createQuiz: "Create Quiz",
  },
  status: { published: "Published", draft: "Draft", archived: "Archived" },
  difficulty: { easy: "Easy", medium: "Medium", hard: "Hard" },
  table: {
    title: "TITLE", category: "CATEGORY", status: "STATUS", difficulty: "DIFFICULTY",
    questions: "QUESTIONS", avgScore: "AVG SCORE", actions: "ACTIONS",
    noQuizzes: "No quizzes found",
  },
  detail: {
    infoTab: "Info", statsTab: "Stats",
    questions: "Questions", duration: (m: number) => `${m} min`, attempts: "Attempts",
    tags: "Tags", avgScore: "Average Score", completionRate: "Completion Rate",
    created: "Created", updated: "Updated", edit: "Edit",
  },
  modal: {
    createTitle: "Create New Quiz", editTitle: "Edit Quiz",
    createSubtitle: "Fill in the details to create a new quiz.",
    editSubtitle: "Update the quiz details below.",
    titleLabel: "Quiz Title", titlePlaceholder: "e.g. Algebra Fundamentals",
    descLabel: "Description", descPlaceholder: "Brief description of the quiz content...",
    categoryLabel: "Category", categoryPlaceholder: "Select category",
    difficultyLabel: "Difficulty",
    durationLabel: "Duration (minutes)",
    tagsLabel: "Tags (comma separated)", tagsPlaceholder: "e.g. algebra, math, equations",
    cancel: "Cancel", create: "Create Quiz", save: "Save Changes",
    easyLabel: "🟢 Easy", mediumLabel: "🟡 Medium", hardLabel: "🔴 Hard",
  },
  validation: {
    titleRequired: "Title is required",
    categoryRequired: "Category is required",
    durationMin: "Duration must be at least 1 minute",
  },
};

const th: typeof en = {
  nav: {
    brand: "อี-เลิร์นนิ่ง", portalSubtitle: "พอร์ทัลอาจารย์",
    dashboard: "แดชบอร์ด", quizzes: "แบบทดสอบ", students: "นักเรียน",
    calendar: "ปฏิทิน", reports: "รายงาน", settings: "ตั้งค่า", logout: "ออกจากระบบ",
  },
  topbar: {
    searchPlaceholder: "ค้นหาแบบทดสอบ, หมวดหมู่...",
    myProfile: "โปรไฟล์ของฉัน", settings: "ตั้งค่า", logout: "ออกจากระบบ",
  },
  header: {
    title: "จัดการแบบทดสอบ",
    subtitle: (n: number) => `${n} แบบทดสอบในคลัง`,
    newQuiz: "+ สร้างใหม่",
    periods: ["ทั้งหมด", "สัปดาห์นี้", "เดือนนี้", "ปีนี้"],
  },
  stats: {
    totalQuizzes: "แบบทดสอบทั้งหมด", drafts: (n: number) => `${n} ฉบับร่าง`,
    published: "เผยแพร่แล้ว", activeAccessible: "ใช้งานและเข้าถึงได้",
    totalAttempts: "จำนวนครั้งที่ทำ", byAllStudents: "โดยนักเรียนทั้งหมด",
    avgScore: "คะแนนเฉลี่ย", acrossAll: "รวมทุกแบบทดสอบ",
  },
  categories: { title: "หมวดหมู่", active: "ใช้งานอยู่", quizzes: (n: number) => `${n} แบบทดสอบ` },
  quizSection: {
    title: "แบบทดสอบ",
    filteredBy: "— กรองตาม",
    results: (n: number) => `${n} รายการ`,
    noQuizzes: "ไม่พบแบบทดสอบ",
    noQuizzesDesc: "ลองปรับตัวกรอง หรือสร้างแบบทดสอบใหม่",
    createQuiz: "สร้างแบบทดสอบ",
  },
  status: { published: "เผยแพร่", draft: "ฉบับร่าง", archived: "เก็บถาวร" },
  difficulty: { easy: "ง่าย", medium: "ปานกลาง", hard: "ยาก" },
  table: {
    title: "ชื่อ", category: "หมวดหมู่", status: "สถานะ", difficulty: "ความยาก",
    questions: "คำถาม", avgScore: "คะแนนเฉลี่ย", actions: "จัดการ",
    noQuizzes: "ไม่พบแบบทดสอบ",
  },
  detail: {
    infoTab: "ข้อมูล", statsTab: "สถิติ",
    questions: "คำถาม", duration: (m: number) => `${m} นาที`, attempts: "ครั้งที่ทำ",
    tags: "แท็ก", avgScore: "คะแนนเฉลี่ย", completionRate: "อัตราการทำสำเร็จ",
    created: "สร้างเมื่อ", updated: "แก้ไขเมื่อ", edit: "แก้ไข",
  },
  modal: {
    createTitle: "สร้างแบบทดสอบใหม่", editTitle: "แก้ไขแบบทดสอบ",
    createSubtitle: "กรอกรายละเอียดเพื่อสร้างแบบทดสอบใหม่",
    editSubtitle: "แก้ไขรายละเอียดแบบทดสอบด้านล่าง",
    titleLabel: "ชื่อแบบทดสอบ", titlePlaceholder: "เช่น พื้นฐานพีชคณิต",
    descLabel: "คำอธิบาย", descPlaceholder: "คำอธิบายสั้น ๆ ของเนื้อหา...",
    categoryLabel: "หมวดหมู่", categoryPlaceholder: "เลือกหมวดหมู่",
    difficultyLabel: "ระดับความยาก",
    durationLabel: "ระยะเวลา (นาที)",
    tagsLabel: "แท็ก (คั่นด้วยจุลภาค)", tagsPlaceholder: "เช่น พีชคณิต, คณิตศาสตร์",
    cancel: "ยกเลิก", create: "สร้างแบบทดสอบ", save: "บันทึกการเปลี่ยนแปลง",
    easyLabel: "🟢 ง่าย", mediumLabel: "🟡 ปานกลาง", hardLabel: "🔴 ยาก",
  },
  validation: {
    titleRequired: "กรุณากรอกชื่อแบบทดสอบ",
    categoryRequired: "กรุณาเลือกหมวดหมู่",
    durationMin: "ระยะเวลาต้องมากกว่า 0 นาที",
  },
};

const ja: typeof en = {
  nav: {
    brand: "Eラーニング", portalSubtitle: "教師ポータル",
    dashboard: "ダッシュボード", quizzes: "クイズ", students: "学生",
    calendar: "カレンダー", reports: "レポート", settings: "設定", logout: "ログアウト",
  },
  topbar: {
    searchPlaceholder: "クイズ、カテゴリを検索...",
    myProfile: "マイプロフィール", settings: "設定", logout: "ログアウト",
  },
  header: {
    title: "クイズ管理",
    subtitle: (n: number) => `ライブラリに ${n} 件のクイズ`,
    newQuiz: "+ 新規クイズ",
    periods: ["全期間", "今週", "今月", "今年"],
  },
  stats: {
    totalQuizzes: "クイズ総数", drafts: (n: number) => `下書き ${n} 件`,
    published: "公開済み", activeAccessible: "有効・アクセス可能",
    totalAttempts: "総受験回数", byAllStudents: "全学生による",
    avgScore: "平均スコア", acrossAll: "全クイズの平均",
  },
  categories: { title: "カテゴリ", active: "選択中", quizzes: (n: number) => `${n} クイズ` },
  quizSection: {
    title: "クイズ一覧",
    filteredBy: "— フィルター:",
    results: (n: number) => `${n} 件`,
    noQuizzes: "クイズが見つかりません",
    noQuizzesDesc: "フィルターを変更するか、新しいクイズを作成してください。",
    createQuiz: "クイズを作成",
  },
  status: { published: "公開中", draft: "下書き", archived: "アーカイブ" },
  difficulty: { easy: "易しい", medium: "普通", hard: "難しい" },
  table: {
    title: "タイトル", category: "カテゴリ", status: "ステータス", difficulty: "難易度",
    questions: "問題数", avgScore: "平均スコア", actions: "操作",
    noQuizzes: "クイズが見つかりません",
  },
  detail: {
    infoTab: "情報", statsTab: "統計",
    questions: "問題数", duration: (m: number) => `${m} 分`, attempts: "受験回数",
    tags: "タグ", avgScore: "平均スコア", completionRate: "完了率",
    created: "作成日", updated: "更新日", edit: "編集",
  },
  modal: {
    createTitle: "クイズを新規作成", editTitle: "クイズを編集",
    createSubtitle: "以下の項目を入力してクイズを作成してください。",
    editSubtitle: "クイズの詳細を編集してください。",
    titleLabel: "クイズタイトル", titlePlaceholder: "例：代数の基礎",
    descLabel: "説明", descPlaceholder: "クイズの内容を簡単に説明してください...",
    categoryLabel: "カテゴリ", categoryPlaceholder: "カテゴリを選択",
    difficultyLabel: "難易度",
    durationLabel: "制限時間（分）",
    tagsLabel: "タグ（カンマ区切り）", tagsPlaceholder: "例：代数、数学、方程式",
    cancel: "キャンセル", create: "クイズを作成", save: "変更を保存",
    easyLabel: "🟢 易しい", mediumLabel: "🟡 普通", hardLabel: "🔴 難しい",
  },
  validation: {
    titleRequired: "タイトルを入力してください",
    categoryRequired: "カテゴリを選択してください",
    durationMin: "制限時間は1分以上にしてください",
  },
};

export const translations = { en, th, ja };
export type T = typeof en;
