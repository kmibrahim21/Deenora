
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Phone, Clock, User, Loader2, XCircle, ChevronRight } from 'lucide-react';
import { RecentCall } from '../types';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  const fetchRecentCalls = async () => {
    const { data } = await supabase
      .from('recent_calls')
      .select('*')
      .order('called_at', { ascending: false })
      .limit(10);
    if (data) setRecentCalls(data);
  };

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const isNumeric = !isNaN(Number(val.trim()));
      let query = supabase.from('students').select('*, classes(class_name)');

      if (isNumeric) {
        query = query.eq('roll_number', Number(val.trim()));
      } else {
        query = query.ilike('student_name', `%${val.trim()}%`);
      }

      const { data } = await query.limit(15);
      setSearchResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const makeCall = async (student: any) => {
    const phone = student.guardian_phone || student.phone;
    if (!phone) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('recent_calls').insert({
      student_id: student.id || null,
      student_name: student.student_name || student.name,
      guardian_phone: phone,
      madrasah_id: user?.id
    });
    window.location.href = `tel:${phone}`;
    setTimeout(fetchRecentCalls, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Search Bar */}
      <section className="relative z-[55]">
        <div className="relative group">
          <input
            type="text"
            placeholder="নাম বা রোল লিখে খুঁজুন..."
            className="w-full p-5 pl-14 rounded-[2.5rem] bg-white border-none shadow-[0_15px_40px_rgba(0,0,0,0.03)] focus:ring-4 focus:ring-green-500/10 outline-none transition-all text-lg font-semibold placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-green-600" size={24} />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setSearchResults([]); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"
            >
              <XCircle size={24} />
            </button>
          )}
        </div>

        {searchTerm.trim().length > 0 && (
          <div className="mt-4 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-50 overflow-hidden animate-slide-up">
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">অনুসন্ধানের ফলাফল</span>
              {loading && <Loader2 size={16} className="animate-spin text-green-600" />}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-16 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-green-600" size={24} />
                  </div>
                  <p className="text-slate-400 font-bold">খুঁজে দেখা হচ্ছে</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((student) => (
                  <div 
                    key={student.id} 
                    className="p-6 border-b border-slate-50 flex items-center justify-between active:bg-slate-50 transition-colors"
                    onClick={() => makeCall(student)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-sm border border-emerald-100">
                        {student.roll_number || '০'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{student.student_name}</h3>
                        <p className="text-xs font-bold text-slate-400">
                          {student.classes?.class_name || 'শ্রেণিহীন'}
                        </p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                      <Phone size={20} fill="currentColor" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center text-slate-300 flex flex-col items-center">
                  <User size={48} className="opacity-10 mb-4" />
                  <p className="font-bold text-lg">কিছু পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Modern Recent Calls List */}
      <section className={searchTerm ? 'opacity-20 blur-sm pointer-events-none' : 'transition-all duration-500'}>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Clock size={22} className="text-green-600" />
            </div>
            সাম্প্রতিক কল
          </h2>
          <span className="text-[10px] bg-white border border-slate-100 text-slate-400 font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
            সর্বশেষ ১০টি
          </span>
        </div>

        <div className="space-y-4">
          {recentCalls.length > 0 ? (
            recentCalls.map((call) => (
              <div 
                key={call.id} 
                className="bg-white p-6 rounded-[2.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group hover:border-green-100"
                onClick={() => makeCall({ student_name: call.student_name, guardian_phone: call.guardian_phone })}
              >
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <User size={28} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-green-700 transition-colors">{call.student_name}</h3>
                    <p className="text-sm font-bold text-slate-400 font-mono tracking-tight">{call.guardian_phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    {new Date(call.called_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="text-slate-300 group-hover:text-green-600 transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 text-center rounded-[3rem] border border-dashed border-slate-200 text-slate-300 flex flex-col items-center">
              <Clock size={64} className="mb-4 opacity-5" />
              <p className="font-bold text-lg">কল হিস্ট্রি খালি</p>
              <p className="text-xs mt-2 text-slate-400">অভিভাবকদের কল করলে এখানে দেখতে পাবেন</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
