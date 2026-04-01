
-- 1. Reload Schema Cache (Most important for "Database error querying schema")
NOTIFY pgrst, 'reload config';

-- 2. Ensure get_my_institution_id is robust and stable
CREATE OR REPLACE FUNCTION public.get_my_institution_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT institution_id FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Ensure check_is_super_admin is robust
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'manager')
  ) OR (auth.jwt()->>'email' IN ('kmibrahim@gmail.com', 'thedevomix@gmail.com', 'infoibrahim40@gmail.com'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Refine check_teacher_login for better introspection
DROP FUNCTION IF EXISTS public.check_teacher_login(text, text);
CREATE OR REPLACE FUNCTION public.check_teacher_login(p_phone text, p_pin text)
RETURNS TABLE (
  teacher_id uuid,
  institution_id uuid,
  teacher_name text,
  teacher_phone text,
  is_active boolean,
  permissions jsonb,
  created_at timestamptz,
  institution_details jsonb,
  supabase_email text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
#variable_conflict use_column
DECLARE
  v_teacher_id uuid;
  v_inst_id uuid;
  v_name text;
  v_email text;
  v_user_id uuid;
  v_instance_id uuid;
  v_perms jsonb;
  v_created_at timestamptz;
BEGIN
  -- Get instance_id for auth.users
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- 1. Verify teacher credentials
  SELECT t.id, t.institution_id, t.name, t.permissions, t.created_at
  INTO v_teacher_id, v_inst_id, v_name, v_perms, v_created_at
  FROM public.teachers t
  WHERE t.phone = p_phone AND t.login_code = p_pin AND t.is_active = true;

  IF v_teacher_id IS NULL THEN
    RETURN;
  END IF;

  v_email := p_phone || '@teacher.deenora.com';

  -- 2. Check if Supabase user exists
  SELECT u.id INTO v_user_id FROM auth.users u WHERE u.email = v_email;

  -- 3. If not, create user
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      v_user_id, 'authenticated', 'authenticated', v_email, crypt(p_pin, gen_salt('bf')), now(), now(), now(), v_instance_id,
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb, 'email', v_user_id::text, now(), now(), now()
    );
  ELSE
    -- Sync password
    UPDATE auth.users SET encrypted_password = crypt(p_pin, gen_salt('bf')), updated_at = now() WHERE id = v_user_id;
  END IF;

  -- 4. Ensure profile exists
  INSERT INTO public.profiles (id, institution_id, full_name, role, is_active, permissions)
  VALUES (v_user_id, v_inst_id, v_name, 'teacher', true, v_perms)
  ON CONFLICT (id) DO UPDATE 
  SET institution_id = v_inst_id, full_name = v_name, role = 'teacher', permissions = EXCLUDED.permissions;

  -- 5. Return data
  RETURN QUERY
  SELECT 
    v_user_id,
    v_inst_id,
    v_name,
    p_phone,
    true,
    v_perms,
    v_created_at,
    to_jsonb(i.*),
    v_email
  FROM public.institutions i
  WHERE i.id = v_inst_id;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.check_teacher_login(text, text) TO anon, authenticated;

-- Final Cache Reload
NOTIFY pgrst, 'reload config';
