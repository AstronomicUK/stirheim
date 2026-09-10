-- A discovery pays for one contract, even if two recruitment requests race.
-- Only the principal hire carries this flag; mandatory companions share that contract.
create unique index heroes_returning_favour_once
on public.heroes ((flags ->> 'returningFavourReportId'))
where flags ? 'returningFavourReportId';
