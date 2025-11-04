export const Footer = () => {
  return (
    <div className="hidden h-20 w-full border-t-2 border-slate-200 p-2 lg:block">
      <div className="mx-auto h-full w-full max-w-screen-lg">
        <div className="grid grid-cols-12 items-center gap-4 py-2 text-sm">
          <div className="col-span-2 font-semibold text-slate-700">Icon</div>
          <div className="col-span-3 font-semibold text-slate-700">Course Name</div>
          <div className="col-span-7 font-semibold text-slate-700">Description</div>
        </div>

        <div className="divide-y">
          <div className="grid grid-cols-12 items-center gap-4 py-2">
            <div className="col-span-2">🌍</div>
            <div className="col-span-3">General Knowledge (GK)</div>
            <div className="col-span-7">Learn important facts, current affairs, and world trivia.</div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4 py-2">
            <div className="col-span-2">🧩</div>
            <div className="col-span-3">Logical Reasoning</div>
            <div className="col-span-7">Practice puzzles, reasoning patterns, and IQ-based problems.</div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4 py-2">
            <div className="col-span-2">📊</div>
            <div className="col-span-3">Analytical Skills</div>
            <div className="col-span-7">Improve data interpretation, analysis, and problem-solving.</div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4 py-2">
            <div className="col-span-2">✍️</div>
            <div className="col-span-3">Grammar</div>
            <div className="col-span-7">Strengthen English grammar, sentence correction, and usage.</div>
          </div>

          <div className="grid grid-cols-12 items-center gap-4 py-2">
            <div className="col-span-2">🔢</div>
            <div className="col-span-3">Mathematics</div>
            <div className="col-span-7">Sharpen your aptitude, numbers, and equations.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
