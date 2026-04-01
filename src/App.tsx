
import React, { useState, useEffect } from 'react';
import { OfflineService } from 'services/OfflineService';
import { useSyncEngine } from 'hooks/useOffline';
import { useAndroidBackHandler } from 'hooks/useAndroidBackHandler';
import { OfflineIndicator } from 'components/OfflineIndicator';
import { useAuth } from 'hooks/useAuth';
import Auth from 'pages/Auth';
import Layout from 'components/Layout';
import Home from 'pages/Home';
import Classes from 'pages/Classes';
import Students from 'pages/Students';
import StudentDetails from 'pages/StudentDetails';
import StudentForm from 'pages/StudentForm';
import Account from 'pages/Account';
import SuperAccount from 'pages/SuperAccount';
import AdminPanel from 'pages/AdminPanel';
import { ManagersManager } from 'components/admin/ManagersManager';
import WalletSMS from 'pages/WalletSMS';
import DataManagement from 'pages/DataManagement';
import Accounting from 'pages/Accounting';
import Attendance from 'pages/Attendance';
import Exams from 'pages/Exams';
import FinalResults from 'pages/FinalResults';
import VoiceBroadcast from 'pages/VoiceBroadcast';
import SmsVoiceMenu from 'pages/SmsVoiceMenu';
import AcademicCalendarPage from 'pages/AcademicCalendarPage';
import Tutorials from 'pages/Tutorials';
import TeacherManagement from 'pages/TeacherManagement';
import TeacherLogin from 'pages/TeacherLogin';
import { VoiceServiceDashboard } from 'components/VoiceServiceDashboard';
import { TutorialsManager } from 'components/TutorialsManager';
import { View, Class, Student, Language } from 'types';
import { t } from 'translations';
import { BookOpen, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

const App: React.FC = () => {
  useSyncEngine();
  const { session, profile, madrasah, loading, authError, handleLogout, refreshMadrasah } = useAuth();
  const [teacherSession, setTeacherSession] = useState<any>(() => {
    const saved = localStorage.getItem('teacher_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<View>('home');
  useAndroidBackHandler(view, setView);
  const [walletTab, setWalletTab] = useState<'templates' | 'bulk-sms' | 'history' | 'recharge'>('bulk-sms');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); 
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app_lang') as Language) || 'bn');
  const [statusModal, setStatusModal] = useState<{show: boolean, type: 'success' | 'error', title: string, message: string}>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const triggerRefresh = () => {
    setDataVersion(prev => prev + 1);
    refreshMadrasah();
  };

  useEffect(() => {
    if ((profile?.role === 'super_admin' || profile?.role === 'manager') && view === 'home') {
      setView('admin-dashboard');
    }
  }, [profile?.role, view]);

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      if (loading) {
        themeColorMeta.setAttribute('content', '#8D30F4'); // Splash screen color
      } else {
        // Use a dark color for the status bar in both modes to ensure white icons are always visible
        themeColorMeta.setAttribute('content', '#0F172A'); 
      }
    }
  }, [loading, session, madrasah, madrasah?.theme]);

  useEffect(() => {
    const handleStatusChange = () => {
      if (navigator.onLine) OfflineService.processQueue();
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#8D30F4] mesh-bg-vibrant">
      <div className="flex flex-col items-center justify-center animate-in fade-in duration-1000">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-2xl">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        </div>
        <h1 className="text-white font-black tracking-[0.7em] text-[11px] uppercase opacity-90">DEENORA</h1>
      </div>
    </div>
  );

  if (authError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-500 p-10 text-center text-white font-noto">
       <ShieldAlert size={80} className="mb-6 animate-bounce" />
       <h1 className="text-3xl font-black mb-4">নিরাপত্তা সতর্কতা!</h1>
       <p className="text-lg opacity-80 mb-8">{authError}</p>
       <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-red-600 rounded-full font-black shadow-2xl active:scale-95 transition-all">পুনরায় চেষ্টা করুন</button>
    </div>
  );

  if (view === 'teacher-login') {
    return <TeacherLogin madrasah={madrasah} lang={lang} onBack={() => setView('home')} onLoginSuccess={(data) => { setTeacherSession(data); setView('home'); }} />;
  }

  if (!session && !madrasah && !teacherSession) return <Auth lang={lang} onTeacherLoginClick={() => setView('teacher-login')} />;

  const renderView = () => {
    const role = teacherSession ? 'teacher' : (profile?.role || 'madrasah_admin');
    const currentMadrasah = madrasah || teacherSession?.institute;
    const permissions = teacherSession?.permissions || profile?.permissions;

    switch (view) {
      case 'home':
        return <Home 
                  onStudentClick={(s) => { setSelectedStudent(s); setView('student-details'); }} 
                  lang={lang} 
                  dataVersion={dataVersion} 
                  triggerRefresh={triggerRefresh} 
                  institutionId={currentMadrasah?.id} 
                  madrasah={currentMadrasah}
                  isAdmin={role === 'madrasah_admin' || role === 'super_admin' || !!permissions?.can_send_sms || !!permissions?.can_use_voice_call}
                  onNavigateToWallet={() => {
                    const modules = {
                      voice_broadcast: true,
                      sms: true,
                      ...(currentMadrasah?.config_json?.modules || {})
                    };
                    if (modules.sms !== false || modules.voice_broadcast) {
                      setWalletTab('bulk-sms');
                      setView('wallet-sms');
                    }
                  }}
                  onNavigateToAccounting={() => setView('accounting')}
                  onNavigateToAttendance={() => setView('attendance')}
                  onNavigateToExams={() => setView('exams')}
                  onNavigateToClasses={() => setView('classes')}
                  onNavigateToVoiceBroadcast={() => setView('voice-broadcast')}
                  onNavigateToTutorials={() => setView('tutorials')}
                  onNavigateToAcademicYear={() => setView('academic-calendar')}
                  onNavigateToDataManagement={() => setView('data-management')}
                />;
      case 'classes':
        return <Classes onClassClick={(cls) => { setSelectedClass(cls); setView('students'); }} lang={lang} madrasah={currentMadrasah} dataVersion={dataVersion} triggerRefresh={triggerRefresh} readOnly={role === 'teacher' && !permissions?.can_manage_students} />;
      case 'students':
        if (!selectedClass) { setView('classes'); return null; }
        return <Students 
                  selectedClass={selectedClass} 
                  onStudentClick={(s) => { setSelectedStudent(s); setView('student-details'); }} 
                  onAddClick={() => { setIsEditing(false); setSelectedStudent(null); setView('student-form'); }} 
                  onBack={() => setView('classes')} 
                  lang={lang} 
                  dataVersion={dataVersion} 
                  triggerRefresh={triggerRefresh} 
                  canAdd={role !== 'teacher' || permissions?.can_manage_students}
                  canSendSMS={role !== 'teacher' || permissions?.can_send_sms}
                  institutionId={currentMadrasah?.id}
                />;
      case 'student-details':
        if (!selectedStudent) { setView('home'); return null; }
        return <StudentDetails 
                  student={selectedStudent} 
                  madrasah={currentMadrasah}
                  onEdit={() => { setIsEditing(true); setView('student-form'); }} 
                  onBack={() => setView('students')} 
                  lang={lang} 
                  readOnly={role === 'teacher' && !permissions?.can_manage_students}
                  institutionId={currentMadrasah?.id}
                  triggerRefresh={triggerRefresh}
                />;
      case 'student-form':
        if (role === 'teacher' && !permissions?.can_manage_students) { setView('students'); return null; }
        return <StudentForm student={selectedStudent} madrasah={currentMadrasah} defaultClassId={selectedClass?.id} isEditing={isEditing} onSuccess={() => { triggerRefresh(); setView('students'); }} onCancel={() => setView('students')} lang={lang} />;
      case 'account':
        return <Account lang={lang} setLang={(l) => { setLang(l); localStorage.setItem('app_lang', l); }} initialMadrasah={currentMadrasah} isSystemManager={role === 'manager'} permissions={permissions} setView={setView} onLogout={() => { if (teacherSession) { localStorage.removeItem('teacher_session'); setTeacherSession(null); setView('home'); } else { handleLogout(); } }} onProfileUpdate={refreshMadrasah} role={role} />;
      case 'teacher-management':
      case 'teachers':
        if (role !== 'madrasah_admin' && role !== 'super_admin') { setView('home'); return null; }
        return <TeacherManagement lang={lang} madrasah={currentMadrasah} onBack={() => setView('account')} />;
      case 'super-account':
        if (role !== 'super_admin') { setView('home'); return null; }
        return <SuperAccount lang={lang} setLang={(l) => { setLang(l); localStorage.setItem('app_lang', l); }} initialMadrasah={madrasah} setView={setView} onLogout={handleLogout} onProfileUpdate={refreshMadrasah} />;
      case 'admin-panel':
      case 'admin-approvals':
      case 'admin-dashboard':
      case 'admin-managers':
        if (role !== 'super_admin' && role !== 'manager') { setView('home'); return null; }
        
        if (view === 'admin-dashboard' && permissions?.dashboard === false) { setView('home'); return null; }
        if (view === 'admin-panel' && permissions?.institutions === false) { setView('home'); return null; }
        if (view === 'admin-approvals' && permissions?.approvals === false) { setView('home'); return null; }
        if (view === 'admin-managers' && permissions?.managers === false) { setView('home'); return null; }
        
        if (view === 'admin-managers') {
          return <ManagersManager onBack={() => setView('account')} madrasah={madrasah} />;
        }

        return <AdminPanel lang={lang} currentView={view === 'admin-approvals' ? 'approvals' : view === 'admin-dashboard' ? 'dashboard' : 'list'} dataVersion={dataVersion} onProfileUpdate={refreshMadrasah} madrasah={madrasah} profile={profile} setStatusModal={setStatusModal} />;
      case 'admin-voice-service':
        if (role !== 'super_admin' && role !== 'manager') { setView('home'); return null; }
        if (role === 'manager' && profile?.permissions?.voice_broadcast === false) { setView('home'); return null; }
        return <VoiceServiceDashboard onBack={() => setView('account')} madrasah={madrasah} setStatusModal={setStatusModal} />;
      case 'admin-tutorials':
        if (role !== 'super_admin' && role !== 'manager') { setView('home'); return null; }
        if (role === 'manager' && profile?.permissions?.tutorials === false) { setView('home'); return null; }
        return <TutorialsManager onBack={() => setView('account')} madrasah={madrasah} setStatusModal={setStatusModal} />;
      case 'wallet-sms':
        return <WalletSMS lang={lang} madrasah={madrasah} triggerRefresh={triggerRefresh} dataVersion={dataVersion} initialTab={walletTab} />;
      case 'voice-broadcast':
        return <VoiceBroadcast lang={lang} madrasah={madrasah} triggerRefresh={triggerRefresh} dataVersion={dataVersion} />;
      case 'sms-voice-menu':
        return <SmsVoiceMenu lang={lang} madrasah={madrasah} onBack={() => setView('home')} onNavigateToSms={() => setView('wallet-sms')} onNavigateToVoice={() => setView('voice-broadcast')} />;
      case 'academic-calendar':
        return <AcademicCalendarPage lang={lang} madrasah={madrasah} onBack={() => setView('account')} role={role} />;
      case 'tutorials':
        return <Tutorials lang={lang} madrasah={madrasah} onBack={() => setView('account')} />;
      case 'data-management':
        return <DataManagement lang={lang} madrasah={madrasah} onBack={() => setView('account')} triggerRefresh={triggerRefresh} />;
      case 'accounting':
        if (role === 'teacher' && !permissions?.can_manage_accounting) { setView('home'); return null; }
        return <Accounting lang={lang} madrasah={currentMadrasah} onBack={() => setView('home')} role={role} />;
      case 'attendance':
        if (role === 'teacher' && !permissions?.can_manage_attendance) { setView('home'); return null; }
        return <Attendance lang={lang} madrasah={currentMadrasah} onBack={() => setView('home')} userId={teacherSession?.id || session?.user?.id} />;
      case 'exams':
        if (role === 'teacher' && !permissions?.can_manage_exams) { setView('home'); return null; }
        return <Exams lang={lang} madrasah={currentMadrasah} onBack={() => setView('home')} role={role} onNavigateToFinalResults={() => setView('final-results')} />;
      case 'final-results':
        if (role === 'teacher' && !permissions?.can_manage_exams) { setView('home'); return null; }
        return <FinalResults lang={lang} madrasah={currentMadrasah} onBack={() => setView('home')} role={role} />;
      default:
        return <Home 
                  onStudentClick={(s) => { setSelectedStudent(s); setView('student-details'); }} 
                  lang={lang} 
                  dataVersion={dataVersion} 
                  triggerRefresh={triggerRefresh} 
                  institutionId={madrasah?.id} 
                  madrasah={madrasah}
                  isAdmin={role === 'madrasah_admin' || role === 'super_admin' || !!profile?.permissions?.can_send_sms || !!profile?.permissions?.can_use_voice_call}
                  onNavigateToWallet={() => {
                    const modules = {
                      voice_broadcast: true,
                      sms: true,
                      ...(madrasah?.config_json?.modules || {})
                    };
                    if (modules.sms !== false || modules.voice_broadcast) {
                      setWalletTab('bulk-sms');
                      setView('wallet-sms');
                    }
                  }}
                  onNavigateToAccounting={() => setView('accounting')}
                  onNavigateToAttendance={() => setView('attendance')}
                  onNavigateToExams={() => setView('exams')}
                  onNavigateToClasses={() => setView('classes')}
                  onNavigateToVoiceBroadcast={() => setView('voice-broadcast')}
                  onNavigateToTutorials={() => setView('tutorials')}
                  onNavigateToAcademicYear={() => setView('academic-calendar')}
                  onNavigateToDataManagement={() => setView('data-management')}
                />;
    }
  };

  return (
    <Layout currentView={view} setView={setView} lang={lang} madrasah={madrasah} profile={profile}>
      <OfflineIndicator />
      {renderView()}
      
      {/* Status Modal - PORTALED */}
      {statusModal.show && createPortal(
        <div className="modal-overlay bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300 z-[100]">
          <div className={`${madrasah?.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'} w-full max-w-sm rounded-[3.5rem] p-10 text-center shadow-2xl border animate-in zoom-in-95 duration-500 relative overflow-hidden`}>
             <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform duration-700 ${statusModal.type === 'success' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'} border-4 shadow-inner`}>
                {statusModal.type === 'success' ? <CheckCircle2 size={40} strokeWidth={2.5} /> : <AlertCircle size={40} strokeWidth={2.5} />}
             </div>
             <h3 className={`text-[22px] font-black font-noto leading-tight tracking-tight ${madrasah?.theme === 'dark' ? 'text-white' : 'text-[#1E3A8A]'}`}>{statusModal.title}</h3>
             <p className="text-[13px] font-bold text-slate-400 mt-3 font-noto px-4 leading-relaxed">{statusModal.message}</p>
             <button onClick={() => setStatusModal({ ...statusModal, show: false })} className={`w-full mt-8 py-4 font-black rounded-full text-xs uppercase tracking-[0.2em] transition-all shadow-premium active:scale-95 ${statusModal.type === 'success' ? 'bg-[#2563EB] text-white' : 'bg-red-500 text-white'}`}>
                {lang === 'bn' ? 'ঠিক আছে' : 'Continue'}
             </button>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default App;
