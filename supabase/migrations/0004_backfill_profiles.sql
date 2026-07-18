-- One-time repair: any auth.users row created before the profiles trigger
-- (migration 0001) existed has no matching profiles row, which breaks
-- anything referencing profiles(id) as a foreign key (e.g. bids). Safe to
-- run more than once — only touches users that are still missing a profile.
insert into public.profiles (id, full_name)
select u.id, u.raw_user_meta_data ->> 'full_name'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
