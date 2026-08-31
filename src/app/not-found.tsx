// src/app/not-found.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* <Navbar /> */}

      <main className="grow flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Teks "404" Besar di Background (Transparan) */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none select-none opacity-[0.03]">
          <span className="font-bold text-slate-900 tracking-tighter" style={{ fontSize: "20rem", lineHeight: 1 }}>
            404
          </span>
        </div>

        {/* Kotak Konten Utama (Card) */}
        <div className="max-w-xl w-full flex flex-col items-center text-center bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          {/* Ilustrasi Kotak Kosong */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD64O1q7YxcAf2MSTybPOSBVp5hrCk7W5NqHfKii6cGXIyGWKyCtX4VHYUswyc4tCq3cNhvd0x8Vv9Wzzs9kVgvMIosLwItkOyPXTDTYH0fcNfv1OZ7U7Jou0_rEBTVVp7KYcLk-fa5cgmocXnzPYNVxQYyUdbES4EqtYNJ1lkhoNDNzZ6xlWYrR0vLSyahESOiPNj-xVZcqAWN6PgnvuX6V4nfgYnbmlVNqnl03TnW-db5d4FVOTe90g"
            alt="Ilustrasi Tidak Ditemukan"
            className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8 drop-shadow-sm"
          />

          {/* Teks Peringatan */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Halaman Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-8 max-w-md text-sm md:text-base leading-relaxed">Maaf, data arsip atau halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau URL salah.</p>

          {/* Tombol Kembali */}
          <Link href="/admin/dashboard" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg active:translate-y-0.5">
            <ArrowLeft size={20} />
            Kembali ke Beranda
          </Link>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
