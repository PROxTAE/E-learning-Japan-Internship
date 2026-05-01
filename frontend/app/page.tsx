import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Learning | Home",
  description: "Interactive quiz platform for e-learning",
};

export default function Home() {
  return (
    <div
      className="quiz-bg fixed inset-0 overflow-y-auto"
    >
      {/* Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-purple-400/20 dark:bg-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-violet-800/30 dark:bg-violet-600/20 blur-3xl" />
      </div>

      {/* Centred content */}
      <div className="relative min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-16 text-center gap-6 sm:gap-8">

        {/* Icon */}
        <div className="
          w-24 h-24 sm:w-28 sm:h-28 rounded-3xl
          bg-white/10 dark:bg-white/5 backdrop-blur-sm
          border-2 border-white/20 dark:border-white/10
          flex items-center justify-center shadow-2xl
          text-5xl sm:text-6xl
        ">
          🎓
        </div>

        {/* Title + subtitle */}
        <div className="flex flex-col gap-2 sm:gap-3 max-w-xs sm:max-w-sm">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
            E-Learning<br />Quiz
          </h1>
          <p className="text-white/55 text-base sm:text-lg">
            Test your knowledge with our interactive quizzes. Challenge yourself!
          </p>
        </div>

        {/* Stats pills row */}
        <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
          {[
            { icon: "📝", label: "5 Questions" },
            { icon: "⚡", label: "Instant Results" },
            { icon: "🏆", label: "Score Tracking" },
          ].map((item) => (
            <div
              key={item.label}
              className="
                flex items-center gap-2 px-4 py-2 rounded-full
                bg-white/10 dark:bg-white/5 backdrop-blur-sm
                border border-white/20 dark:border-white/10
              "
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-white/80 text-xs sm:text-sm font-semibold">{item.label}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <Link href="/quiz" className="w-full max-w-xs sm:max-w-sm">
          <button
            className="
              w-full py-4 sm:py-4.5 rounded-2xl
              bg-gradient-to-r from-emerald-400 to-green-500
              text-white font-bold text-lg sm:text-xl shadow-2xl
              hover:from-emerald-500 hover:to-green-600
              hover:shadow-emerald-500/30 hover:-translate-y-1
              active:scale-97 transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-emerald-400 focus-visible:ring-offset-2
            "
          >
            Start Quiz →
          </button>
        </Link>

      </div>
    </div>
  );
}
