-- Stirheim - Campaign Ledger. Phase 9 (1 of 2): a third match origin for imported history.
--
-- Kept in its own file: the Supabase CLI runs each migration as one transaction, and Postgres
-- refuses to use a freshly added enum value inside the transaction that added it. Migration 10
-- (the import function and the widened insert policy) references 'import' as a literal, so it
-- has to run after this commit.

alter type public.match_origin add value if not exists 'import';
