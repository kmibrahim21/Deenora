
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
// Added Sparkles to the import list
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Info, ArrowUpCircle, ExternalLink, Sparkles } from 'lucide-react';

const ImportData: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{success: number, error: string} | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      alert('শুধুমাত্র CSV ফাইল আপলোড করুন।');
      return;
    }

    setLoading(true);
    setReport(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(r => r.trim()).filter(Boolean);
        if (rows.length < 1) throw new Error("ফাইলটি খালি!");
        const firstRow = rows[0].toLowerCase();
        const startIdx = (firstRow.includes('name') || firstRow.includes('phone') || firstRow.includes('নাম')) ? 1 : 0;
        const { data: userData } = await supabase.auth.getUser();
        const madrasahId = userData.user?.id;
        
        let successCount = 0;
        const errors: string[] = [];
        const rawEntries = rows.slice(startIdx).map(row => {
          const parts = row.split(',').map(s => s.trim());
          return { name: parts[0], className: parts[1], phone: parts[2] };
        }).filter(e => e.name && e.className && e.phone);

        const uniqueClassNames = Array.from(new Set(rawEntries.map(r => r.className)));
        const classMap: Record<string, string> = {};
        for (const cName of uniqueClassNames) {
          const { data: existing } = await supabase.from('classes').select('id').eq('class_name', cName).eq('madrasah_id', madrasahId).single();
          if (!existing) {
            const { data: created } = await supabase.from('classes').insert({ class_name: cName, madrasah_id: madrasahId }).select('id').single();
            if (created) classMap[cName] = created.id;
          } else {
            classMap[cName] = existing.id;
          }
        }

        const studentData = rawEntries.map(entry => ({
          student_name: entry.name,
          class_id: classMap[entry.className],
          guardian_phone: entry.phone,
          madrasah_id: madrasahId
        })).filter(s => s.class_id);

        if (studentData.length > 0) {
          const { error: insertError } = await supabase.from('students').insert(studentData);
          if (!insertError) successCount = studentData.length;
          else errors.push(insertError.message);
        }
        setReport({ success: successCount, error: errors.join('. ') });
      } catch (err: any) {
        setReport({ success: 0, error: err.message });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3 px-2">
        <div className="p-2.5 bg-emerald-100 rounded-xl">
           <ArrowUpCircle size={24} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800">ডাটা ইমপোর্ট</h2>
      </div>
      
      <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white space-y-8">
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex gap-4">
          <Info size={24} className="text-emerald-600 shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="font-black text-emerald-800">CSV ফরম্যাট গাইড</h4>
            <p className="text-sm text-emerald-600/80 leading-relaxed font-bold">
              ফাইলটি ৩টি কলামের হতে হবে: নাম, শ্রেণি এবং অভিভাবকের ফোন নম্বর। শ্রেণি আগে না থাকলেও অটোমেটিক তৈরি হবে।
            </p>
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-3xl font-mono text-[10px] text-slate-400 relative">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
             <span className="font-bold text-slate-500 uppercase">Example_Format.csv</span>
             <ExternalLink size={12} />
          </div>
          <p className="text-slate-300">ছাত্রের নাম, শ্রেণি, অভিভাবকের ফোন</p>
          <p>আব্দুল্লাহ ইবনে আলী, ১০ম শ্রেণি, 01700000000</p>
          <p>ওমর ফারুক, ৯ম শ্রেণি, 01800000000</p>
        </div>

        <label className={`group w-full border-4 border-dashed border-slate-100 rounded-[3rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? (
            <div className="bg-white p-6 rounded-full shadow-lg mb-4">
               <Loader2 className="animate-spin text-emerald-600" size={48} />
            </div>
          ) : (
            <div className="bg-emerald-100 p-8 rounded-full text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xl shadow-emerald-50">
               <Upload size={48} />
            </div>
          )}
          <span className="font-black text-slate-800 text-2xl mb-2">{loading ? 'প্রসেসিং হচ্ছে...' : 'ফাইল সিলেক্ট করুন'}</span>
          <p className="text-sm text-slate-400 font-bold">একসাথে হাজার হাজার ডাটা আপলোড করুন</p>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {report && (
        <div className={`p-8 rounded-[2.5rem] border shadow-xl animate-slide-up ${report.success > 0 ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
          <div className="flex items-center gap-4 mb-4">
            {report.success > 0 ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            <h3 className="font-black text-2xl">ইমপোর্ট রিপোর্ট</h3>
          </div>
          <p className="text-lg font-bold opacity-90">{report.success} জন ছাত্রের তথ্য সফলভাবে যুক্ত হয়েছে।</p>
          {report.error && (
            <div className="mt-6 p-4 bg-black/10 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">এরর ডিটেইলস</p>
              <p className="text-sm font-bold leading-relaxed">{report.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 pt-4">
        <h3 className="font-black text-slate-800 flex items-center gap-2 text-xl px-2">
          <Sparkles size={20} className="text-amber-500" /> গুরুত্বপূর্ণ টিপস
        </h3>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 shrink-0">১</div>
             <p className="text-sm font-bold text-slate-500 leading-relaxed">গুগল শিট বা এক্সেল ফাইলকে 'Save As CSV' হিসেবে সেভ করে আপলোড করুন।</p>
          </div>
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 shrink-0">২</div>
             <p className="text-sm font-bold text-slate-500 leading-relaxed">ফোন নম্বরগুলো যেন ইংরেজি সংখ্যায় থাকে (যেমন: 017xx) তা নিশ্চিত করুন।</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
