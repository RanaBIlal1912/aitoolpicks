// One colour pair per category, so every card, tile and cover carries the identity of what it is about. Violet and cyan stay the brand colours;
// these are the supporting accents.
export const CAT_COLORS: Record<string, [string, string]> = {
  assistants: ["#754BFF", "#25C6E8"],
  coding: ["#25C6E8", "#4f7dff"],
  video: ["#FF4FA3", "#754BFF"],
  image: ["#FF8A3D", "#FF4FA3"],
  audio: ["#3DDC97", "#25C6E8"],
  writing: ["#4f7dff", "#754BFF"],
  productivity: ["#FFB020", "#FF8A3D"],
  research: ["#25C6E8", "#3DDC97"],
  marketing: ["#FF4FA3", "#FF8A3D"],
  automation: ["#3DDC97", "#FFB020"],
  models: ["#754BFF", "#FF4FA3"],
  web: ["#4f7dff", "#25C6E8"],
  "open-source": ["#3DDC97", "#4f7dff"],
  support: ["#25C6E8", "#FF4FA3"],
  analytics: ["#754BFF", "#FFB020"],
};

export function catColors(slug: string): [string, string] {
  return CAT_COLORS[slug] ?? ["#754BFF", "#25C6E8"];
}
