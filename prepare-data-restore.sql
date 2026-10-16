begin;

truncate table
  public.adj,
  public.ads,
  public.amplop,
  public.beli,
  public.jual,
  public.ops,
  public.produk;

alter table public.produk alter column user_id drop not null;
alter table public.amplop alter column user_id drop not null;
alter table public.jual alter column user_id drop not null;
alter table public.ops alter column user_id drop not null;
alter table public.beli alter column user_id drop not null;
alter table public.adj alter column user_id drop not null;
alter table public.ads alter column user_id drop not null;

commit;
