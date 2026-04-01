import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "supabase";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { Institution } from "types";

interface ManagersManagerProps {
  onBack: () => void;
  madrasah: Institution | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  voice_broadcast: "Voice Call Features",
  tutorials: "Video Tutorials",
  sms: "Bulk SMS Features",
  institutions: "Institute Manage",
  approvals: "Payment Manage",
};

export const ManagersManager: React.FC<ManagersManagerProps> = ({
  onBack,
  madrasah,
}) => {
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    dashboard: true,
    voice_broadcast: true,
    tutorials: true,
    sms: true,
    institutions: true,
    approvals: true,
  });
  const [statusModal, setStatusModal] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const openEditModal = (manager: any) => {
    setEditingManager(manager);
    setNewName(manager.full_name || "");
    setNewEmail(manager.institution?.email || "");
    setPermissions(
      manager.permissions || {
        dashboard: true,
        voice_broadcast: true,
        tutorials: true,
        sms: true,
        institutions: true,
        approvals: true,
      },
    );
    setShowEdit(true);
  };

  const handleUpdateManager = async () => {
    if (!editingManager || !newName.trim()) {
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: "ম্যানেজার তথ্য পাওয়া যায়নি অথবা নাম খালি",
      });
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: newName.trim(),
          permissions: permissions,
        })
        .eq("id", editingManager.id);

      if (error) throw error;

      setStatusModal({
        show: true,
        type: "success",
        title: "সফল",
        message: "ম্যানেজার সফলভাবে আপডেট হয়েছে",
      });
      setShowEdit(false);
      setEditingManager(null);
      setNewName("");
      setNewEmail("");
      fetchManagers();
    } catch (err: any) {
      console.error("Error updating manager:", err);
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: `ম্যানেজার আপডেট করতে সমস্যা হয়েছে: ${err.message || "অজানা ত্রুটি"}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      // First get all institutions that are marked as super admin (managers)
      const { data: insts, error: instsError } = await supabase
        .from("institutions")
        .select("id, email, phone")
        .eq("is_super_admin", true);

      if (instsError) throw instsError;

      if (insts && insts.length > 0) {
        const instIds = insts.map((i) => i.id);

        // Then get their profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", instIds);

        if (profilesError) throw profilesError;

        if (profiles && profiles.length > 0) {
          const merged = profiles
            .map((p) => ({
              ...p,
              institution: insts.find((i) => i.id === p.id),
            }))
            .filter((m) => m.institution?.email !== "thedevomix@gmail.com");
          setManagers(merged);
        } else {
          setManagers([]);
        }
      } else {
        setManagers([]);
      }
    } catch (err: any) {
      console.error("Error fetching managers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleCreateManager = async () => {
    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: "নাম, ইমেইল এবং পাসওয়ার্ড আবশ্যক",
      });
      return;
    }
    setIsCreating(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: newEmail.trim(),
          password: newPassword.trim(),
          options: {
            data: {
              name: newName.trim(),
              madrasah_name: "Deenora System",
            },
          },
        });

      let newUserId = signUpData?.user?.id;

      if (signUpError || !newUserId) {
        console.log("Signup failed, falling back to RPC:", signUpError);
        const { data: rpcUserId, error: rpcError } = await supabase.rpc(
          "create_user_by_admin",
          {
            p_email: newEmail.trim(),
            p_password: newPassword.trim(),
            p_user_data: {
              name: newName.trim(),
              madrasah_name: "Deenora System",
            },
          },
        );

        if (rpcError) throw rpcError;
        if (!rpcUserId) throw new Error("User creation failed via RPC");
        newUserId = rpcUserId;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await supabase
        .from("institutions")
        .update({
          is_super_admin: true,
          institution_type: "system",
        })
        .eq("id", newUserId);

      await supabase
        .from("profiles")
        .update({
          role: "super_admin",
          institution_id: null,
          permissions: permissions,
        })
        .eq("id", newUserId);

      setStatusModal({
        show: true,
        type: "success",
        title: "সফল",
        message: "ম্যানেজার সফলভাবে তৈরি হয়েছে",
      });
      setShowCreate(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setPermissions({
        dashboard: true,
        voice_broadcast: true,
        tutorials: true,
        sms: true,
        institutions: true,
        approvals: true,
      });
      fetchManagers();
    } catch (err: any) {
      console.error("Error creating manager:", err);
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: err.message || "ম্যানেজার তৈরি করতে সমস্যা হয়েছে",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteManager = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (id === user?.id) {
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: "আপনি নিজেকে রিমুভ করতে পারবেন না",
      });
      return;
    }
    setManagerToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteManager = async () => {
    if (!managerToDelete) return;
    setShowDeleteConfirm(false);
    
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", managerToDelete);
      if (profileError) throw profileError;

      const { error: instError } = await supabase
        .from("institutions")
        .update({ is_super_admin: false })
        .eq("id", managerToDelete);
      if (instError) throw instError;

      fetchManagers();
      setStatusModal({
        show: true,
        type: "success",
        title: "সফল",
        message: "ম্যানেজার সফলভাবে রিমুভ হয়েছে",
      });
    } catch (err: any) {
      console.error("Error removing manager:", err);
      setStatusModal({
        show: true,
        type: "error",
        title: "ত্রুটি",
        message: `ম্যানেজার রিমুভ করতে সমস্যা হয়েছে: ${err.message || "অজানা ত্রুটি"}`,
      });
    } finally {
      setManagerToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${madrasah?.theme === "dark" ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600"}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2
              className={`text-2xl font-black font-noto ${madrasah?.theme === "dark" ? "text-white" : "text-[#1E3A8A]"}`}
            >
              System Managers
            </h2>
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${madrasah?.theme === "dark" ? "text-slate-500" : "text-slate-400"}`}
            >
              Manage Super Admins
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-12 px-6 bg-[#2563EB] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus size={16} /> Add Manager
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((manager) => (
            <div
              key={manager.id}
              className={`p-6 rounded-[2rem] border relative ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${madrasah?.theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                >
                  {manager.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3
                    className={`font-bold ${madrasah?.theme === "dark" ? "text-white" : "text-slate-900"}`}
                  >
                    {manager.full_name}
                  </h3>
                  <p
                    className={`text-xs ${madrasah?.theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {manager.institution?.email || "No Email"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${manager.is_active ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
                >
                  {manager.is_active ? "Active" : "Inactive"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(manager)}
                    className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteManager(manager.id)}
                    className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEdit &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`${madrasah?.theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-white/50"} rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border animate-in zoom-in-95 duration-200`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-black font-noto ${madrasah?.theme === "dark" ? "text-white" : "text-[#1E293B]"}`}
                >
                  Edit Manager
                </h2>
                <button
                  onClick={() => setShowEdit(false)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${madrasah?.theme === "dark" ? "bg-slate-700 text-slate-400 hover:bg-slate-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`w-full px-6 py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-100 text-[#1E293B] placeholder:text-slate-300"}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    disabled
                    className={`w-full px-6 py-4 rounded-2xl border transition-all ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(permissions).map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={permissions[key as keyof typeof permissions]}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold">
                          {PERMISSION_LABELS[key] || key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleUpdateManager}
                  disabled={isUpdating || !newName.trim()}
                  className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isUpdating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isUpdating ? "Updating..." : "Update Manager"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showCreate &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`${madrasah?.theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-white/50"} rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border animate-in zoom-in-95 duration-200`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-xl font-black font-noto ${madrasah?.theme === "dark" ? "text-white" : "text-[#1E293B]"}`}
                >
                  Add New Manager
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${madrasah?.theme === "dark" ? "bg-slate-700 text-slate-400 hover:bg-slate-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`w-full px-6 py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-100 text-[#1E293B] placeholder:text-slate-300"}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="manager@example.com"
                    className={`w-full px-6 py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-100 text-[#1E293B] placeholder:text-slate-300"}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-6 py-4 rounded-2xl border transition-all focus:ring-4 focus:ring-blue-500/10 outline-none ${madrasah?.theme === "dark" ? "bg-slate-900 border-slate-700 text-white placeholder:text-slate-600" : "bg-slate-50 border-slate-100 text-[#1E293B] placeholder:text-slate-300"}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(permissions).map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={permissions[key as keyof typeof permissions]}
                          onChange={(e) =>
                            setPermissions((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold">
                          {PERMISSION_LABELS[key] || key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCreateManager}
                  disabled={
                    isCreating ||
                    !newName.trim() ||
                    !newEmail.trim() ||
                    !newPassword.trim()
                  }
                  className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isCreating ? "Creating..." : "Create Manager"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`${madrasah?.theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-white/50"} rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-200`}
            >
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-inner">
                <Trash2 size={40} />
              </div>
              <h3
                className={`text-2xl font-black mb-2 ${madrasah?.theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                নিশ্চিত করুন
              </h3>
              <p
                className={`text-sm ${madrasah?.theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
              >
                আপনি কি নিশ্চিত যে এই ম্যানেজারকে রিমুভ করতে চান?
              </p>
              <div className="flex gap-3 w-full mt-8">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setManagerToDelete(null);
                  }}
                  className={`flex-1 py-4 font-black rounded-full text-xs uppercase tracking-[0.2em] transition-all ${madrasah?.theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"}`}
                >
                  বাতিল
                </button>
                <button
                  onClick={confirmDeleteManager}
                  className="flex-1 py-4 bg-red-500 text-white font-black rounded-full text-xs uppercase tracking-[0.2em] transition-all shadow-premium active:scale-95"
                >
                  রিমুভ করুন
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {statusModal.show &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className={`${madrasah?.theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-white/50"} rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-200`}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${statusModal.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}
              >
                {statusModal.type === "success" ? (
                  <CheckCircle2 size={40} />
                ) : (
                  <X size={40} />
                )}
              </div>
              <h3
                className={`text-2xl font-black mb-2 ${madrasah?.theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                {statusModal.title}
              </h3>
              <p
                className={`text-sm ${madrasah?.theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
              >
                {statusModal.message}
              </p>
              <button
                onClick={() => setStatusModal({ ...statusModal, show: false })}
                className={`w-full mt-8 py-4 font-black rounded-full text-xs uppercase tracking-[0.2em] transition-all shadow-premium active:scale-95 ${statusModal.type === "success" ? "bg-[#2563EB] text-white" : "bg-red-500 text-white"}`}
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
