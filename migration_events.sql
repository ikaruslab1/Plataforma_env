-- Create Events Table
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  event_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Fixed Events
insert into events (name, description, event_date)
values 
  ('Conferencia sobre igualdad', 'Una conferencia magistral sobre los avances en igualdad de género.', now() + interval '1 day'),
  ('Taller sobre Género', 'Taller práctico con dinámicas grupales.', now() + interval '2 days')
on conflict do nothing; -- In case we run this multiple times, though names aren't unique constraints usually. We rely on IDs.

-- Create Event Attendance Table
create table if not exists event_attendance (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  is_interested boolean default false,
  has_attended boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, event_id)
);

-- Enable RLS
alter table events enable row level security;
alter table event_attendance enable row level security;

-- Policies for Events (Public Read)
create policy "Allow public read events"
on events for select
to anon
using (true);

-- Policies for Attendance (Public Read/Write for now as we manage access via specific actions/flows)
--Ideally we'd restrict update to owner or admin, but for this simplified app:
create policy "Allow public read attendance"
on event_attendance for select
to anon
using (true);

create policy "Allow public insert attendance"
on event_attendance for insert
to anon
with check (true);

create policy "Allow public update attendance"
on event_attendance for update
to anon
using (true);
