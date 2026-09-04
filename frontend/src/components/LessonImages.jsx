/** Lesson illustration SVGs — educational visuals, no text captions */
export const LESSON_IMAGES = {
  'foundation-l1': AlphabetArt,
  'foundation-l2': BlendArt,
  'foundation-l3': FirstWordsArt,
  'foundation-l4': AboutMeArt,
  'beginner-l1': VerbsArt,
  'beginner-l2': AdjectivesArt,
  'beginner-l3': PresentTenseArt,
  'beginner-l4': StoryArt,
  'intermediate-l1': TensesArt,
  'intermediate-l2': CompoundArt,
  'intermediate-l3': BakeryArt,
  'intermediate-l4': GrammarArt,
  'advanced-l1': ComplexArt,
  'advanced-l2': IdiomsArt,
  'advanced-l3': DeepReadArt,
  'advanced-l4': ParagraphArt,
};

function Frame({ children, glow = '#58cc02', uid = 'a' }) {
  const skyId = `sky-${uid}`;
  const glowId = `glow-${uid}`;
  return (
    <svg viewBox="0 0 640 360" className="h-full w-full" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#063528" />
          <stop offset="45%" stopColor="#0f5c45" />
          <stop offset="100%" stopColor="#1a8f6a" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill={`url(#${skyId})`} />
      <ellipse cx="320" cy="120" rx="240" ry="120" fill={`url(#${glowId})`} />
      <circle cx="520" cy="60" r="40" fill="rgba(255,255,255,0.08)" />
      <circle cx="90" cy="280" r="50" fill="rgba(255,255,255,0.06)" />
      {children}
    </svg>
  );
}

function AlphabetArt() {
  return (
    <Frame glow="#ffc800" uid="u1">
      {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
        <g key={letter} transform={`translate(${70 + i * 105}, 110)`}>
          <rect width="88" height="140" rx="18" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
          <text x="44" y="88" textAnchor="middle" fontSize="54" fontWeight="800" fill="#fff" fontFamily="Space Grotesk,sans-serif">{letter}</text>
          <circle cx="44" cy="118" r="10" fill={['#ff6b6b', '#1cb0f6', '#ffc800', '#58cc02', '#c084fc'][i]} />
        </g>
      ))}
    </Frame>
  );
}

function BlendArt() {
  return (
    <Frame glow="#1cb0f6" uid="u2">
      {['C', 'A', 'T'].map((l, i) => (
        <g key={l}>
          <circle cx={140 + i * 110} cy="150" r="48" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="3" />
          <text x={140 + i * 110} y="162" textAnchor="middle" fontSize="42" fontWeight="800" fill="#fff" fontFamily="Space Grotesk,sans-serif">{l}</text>
          {i < 2 ? <path d={`M${185 + i * 110} 150 H${205 + i * 110}`} stroke="#7be012" strokeWidth="6" strokeLinecap="round" /> : null}
        </g>
      ))}
      <path d="M430 150 H480" stroke="#7be012" strokeWidth="6" strokeLinecap="round" markerEnd="url(#arrow)" />
      <rect x="490" y="110" width="110" height="80" rx="16" fill="#58cc02" />
      <text x="545" y="162" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0b2a12" fontFamily="Space Grotesk,sans-serif">CAT</text>
      <ellipse cx="545" cy="260" rx="40" ry="28" fill="#ffc800" opacity="0.9" />
      <circle cx="530" cy="250" r="6" fill="#0b2a12" />
      <circle cx="555" cy="250" r="6" fill="#0b2a12" />
      <path d="M535 268 Q545 275 555 268" stroke="#0b2a12" strokeWidth="3" fill="none" />
    </Frame>
  );
}

