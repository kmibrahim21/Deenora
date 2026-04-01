SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers'
) AS table_exists,
EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'check_teacher_login'
) AS function_exists;
