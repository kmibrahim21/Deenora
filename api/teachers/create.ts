
import { getSupabaseAdmin } from '../../lib/supabase-admin';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { institute_id, teacher_name, mobile, password, designation, photo_url, permissions } = req.body;

  if (!institute_id || !teacher_name || !mobile || !password) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Start a transaction or just do sequential inserts
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        institution_id: institute_id,
        teacher_name,
        mobile,
        password_hash: passwordHash,
        designation,
        photo_url,
        status: 'active'
      })
      .select()
      .single();

    if (teacherError) throw teacherError;

    // Create permissions
    const { error: permError } = await supabase
      .from('teacher_permissions')
      .insert({
        teacher_id: teacher.id,
        ...permissions
      });

    if (permError) throw permError;

    res.status(201).json({ success: true, teacher });
  } catch (err) {
    console.error('Create teacher error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
