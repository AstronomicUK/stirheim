# Claude Code — join the Stirheim collaboration

Tom has authorised direct collaboration between Claude Code and Codex on the five core-first priority projects. The shared channel is already available in this workspace. A welcome/handoff message (`c659b120`) is queued for the project mailbox `claude-core-rules`.

## Join

Read the applicable parent `CLAUDE.md` first. Respect any session opt-out; do not use a new mailbox to evade it. If this Claude session already has an active registered identity, keep it and tell Codex that identity instead of registering a duplicate. Otherwise use the project mailbox below; this is a message-bus name, not a claim about your platform's internal agent ID.

```sh
cd '/Users/tombrookes/Documents/Claude Scripts'
SESS='/Users/tombrookes/Documents/Claude Scripts/.sessions/bin/sess'
"$SESS" register --me claude-core-rules --role 'Claude Code: core rulebook priorities 1–5; UI and review'
"$SESS" who
"$SESS" inbox --me claude-core-rules
```

Read `stirheim/docs/CORE-RULEBOOK-COLLABORATION-PROJECT.md`, then introduce yourself directly:

```sh
"$SESS" send --me claude-core-rules --to codex-rules-reconciliation \
  --kind tell --subject 'Claude joined: ready to agree Priority 1 scope' \
  --body 'I have read the project brief. I am ready to agree exact UI files and the shared magic interfaces. I will check current Git changes and claims before editing. My first proposed scope is the Priority 1 spell/target UI and tooltips; please confirm the resolver/state interface split.'
```

If using an existing session name, substitute that name for `claude-core-rules` in your registration/sending/claiming commands. The queued invitation can be read with `inbox --me claude-core-rules`; reply from your own identity so Codex knows where to answer. Include any current implementation changes and conflicts in the introduction.

## Work directly with Codex

Codex's mailbox is **`codex-rules-reconciliation`**. Its old broad file reservations have been released. Nobody has yet accepted new implementation ownership; coordinate before editing shared files.

```sh
# Check at the beginning and end of each bounded task, and before changing shared interfaces.
"$SESS" inbox --me claude-core-rules

# Example only: claim the exact agreed file before editing it.
"$SESS" claim --me claude-core-rules --path 'stirheim/src/features/match/battle/CastTab.tsx'

# Send actual results, including file names, commit, validation and the next owner.
"$SESS" send --me claude-core-rules --to codex-rules-reconciliation \
  --kind handoff --subject 'Priority 1 UI checkpoint' \
  --body '<Describe the actual changes, agreed interface, tests, commit and outstanding work.>'

# Acknowledge messages once handled; use the real message ID from the inbox.
"$SESS" ack --me claude-core-rules --id <message-id> --note '<What was done>'

# Release an agreed file after completing the handoff.
"$SESS" release --me claude-core-rules --path 'stirheim/src/features/match/battle/CastTab.tsx'
```

Use `--reply-to <message-id>` when replying to a specific message. The bus limits reply depth; start a fresh, clearly summarised handoff when needed rather than forcing long chains.

## Delivery and availability

- This is a durable local inbox, not an instant chat socket. Sending a message does not interrupt a running Claude/Codex turn or prove it was read.
- Codex has a five-minute inbox follow-up scheduled. It will handle new actionable messages and stay quiet when nothing changes.
- Claude must check its own inbox at natural task boundaries. If your platform supplies an actual supported wake/message tool for a known running peer, use it; do not invent a peer tool identity or assume Codex's sub-agent tools can wake an external Claude session.
- While waiting for an interface answer, continue independent reading, reproduction or agreed work. Do not edit a contested file or treat silence as agreement.
- Neither agent should route ordinary coordination through Tom. Ask him only for actual design preferences or unresolved rules decisions.

## Important boundaries

The last batch is already deployed and verified. Do not repeat that deployment. Keep new changes local and batch releases to minimise Netlify credits. Preserve player overrides and unrelated audit work. Do not use live player records for QA. Prioritise core rules over supplements. The complete project scope and acceptance criteria are in the shared project brief.
