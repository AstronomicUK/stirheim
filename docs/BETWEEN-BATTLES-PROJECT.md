# Between Battles — approved 20-item project

Tom approved this project on 10 September 2026. Develop and test locally, with local commit checkpoints. No intermediate pushes or production deployments. At the end, one push and one production release; check whether GitHub already triggers deployment to avoid a duplicate manual deployment. This supersedes the earlier per-fix deployment agreement.

## Scope

- Hired characters: #61, #74, #119, #184.
- Recruitment/upkeep: #123, #219, #220.
- Scenario/treasure rewards: #72, #187, #188, #190.
- Exploration abilities: #66, #104, #105, #106, #107, #108, #109, #110.
- Advancement completion: #87.

Keep existing approved player overrides. #72 removes arbitrary treasure from the normal reward flow, not the separately identified, reason-recorded override. #219 keeps the inline reminder, warns before battle, and dismisses unpaid characters only when starting, not when scheduling/joining. Preserve shared hero searches when moving Personae into Recruit.

## Delivery and evidence

Implement cohesive local milestones, documenting source rules and meaningful tests. Keep tracker entries open until their complete scope is verified. Review mobile layouts and the full saved post-battle/recruitment/start-battle journey with disposable local data. Do not alter existing live player histories or the CoC–Dwarves battle for testing.

## Progress

- Baseline: production commit 2f7c750, verification commit 20037d4; 1,365 unit tests pass. Existing uncommitted audit documents predate this project and must be preserved.
- Initial milestone: close the unrolled-advancement loophole (#87), then connect recruitment/search and pre-battle upkeep (#220/#219).

### Local milestone 1 (not deployed)

#87 now rejects untouched advances and legacy whole-advance deferrals; rolled skill choices remain deferrable. #220 moves Personae to Recruit while retaining the persisted trading-phase search ledger and leaving unrelated between-battle actions in Trading Post. Full suite: 1,366 passing, 78 local integration tests skipped. Typechecked build passes with existing CSS/bundle warnings. Browser and database integration verification remain required before marking these entries complete.
