export default function ArcanePyramid({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer pyramid */}
      <path
        d="M50 10 L90 85 L10 85 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="miter"
      />

      {/* Inner lines creating mystical pattern */}
      <path
        d="M50 10 L50 85"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />

      {/* Left inner line */}
      <path
        d="M50 10 L30 85"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Right inner line */}
      <path
        d="M50 10 L70 85"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Horizontal sections */}
      <path
        d="M35 50 L65 50"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />

      <path
        d="M25 70 L75 70"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Eye of knowledge at the top */}
      <circle
        cx="50"
        cy="25"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      <circle
        cx="50"
        cy="25"
        r="3"
        fill="currentColor"
      />

      {/* Sacred geometry dots */}
      <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="40" cy="60" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="60" cy="60" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="50" cy="70" r="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
