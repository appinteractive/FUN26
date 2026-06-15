export interface EventConfig {
  /** Human event name, e.g. used as the header tagline and in titles. */
  name: string
  /** Short brand/abbreviation, e.g. header logo + PWA short_name + title suffix. */
  shortName: string
  /** Primary brand color as a hex string; drives <meta theme-color> + manifest. */
  themeColor: string
  /** IANA timezone all session times render in. */
  timeZone: string
  /** Whether this is a community/unofficial build (renders the "unofficial" badge + copy). */
  unofficial: boolean
  /** Footer attribution. */
  author: { name: string; url: string }
  /** PWA manifest text. */
  manifest: { name: string; description: string }
  /**
   * Per-stage venue location, shown next to the stage name.
   * Key = exact stage name used in session frontmatter; value = a FREE-FORM
   * label the deployer fully controls (a cinema screen, a room, a hall, a
   * floor — whatever this event uses). No venue terminology is baked into the
   * code. Stages with no entry simply render without a venue label.
   */
  venues: Record<string, string>
}

export const event: EventConfig = {
  name: "Freelance Unlocked",
  shortName: "FUN26",
  themeColor: "#E9664C",
  timeZone: "Europe/Berlin",
  unofficial: true,
  author: {
    name: "Grzegorz Leoniec",
    url: "https://www.linkedin.com/in/grzegorz-leoniec",
  },
  manifest: {
    name: "FUN26 Schedule (unofficial)",
    description:
      "Unofficial schedule and personal favorites for the Freelance Unlocked conference, June 12, 2026. Community-built, not affiliated with the organizers.",
  },
  // FUN26 is held in a cinema, so its labels read "Kino N · Level" — but that
  // wording lives only here in the data, not in any code. Another event would
  // write "Room 4", "Main Hall", "Floor 2 · East", etc.
  venues: {
    "exali Main Stage": "Kino 10 · Upper Level",
    "Grow & Sell": "Kino 7 · Upper Level",
    "Beyond the hustle": "Kino 9 · Upper Level",
    "freelancermap Stage": "Kino 4 · Ground Level",
    "Workshop Room": "Kino 2 · Ground Level",
  },
}
