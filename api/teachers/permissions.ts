
import { getSupabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teacher_id, permissions } = req.body;

  if (!teacher_id || !permissions) {
    return res.status(400).json({ error: 'Teacher ID and permissions are required' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('teacher_permissions')
      .upsert({
        teacher_id,
        ...permissions
      });

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update permissions error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
