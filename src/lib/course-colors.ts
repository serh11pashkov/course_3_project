// Classroom-style course colors
const COURSE_COLORS = [
  { bg: "#f28482", text: "#e53b34" }, // Red
  { bg: "#f4a261", text: "#e76f51" }, // Orange
  { bg: "#ffd166", text: "#ffb703" }, // Yellow
  { bg: "#81c784", text: "#66bb6a" }, // Green
  { bg: "#4ecdc4", text: "#1d9d93" }, // Teal
  { bg: "#64b5f6", text: "#2196f3" }, // Blue
  { bg: "#81c784", text: "#43a047" }, // Light Green
  { bg: "#ce93d8", text: "#ab47bc" }, // Purple
  { bg: "#ff8a80", text: "#ff6e40" }, // Pink
  { bg: "#ffab91", text: "#ff7043" }, // Deep Orange
];

export function getCourseColorByIndex(index: number): {
  bg: string;
  text: string;
} {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

export function getCourseColorByHash(text: string): {
  bg: string;
  text: string;
} {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}
