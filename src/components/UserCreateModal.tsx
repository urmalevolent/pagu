"use client";

import { useState } from "react";
import { X, Save, UserPlus, Loader2 } from "lucide-react";
import { createNewUser } from "@/actions/userActions";
import Swal from "sweetalert2";

type UserCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function UserCreateModal({ isOpen, onClose, onSave }: UserCreateModalProps) {
  const [email, setEmail] = useState("");
  const [nip, setNip] = useState("");
  const [nama, setNama] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [role, setRole] = useState("Admin");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Panggil Server Action ke Supabase
      const result = await createNewUser({ email, kataSandi, nip, nama, role });

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Pengguna Dibuat!",
          text: "Akun admin baru berhasil didaftarkan.",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          showConfirmButton: false,
        });

        setEmail("");
        setNip("");
        setNama("");
        setKataSandi("");
        if (onSave) onSave();
        onClose();
      } else {
        setErrorMsg(result.message);
      }
      // PERBAIKAN: Menggunakan try-catch-finally agar tombol tidak 'stuck' jika terjadi crash server
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal.";
      setErrorMsg("Gagal mendaftarkan: " + msg + "\n(Pastikan SERVICE_ROLE_KEY sudah dipasang di Vercel)");
    } finally {
      setIsLoading(false); // DIJAMIN SELALU DIEKSEKUSI APA PUN YANG TERJADI
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="relative flex w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Tambah Pengguna Baru</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftarkan akun Gmail pegawai untuk akses sistem.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="createUserForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium whitespace-pre-line">{errorMsg}</div>}

          <div>
            <label className={labelClass}>NIP Pegawai</label>
            <input required value={nip} onChange={(e) => setNip(e.target.value)} className={inputClass} placeholder="Contoh: 199001..." type="text" />
          </div>
          <div>
            <label className={labelClass}>Nama Lengkap</label>
            <input required value={nama} onChange={(e) => setNama(e.target.value)} className={inputClass} placeholder="Masukkan nama..." type="text" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email (Gmail)</label>
              <input required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="akun@gmail.com" type="email" />
            </div>
            <div>
              <label className={labelClass}>Kata Sandi Awal</label>
              <input required value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} className={inputClass} placeholder="Minimal 6 karakter" type="password" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Hak Akses (Role)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} bg-white cursor-pointer`}>
              <option value="Admin">Admin (Hanya Inventaris)</option>
              <option value="Superadmin">Superadmin (Akses Penuh)</option>
            </select>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            Batal
          </button>
          <button type="submit" form="createUserForm" disabled={isLoading} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
