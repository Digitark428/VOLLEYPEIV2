-- Historical objects remain intact but are no longer anonymously downloadable.
update storage.buckets set public = false where id in ('posters', 'sponsors');

drop policy if exists posters_select_public on storage.objects;
drop policy if exists sponsors_select_public on storage.objects;

create policy legacy_media_member_read on storage.objects for select
  to authenticated
  using (bucket_id in ('posters', 'sponsors'));
