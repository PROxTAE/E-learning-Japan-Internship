require("dotenv").config();
const mongoose = require("mongoose");
const QuizSessionResult = require("../src/models/QuizSessionResult.model");
const Quiz = require("../src/models/Quiz.model");

async function run() {
  console.log("Connecting to:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const sessions = await QuizSessionResult.find({}).lean();
  console.log(`Found ${sessions.length} sessions to check.`);

  for (const session of sessions) {
    const quizDoc = await Quiz.findById(session.quizId).lean();
    if (!quizDoc) {
      console.log(`Skipping session ${session._id} because quiz ${session.quizId} was not found.`);
      continue;
    }

    const quizQuestions = [...(quizDoc.questions || [])].sort((a, b) => a.order - b.order);
    if (!quizQuestions.length) continue;

    console.log(`Processing session: "${session.sessionLabel || session.sessionId}" for quiz: "${quizDoc.title}"`);

    // 1. Gather all unique old questionIds in the answers
    const oldQIds = Array.from(new Set(session.answers.map(a => a.questionId))).filter(id => mongoose.Types.ObjectId.isValid(id));
    // Sort them so they match the creation sequence
    oldQIds.sort();

    // Create a mapping from oldQId -> new quizQuestion
    const qMap = {};
    oldQIds.forEach((oldId, index) => {
      if (index < quizQuestions.length) {
        qMap[oldId] = quizQuestions[index];
      }
    });

    // 2. Map answers
    const updatedAnswers = session.answers.map(a => {
      const q = qMap[a.questionId];
      if (!q) return a; // fallback

      // Find choice matching by text
      const choice = q.choices.find(c => c.text === a.choiceText);
      return {
        ...a,
        questionId: q._id.toString(),
        choiceId: choice ? choice._id.toString() : a.choiceId,
        isCorrect: choice ? choice.isCorrect : a.isCorrect,
      };
    });

    // 3. Recompute student scores
    const updatedStudents = session.students.map(st => {
      const studentAnswers = updatedAnswers.filter(a => a.studentId === st.studentId);
      const correctCount = studentAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = quizQuestions.length;

      return {
        ...st,
        score: correctCount,
        scorePercent: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        progress: totalQuestions > 0 ? Math.round((studentAnswers.length / totalQuestions) * 100) : 0,
      };
    });

    // 4. Recompute questionStats
    const updatedQuestionStats = quizQuestions.map((q, idx) => {
      const qId = q._id.toString();
      const qAnswers = updatedAnswers.filter(a => a.questionId === qId);
      const correctCount = qAnswers.filter(a => a.isCorrect).length;
      const totalTime = qAnswers.reduce((s, a) => s + (a.responseTime || 0), 0);
      const confusionCount = qAnswers.filter(a => a.confusionLevel && a.confusionLevel !== "none").length;

      const choiceMap = {};
      qAnswers.forEach(a => {
        const choice = q.choices.find(c => c._id.toString() === a.choiceId || c.text === a.choiceText);
        const key = choice ? choice._id.toString() : a.choiceId;
        if (!choiceMap[key]) {
          choiceMap[key] = {
            choiceId: key,
            choiceText: choice ? choice.text : a.choiceText,
            count: 0
          };
        }
        choiceMap[key].count++;
      });

      return {
        questionId: qId,
        questionText: q.text || `Question ${idx + 1}`,
        order: q.order ?? idx,
        answerCount: qAnswers.length,
        correctCount,
        correctPercent: qAnswers.length > 0 ? Math.round((correctCount / qAnswers.length) * 100) : 0,
        avgResponseTime: qAnswers.length > 0 ? Math.round(totalTime / qAnswers.length) : 0,
        confusionCount,
        choices: Object.values(choiceMap),
      };
    });

    // 5. Recompute general stats
    const totalStudents = updatedStudents.length;
    const totalAnswers = updatedAnswers.length;
    const correctAnswers = updatedAnswers.filter(a => a.isCorrect).length;
    const avgScore = totalStudents > 0
      ? Math.round(updatedStudents.reduce((s, st) => s + st.scorePercent, 0) / totalStudents) : 0;
    const completed = updatedStudents.filter(st => st.progress === 100).length;
    const completionPct = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

    const stats = {
      totalStudents,
      averageScore: avgScore,
      completionPercentage: completionPct,
      correctAnswers,
      totalAnswers,
    };

    // Update in MongoDB
    await QuizSessionResult.findByIdAndUpdate(session._id, {
      $set: {
        answers: updatedAnswers,
        students: updatedStudents,
        questionStats: updatedQuestionStats,
        stats: stats
      }
    });
    console.log(`Successfully migrated and updated session ${session._id}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
