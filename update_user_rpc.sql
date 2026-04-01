-- RPC to update a user's password and metadata from auth.users
DROP FUNCTION IF EXISTS public.update_user_by_admin(UUID, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.update_user_by_admin(
  p_user_id UUID,
  p_password TEXT DEFAULT NULL,
  p_user_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_encrypted_pw TEXT;
BEGIN
  -- 1. Check if caller is super_admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can update users directly.';
  END IF;

  -- 2. Update password if provided
  IF p_password IS NOT NULL AND p_password <> '' THEN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    UPDATE auth.users 
    SET encrypted_password = v_encrypted_pw,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  -- 3. Update metadata if provided
  IF p_user_data IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = p_user_data,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user: %', SQLERRM;
    RETURN FALSE;
END;
$$;
