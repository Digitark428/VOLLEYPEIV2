-- Cover nullable foreign keys used by cascades, moderation and administrative
-- views. Partial indexes keep the new empty community database lightweight.

create index if not exists association_members_invited_by_idx
  on public.association_members (invited_by)
  where invited_by is not null;

create index if not exists associations_approved_by_idx
  on public.associations (approved_by)
  where approved_by is not null;

create index if not exists associations_created_by_idx
  on public.associations (created_by);

create index if not exists content_reports_reviewed_by_idx
  on public.content_reports (reviewed_by)
  where reviewed_by is not null;

create index if not exists platform_admins_created_by_idx
  on public.platform_admins (created_by)
  where created_by is not null;

create index if not exists post_comments_parent_id_idx
  on public.post_comments (parent_id)
  where parent_id is not null;

create index if not exists tournament_comments_parent_id_idx
  on public.tournament_comments (parent_id)
  where parent_id is not null;

create index if not exists tournament_results_created_by_idx
  on public.tournament_results (created_by)
  where created_by is not null;

create index if not exists tournament_results_registration_id_idx
  on public.tournament_results (registration_id)
  where registration_id is not null;
