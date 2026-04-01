
import { getSupabaseAdmin } from '../../lib/supabase-admin';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, teacher_name, mobile, password, designation, photo_url, status, permissions } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Teacher ID is required' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const updateData: any = {
      teacher_name,
      mobile,
      designation,
      photo_url,
      status
    };

    if (password) {
      updateData.password_hash = crypto.createHash('sha256').update(password).digest('hex');
    }

    const { error: teacherError } = await supabase
      .from('teachers')
      .update(updateData)
      .eq('id', id);

    if (teacherError) throw teacherError;

    if (permissions) {
      const { error: permError } = await supabase
        .from('teacher_permissions')
        .update(permissions)
        .eq('teacher_id', id);

      if (permError) throw permError;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update teacher error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
