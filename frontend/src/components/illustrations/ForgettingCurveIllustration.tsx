/**
 * The one deliberately bold visual element in this app (see
 * frontend-design skill: "spend your boldness in one place"). It's a
 * stylized version of the Ebbinghaus forgetting curve — the actual
 * mechanic this whole product is built on. Each segment decays slower and
 * shallower than the last, which is literally what Sm2Service computes on
 * the backend: a correct review lengthens the next interval.
 *
 * The curve draws itself in once on mount (stroke-dasharray animation) —
 * the one orchestrated motion moment for the whole app. Respects
 * prefers-reduced-motion globally (see index.css).
 */
export function ForgettingCurveIllustration() {
  return (
    <svg
      viewBox="0 0 440 200"
      fill="none"
      className="w-full max-w-md"
      role="img"
      aria-label="Illustration of a memory retention curve: each review flattens the forgetting curve, extending how long a word stays remembered."
    >
      {/* Forgetting threshold — the point a word would be lost without review */}
      <line
        x1="10"
        y1="165"
        x2="430"
        y2="165"
        stroke="var(--color-ink-600)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      <path
        d="M 20,32 C 55,45 85,120 108,162
           M 118,34 C 175,55 230,110 255,158
           M 265,34 C 330,55 380,90 415,142"
        stroke="var(--color-amber-400)"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="curve-draw-in"
        pathLength={1}
      />

      {/* Review points — each one is where the user answered a card */}
      {[
        { x: 108, y: 162 },
        { x: 255, y: 158 },
      ].map((point) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} r="7" fill="var(--color-ink-950)" />
          <circle cx={point.x} cy={point.y} r="4.5" fill="var(--color-amber-600)" />
        </g>
      ))}

      <style>{`
        .curve-draw-in {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: draw-curve 1.6s ease-out 0.2s forwards;
        }
        @keyframes draw-curve {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}
