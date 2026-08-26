"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Key, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import router untuk redirect
import UserCreateModal from "@/components/UserCreateModal";
import UserEditModal from "@/components/UserEditModal";
import { createClient } from "@/lib/supabase";
import { deleteUserAccount, resetUserPassword } from "@/actions/userActions";
import Swal from "sweetalert2";

export type UserType = {
  id: number;
  nip: string;
  nama: string;
  email: string;
  role: string;
};

export default function PenggunaAdminPage() {
  const router = useRouter();
  const [dataUsers, setDataUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserType | null>(null);

  const supabase = createClient();

  // FUNGSI PROTEKSI AKSES HALAMAN (HANYA SUPERADMIN YANG BOLEH MASUK)
  const checkRoleAndFetchData = async () => {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && user.email) {
      // Tarik role user bersangkutan
      const { data: profile } = await supabase.from("users").select("role").eq("email", user.email).single();

      // JIKA BUKAN SUPERADMIN -> BLOKIR AKSES!
      if (profile && profile.role !== "Superadmin") {
        Swal.fire({
          icon: "error",
          title: "Akses Ditolak",
          text: "Hanya akun dengan hak akses Superadmin yang diizinkan mengelola pengguna sistem.",
          confirmButtonColor: "#ba1a1a",
        }).then(() => {
          // Tendang balik ke dashboard admin
          router.push("/admin/dashboard");
        });
        return;
      }

      // Jika lolos (dia memang Superadmin), baru tarik data tabel
      const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true });
      if (data && !error) setDataUsers(data);
    } else {
      router.push("/login");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      checkRoleAndFetchData();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = dataUsers.filter((user) => user.nama.toLowerCase().includes(searchTerm.toLowerCase()) || user.nip.includes(searchTerm));

  const handleDelete = async (id: number, nama: string, email: string) => {
    const swalResult = await Swal.fire({
      title: "Hapus Pengguna?",
      text: `Apakah Anda yakin ingin menghapus akses untuk "${nama}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ba1a1a",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (swalResult.isConfirmed) {
      const res = await deleteUserAccount(id, email);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Selesai!", text: `Akses pengguna "${nama}" berhasil dicabut.`, confirmButtonColor: "#2563eb", timer: 2000, showConfirmButton: false });
        checkRoleAndFetchData();
      } else {
        Swal.fire({ icon: "error", title: "Gagal Menghapus", text: res.message, confirmButtonColor: "#2563eb" });
      }
    }
  };

  const handleResetPassword = async (email: string, nama: string) => {
    const swalResult = await Swal.fire({
      title: "Reset Sandi?",
      text: `Sandi untuk "${nama}" akan dikembalikan ke default: CamatKuta2026!`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#cbd5e1",
      confirmButtonText: "Ya, Reset!",
      cancelButtonText: "Batal",
    });

    if (swalResult.isConfirmed) {
      const res = await resetUserPassword(email);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Sandi Direset!", text: `Sandi "${nama}" berhasil dikembalikan ke default.`, confirmButtonColor: "#2563eb", timer: 2500, showConfirmButton: false });
      } else {
        Swal.fire({ icon: "error", title: "Gagal Reset", text: res.message, confirmButtonColor: "#2563eb" });
      }
    }
  };

  const handleEditClick = (user: UserType) => {
    setUserToEdit(user);
    setIsEditOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna Sistem</h2>
        <p className="text-sm text-slate-500 mt-1">Kelola akses, peran, dan data profil pengguna sistem secara komprehensif.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 sm:py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
        >
          <Plus size={18} />
          <span>Tambah Pengguna</span>
        </button>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari NIP atau Nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 sm:py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full min-h-75">
        <div className="overflow-x-auto w-full flex-1">
          <table className="min-w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">NIP</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Hak Akses</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{user.nip}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.nama}</td>
                    <td className="px-6 py-4 text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === "Superadmin" ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white tracking-wide">Superadmin</span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-white text-slate-600 border border-slate-300 tracking-wide">Admin</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEditClick(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Profil">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleResetPassword(user.email, user.nama)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                          <Key size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id, user.nama, user.email)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus Pengguna">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Pengguna tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={() => checkRoleAndFetchData()} />
      <UserEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} user={userToEdit} onSave={() => checkRoleAndFetchData()} />
    </div>
  );
}
