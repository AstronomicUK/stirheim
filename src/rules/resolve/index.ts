// Phase 2 rules resolvers: pure functions over the roster model in src/rules/types/roster.ts.
// Dice are always inputs (the player rolls, or the UI calls dice.rollDice with an rng); nothing
// here mutates its arguments; state-changing functions return Resolution<T> with events.

export * from "./errors";
export * from "./dice";
export * from "./houseRules";
export * from "./income";
export * from "./trading";
export * from "./injuries";
export * from "./advances";
export * from "./exploration";
export * from "./rating";
export * from "./roster";
export * from "./recruitment";
export * from "./builder";
export * from "./equipmentCost";
