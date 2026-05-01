import { QuizQuestion } from "../types";

const mockQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the primary role of a front-end developer?",
    options: [
      { id: "o1", text: "Designing the database schema" },
      { id: "o2", text: "Creating the user interface and experience" },
      { id: "o3", text: "Managing server-side infrastructure" },
      { id: "o4", text: "Writing API endpoints" },
    ],
    correctOptionId: "o2",
  },
  {
    id: "q2",
    question: "Which of the following is NOT a JavaScript framework/library?",
    options: [
      { id: "o1", text: "React" },
      { id: "o2", text: "Angular" },
      { id: "o3", text: "Django" },
      { id: "o4", text: "Vue" },
    ],
    correctOptionId: "o3",
  },
  {
    id: "q3",
    question: "What does CSS stand for?",
    options: [
      { id: "o1", text: "Cascading Style Sheets" },
      { id: "o2", text: "Creative Style System" },
      { id: "o3", text: "Computer Style Sheets" },
      { id: "o4", text: "Colorful Style Sheets" },
    ],
    correctOptionId: "o1",
  },
  {
    id: "q4",
    question: "Which HTML tag is used to define an internal style sheet?",
    options: [
      { id: "o1", text: "<script>" },
      { id: "o2", text: "<style>" },
      { id: "o3", text: "<css>" },
      { id: "o4", text: "<link>" },
    ],
    correctOptionId: "o2",
  },
  {
    id: "q5",
    question: "What is the correct syntax for referring to an external script called 'app.js'?",
    options: [
      { id: "o1", text: "<script href='app.js'>" },
      { id: "o2", text: "<script name='app.js'>" },
      { id: "o3", text: "<script src='app.js'>" },
      { id: "o4", text: "<script file='app.js'>" },
    ],
    correctOptionId: "o3",
  },
];

// Mock API calls
export const fetchQuizQuestions = async (): Promise<QuizQuestion[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockQuestions);
    }, 1000);
  });
};
