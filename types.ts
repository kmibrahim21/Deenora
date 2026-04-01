
export interface Madrasah {
  id: string;
  name: string;
  phone?: string;
  madrasah_code?: string;
  avatar_url?: string;
  created_at: string;
}

export interface ClassRoom {
  id: string;
  class_name: string;
  madrasah_id: string;
}

export interface Student {
  id: string;
  student_name: string;
  guardian_phone: string;
  roll_number: number;
  class_id: string;
  madrasah_id: string;
  class_name?: string;
}

export interface RecentCall {
  id: string;
  student_id: string | null;
  student_name: string;
  guardian_phone: string;
  called_at: string;
}

export interface AuthState {
  user: any;
  loading: boolean;
  madrasah: Madrasah | null;
}
