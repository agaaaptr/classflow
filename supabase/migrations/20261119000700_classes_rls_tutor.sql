-- Tutors must only see classes assigned to them, including through the API.
-- Students still see the catalog (they need it to enroll); admins see all.
drop policy if exists classes_select on public.classes;

create policy classes_select on public.classes
  for select to authenticated
  using (
    private.is_admin()
    or tutor_id = auth.uid()
    or private.get_user_role() = 'student'
  );