function FirstWordsArt() {
  return (
    <Frame uid="u3">
      {[
        { x: 80, label: 'I', color: '#1cb0f6' },
        { x: 200, label: 'CAT', color: '#ffc800' },
        { x: 340, label: 'DOG', color: '#58cc02' },
        { x: 480, label: 'SUN', color: '#ff6b6b' },
      ].map((item) => (
        <g key={item.label} transform={`translate(${item.x}, 100)`}>
          <rect width="100" height="160" rx="20" fill="rgba(255,255,255,0.16)" />
          <circle cx="50" cy="55" r="28" fill={item.color} />
          <rect x="18" y="110" width="64" height="28" rx="8" fill="rgba(0,0,0,0.25)" />
          <text x="50" y="130" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Nunito,sans-serif">{item.label}</text>
        </g>
      ))}
    </Frame>
  );
}

function AboutMeArt() {
  return (
    <Frame glow="#c084fc" uid="u4">
      <circle cx="320" cy="150" r="70" fill="#ffe0b2" />
      <circle cx="300" cy="140" r="6" fill="#0b2a12" />
      <circle cx="340" cy="140" r="6" fill="#0b2a12" />
      <path d="M300 165 Q320 180 340 165" stroke="#0b2a12" strokeWidth="4" fill="none" />
      <rect x="280" y="220" width="80" height="70" rx="16" fill="#1cb0f6" />
      {[
        { x: 80, y: 80, t: '👋' },
        { x: 500, y: 90, t: '📖' },
        { x: 100, y: 230, t: '✨' },
        { x: 490, y: 230, t: '💚' },
      ].map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={b.y} width="70" height="50" rx="16" fill="rgba(255,255,255,0.22)" />
          <text x={b.x + 35} y={b.y + 34} textAnchor="middle" fontSize="24">{b.t}</text>
        </g>
      ))}
    </Frame>
  );
}

function VerbsArt() {
  return (
    <Frame glow="#ff6b6b" uid="u5">
      {[
        { x: 70, icon: '🏃', label: 'runs' },
        { x: 210, icon: '🍎', label: 'eats' },
        { x: 350, icon: '📚', label: 'reads' },
        { x: 490, icon: '😴', label: 'sleeps' },
      ].map((a) => (
        <g key={a.label} transform={`translate(${a.x}, 90)`}>
          <rect width="110" height="180" rx="22" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.35)" />
          <text x="55" y="90" textAnchor="middle" fontSize="48">{a.icon}</text>
          <text x="55" y="150" textAnchor="middle" fontSize="20" fontWeight="800" fill="#b8ff7a" fontFamily="Space Grotesk,sans-serif">{a.label}</text>
        </g>
      ))}
    </Frame>
  );
}

function AdjectivesArt() {
  return (
    <Frame glow="#ffc800" uid="u6">
      <rect x="40" y="40" width="560" height="280" rx="24" fill="rgba(255,255,255,0.08)" />
      <rect x="80" y="70" width="40" height="200" rx="8" fill="#2d6a4f" />
      <circle cx="100" cy="70" r="50" fill="#58cc02" opacity="0.85" />
      <ellipse cx="220" cy="250" rx="45" ry="30" fill="#1cb0f6" />
      <circle cx="340" cy="240" r="28" fill="#ffc800" />
      <circle cx="450" cy="220" r="22" fill="#ff6b6b" />
      <circle cx="540" cy="180" r="40" fill="#ffe0b2" />
      <text x="100" y="320" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">tall</text>
      <text x="220" y="320" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">big</text>
      <text x="340" y="320" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">small</text>
      <text x="450" y="320" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">red</text>
      <text x="540" y="320" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">happy</text>
    </Frame>
  );
}

function PresentTenseArt() {
  return (
    <Frame glow="#1cb0f6" uid="u7">
      <rect x="40" y="60" width="260" height="240" rx="22" fill="rgba(28,176,246,0.25)" />
      <rect x="340" y="60" width="260" height="240" rx="22" fill="rgba(88,204,2,0.25)" />
      <text x="170" y="110" textAnchor="middle" fontSize="22" fontWeight="800" fill="#9adbff" fontFamily="Space Grotesk,sans-serif">I / You / We</text>
      <text x="170" y="180" textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" fontFamily="Space Grotesk,sans-serif">eat</text>
      <text x="470" y="110" textAnchor="middle" fontSize="22" fontWeight="800" fill="#b8ff7a" fontFamily="Space Grotesk,sans-serif">He / She / It</text>
      <text x="470" y="180" textAnchor="middle" fontSize="36" fontWeight="800" fill="#fff" fontFamily="Space Grotesk,sans-serif">eats</text>
    </Frame>
  );
}

