// Campaign-rules datasets extracted in Phase 1 from reference/rules (mordheimer.net scrape).
// Each module cites its source line range in a *_SOURCE constant. See docs/PLANNING.md
// "Known gaps in the scraped rules" for what is encoded from the rulebook rather than the scrape.

export * from "./injuries";
export * from "./experience";
export * from "./income";
export * from "./trading";
export * from "./exploration";
export * from "./magic";
export * from "./hiredSwords";
export * from "./dramatisPersonae";
export * from "./scenarios";
export * from "./warbandSkills";

// Deliberately NOT re-exported: ./scenarioDetails (~1.3 MB of scenario rules text). Import it
// lazily where the Scenario Library needs it:
//   const { SCENARIO_DETAILS } = await import("./scenarioDetails");
