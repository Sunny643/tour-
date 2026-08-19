export interface TemplateStyle {
  id: string;
  label: string;
  description: string;
  kenBurnsEffect: string; // Shotstack clip "effect" value
  transition: { in: string; out: string };
}

// 3 initial styles per CLAUDE.md P0 scope ("2-3 initial styles").
export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "classic-walkthrough",
    label: "Classic Walkthrough",
    description: "Slow pans, gentle crossfades — suited to a room-by-room listing tour.",
    kenBurnsEffect: "slowZoomIn",
    transition: { in: "fade", out: "fade" },
  },
  {
    id: "punchy-highlights",
    label: "Punchy Highlights",
    description: "Faster cuts and zooms — built for short amenity-highlight reels.",
    kenBurnsEffect: "zoomIn",
    transition: { in: "slideLeft", out: "slideLeft" },
  },
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    description: "Clean, understated pans with simple fades — works for either persona.",
    kenBurnsEffect: "zoomOut",
    transition: { in: "fade", out: "fade" },
  },
];

export function getTemplateStyle(id: string | null | undefined): TemplateStyle {
  return TEMPLATE_STYLES.find((t) => t.id === id) ?? TEMPLATE_STYLES[0];
}
