
import { getSupabaseAdmin } from '../../lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { institute_id } = req.query;

  if (!institute_id) {
    return res.status(400).json({ error: 'Institute ID is required' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select('*, teacher_permissions(*)')
      .eq('institution_id', institute_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten permissions
    const formattedTeachers = (teachers || []).map(t => ({
      ...t,
      permissions: t.teacher_permissions?.[0] || null
    }));

    res.status(200).json({ teachers: formattedTeachers });
  } catch (err) {
    console.error('List teachers error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
