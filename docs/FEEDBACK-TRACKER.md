# Feedback Tracker

Every bug and improvement Tom sends, logged as its own entry in his own words. Nothing here is
paraphrased or trimmed when it's added — the point of this file is that no detail from a report
gets lost between "Tom said it" and "it's fixed," however small the item looks at a glance.

## How this works

1. When Tom sends a new list (or a message that bundles several issues together), each distinct
   item is broken out and logged below as its own numbered entry under a new dated batch. The
   "Reported" block is a **verbatim quote** of what he wrote for that specific item — not a
   summary — even when it was one sentence inside a longer combined message.
2. New entries start **Open**. They're worked top to bottom within a batch; an item that can't be
   finished (needs a decision, a screenshot, more information) is marked **Blocked** with why, and
   work moves on to the next one rather than stalling the batch.
3. An entry moves to **Fixed** once it's implemented and verified (tested, or checked live in the
   browser where that applies), then **Deployed** once that fix has actually shipped to Netlify —
   with a one-line note on what changed and the commit it landed in.
4. Nothing is deleted. A fixed batch stays in the file as the record of what was reported and how
   it was resolved; new batches are added below the older ones.

## Status key

| | |
|---|---|
| 🔲 Open | Logged, not started yet |
| 🔧 In progress | Being worked on right now |
| ✅ Fixed | Implemented and verified, not yet deployed |
| 🚀 Deployed | Live on stirheim.com |
| ⛔ Blocked | Needs something from Tom before it can move — noted inline |

---

<!-- New batches go below this line, most recent last. Copy the entry template for each item. -->

<!--
### N. Short title

**Status:** 🔲 Open
**Reported:** YYYY-MM-DD

> Verbatim text of what Tom said about this item.

**Notes:** (investigation, fix approach, commit link — filled in as work happens)
-->