function StoryArt() {
  return (
    <Frame uid="u8">
      {[1, 2, 3, 4, 5].map((n, i) => (
        <g key={n} transform={`translate(${40 + i * 118}, 90)`}>
          <rect width="100" height="180" rx="16" fill="rgba(255,255,255,0.15)" />
          <text x="50" y="50" textAnchor="middle" fontSize="28">{['🌅', '🪥', '🍳', '🏫', '🏞️'][i]}</text>
          <text x="50" y="150" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{n}</text>
        </g>
      ))}
    </Frame>
  );
}

function TensesArt() {
  return (
    <Frame glow="#ffc800" uid="u9">
      {[
        { x: 50, title: 'Past', color: '#c4a484', word: 'ate' },
        { x: 240, title: 'Present', color: '#58cc02', word: 'eat' },
        { x: 430, title: 'Future', color: '#1cb0f6', word: 'will eat' },
      ].map((t) => (
        <g key={t.title} transform={`translate(${t.x}, 80)`}>
          <rect width="160" height="200" rx="22" fill="rgba(255,255,255,0.14)" stroke={t.color} strokeWidth="3" />
          <text x="80" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill={t.color} fontFamily="Space Grotesk,sans-serif">{t.title}</text>
          <text x="80" y="130" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff" fontFamily="Space Grotesk,sans-serif">{t.word}</text>
        </g>
      ))}
    </Frame>
  );
}

function CompoundArt() {
  return (
    <Frame glow="#58cc02" uid="u10">
      <rect x="50" y="120" width="160" height="90" rx="18" fill="rgba(255,255,255,0.18)" />
      <rect x="430" y="120" width="160" height="90" rx="18" fill="rgba(255,255,255,0.18)" />
      <rect x="250" y="130" width="140" height="70" rx="18" fill="#58cc02" />
      <text x="320" y="175" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0b2a12" fontFamily="Space Grotesk,sans-serif">AND / BUT</text>
      <text x="130" y="175" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">Idea 1</text>
      <text x="510" y="175" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">Idea 2</text>
      <path d="M210 165 H250" stroke="#fff" strokeWidth="4" />
      <path d="M390 165 H430" stroke="#fff" strokeWidth="4" />
    </Frame>
  );
}

function BakeryArt() {
  return (
    <Frame glow="#ffc800" uid="u11">
      <rect x="120" y="100" width="400" height="180" rx="20" fill="rgba(255,255,255,0.14)" />
      <rect x="160" y="70" width="320" height="50" rx="12" fill="#ffc800" />
      <text x="320" y="105" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0b2a12" fontFamily="Space Grotesk,sans-serif">Priya's Bakery</text>
      <ellipse cx="220" cy="200" rx="35" ry="20" fill="#e8b86d" />
      <ellipse cx="320" cy="200" rx="35" ry="20" fill="#e8b86d" />
      <ellipse cx="420" cy="200" rx="35" ry="20" fill="#e8b86d" />
      <circle cx="500" cy="230" r="28" fill="#ffe0b2" />
    </Frame>
  );
}

function GrammarArt() {
  return (
    <Frame glow="#ff6b6b" uid="u12">
      {[
        { y: 70, wrong: 'She go', right: 'She goes' },
        { y: 150, wrong: "don't nothing", right: "don't anything" },
        { y: 230, wrong: 'Their going', right: "They're going" },
      ].map((row) => (
        <g key={row.wrong}>
          <rect x="50" y={row.y} width="220" height="55" rx="14" fill="rgba(255,75,75,0.25)" stroke="#ff6b6b" />
          <text x="160" y={row.y + 35} textAnchor="middle" fontSize="18" fontWeight="700" fill="#ffc0c0" fontFamily="Nunito,sans-serif">{row.wrong}</text>
          <text x="300" y={row.y + 35} textAnchor="middle" fontSize="24" fill="#58cc02">→</text>
          <rect x="350" y={row.y} width="240" height="55" rx="14" fill="rgba(88,204,2,0.25)" stroke="#58cc02" />
          <text x="470" y={row.y + 35} textAnchor="middle" fontSize="18" fontWeight="700" fill="#c8ff9a" fontFamily="Nunito,sans-serif">{row.right}</text>
        </g>
      ))}
    </Frame>
  );
}

