"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, LogOut, Globe, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState({ nama: "Memuat...", role: "...", avatar_url: "" });
  const [notifCount, setNotifCount] = useState(0);

  // STATE UNTUK BUKA/TUTUP DROPDOWN PROFIL
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const supabase = createClient();

  const fetchHeaderData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.email) {
      const { data: userData } = await supabase.from("users").select("nama, role, avatar_url").eq("email", user.email).single();

      if (userData) {
        setProfile({
          nama: userData.nama,
          role: userData.role,
          avatar_url: userData.avatar_url,
        });
      } else {
        setProfile({ nama: "Admin Sistem", role: "Pengguna", avatar_url: "" });
      }
    }

    const { count } = await supabase.from("inventaris_kib_b").select("*", { count: "exact", head: true }).in("kondisi", ["Rusak Ringan", "Rusak Berat"]);

    if (count !== null) setNotifCount(count);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchHeaderData();
    }, 0);

    const handleAvatarUpdate = () => {
      fetchHeaderData();
    };

    window.addEventListener("local-avatar-updated", handleAvatarUpdate);

    return () => {
      window.removeEventListener("local-avatar-updated", handleAvatarUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const currentMenu = pathname.includes("inventaris")
    ? "Manajemen Inventaris"
    : pathname.includes("pengguna")
      ? "Manajemen Pengguna"
      : pathname.includes("pengaturan")
        ? "Pengaturan Sistem"
        : pathname.includes("kategori/kir")
          ? "Kategori / KIR"
          : pathname.includes("kategori/asal-usul")
            ? "Kategori / Asal Usul"
            : pathname.includes("pemeliharaan")
              ? "Pemeliharaan Aset"
              : "Beranda";

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-30 bg-white border-b border-slate-200 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="hidden sm:inline">Dashboard</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="font-semibold text-slate-800 truncate max-w-37.5 sm:max-w-none">{currentMenu}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/admin/pemeliharaan" className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          {notifCount > 0 && <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">{notifCount}</span>}
        </Link>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* ========================================================== */}
        {/* DROPDOWN PROFIL DENGAN ANIMASI TRANSISI SMOOTH */}
        {/* ========================================================== */}
        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 p-1.5 pr-2 md:pr-3 rounded-lg transition-colors text-left border border-transparent hover:border-slate-200">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.nama}&background=0D8ABC&color=fff&bold=true`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-37.5">{profile.nama}</p>
              <p className="text-xs font-medium text-slate-500 leading-tight">{profile.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
          </button>

          {/* BACKDROP TRANSPARAN */}
          <div className={`fixed inset-0 z-40 transition-opacity duration-200 ${isProfileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={() => setIsProfileOpen(false)} />

          {/* BOX MENU DROPDOWN (Scale & Fade-in) */}
          <div
            className={`absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 transform origin-top-right transition-all duration-200 ease-in-out ${
              isProfileOpen ? "opacity-100 scale-100 translate-y-0 visible" : "opacity-0 scale-95 -translate-y-2 invisible"
            }`}
          >
            <div className="px-4 py-2 border-b border-slate-100 mb-1 lg:hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{profile.nama}</p>
              <p className="text-xs font-medium text-slate-500">{profile.role}</p>
            </div>

            <Link href="https://sate.gdpartstudio.my.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
              <Globe size={16} /> Ke Halaman Publik
            </Link>

            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-slate-100 pt-3">
              <LogOut size={16} /> Keluar (Logout)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
