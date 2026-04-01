
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building, Lock, Phone, Loader2, ArrowRight, AlertCircle, Sparkles, UserPlus, Info } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = phone.trim();
    if (cleanPhone.length < 11) {
      setError('সঠিক মোবাইল নম্বর প্রদান করুন (১১ ডিজিট)।');
      setLoading(false);
      return;
    }

    if (code.length < 6) {
      setError('কোড কমপক্ষে ৬ ডিজিটের হতে হবে।');
      setLoading(false);
      return;
    }

    const email = `${cleanPhone}@madrasah.app`;

    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password: code,
          options: {
            data: { 
              display_name: name || 'নতুন মাদরাসা',
              phone: cleanPhone 
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('Signups not allowed')) {
            setError('আপনার Supabase প্রোজেক্টে রেজিস্ট্রেশন বন্ধ করা আছে। ড্যাশবোর্ড থেকে "Allow new users to sign up" চালু করুন।');
          } else {
            setError(signUpError.message);
          }
          throw signUpError;
        }
        
        if (data.user) {
          await supabase.from('madrasahs').upsert({
            id: data.user.id,
            name: name || 'নতুন মাদরাসা',
            madrasah_code: code,
            phone: cleanPhone
          });
          alert('রেজিস্ট্রেশন সফল! এখন লগইন করুন।');
          setIsRegister(false);
          setCode('');
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ 
          email, 
          password: code 
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            setError('নম্বর অথবা কোড সঠিক নয়। আপনি কি রেজিস্ট্রেশন করেছেন?');
          } else if (authError.message.includes('Email not confirmed')) {
            setError('ইমেইল কনফার্ম করা হয়নি। Supabase ড্যাশবোর্ড থেকে "Confirm email" অপশনটি বন্ধ করুন।');
          } else {
            setError(authError.message);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f9f6] relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-green-200 rounded-full blur-[100px] opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-200 rounded-full blur-[120px] opacity-40"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-white rounded-[2rem] shadow-xl shadow-green-100 mb-6">
            <div className="w-16 h-16 bg-green-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-green-200">
              <Building size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">মাদরাসা কন্টাক্ট</h1>
          <p className="text-slate-500 font-medium">নিরাপদ ও সহজ যোগাযোগ ব্যবস্থাপনা</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${!isRegister ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
            >
              লগইন
            </button>
            <button 
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${isRegister ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">মাদরাসার নাম</label>
                <input 
                  type="text" 
                  required
                  placeholder="মাদরাসার নাম দিন"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">মোবাইল নম্বর</label>
              <div className="relative group">
                <input 
                  type="tel" 
                  required
                  placeholder="01XXXXXXXXX"
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-mono text-lg"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">মাদরাসা কোড</label>
              <div className="relative group">
                <input 
                  type="password" 
                  required
                  placeholder="কমপক্ষে ৬ ডিজিট"
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-lg"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex gap-3 items-start">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 active:scale-[0.98] transition-all shadow-xl shadow-green-100 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : (
                <>
                  {isRegister ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {error.includes('Supabase') && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 animate-slide-up">
            <Info className="text-amber-600 shrink-0" size={20} />
            <div className="text-[10px] text-amber-700 font-bold leading-relaxed">
              টিপস: Supabase Dashboard > Authentication > Settings > Providers > Email-এ গিয়ে "Confirm email" অপশনটি OFF করুন।
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
