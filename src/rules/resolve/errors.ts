// Typed error thrown by every resolver in src/rules/resolve when the input breaks a rule or is
// malformed (selling more wyrdstone than you own, buying with too little gold, an unparseable dice
// expression). `code` is a stable dotted identifier the UI can switch on; `message` is for people.

export class RulesError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "RulesError";
    this.code = code;
  }
}

export function isRulesError(err: unknown): err is RulesError {
  return err instanceof RulesError;
}
