"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "@/components/AdminFooter";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* SIDEBAR (NAVBAR KIRI) */}
      <AdminSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* AREA KANAN */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-slate-50 relative">
        {/* HEADER ATAS */}
        <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* KONTEN UTAMA HALAMAN & FOOTER */}
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          {/* PADDING P-4 MD:P-8 DIPINDAHKAN KHUSUS KE PEMBUNGKUS CHILDREN */}
          <div className="p-4 md:p-8 grow">{children}</div>

          {/* FOOTER RATA BAWAH (MENEMPEL PRESISI PADA SIDEBAR DAN DASAR LAYAR) */}
          <AdminFooter />
        </main>
      </div>
    </div>
  );
}
