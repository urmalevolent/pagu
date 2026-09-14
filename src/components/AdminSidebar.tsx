"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, Users, Settings, LogOut, X, Tags, ChevronDown, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase";

type AdminSidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // STATE UNTUK DROPDOWN MENU
  const [isKategoriOpen, setIsKategoriOpen] = useState(pathname.includes("/kategori"));
  const [isPemeliharaanOpen, setIsPemeliharaanOpen] = useState(pathname.includes("/pemeliharaan"));

  // STATE BARU: Menyimpan role user aktif untuk proteksi menu
  const [userRole, setUserRole] = useState("Admin");

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data } = await supabase.from("users").select("role").eq("email", user.email).single();
        if (data && data.role) {
          setUserRole(data.role); // Simpan role asli ke state (Superadmin / Admin)
        }
      }
    };
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeMenuMobile = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    closeMenuMobile();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" onClick={closeMenuMobile} />}

      <nav
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 py-6 text-white z-50 flex flex-col shrink-0 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <button onClick={closeMenuMobile} className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <X size={24} />
        </button>

        {/* HEADER SIDEBAR */}
        <div className="px-6 mb-8 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/assets/logos-pagu.png" alt="Logo Badung" className="w-10 h-10 object-contain drop-shadow-sm shrink-0 bg-white rounded-md p-0.5" />
          <div className="flex flex-col mt-0.5">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1.5">PAGU</h1>
            <p className="text-[10px] text-slate-400 leading-snug font-medium tracking-wide pr-2">
              PEMELIHARAAN
              <br />
              ASET
              <br />
              BERBASIS DIGITAL
            </p>
          </div>
        </div>

        {/* DAFTAR MENU UTAMA */}
        <ul className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <li>
            <Link
              onClick={closeMenuMobile}
              href="/admin/dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${pathname === "/admin/dashboard" ? "text-white bg-blue-600/20 border-l-4 border-blue-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <Home size={20} className={pathname === "/admin/dashboard" ? "text-blue-600" : "group-hover:text-white"} />
              <span>Beranda</span>
            </Link>
          </li>

          {/* MENU PEMELIHARAAN (SEKARANG DROPDOWN) */}
          <li>
            <button
              onClick={() => setIsPemeliharaanOpen(!isPemeliharaanOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${pathname.includes("/pemeliharaan") ? "text-white bg-blue-600/20 border-l-4 border-blue-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <div className="flex items-center gap-3">
                <Wrench size={20} className={pathname.includes("/pemeliharaan") ? "text-blue-500" : "group-hover:text-white"} />
                <span>Pemeliharaan</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isPemeliharaanOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPemeliharaanOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
              <ul className="flex flex-col gap-1 pl-11 pr-2 border-l border-slate-700 ml-5">
                <li>
                  <Link
                    onClick={closeMenuMobile}
                    href="/admin/pemeliharaan"
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/pemeliharaan" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                  >
                    Semua Aset
                  </Link>
                </li>
                <li>
                  <Link
                    onClick={closeMenuMobile}
                    href="/admin/pemeliharaan/kendaraan"
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/pemeliharaan/kendaraan" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                  >
                    Kendaraan
                  </Link>
                </li>
                <li>
                  <Link
                    onClick={closeMenuMobile}
                    href="/admin/pemeliharaan/list"
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/pemeliharaan/list" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`}
                  >
                    List
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* 
            REVISI PROTEKSI: 
            Menu "Pengguna" HANYA AKAN TAMPIL jika yang login adalah SUPERADMIN!
          */}
          {userRole === "Superadmin" && (
            <li>
              <Link
                onClick={closeMenuMobile}
                href="/admin/pengguna"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${pathname === "/admin/pengguna" ? "text-white bg-blue-600/20 border-l-4 border-blue-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
              >
                <Users size={20} className={pathname === "/admin/pengguna" ? "text-blue-600" : "group-hover:text-white"} />
                <span>Pengguna</span>
              </Link>
            </li>
          )}

          <li>
            <Link
              onClick={closeMenuMobile}
              href="/admin/pengaturan"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${pathname === "/admin/pengaturan" ? "text-white bg-blue-600/20 border-l-4 border-blue-600" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <Settings size={20} className={pathname === "/admin/pengaturan" ? "text-blue-600" : "group-hover:text-white"} />
              <span>Pengaturan</span>
            </Link>
          </li>
        </ul>

        {/* Footer Sidebar */}
        <div className="px-4 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 text-sm font-semibold hover:bg-red-500/10 hover:text-red-500 transition-colors group">
            <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
            <span>Keluar</span>
          </button>
        </div>
      </nav>
    </>
  );
}