
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Home from './pages/Home';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Account from './pages/Account';
import Login from './pages/Login';
import ImportData from './pages/ImportData';
import { AuthState, Madrasah } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    madrasah: null,
  });

  const fetchMadrasahProfile = async (userId: string): Promise<Madrasah | null> => {
    try {
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        const { data: newData } = await supabase
          .from('madrasahs')
          .upsert({ id: userId, name: 'নতুন মাদরাসা' })
          .select('*')
          .single();
        return newData;
      }
      return data;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (auth.user) {
      const madrasah = await fetchMadrasahProfile(auth.user.id);
      setAuth(prev => ({ ...prev, madrasah }));
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const madrasah = await fetchMadrasahProfile(session.user.id);
          setAuth({ user: session.user, madrasah, loading: false });
        } else {
          setAuth({ user: null, madrasah: null, loading: false });
        }
      } catch (err) {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const madrasah = await fetchMadrasahProfile(session.user.id);
        setAuth({ user: session.user, madrasah, loading: false });
      } else {
        setAuth({ user: null, madrasah: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (auth.loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-green-50 text-green-600 font-bold">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p>লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {auth.user ? (
          <Route element={<Layout madrasah={auth.madrasah} />}>
            <Route path="/" element={<Home />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:classId" element={<Students />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="/account" element={<Account madrasah={auth.madrasah} onUpdate={refreshProfile} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
