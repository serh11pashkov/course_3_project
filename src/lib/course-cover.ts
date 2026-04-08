import { getCourseColorByHash } from "./course-colors";

export function getCourseCoverUrl(course: {
  id?: string;
  title?: string;
  coverImageUrl?: string;
}) {
  const title = course.title || "";
  const colors = getCourseColorByHash(title);
  const hash = hashString(title);
  const variant = (hash >>> 3) % 3;
  const primaryColor = darkenColor(colors.bg, 14 + (hash % 8));
  const secondaryColor = darkenColor(colors.text, 18 + (hash % 6));

  // Generate pattern type based on title hash
  const patternType = hash % 10;

  let svgContent = "";

  if (patternType === 0) {
    // Triangular pattern
    svgContent = generateTrianglePattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 1) {
    // Circular pattern
    svgContent = generateCirclePattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 2) {
    // Diagonal stripe pattern
    svgContent = generateStripePattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 3) {
    // Dot pattern
    svgContent = generateDotPattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 4) {
    // Ring pattern
    svgContent = generateRingPattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 5) {
    // Interlocking blob pattern
    svgContent = generateBlobPattern(primaryColor, secondaryColor, variant);
  } else if (patternType === 6) {
    // Offset triangle pattern
    svgContent = generateTrianglePattern(
      primaryColor,
      secondaryColor,
      variant + 1,
    );
  } else if (patternType === 7) {
    // Offset ring pattern
    svgContent = generateRingPattern(primaryColor, secondaryColor, variant + 1);
  } else if (patternType === 8) {
    // Staggered dot pattern
    svgContent = generateDotPattern(primaryColor, secondaryColor, variant + 1);
  } else {
    // Soft arc pattern
    svgContent = generateArcPattern(primaryColor, secondaryColor, variant);
  }

  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateTrianglePattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const skew = variant * 20;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, 10)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    <polygon points='${0 + skew},0 ${200 + skew},0 ${100 + skew},200' fill='${adjustColor(primary, -22)}' opacity='0.26'/>
    <polygon points='${200 + skew},0 ${400 + skew},0 ${300 + skew},200' fill='${adjustColor(primary, 18)}' opacity='0.16'/>
    <polygon points='${400 + skew},0 ${600 + skew},0 ${500 + skew},200' fill='${adjustColor(primary, -18)}' opacity='0.24'/>
    <polygon points='${600 + skew},0 ${800 + skew},0 ${700 + skew},200' fill='${adjustColor(primary, 14)}' opacity='0.18'/>
    <polygon points='${800 + skew},0 ${1000 + skew},0 ${900 + skew},200' fill='${adjustColor(primary, -20)}' opacity='0.24'/>
    <polygon points='${1000 + skew},0 ${1200 + skew},0 ${1100 + skew},200' fill='${adjustColor(primary, 12)}' opacity='0.16'/>
    <polygon points='${0 + skew},150 ${200 + skew},150 ${100 + skew},320' fill='${adjustColor(primary, -18)}' opacity='0.22'/>
    <polygon points='${200 + skew},150 ${400 + skew},150 ${300 + skew},320' fill='${adjustColor(primary, 14)}' opacity='0.18'/>
    <polygon points='${400 + skew},150 ${600 + skew},150 ${500 + skew},320' fill='${adjustColor(primary, -16)}' opacity='0.22'/>
    <polygon points='${600 + skew},150 ${800 + skew},150 ${700 + skew},320' fill='${adjustColor(primary, 12)}' opacity='0.18'/>
    <polygon points='${800 + skew},150 ${1000 + skew},150 ${900 + skew},320' fill='${adjustColor(primary, -18)}' opacity='0.22'/>
    <polygon points='${1000 + skew},150 ${1200 + skew},150 ${1100 + skew},320' fill='${adjustColor(primary, 10)}' opacity='0.16'/>
  </svg>`;
}

function generateCirclePattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const shift = variant * 30;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <radialGradient id='grad' cx='50%' cy='50%' r='50%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -28)};stop-opacity:1' />
      </radialGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    <circle cx='${150 + shift}' cy='80' r='62' fill='${adjustColor(primary, 14)}' opacity='0.26'/>
    <circle cx='${150 + shift}' cy='240' r='52' fill='${adjustColor(primary, -14)}' opacity='0.24'/>
    <circle cx='${400 + shift}' cy='60' r='72' fill='${adjustColor(primary, -18)}' opacity='0.22'/>
    <circle cx='${400 + shift}' cy='260' r='57' fill='${adjustColor(primary, 12)}' opacity='0.24'/>
    <circle cx='${650 + shift}' cy='100' r='66' fill='${adjustColor(primary, 16)}' opacity='0.24'/>
    <circle cx='${650 + shift}' cy='250' r='46' fill='${adjustColor(primary, -12)}' opacity='0.22'/>
    <circle cx='${900 + shift}' cy='80' r='60' fill='${adjustColor(primary, -16)}' opacity='0.24'/>
    <circle cx='${900 + shift}' cy='240' r='62' fill='${adjustColor(primary, 14)}' opacity='0.24'/>
    <circle cx='${1100 + shift}' cy='150' r='68' fill='${adjustColor(primary, 12)}' opacity='0.22'/>
  </svg>`;
}

function generateStripePattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const reverse = variant % 2 === 1;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -28)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    ${
      reverse
        ? `<polygon points='0,20 150,0 390,320 230,320' fill='${adjustColor(primary, -14)}' opacity='0.22'/>
         <polygon points='170,0 330,0 570,320 420,320' fill='${adjustColor(primary, 8)}' opacity='0.16'/>
         <polygon points='360,0 520,0 760,320 600,320' fill='${adjustColor(primary, -10)}' opacity='0.20'/>
         <polygon points='550,0 710,0 950,320 790,320' fill='${adjustColor(primary, 10)}' opacity='0.16'/>
         <polygon points='740,0 900,0 1140,320 980,320' fill='${adjustColor(primary, -12)}' opacity='0.20'/>
         <polygon points='930,0 1200,0 1200,120 1140,320' fill='${adjustColor(primary, 6)}' opacity='0.16'/>`
        : `<polygon points='0,0 180,0 420,320 240,320' fill='${adjustColor(primary, -14)}' opacity='0.22'/>
         <polygon points='180,0 360,0 600,320 420,320' fill='${adjustColor(primary, 8)}' opacity='0.16'/>
         <polygon points='360,0 540,0 780,320 600,320' fill='${adjustColor(primary, -10)}' opacity='0.20'/>
         <polygon points='540,0 720,0 960,320 780,320' fill='${adjustColor(primary, 10)}' opacity='0.16'/>
         <polygon points='720,0 900,0 1140,320 960,320' fill='${adjustColor(primary, -12)}' opacity='0.20'/>
         <polygon points='900,0 1200,0 1200,140 1140,320' fill='${adjustColor(primary, 6)}' opacity='0.16'/>`
    }
  </svg>`;
}

function generateDotPattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const dotShift = variant * 18;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -26)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    ${Array.from({ length: 28 })
      .map((_, index) => {
        const x = 60 + (((index % 7) * 165 + dotShift) % 160);
        const y = 48 + Math.floor(index / 7) * 86 + (variant % 2) * 8;
        const radius = 14 + ((index + variant) % 4) * 5;
        const fill =
          index % 2 === 0
            ? adjustColor(primary, 10)
            : adjustColor(primary, -12);
        return `<circle cx='${x + (index % 3) * 22}' cy='${y}' r='${radius}' fill='${fill}' opacity='0.2'/>`;
      })
      .join("")}
  </svg>`;
}

function generateRingPattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const shift = variant * 24;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -30)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    <circle cx='${170 + shift}' cy='110' r='70' fill='none' stroke='${adjustColor(primary, 12)}' stroke-width='18' opacity='0.22'/>
    <circle cx='${390 + shift}' cy='200' r='90' fill='none' stroke='${adjustColor(primary, -10)}' stroke-width='20' opacity='0.2'/>
    <circle cx='${640 + shift}' cy='120' r='78' fill='none' stroke='${adjustColor(primary, 8)}' stroke-width='16' opacity='0.2'/>
    <circle cx='${880 + shift}' cy='210' r='88' fill='none' stroke='${adjustColor(primary, -12)}' stroke-width='22' opacity='0.18'/>
    <circle cx='${1080 + shift}' cy='100' r='66' fill='none' stroke='${adjustColor(primary, 10)}' stroke-width='14' opacity='0.2'/>
  </svg>`;
}

function generateArcPattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const upper = variant * 12;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -28)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    <path d='M 0 ${90 + upper} C 130 ${10 + upper}, 280 ${10 + upper}, 420 ${90 + upper} S 700 ${170 + upper}, 840 ${90 + upper} S 1090 ${10 + upper}, 1200 ${80 + upper}' fill='none' stroke='${adjustColor(primary, 12)}' stroke-width='22' opacity='0.2' stroke-linecap='round'/>
    <path d='M 0 ${180 - upper} C 150 ${100 - upper}, 300 ${100 - upper}, 450 ${180 - upper} S 730 ${260 - upper}, 870 ${180 - upper} S 1080 ${100 - upper}, 1200 ${170 - upper}' fill='none' stroke='${adjustColor(primary, -10)}' stroke-width='18' opacity='0.18' stroke-linecap='round'/>
    <path d='M 40 ${300 - upper} C 180 ${230 - upper}, 340 ${230 - upper}, 480 ${300 - upper} S 760 ${370 - upper}, 940 ${300 - upper} S 1120 ${230 - upper}, 1180 ${285 - upper}' fill='none' stroke='${adjustColor(primary, 8)}' stroke-width='16' opacity='0.16' stroke-linecap='round'/>
  </svg>`;
}

function generateBlobPattern(
  primary: string,
  secondary: string,
  variant = 0,
): string {
  const shift = variant * 14;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='320' viewBox='0 0 1200 320'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' style='stop-color:${primary};stop-opacity:1' />
        <stop offset='100%' style='stop-color:${adjustColor(primary, -30)};stop-opacity:1' />
      </linearGradient>
    </defs>
    <rect fill='url(#grad)' width='1200' height='320'/>
    <ellipse cx='${200 + shift}' cy='100' rx='120' ry='80' fill='${adjustColor(primary, 14)}' opacity='0.24' transform='rotate(-30 200 100)'/>
    <ellipse cx='${500 + shift}' cy='250' rx='140' ry='90' fill='${adjustColor(primary, -14)}' opacity='0.22' transform='rotate(25 500 250)'/>
    <ellipse cx='${800 + shift}' cy='80' rx='110' ry='100' fill='${adjustColor(primary, 12)}' opacity='0.24' transform='rotate(-40 800 80)'/>
    <ellipse cx='${1050 + shift}' cy='220' rx='130' ry='85' fill='${adjustColor(primary, -12)}' opacity='0.22' transform='rotate(35 1050 220)'/>
    <circle cx='${400 + shift}' cy='160' r='40' fill='${adjustColor(primary, 10)}' opacity='0.18'/>
    <circle cx='${900 + shift}' cy='180' r='35' fill='${adjustColor(primary, -10)}' opacity='0.2'/>
  </svg>`;
}

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  return adjustColor(hex, -Math.abs(percent));
}
