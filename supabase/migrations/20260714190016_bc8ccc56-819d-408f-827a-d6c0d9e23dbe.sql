
DO $$
DECLARE
  new_id uuid;
  old_id uuid;
BEGIN
  SELECT id INTO new_id FROM auth.users WHERE lower(email) = 'superdavihero@gmail.com' LIMIT 1;
  SELECT id INTO old_id FROM auth.users WHERE lower(email) = 'davi0011@admin.local' LIMIT 1;

  IF new_id IS NULL THEN
    RAISE EXCEPTION 'superdavihero@gmail.com not found';
  END IF;

  -- Grant admin to the real account
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF old_id IS NOT NULL THEN
    -- Move player save from old account if the new one has none
    IF NOT EXISTS (SELECT 1 FROM public.player_saves WHERE user_id = new_id) THEN
      UPDATE public.player_saves SET user_id = new_id WHERE user_id = old_id;
    ELSE
      DELETE FROM public.player_saves WHERE user_id = old_id;
    END IF;

    -- Remove old admin role and old account
    DELETE FROM public.user_roles WHERE user_id = old_id;
    DELETE FROM auth.users WHERE id = old_id;
  END IF;
END $$;
