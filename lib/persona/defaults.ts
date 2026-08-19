export type PersonaType = "agent" | "host";

interface PersonaDefaults {
  defaultAspectRatio: "16:9" | "9:16";
  secondsPerPhoto: number;
  defaultTemplateStyle: string;
  copy: {
    ctaLabel: string;
    priceLabel: string;
    projectNounSingular: string;
  };
}

// Config only — consumed by the create-project form (UI default, overridable)
// and by lib/render/buildTimeline.ts (clip duration). The render pipeline
// itself stays persona-agnostic; it only ever receives numeric params.
export const PERSONA_DEFAULTS: Record<PersonaType, PersonaDefaults> = {
  agent: {
    defaultAspectRatio: "16:9",
    secondsPerPhoto: 3.5,
    defaultTemplateStyle: "classic-walkthrough",
    copy: {
      ctaLabel: "Generate Listing Video",
      priceLabel: "Price",
      projectNounSingular: "listing",
    },
  },
  host: {
    defaultAspectRatio: "9:16",
    secondsPerPhoto: 2.0,
    defaultTemplateStyle: "punchy-highlights",
    copy: {
      ctaLabel: "Generate Amenity Reel",
      priceLabel: "Nightly Rate",
      projectNounSingular: "property",
    },
  },
};
