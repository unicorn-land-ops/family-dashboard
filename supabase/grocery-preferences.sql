-- Family Dashboard - Grocery normalization migration
-- Run this in Supabase SQL Editor for existing projects.
-- Enforces household defaults (e.g., "milk" always becomes "full fat bio milk").

create or replace function normalize_grocery_name(input_name text)
returns text
language plpgsql
as $$
declare
  trimmed_name text := btrim(coalesce(input_name, ''));
  quantity_prefix text;
  base_name text;
  normalized_base text;
begin
  if trimmed_name = '' then
    return trimmed_name;
  end if;

  if trimmed_name ~ '^[0-9]+([.,][0-9]+)?\s+' then
    quantity_prefix := regexp_replace(
      trimmed_name,
      '^([0-9]+([.,][0-9]+)?)\s+.*$',
      '\1'
    );
    base_name := regexp_replace(trimmed_name, '^[0-9]+([.,][0-9]+)?\s+', '');
  else
    quantity_prefix := null;
    base_name := trimmed_name;
  end if;

  normalized_base := lower(regexp_replace(base_name, '\s+', ' ', 'g'));

  if normalized_base = any (array[
    'milk',
    'whole milk',
    'full fat milk',
    'full-fat milk',
    'bio milk',
    'organic whole milk',
    'vollmilch',
    'bio vollmilch',
    'full fat bio milk'
  ]) then
    base_name := 'full fat bio milk';
  end if;

  if quantity_prefix is not null then
    return quantity_prefix || ' ' || base_name;
  end if;

  return base_name;
end;
$$;

create or replace function groceries_apply_name_preferences()
returns trigger
language plpgsql
as $$
begin
  new.name := normalize_grocery_name(new.name);
  return new;
end;
$$;

drop trigger if exists groceries_normalize_name on groceries;
create trigger groceries_normalize_name
before insert or update of name
on groceries
for each row
execute function groceries_apply_name_preferences();

-- Backfill existing rows
update groceries
set name = normalize_grocery_name(name)
where name is not null;
