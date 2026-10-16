begin;

insert into public.accounts (
  id,
  email,
  password_hash,
  display_name,
  is_active,
  is_admin,
  created_at
) values (
  '136ca9d4-1919-4a7f-9664-8a0371681d65',
  'admin@faedahsehat.com',
  'pending-backend-password-setup',
  'Admin',
  true,
  true,
  '2026-06-25 04:03:37.941241+00'
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  is_admin = excluded.is_admin;

commit;
