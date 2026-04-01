
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, Plus, X, User, Edit2, ArrowLeft, Loader2, UserPlus, PhoneCall, Hash, Sparkles } from 'lucide-react';
import { Student } from '../types';

const Students: React.FC = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState<Student | null>(null);
  const [className, setClassName] = useState('');
  
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', roll: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClassAndStudents();
  }, [classId]);

  const fetchClassAndStudents = async () => {
    if (!classId) return;
    try {
      const [classRes, studentRes] = await Promise.all([
        supabase.from('classes').select('class_name').eq('id', classId).single(),
        supabase.from('students').select('*').eq('class_id', classId).order('roll_number', { ascending: true })
      ]);
      if (classRes.data) setClassName(classRes.data.class_name);
      if (studentRes.data) setStudents(studentRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        student_name: formData.name.trim(),
        guardian_phone: formData.phone.trim(),
        roll_number: parseInt(formData.roll) || 0,
        class_id: classId,
        madrasah_id: userData.user?.id
      };
      let error;
      if (editId) {
        const res = await supabase.from('students').update(payload).eq('id', editId);
        error = res.error;
      } else {
        const res = await supabase.from('students').insert(payload);
        error = res.error;
      }
      if (error) throw error;
      setShowModal(false);
      setEditId(null);
      setFormData({ name: '', phone: '', roll: '' });
      fetchClassAndStudents();
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const makeCall = async (student: Student) => {
    try {
      await supabase.from('recent_calls').insert({
        student_id: student.id,
        student_name: student.student_name,
        guardian_phone: student.guardian_phone,
        madrasah_id: student.madrasah_id
      });
    } catch (e) {}
    window.location.href = `tel:${student.guardian_phone}`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-green-600" size={40} />
      <p className="text-slate-400 font-bold">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/classes')} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-slate-400 active:scale-90 transition-transform">
             <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">{className}</h2>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{students.length} জন ছাত্র</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {students.length > 0 ? (
          students.map((student) => (
            <div 
              key={student.id} 
              onClick={() => setShowDetails(student)}
              className="bg-white p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white flex items-center justify-between active:bg-slate-50 transition-colors cursor-pointer group hover:border-green-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 h-14 w-14 flex items-center justify-center rounded-2xl text-emerald-700 font-black text-sm border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {student.roll_number || '০'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-800 transition-colors">{student.student_name}</h3>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                     <PhoneCall size={10} /> {student.guardian_phone}
                  </p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); makeCall(student); }} 
                className="bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-100 active:scale-90 transition-transform"
              >
                <Phone size={20} fill="currentColor" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center">
            <User size={64} className="mb-4 opacity-5" />
            <p className="font-bold text-slate-300">কোনো ছাত্র নেই</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setEditId(null); setFormData({name:'', phone:'', roll:''}); setShowModal(true); }}
        className="fixed bottom-28 right-6 bg-green-600 text-white w-16 h-16 rounded-3xl shadow-2xl shadow-green-200 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"
      >
        <UserPlus size={28} />
      </button>

      {/* Details Sheet */}
      {showDetails && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-end justify-center p-0 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-10 animate-slide-up relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full"></div>
            
            <div className="flex justify-between items-start mb-10">
              <div className="bg-emerald-50 p-6 rounded-[2rem] text-emerald-700 flex items-center gap-4 border border-emerald-100">
                <div className="bg-emerald-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-black">
                   {showDetails.roll_number}
                </div>
                <span className="text-xl font-black">রোল নম্বর</span>
              </div>
              <button onClick={() => setShowDetails(null)} className="p-3 bg-slate-50 text-slate-400 rounded-full active:bg-slate-100 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-8">
              <div className="group">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 ml-1">ছাত্রের নাম</h4>
                <p className="text-3xl font-black text-slate-800">{showDetails.student_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 ml-1">শ্রেণি</h4>
                    <p className="text-lg font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl inline-block">{className}</p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 ml-1">মোবাইল নম্বর</h4>
                    <p className="text-lg font-black text-emerald-600 font-mono tracking-tight">{showDetails.guardian_phone}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-6">
                <button 
                  onClick={() => makeCall(showDetails)}
                  className="flex items-center justify-center gap-3 bg-green-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-green-100 active:scale-95 transition-all"
                >
                  <PhoneCall size={20} fill="currentColor" />
                  কল দিন
                </button>
                <button 
                  onClick={() => { setEditId(showDetails.id); setFormData({name: showDetails.student_name, phone: showDetails.guardian_phone, roll: showDetails.roll_number.toString()}); setShowDetails(null); setShowModal(true); }}
                  className="flex items-center justify-center gap-3 bg-slate-50 text-slate-600 py-5 rounded-3xl font-black active:scale-95 transition-all border border-slate-100"
                >
                  <Edit2 size={20} />
                  এডিট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-slide-up">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">{editId ? 'তথ্য সংশোধন' : 'নতুন ছাত্র যোগ'}</h3>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">রোল</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="১"
                      className="w-full p-5 pl-12 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-bold"
                      value={formData.roll}
                      onChange={e => setFormData({...formData, roll: e.target.value})}
                    />
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ছাত্রের নাম</label>
                  <input 
                    required
                    type="text" 
                    placeholder="উদাঃ আব্দুল্লাহ"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">অভিভাবকের ফোন নম্বর</label>
                <div className="relative">
                  <input 
                    required
                    type="tel" 
                    placeholder="01XXXXXXXXX"
                    className="w-full p-5 pl-12 bg-slate-50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-mono font-bold text-lg"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-100 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
                {editId ? 'তথ্য আপডেট করুন' : 'ছাত্র সংরক্ষণ করুন'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
