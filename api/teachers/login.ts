
import { getSupabaseAdmin } from '../../lib/supabase-admin';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile and password are required' });
  }

  try {
    const supabase = getSupabaseAdmin();
    // Hash the password (using a simple SHA256 for now, or match whatever is used in create)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const { data: teacher, error } = await supabase
      .rpc('check_teacher_login', { 
        p_mobile: mobile, 
        p_password_hash: passwordHash 
      });

    if (error) throw error;

    if (!teacher || teacher.length === 0) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }

    const teacherData = teacher[0];

    // Update last login
    await supabase
      .from('teachers')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', teacherData.id);

    res.status(200).json({ 
      user: {
        id: teacherData.id,
        role: 'teacher',
        name: teacherData.teacher_name,
        institute_id: teacherData.institution_id,
        designation: teacherData.designation,
        photo_url: teacherData.photo_url,
        permissions: teacherData.permissions
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
