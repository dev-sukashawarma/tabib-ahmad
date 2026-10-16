begin;

update public.produk
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.amplop
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.jual
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.ops
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.beli
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.adj
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

update public.ads
set user_id = '136ca9d4-1919-4a7f-9664-8a0371681d65'
where user_id is null;

alter table public.produk alter column user_id set not null;
alter table public.amplop alter column user_id set not null;
alter table public.jual alter column user_id set not null;
alter table public.ops alter column user_id set not null;
alter table public.beli alter column user_id set not null;
alter table public.adj alter column user_id set not null;
alter table public.ads alter column user_id set not null;

commit;
