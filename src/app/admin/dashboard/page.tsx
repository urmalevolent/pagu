"use client";

import { useState, useEffect } from "react";
import { Package, CheckCircle, Wrench, Wallet, Calendar, Loader2, BarChart3, DollarSign, Activity, TrendingDown, TrendingUp, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AssetDetailModal, { AssetType } from "@/components/AssetDetailModal";
import AssetEditModal from "@/components/AssetEditModal";
import { AssetItem } from "@/utils/exportPdfKibB";
import PemeliharaanStats from "@/components/PemeliharaanStats";

interface SupabaseAsset {
  id: number;
  kode_barang: string;
  nama_barang: string;
  nomor_register?: string | null;
  merk_type?: string | null;
  ukuran_cc?: string | null;
  bahan?: string | null;
  tahun_beli?: string | null;
  pabrik?: string | null;
  no_rangka?: string | null;
  no_mesin?: string | null;
  no_polisi?: string | null;
  no_bpkb?: string | null;
  asal_usul_id?: number | null;
  harga?: number | null;
  kondisi: string;
  kir_id?: number | null;
  keterangan?: string | null;
  foto_url?: string | null;
  kir?: { nama_ruangan: string } | null;
  asal_usul?: { nama_asal: string } | null;
}

type ChartData = {
  year: string;
  count: number;
  heightPercentage: number;
  isActive: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Admin");

  // State Statistik Inventaris
  const [stats, setStats] = useState({ totalAset: 0, kondisiBaik: 0, perluPemeliharaan: 0, totalNilai: 0 });
  const [actionItems, setActionItems] = useState<AssetItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // State Statistik PAGU Kendaraan
  const [paguStats, setPaguStats] = useState({
    totalTahunan: 0,
    sisaTahunan: 0,
    sisaBulanIni: 0,
    realisasiBulanIni: 0, // <-- Tambahan State
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<AssetItem | null>(null);

  const supabase = createClient();

  // =========================================================
  // HELPER WAKTU SAAT INI (DINAMIS MENGIKUTI KALENDER)
  // =========================================================
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' });

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && user.email) {
      const { data } = await supabase.from("users").select("nama").eq("email", user.email).single();
      if (data && data.nama) setUserName(data.nama);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);

    // 1. FETCH DATA INVENTARIS KIB B
    const { data, error } = await supabase.from("inventaris_kib_b").select("*, kir:master_kir(nama_ruangan), asal_usul:master_asal_usul(nama_asal)").order("id", { ascending: false });

    if (!error && data) {
      const rawData = data as unknown as SupabaseAsset[];

      const formattedData: AssetItem[] = rawData.map((item) => ({
        id: item.id,
        kode: item.kode_barang,
        nama: item.nama_barang,
        nomorRegister: item.nomor_register || "0000",
        merk: item.merk_type || "-",
        ukuran: item.ukuran_cc || "-",
        bahan: item.bahan || "-",
        tahun: item.tahun_beli || "-",
        pabrik: item.pabrik || "-",
        rangka: item.no_rangka || "-",
        mesin: item.no_mesin || "-",
        polisi: item.no_polisi || "-",
        bpkb: item.no_bpkb || "-",
        asalUsul: item.asal_usul?.nama_asal || "-",
        asal_usul_id: item.asal_usul_id,
        harga: item.harga || 0,
        kondisi: item.kondisi,
        kir: item.kir?.nama_ruangan || "-",
        kir_id: item.kir_id,
        keterangan: item.keterangan || "-",
        foto: item.foto_url || null,
      }));

      const total = formattedData.length;
      const baik = formattedData.filter((item) => item.kondisi === "Baik").length;
      const perluPemeliharaanHitung = formattedData.filter((item) => item.kondisi === "Rusak Ringan" || item.kondisi === "Rusak Berat").length;
      const nilai = formattedData.reduce((sum, item) => sum + (Number(item.harga) || 0), 0);
      setStats({ totalAset: total, kondisiBaik: baik, perluPemeliharaan: perluPemeliharaanHitung, totalNilai: nilai });

      const rusakData = formattedData.filter((item) => item.kondisi === "Rusak Berat" || item.kondisi === "Rusak Ringan");
      setActionItems(rusakData);

      const yearCounts: Record<string, number> = {};
      formattedData.forEach((item) => {
        const year = item.tahun;
        if (year && year !== "-" && !isNaN(Number(year))) {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      });

      const sortedYears = Object.keys(yearCounts).sort();
      const recentYears = sortedYears.slice(-7);
      const maxCount = Math.max(...recentYears.map((y) => yearCounts[y]), 1);

      const dynamicChartData: ChartData[] = recentYears.map((year, index) => {
        const count = yearCounts[year];
        const heightPercentage = Math.max(15, Math.round((count / maxCount) * 100));
        return {
          year: year,
          count: count,
          heightPercentage: heightPercentage,
          isActive: index === recentYears.length - 1,
        };
      });

      setChartData(dynamicChartData);
    }

    // 2. FETCH DATA PAGU KENDARAAN TAHUN BERJALAN
    try {
      // Ambil PAGU tahun saat ini (dinamis)
      const { data: paguData } = await supabase
        .from('pagu')
        .select('nominal_tahunan')
        .eq('tahun', currentYear)
        .single();

      const paguTahunan = paguData ? Number(paguData.nominal_tahunan) : 0;
      const paguBulanan = Math.round(paguTahunan / 12);

      // Ambil Pemeliharaan Tahun Ini (dinamis)
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;

      const { data: pemeliharaanData } = await supabase
        .from('pemeliharaan')
        .select('tanggal_pengajuan, total_biaya')
        .gte('tanggal_pengajuan', startOfYear)
        .lte('tanggal_pengajuan', endOfYear);

      let realisasiTahunan = 0;
      let realisasiBulanIni = 0;

      if (pemeliharaanData) {
        pemeliharaanData.forEach(p => {
          const biaya = Number(p.total_biaya) || 0;
          realisasiTahunan += biaya;

          // Cek bulan berjalan (dinamis)
          if (p.tanggal_pengajuan) {
            const monthStr = p.tanggal_pengajuan.split('-')[1];
            if (parseInt(monthStr, 10) === currentMonthNum) {
              realisasiBulanIni += biaya;
            }
          }
        });
      }

      setPaguStats({
        totalTahunan: paguTahunan,
        sisaTahunan: paguTahunan - realisasiTahunan,
        sisaBulanIni: paguBulanan - realisasiBulanIni,
        realisasiBulanIni: realisasiBulanIni, // <-- Data ini dilempar ke UI
      });

    } catch (err) {
      console.error("Gagal mengambil data PAGU:", err);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
      setCurrentDate(new Date().toLocaleDateString("id-ID", options));
      fetchUserProfile();
      fetchDashboardData();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatRupiahSingkat = (angka: number) => {
    if (angka >= 1000000000) return `Rp ${parseFloat((angka / 1000000000).toFixed(2))} Miliar`;
    if (angka >= 1000000) return `Rp ${parseFloat((angka / 1000000).toFixed(2))} Juta`;
    return `Rp ${angka.toLocaleString("id-ID")}`;
  };

  const handleOpenDetail = (item: AssetItem) => {
    setSelectedAsset(item as unknown as AssetType);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, item: AssetItem) => {
    e.stopPropagation();
    setAssetToEdit(item);
    setIsEditModalOpen(true);
  };

  // Fungsi navigasi klik kartu PAGU
  const handlePaguClick = () => {
    router.push('/admin/pemeliharaan/kendaraan');
  };

  // Hitung Jatah Bulanan untuk ditampilkan di card
  const alokasiJatahBulanan = Math.round(paguStats.totalTahunan / 12);

  return (
    <div className="max-w-7xl mx-auto space-y-6 overflow-hidden pb-10">
      {/* WELCOME SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Halo, Selamat Datang <span className="text-blue-600">{userName}</span> di Panel Admin
          </h2>
          <p className="text-sm md:text-base text-slate-500">Berikut adalah ringkasan data inventaris aset Anda hari ini.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm w-fit shrink-0">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-sm font-semibold">{currentDate || "Memuat..."}</span>
        </div>
      </div>

      {/* STATISTIK KARTU INVENTARIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Package size={24} />
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">Total</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Inventaris</p>
          <h3 className="text-3xl font-bold text-slate-900">{isLoading ? <Loader2 size={28} className="animate-spin text-slate-300" /> : stats.totalAset}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Kondisi Baik</p>
          <h3 className="text-3xl font-bold text-slate-900">{isLoading ? <Loader2 size={28} className="animate-spin text-slate-300" /> : stats.kondisiBaik}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Wrench size={24} />
            </div>
            <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200/50 px-2.5 py-1 rounded-md">Urgent</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Perlu Pemeliharaan</p>
          <h3 className="text-3xl font-bold text-slate-900">{isLoading ? <Loader2 size={28} className="animate-spin text-slate-300" /> : stats.perluPemeliharaan}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Wallet size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Nilai Aset</p>
          <h3 className="text-3xl font-bold text-slate-900">{isLoading ? <Loader2 size={28} className="animate-spin text-slate-300" /> : formatRupiahSingkat(stats.totalNilai)}</h3>
        </div>
      </div>

      {/* ========================================================
          RINGKASAN PAGU KENDARAAN (4 KOLOM, DINAMIS)
          ======================================================== */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Ringkasan Anggaran Kendaraan (PAGU) {currentYear}</h3>

        <div onClick={handlePaguClick} className="cursor-pointer">
          <PemeliharaanStats
            paguTahunan={paguStats.totalTahunan}
            sisaPaguTahunan={paguStats.sisaTahunan}
            paguBulanan={alokasiJatahBulanan}
            realisasiBulanIni={paguStats.realisasiBulanIni}
            sisaPaguBulanIni={paguStats.sisaBulanIni}
            selectedYear={currentYear}
            selectedMonthName={currentMonthName}
            hideBensinStats={true}
          />
        </div>
      </div>
      {/* ======================================================== */}


      {/* GRID KONTEN BAWAH (Chart & Action Items) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK ASET DINAMIS BERDASARKAN TAHUN */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 md:mb-8 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pertumbuhan Aset</h3>
              <p className="text-xs text-slate-500 mt-1">Berdasarkan tahun pembelian teregistrasi (Klik batang untuk memfilter)</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <BarChart3 size={16} className="text-blue-600" />
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-end px-4 md:px-6 pb-6 pt-14 gap-2 md:gap-6 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex justify-center items-center">
                <Loader2 className="animate-spin text-slate-300" size={32} />
              </div>
            ) : chartData.length > 0 ? (
              chartData.map((bar, i) => (
                <div
                  key={i}
                  onClick={() => router.push(`/admin/inventaris?tahun=${bar.year}`)}
                  title={`Klik untuk melihat aset tahun ${bar.year}`}
                  className="w-full h-full flex flex-col justify-end items-center gap-3 group cursor-pointer relative"
                >
                  <div style={{ height: `${bar.heightPercentage}%` }} className={`w-full rounded-t-md transition-all duration-300 ease-out relative ${bar.isActive ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-200 hover:bg-blue-400"}`}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                      {bar.count} Aset ({bar.year})
                    </div>
                  </div>
                  <span className={`text-[10px] md:text-xs font-semibold ${bar.isActive ? "text-blue-600" : "text-slate-400"}`}>{bar.year}</span>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-400">
                <BarChart3 size={40} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Belum ada data tahun pembelian</p>
              </div>
            )}
          </div>
        </div>

        {/* MENUNGGU TINDAKAN */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[500px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-lg font-bold text-slate-900">Menunggu Tindakan</h3>
            <span className="bg-red-50 text-red-600 font-semibold text-xs px-2.5 py-1 rounded-full border border-red-200/50">{isLoading ? "..." : actionItems.length} Item</span>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            ) : actionItems.length > 0 ? (
              actionItems.map((item) => (
                <div key={item.id} onClick={() => handleOpenDetail(item)} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white group cursor-pointer shrink-0">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{item.nama}</h4>
                    <span className={`font-semibold text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${item.kondisi === "Rusak Berat" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                      {item.kondisi}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 font-medium">KODE: {item.kode}</p>
                  <button
                    onClick={(e) => handleOpenEdit(e, item)}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors"
                  >
                    Update Status
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
                <CheckCircle size={32} className="text-green-300" />
                <p>Semua aset dalam kondisi baik.</p>
              </div>
            )}
          </div>

          <Link href="/admin/pemeliharaan" className="mt-6 text-blue-600 text-sm font-bold hover:underline text-center w-full pt-4 border-t border-slate-100 shrink-0 block">
            Buka Menu Pemeliharaan
          </Link>
        </div>
      </div>

      <AssetDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} asset={selectedAsset} />
      <AssetEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} asset={assetToEdit} onSave={() => fetchDashboardData()} />
    </div>
  );
}