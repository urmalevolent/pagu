"use client";

import { useState, useEffect } from "react";
// 1. PERBAIKAN: Menghapus ShieldCheck dari import agar tidak menimbulkan warning
import { LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// IMPORT AOS
import AOS from "aos";
import "aos/dist/aos.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setIsLoading(false);
      setErrorMsg("Email atau Kata Sandi salah. Silakan coba lagi.");
    } else {
      setIsLoading(false);
      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-50 lg:bg-white overflow-hidden">
      {/* ==================================================== */}
      {/* KOLOM KIRI: BACKGROUND GAMBAR */}
      {/* ==================================================== */}
      <div data-aos="fade-right" className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center shrink-0" style={{ backgroundImage: "url('/images/hero/HeroBanner1.jpg')" }}>
        {/* Overlay Gelap */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" />

        {/* Konten di Atas Gambar */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          {/* Tombol Kembali */}
          <div data-aos="fade-down" data-aos-delay="200" className="w-fit">
            <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition w-fit text-sm font-medium">
              <ArrowLeft size={18} /> Kembali ke Beranda
            </Link>
          </div>

          {/* Teks Branding */}
          <div data-aos="fade-up" data-aos-delay="300" className="mb-12">
            {/* 2. REVISI: Mengganti box biru ShieldCheck dengan logo Badung di dalam box putih bersih */}
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/assets/logos-sate.webp" alt="Logo Badung" className="w-full h-full object-contain" />
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">SATE</h1>
            <p className="text-slate-300 text-lg font-medium max-w-md leading-relaxed">
              SISTEM ASET TERINTEGRASI EFEKTIF AKUNTABEL TRANSPARAN
              <br />
              Kantor Camat Kuta Selatan.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* KOLOM KANAN: FORMULIR LOGIN */}
      {/* ==================================================== */}
      <div data-aos="fade-up" data-aos-delay="100" className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Tombol Kembali khusus HP */}
        <Link href="/" className="lg:hidden absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-medium text-sm">
          <ArrowLeft size={18} /> Beranda
        </Link>

        {/* Kotak Form */}
        <div className="w-full max-w-100 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 lg:shadow-none lg:border-none lg:p-0">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Panel Admin</h2>
            <p className="text-slate-500 text-sm">Masuk menggunakan Email dan Kata Sandi.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Pegawai</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: admin@gmail.com"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Input Password */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Pesan Error */}
            {errorMsg && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium text-center">{errorMsg}</div>}

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white mt-2 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 active:translate-y-px"
            >
              {isLoading ? (
                "Memverifikasi..."
              ) : (
                <>
                  <LogIn size={18} className="mr-2" /> Masuk Ke Sistem
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-12 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 w-full">&copy; 2026 SI-ARSIP Kantor Camat Kuta Selatan.</p>
        </div>
      </div>
    </div>
  );
}
