/**
 * Pictures for "Tìm mối nguy" (viewBox 0 0 800 450). Hazard coordinates in the
 * level spec refer to this coordinate system. Replace with AI/hand-drawn art
 * later — keep the viewBox so hotspot coordinates stay valid.
 */
export const HAZARD_SCENES: Record<string, string> = {
  workplace: `
  <svg viewBox="0 0 800 450" class="hazard__svg" role="img" aria-label="Văn phòng làm việc">
    <defs>
      <linearGradient id="hz-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f4ff"/><stop offset="1" stop-color="#cfe4fb"/></linearGradient>
      <linearGradient id="hz-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b88f"/><stop offset="1" stop-color="#b98f63"/></linearGradient>
    </defs>
    <rect width="800" height="335" fill="url(#hz-wall)"/>
    <rect y="335" width="800" height="115" fill="url(#hz-floor)"/>
    <path d="M0 335 H800" stroke="#8a6a45" stroke-width="4"/>
    <g stroke="#a88760" stroke-width="2" opacity=".5"><path d="M0 370 H800 M0 410 H800 M120 335 L90 450 M300 335 L290 450 M480 335 L490 450 M660 335 L690 450"/></g>

    <!-- window + clock + plant (safe) -->
    <rect x="230" y="40" width="170" height="110" rx="6" fill="#bfe6ff" stroke="#0e3a8c" stroke-width="5"/>
    <path d="M315 40 V150 M230 95 H400" stroke="#0e3a8c" stroke-width="4"/>
    <circle cx="500" cy="80" r="30" fill="#fff" stroke="#0e3a8c" stroke-width="5"/>
    <path d="M500 80 V60 M500 80 L514 88" stroke="#0e3a8c" stroke-width="4" stroke-linecap="round"/>
    <rect x="605" y="290" width="34" height="45" rx="4" fill="#c9773a" stroke="#6b3a12" stroke-width="3"/>
    <g fill="#3fa336" stroke="#1f5f1a" stroke-width="3"><circle cx="612" cy="275" r="16"/><circle cx="632" cy="272" r="16"/><circle cx="622" cy="255" r="16"/></g>

    <!-- shelf with heavy boxes on top (hazard: shelf) -->
    <rect x="30" y="150" width="140" height="185" fill="#8a5a33" stroke="#4d2f17" stroke-width="4"/>
    <path d="M30 210 H170 M30 270 H170" stroke="#4d2f17" stroke-width="4"/>
    <rect x="42" y="228" width="40" height="40" fill="#e9c98f" stroke="#8a6a3a" stroke-width="3"/>
    <rect x="100" y="288" width="50" height="45" fill="#e9c98f" stroke="#8a6a3a" stroke-width="3"/>
    <g transform="rotate(-8 95 120)">
      <rect x="45" y="95" width="70" height="55" fill="#d8a860" stroke="#6b4a1a" stroke-width="4"/>
      <rect x="85" y="60" width="60" height="40" fill="#d8a860" stroke="#6b4a1a" stroke-width="4"/>
      <text x="80" y="128" font-size="16" font-weight="800" fill="#6b4a1a" font-family="Be Vietnam Pro, sans-serif">25kg</text>
    </g>

    <!-- desk, monitor, chair -->
    <rect x="220" y="225" width="250" height="16" rx="4" fill="#5d7299" stroke="#2a3a5c" stroke-width="3"/>
    <rect x="232" y="241" width="12" height="94" fill="#5d7299"/><rect x="446" y="241" width="12" height="94" fill="#5d7299"/>
    <rect x="290" y="160" width="100" height="62" rx="6" fill="#1c3570" stroke="#0a1a44" stroke-width="4"/>
    <rect x="298" y="168" width="84" height="46" rx="3" fill="#4ea3ff"/>
    <rect x="332" y="222" width="16" height="6" fill="#0a1a44"/>
    <rect x="360" y="255" width="70" height="60" rx="10" fill="#2f7cf6" stroke="#0e3a8c" stroke-width="4"/>
    <path d="M395 315 V335 M375 335 H415" stroke="#0e3a8c" stroke-width="5"/>

    <!-- overloaded power strip (hazard: strip) -->
    <rect x="130" y="388" width="84" height="22" rx="6" fill="#f4f4f4" stroke="#555" stroke-width="3"/>
    <g fill="#333"><rect x="138" y="376" width="12" height="16" rx="2"/><rect x="156" y="372" width="12" height="20" rx="2"/><rect x="174" y="376" width="12" height="16" rx="2"/><rect x="192" y="370" width="12" height="22" rx="2"/></g>
    <path d="M144 376 C140 350 150 340 130 320 M162 372 C170 350 160 340 175 320 M180 376 C190 356 200 350 215 330 M198 370 C210 350 230 350 240 335" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M204 360 l10 -10 l-4 10 l10 -6 l-10 14" stroke="#ff8a1f" stroke-width="3" fill="#ffd23f"/>

    <!-- cable across walkway (hazard: cable) -->
    <path d="M250 335 C270 380 310 420 350 400 C390 380 410 430 450 420 C480 412 500 390 520 380" stroke="#111" stroke-width="6" fill="none" stroke-linecap="round"/>

    <!-- water cooler + puddle without sign (hazard: puddle) -->
    <rect x="535" y="215" width="50" height="120" rx="6" fill="#ffffff" stroke="#5d7299" stroke-width="4"/>
    <path d="M540 215 C540 175 580 175 580 215 Z" fill="#9fdcff" stroke="#5d7299" stroke-width="4"/>
    <circle cx="560" cy="345" r="3" fill="#4ea3ff"/><circle cx="566" cy="358" r="3" fill="#4ea3ff"/>
    <ellipse cx="560" cy="412" rx="58" ry="16" fill="#8fd0ff" opacity=".85"/>
    <ellipse cx="545" cy="408" rx="18" ry="4" fill="#fff" opacity=".7"/>

    <!-- emergency exit blocked by boxes (hazard: exit) -->
    <rect x="665" y="130" width="100" height="205" rx="4" fill="#9fd3a8" stroke="#1c7a3a" stroke-width="5"/>
    <rect x="672" y="98" width="86" height="26" rx="4" fill="#1fa64a" stroke="#0f5a26" stroke-width="3"/>
    <text x="715" y="117" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="Be Vietnam Pro, sans-serif">LỐI THOÁT</text>
    <rect x="660" y="255" width="70" height="80" fill="#d8a860" stroke="#6b4a1a" stroke-width="4"/>
    <rect x="700" y="205" width="66" height="54" fill="#e9c98f" stroke="#6b4a1a" stroke-width="4"/>
    <rect x="725" y="280" width="55" height="55" fill="#d8a860" stroke="#6b4a1a" stroke-width="4"/>
  </svg>`,
};
