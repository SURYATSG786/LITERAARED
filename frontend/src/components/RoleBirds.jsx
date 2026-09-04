import { motion } from 'motion/react';
import { TeacherBird } from './RedBird';

function BirdBase({ children }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="roleBirdRed" x1="48" y1="47" x2="151" y2="171" gradientUnits="userSpaceOnUse"><stop stopColor="#FF705A" /><stop offset="0.55" stopColor="#ED3340" /><stop offset="1" stopColor="#A90F2B" /></linearGradient>
        <linearGradient id="roleBirdBelly" x1="100" y1="127" x2="100" y2="167" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF4D1" /><stop offset="1" stopColor="#FFC26B" /></linearGradient>
        <filter id="roleBirdShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="2.5" floodColor="#571025" floodOpacity=".28" /></filter>
      </defs>
      <ellipse cx="100" cy="180" rx="53" ry="9" fill="rgba(3,32,56,0.14)" />
      <path d="M72 63 Q83 31 100 50 Q118 31 128 63" fill="#F74743" />
      <g filter="url(#roleBirdShadow)">
        <path d="M43 111 Q44 69 77 54 Q100 40 123 54 Q156 69 157 111 L150 151 Q137 174 100 176 Q63 174 50 151 Z" fill="url(#roleBirdRed)" />
        <path d="M64 138 Q100 118 136 138 L137 159 Q100 176 63 159 Z" fill="url(#roleBirdBelly)" />
      </g>
      <ellipse cx="76" cy="96" rx="19" ry="21" fill="#FFFDF5" />
      <ellipse cx="124" cy="96" rx="19" ry="21" fill="#FFFDF5" />
      {children}
      <path d="M86 117 Q100 107 114 117 L100 132 Z" fill="#FFD84A" stroke="#D77812" strokeWidth="2" />
      <path d="M80 171 V180 M80 180 H70 M80 180 H89" stroke="#F68A16" strokeWidth="5" strokeLinecap="round" />
      <path d="M120 171 V180 M120 180 H111 M120 180 H130" stroke="#F68A16" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function MentorBird() {
  return (
    <motion.div className="role-bird-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}>
      <TeacherBird size={120} />
    </motion.div>
  );
}

export function StudentBird() {
  return (
    <motion.div className="role-bird-icon" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}>
      <BirdBase>
        <motion.circle cx="80" cy="99" r="7" fill="#44242A" animate={{ cx: [78, 83, 78], cy: [99, 96, 99] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.circle cx="120" cy="99" r="7" fill="#44242A" animate={{ cx: [118, 123, 118], cy: [99, 96, 99] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        <path d="M59 109 Q77 99 93 108" stroke="#3B1B1B" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M108 108 Q124 99 143 109" stroke="#3B1B1B" strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="51" cy="120" rx="15" ry="26" fill="#C61C36" stroke="#9F1030" strokeWidth="2" transform="rotate(-25 51 120)" />
        <ellipse cx="151" cy="120" rx="15" ry="26" fill="#C61C36" stroke="#9F1030" strokeWidth="2" transform="rotate(25 151 120)" />
        <motion.g animate={{ rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <path d="M47 131 Q100 119 153 131 L151 169 Q100 157 49 169 Z" fill="#2D86D7" stroke="#075D98" strokeWidth="4" />
          <path d="M100 125 V162" stroke="#DFF2FF" strokeWidth="3" />
          <path d="M63 143 Q80 138 92 142 M108 142 Q123 137 139 143" stroke="#DFF2FF" strokeWidth="3" fill="none" strokeLinecap="round" />
        </motion.g>
      </BirdBase>
    </motion.div>
  );
}
