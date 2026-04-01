
-- ===============================================================
-- FINAL TEACHER LOGIN AND SCHEMA FIX
-- ===============================================================

-- 1. Ensure columns exist and have correct names
DO $$ 
BEGIN
    -- Rename columns if they exist with old names
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'name') THEN
        ALTER TABLE public.teachers RENAME COLUMN name TO teacher_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'phone') THEN
        ALTER TABLE public.teachers RENAME COLUMN phone TO mobile;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'login_code') THEN
        ALTER TABLE public.teachers RENAME COLUMN login_code TO password_hash;
    END IF;

    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'designation') THEN
        ALTER TABLE public.teachers ADD COLUMN designation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'photo_url') THEN
        ALTER TABLE public.teachers ADD COLUMN photo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'status') THEN
        ALTER TABLE public.teachers ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.teachers ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Create teacher_permissions table if not exists
CREATE TABLE IF NOT EXISTS public.teacher_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    can_view_attendance BOOLEAN DEFAULT FALSE,
    can_take_attendance BOOLEAN DEFAULT FALSE,
    can_view_results BOOLEAN DEFAULT FALSE,
    can_manage_results BOOLEAN DEFAULT FALSE,
    can_view_fees BOOLEAN DEFAULT FALSE,
    can_manage_fees BOOLEAN DEFAULT FALSE,
    can_send_sms BOOLEAN DEFAULT FALSE,
    can_view_students BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id)
);

-- 3. Ensure all teachers have a permissions entry
INSERT INTO public.teacher_permissions (teacher_id)
SELECT id FROM public.teachers
ON CONFLICT (teacher_id) DO NOTHING;

-- 4. Drop old function versions to avoid conflicts (with different signatures)
DROP FUNCTION IF EXISTS public.check_teacher_login(text, text);

-- 5. Create the correct login function matching the API call
CREATE OR REPLACE FUNCTION public.check_teacher_login(p_mobile TEXT, p_password_hash TEXT)
RETURNS TABLE (
    id UUID,
    institution_id UUID,
    teacher_name TEXT,
    designation TEXT,
    photo_url TEXT,
    status TEXT,
    permissions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.institution_id,
        t.teacher_name,
        t.designation,
        t.photo_url,
        t.status,
        to_jsonb(tp) - 'id' - 'teacher_id' - 'created_at' as permissions
    FROM public.teachers t
    LEFT JOIN public.teacher_permissions tp ON t.id = tp.teacher_id
    WHERE t.mobile = p_mobile 
      AND t.password_hash = p_password_hash 
      AND t.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_teacher_login(text, text) TO anon, authenticated, service_role;

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
