
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, ChevronRight, Loader2, AlertCircle, Sparkles, LayoutGrid, FileUp } from 'lucide-react';
import { ClassRoom } from '../types';

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setClasses(data || []);
    } catch (err: any) {
      console.error(err);
      setError("তথ্য লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const addClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = newClassName.trim();
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insError } = await supabase.from('classes').insert({
        class_name: name,
        madrasah_id: user?.id
      });
      if (insError) throw insError;
      setNewClassName('');
      setIsAdding(false);
      fetchClasses();
    } catch (err: any) {
      setError("ক্লাস যোগ করা যায়নি।");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="animate-spin text-green-600" size={40} />
      <p className="text-slate-400 font-bold">ক্লাস লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-xl">
             <LayoutGrid size={24} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">শ্রেণি তালিকা</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/import')} 
            className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-emerald-100"
            title="ডাটা ইমপোর্ট করুন"
          >
            <FileUp size={20} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="bg-green-600 text-white p-4 rounded-2xl flex items-center gap-2 font-black shadow-lg shadow-green-100 active:scale-90 transition-all"
          >
            <Plus size={20} /> নতুন ক্লাস
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={addClass} className="bg-white p-8 rounded-[2.5rem] border border-green-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)] space-y-5 animate-slide-up">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">শ্রেণির নাম লিখুন</label>
            <input 
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 font-bold text-slate-700" 
              placeholder="যেমন: ১ম শ্রেণি বা তাইসীর" 
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-3xl font-black shadow-lg shadow-green-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Sparkles size={20} />
            যুক্ত করুন
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-3xl border border-red-100 flex items-start gap-3">
          <AlertCircle className="shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="grid gap-5">
        {classes.length > 0 ? (
          classes.map(cls => (
            <div 
              key={cls.id} 
              onClick={() => navigate(`/classes/${cls.id}`)} 
              className="bg-white p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group hover:border-green-100"
            >
              <div className="flex items-center gap-5">
                <div className="bg-slate-50 w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-slate-300 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                  <BookOpen size={30} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl group-hover:text-green-700 transition-colors">{cls.class_name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ভিউ ডিটেইলস</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-300 group-hover:bg-green-600 group-hover:text-white transition-all">
                <ChevronRight size={24} />
              </div>
            </div>
          ))
        ) : !isAdding && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center">
            <BookOpen size={64} className="mb-4 opacity-5" />
            <p className="font-bold text-slate-300 text-lg">কোনো ক্লাস নেই!</p>
            <p className="text-xs text-slate-400 mt-2 italic">শুরু করতে "নতুন ক্লাস" বাটনে ক্লিক করুন</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;
