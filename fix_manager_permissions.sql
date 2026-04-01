
-- Update check_is_super_admin to include 'manager' role
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
  ) OR (auth.jwt()->>'email' IN ('kmibrahim@gmail.com', 'thedevomix@gmail.com', 'infoibrahim40@gmail.com'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