function ComplexArt() {
  return (
    <Frame glow="#c084fc" uid="u13">
      <rect x="40" y="100" width="250" height="140" rx="20" fill="rgba(192,132,252,0.25)" stroke="#c084fc" strokeWidth="3" />
      <rect x="350" y="100" width="250" height="140" rx="20" fill="rgba(28,176,246,0.3)" stroke="#1cb0f6" strokeWidth="3" />
      <text x="165" y="155" textAnchor="middle" fontSize="18" fontWeight="700" fill="#e9d5ff" fontFamily="Nunito,sans-serif">Supporting idea</text>
      <text x="165" y="195" textAnchor="middle" fontSize="16" fill="#fff" fontFamily="Nunito,sans-serif">Although it rained</text>
      <text x="475" y="155" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9adbff" fontFamily="Nunito,sans-serif">Main idea</text>
      <text x="475" y="195" textAnchor="middle" fontSize="16" fill="#fff" fontFamily="Nunito,sans-serif">she went to work</text>
      <path d="M290 170 H350" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

function IdiomsArt() {
  return (
    <Frame uid="u14">
      {[
        { x: 40, a: '🧊', b: '💬' },
        { x: 180, a: '🫘', b: '🤫' },
        { x: 320, a: '🔨', b: '✅' },
        { x: 460, a: '🐱🐶', b: '🌧️' },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x}, 80)`}>
          <rect width="120" height="200" rx="20" fill="rgba(255,255,255,0.14)" />
          <text x="60" y="70" textAnchor="middle" fontSize="32">{p.a}</text>
          <text x="60" y="120" textAnchor="middle" fontSize="20" fill="#58cc02">↓</text>
          <text x="60" y="170" textAnchor="middle" fontSize="32">{p.b}</text>
        </g>
      ))}
    </Frame>
  );
}

function DeepReadArt() {
  return (
    <Frame glow="#1cb0f6" uid="u15">
      <rect x="50" y="70" width="250" height="220" rx="20" fill="rgba(255,255,255,0.14)" />
      <rect x="90" y="110" width="170" height="100" rx="10" fill="#0b2a12" opacity="0.5" />
      <rect x="105" y="125" width="60" height="8" rx="4" fill="#58cc02" />
      <rect x="105" y="145" width="90" height="8" rx="4" fill="#1cb0f6" />
      <rect x="105" y="165" width="70" height="8" rx="4" fill="#ffc800" />
      <circle cx="200" cy="250" r="28" fill="#ffe0b2" />
      <rect x="340" y="70" width="250" height="220" rx="20" fill="rgba(88,204,2,0.18)" />
      <rect x="390" y="140" width="60" height="100" fill="#58cc02" opacity="0.6" />
      <circle cx="500" cy="200" r="30" fill="#ffe0b2" />
      <rect x="470" y="160" width="40" height="60" rx="8" fill="#1cb0f6" />
    </Frame>
  );
}

function ParagraphArt() {
  return (
    <Frame glow="#58cc02" uid="u16">
      <polygon points="320,50 480,280 160,280" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <rect x="260" y="70" width="120" height="40" rx="10" fill="#1cb0f6" />
      <text x="320" y="97" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">Topic</text>
      <rect x="210" y="150" width="220" height="40" rx="10" fill="#ffc800" />
      <text x="320" y="177" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0b2a12">Details</text>
      <rect x="240" y="230" width="160" height="40" rx="10" fill="#58cc02" />
      <text x="320" y="257" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0b2a12">Closing</text>
    </Frame>
  );
}

export function getLessonImage(lessonId) {
  return LESSON_IMAGES[lessonId] || AlphabetArt;
}
