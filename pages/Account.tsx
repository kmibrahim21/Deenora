
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Building, Save, Loader2, CheckCircle, Camera, Mail, ShieldCheck, Key, Copy, Hash } from 'lucide-react';
import { Madrasah } from '../types';

interface AccountProps {
  madrasah: Madrasah | null;
  onUpdate?: () => void;
}

const Account: React.FC<AccountProps> = ({ madrasah: initialMadrasah, onUpdate }) => {
  const [name, setName] = useState(initialMadrasah?.name || '');
  const [phone, setPhone] = useState(initialMadrasah?.phone || '');
  const [code, setCode] = useState(initialMadrasah?.madrasah_code || '');
  const [avatar, setAvatar] = useState(initialMadrasah?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMadrasah) {
      setName(initialMadrasah.name);
      setPhone(initialMadrasah.phone || '');
      setCode(initialMadrasah.madrasah_code || '');
      setAvatar(initialMadrasah.avatar_url || '');
    }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''));
  }, [initialMadrasah]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSuccess(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update Database Table
      const { error: dbError } = await supabase.from('madrasahs').upsert({ 
        id: user?.id, 
        name, 
        phone, 
        madrasah_code: code,
        avatar_url: avatar 
      });
      if (dbError) throw dbError;

      // Update Auth Password if code changed
      if (code !== initialMadrasah?.madrasah_code && code.length >= 6) {
        const { error: authError } = await supabase.auth.updateUser({ password: code });
        if (authError) console.warn("Password sync failed:", authError.message);
      }

      setSuccess(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyId = () => {
    if (initialMadrasah?.id) {
      navigator.clipboard.writeText(initialMadrasah.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800">অ্যাকাউন্ট</h2>
        <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-widest">
          অনলাইন সেশন
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white p-8 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-36 h-36 bg-slate-50 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl">
              {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Building size={64} className="text-slate-200" />}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-green-600 text-white p-3.5 rounded-2xl shadow-xl shadow-green-200 border-2 border-white active:scale-90 transition-transform">
              <Camera size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImage} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mt-6">{name}</h3>
          <div className="flex items-center gap-2 text-slate-400 mt-1 font-bold">
             <ShieldCheck size={14} className="text-green-500" />
             <span className="text-xs uppercase tracking-widest">ভেরিফাইড মাদরাসা এডমিন</span>
          </div>
        </div>

        <div className="space-y-5 pt-4 border-t border-slate-50">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">মাদরাসা ইউনিক আইডি (ID)</label>
            <div className="relative">
              <div className="w-full p-5 pl-14 bg-slate-100/50 border border-slate-200 rounded-3xl font-mono text-[10px] text-slate-500 overflow-hidden flex items-center select-all">
                {initialMadrasah?.id}
              </div>
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <button 
                onClick={copyId}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white text-green-600 rounded-xl shadow-sm border border-slate-100 active:scale-90 transition-all flex items-center gap-2"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                <span className="text-[10px] font-bold">{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">মাদরাসার নাম</label>
            <input type="text" className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">মাদরাসা কোড (লগইন পাসওয়ার্ড)</label>
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-5 pl-14 bg-slate-50/50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                placeholder="নতুন কোড লিখুন"
              />
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            </div>
            <p className="text-[9px] text-slate-400 font-bold ml-2 italic">*কোড পরিবর্তন করলে এটিই আপনার পরবর্তী লগইন পাসওয়ার্ড হবে।</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">যোগাযোগের নম্বর</label>
            <input type="tel" className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-slate-700" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">অফিসিয়াল ইমেইল</label>
            <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl text-slate-400 flex items-center gap-3">
              <Mail size={18} />
              <span className="font-bold text-sm">{email}</span>
            </div>
          </div>

          <button 
            onClick={handleUpdate} 
            disabled={saving} 
            className="w-full py-5 bg-green-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-green-100 disabled:opacity-70 mt-4 active:scale-[0.98] transition-all"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : success ? <CheckCircle size={24} /> : <Save size={24} />}
            {saving ? 'আপডেট হচ্ছে...' : success ? 'তথ্য সংরক্ষিত!' : 'তথ্য আপডেট করুন'}
          </button>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 border border-red-100 active:bg-red-100 active:scale-[0.98] transition-all mb-10">
        <LogOut size={24} /> লগআউট করুন
      </button>
    </div>
  );
};

export default Account;
