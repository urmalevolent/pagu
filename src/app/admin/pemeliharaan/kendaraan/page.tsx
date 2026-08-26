"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  Plus,
  Filter,
  Eye,
  SquarePen,
  Printer,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Edit3,
  Wallet,
  CreditCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Wrench,
} from "lucide-react";
import Swal from "sweetalert2";

import VehicleRepairModal from "@/components/VehicleRepairModal";
import { Skeleton } from "@/components/ui/skeleton";
import PemeliharaanStats from "@/components/PemeliharaanStats";
import VehicleRepairDetailModal from "@/components/VehicleRepairDetailModal";
import VehicleRepairEditModal from "@/components/VehicleRepairEditModal";

import { createClient } from "@/lib/supabase";

import {
  generateVehicleRepairNotaPdf,
  VehicleRepairPrintData,
} from "@/utils/exportVehicleRepairNota";

// ==========================================
// TYPE DATA
// ==========================================

interface VehicleRelation {
  nama_barang: string | null;
  merk_type: string | null;
  no_polisi: string | null;
}

interface PemeliharaanItem {
  id: number;
  tanggal_pengajuan: string | null;
  bengkel_rekanan: string | null;
  total_biaya: number | null;
  kategori_pengeluaran: string | null;
  inventaris_kib_b: VehicleRelation | null;
}

interface PemeliharaanQueryItem {
  id: number;
  tanggal_pengajuan: string | null;
  bengkel_rekanan: string | null;
  total_biaya: number | null;
  kategori_pengeluaran: string | null;
  inventaris_kib_b:
  | VehicleRelation[]
  | VehicleRelation
  | null;
}

interface YearData {
  tahun: number;
}

// ==========================================
// PAGE
// ==========================================

export default function KendaraanPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [paguTahunan, setPaguTahunan] = useState(0);
  const [pemeliharaanList, setPemeliharaanList] = useState<PemeliharaanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonthNum = new Date().getMonth() + 1;

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState("");
  const [newPaguInput, setNewPaguInput] = useState("");
  const [isSubmittingYear, setIsSubmittingYear] = useState(false);

  const [isEditPaguModalOpen, setIsEditPaguModalOpen] = useState(false);
  const [editPaguInput, setEditPaguInput] = useState("");
  const [isSubmittingEditPagu, setIsSubmittingEditPagu] = useState(false);

  // STATE BARU: Modal Print Shadcn Style
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printKeterangan, setPrintKeterangan] = useState("");
  const [printPemeliharaanId, setPrintPemeliharaanId] = useState<number | null>(null);

  const months = [
    { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
    { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
    { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
    { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
  ];

  const selectedMonthName = months.find((m) => m.value === selectedMonth)?.label;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedMonth, itemsPerPage]);

  useEffect(() => {
    const savedMonth = localStorage.getItem("sate_selected_month");
    if (savedMonth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMonth(parseInt(savedMonth, 10));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchYears = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase
          .from("pagu")
          .select("tahun")
          .order("tahun", { ascending: false });

        if (error) {
          if (error.code === "PGRST303" && retryCount < 3) {
            setTimeout(() => {
              if (isMounted) void fetchYears(retryCount + 1);
            }, 1000);
            return;
          }
          throw error;
        }

        if (data && data.length > 0) {
          const years = (data as YearData[]).map((d) => d.tahun);
          years.sort((a, b) => b - a);
          setAvailableYears(years);

          const savedYear = localStorage.getItem("sate_selected_year");
          if (savedYear && years.includes(parseInt(savedYear, 10))) {
            setSelectedYear(savedYear);
          } else {
            setSelectedYear(years[0].toString());
          }
        } else {
          setAvailableYears([]);
          setSelectedYear("");
        }
      } catch (error: unknown) {
        const errorCode = typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "") : "";
        if (errorCode !== "PGRST303") {
          console.error("Gagal mengambil daftar tahun:", error);
        }
        if (isMounted) {
          setAvailableYears([]);
          setSelectedYear("");
        }
      }
    };

    void fetchYears();
    return () => { isMounted = false; };
  }, [supabase]);

  useEffect(() => {
    if (selectedYear) localStorage.setItem("sate_selected_year", selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth) localStorage.setItem("sate_selected_month", selectedMonth.toString());
  }, [selectedMonth]);

  const fetchData = useCallback(async () => {
    if (!selectedYear) {
      setIsLoading(false);
      setPaguTahunan(0);
      setPemeliharaanList([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: paguData } = await supabase
        .from("pagu")
        .select("nominal_tahunan")
        .eq("tahun", parseInt(selectedYear, 10))
        .single();

      if (paguData) {
        setPaguTahunan(Number(paguData.nominal_tahunan));
      } else {
        setPaguTahunan(0);
      }

      const startOfYear = `${selectedYear}-01-01`;
      const endOfYear = `${selectedYear}-12-31`;

      const { data: pemeliharaanData, error } = await supabase
        .from("pemeliharaan")
        .select(`id, tanggal_pengajuan, bengkel_rekanan, total_biaya, kategori_pengeluaran, inventaris_kib_b ( nama_barang, merk_type, no_polisi )`)
        .gte("tanggal_pengajuan", startOfYear)
        .lte("tanggal_pengajuan", endOfYear)
        .order("tanggal_pengajuan", { ascending: false });

      if (error) throw error;

      const rawData = (pemeliharaanData || []) as unknown as PemeliharaanQueryItem[];
      const normalizedData: PemeliharaanItem[] = rawData.map((item) => ({
        id: item.id,
        tanggal_pengajuan: item.tanggal_pengajuan,
        bengkel_rekanan: item.bengkel_rekanan,
        total_biaya: item.total_biaya,
        kategori_pengeluaran: item.kategori_pengeluaran,
        inventaris_kib_b: Array.isArray(item.inventaris_kib_b) ? item.inventaris_kib_b[0] ?? null : item.inventaris_kib_b,
      }));

      setPemeliharaanList(normalizedData);
    } catch (error) {
      console.error("Gagal mengambil data dari Supabase:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  // ==========================================
  // PRINT DATA / GENERATE PDF 
  // ==========================================

  const openPrintModal = (id: number) => {
    setPrintPemeliharaanId(id);
    setPrintKeterangan("");
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = async () => {
    if (!printPemeliharaanId || isPrinting) return;

    setIsPrintModalOpen(false);
    setIsPrinting(true);

    Swal.fire({
      title: "Menyiapkan nota...",
      text: "Sedang mengambil data pemeliharaan dan membuat PDF.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const { data, error } = await supabase
        .from("pemeliharaan")
        .select(`id, tanggal_pengajuan, bengkel_rekanan, total_biaya, kategori_pengeluaran, inventaris_kib_b ( nama_barang, merk_type, no_polisi ), pemeliharaan_detail ( id, nama_barang, banyaknya, unit, harga_unit, jumlah, keterangan )`)
        .eq("id", printPemeliharaanId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Data pemeliharaan tidak ditemukan.");

      const rawData = data as unknown as VehicleRepairPrintData;
      const normalizedData: VehicleRepairPrintData = {
        ...rawData,
        inventaris_kib_b: Array.isArray(rawData.inventaris_kib_b) ? rawData.inventaris_kib_b[0] ?? null : rawData.inventaris_kib_b,
        pemeliharaan_detail: rawData.pemeliharaan_detail ?? [],
      };

      Swal.close();

      // Passing keterangan dari inputan modal ke fungsi print
      generateVehicleRepairNotaPdf(normalizedData, printKeterangan || "-");

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "3 Halaman Nota & Kwitansi berhasil dibuat.",
        confirmButtonColor: "#2563eb",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      Swal.close();
      console.error("Gagal membuat nota:", error);
      const message = error instanceof Error ? error.message : "Gagal membuat nota.";
      await Swal.fire({
        icon: "error",
        title: "Gagal Mencetak",
        text: message,
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsPrinting(false);
      setPrintPemeliharaanId(null);
    }
  };

  const paguBulanan = Math.round(paguTahunan / 12);
  const realisasiTahunan = pemeliharaanList.reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);

  const pemeliharaanBulanIni = pemeliharaanList.filter((p) => {
    if (!p.tanggal_pengajuan) return false;
    const monthStr = p.tanggal_pengajuan.split("-")[1];
    return parseInt(monthStr, 10) === selectedMonth;
  });

  const realisasiBulanIni = pemeliharaanBulanIni.reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);
  const sisaPaguTahunan = paguTahunan - realisasiTahunan;
  const sisaPaguBulanIni = paguBulanan - realisasiBulanIni;

  const bensinTahunan = pemeliharaanList.filter((p) => p.kategori_pengeluaran === "Bensin").reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);
  const pemeliharaanKategoriTahunan = pemeliharaanList.filter((p) => p.kategori_pengeluaran === "Pemeliharaan").reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);
  const bensinBulanan = pemeliharaanBulanIni.filter((p) => p.kategori_pengeluaran === "Bensin").reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);
  const pemeliharaanKategoriBulanan = pemeliharaanBulanIni.filter((p) => p.kategori_pengeluaran === "Pemeliharaan").reduce((sum, item) => sum + Number(item.total_biaya || 0), 0);

  const filteredPemeliharaanList = pemeliharaanList.filter((item) => {
    if (item.tanggal_pengajuan) {
      const monthStr = item.tanggal_pengajuan.split("-")[1];
      if (parseInt(monthStr, 10) !== selectedMonth) return false;
    } else {
      return false;
    }
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const namaKendaraan = item.inventaris_kib_b?.nama_barang?.toLowerCase() || "";
    const platNomor = item.inventaris_kib_b?.no_polisi?.toLowerCase() || "";
    return namaKendaraan.includes(searchLower) || platNomor.includes(searchLower);
  });

  const totalItems = filteredPemeliharaanList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredPemeliharaanList.slice(startIndex, endIndex);

  const handleDelete = (id: number, platNomor: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Data pemeliharaan untuk kendaraan ${platNomor} akan dihapus!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from("pemeliharaan").delete().eq("id", id);
          if (error) throw error;
          setPemeliharaanList((prev) => prev.filter((item) => item.id !== id));
          Swal.fire("Terhapus!", "Data berhasil dihapus.", "success").then(() => { window.location.reload(); });
        } catch {
          Swal.fire("Error", "Gagal menghapus data.", "error");
        }
      }
    });
  };

  const openEditPaguModal = () => {
    setEditPaguInput(paguTahunan.toString());
    setIsEditPaguModalOpen(true);
  };

  const handleSaveEditPagu = async () => {
    if (!editPaguInput || isNaN(Number(editPaguInput))) {
      Swal.fire("Error", "Harap masukkan nominal yang valid.", "error");
      return;
    }
    setIsSubmittingEditPagu(true);
    try {
      const { error } = await supabase.from("pagu").upsert({ tahun: parseInt(selectedYear, 10), nominal_tahunan: Number(editPaguInput) }, { onConflict: "tahun" });
      if (error) throw error;
      setPaguTahunan(Number(editPaguInput));
      setIsEditPaguModalOpen(false);
      Swal.fire("Tersimpan!", "PAGU Tahunan berhasil diperbarui.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal";
      Swal.fire("Error", `Gagal menyimpan: ${message}`, "error");
    } finally {
      setIsSubmittingEditPagu(false);
    }
  };

  const handleAddYear = async () => {
    if (!newYearInput || isNaN(Number(newYearInput))) {
      Swal.fire("Error", "Harap masukkan tahun yang valid.", "error");
      return;
    }
    const yearToInsert = parseInt(newYearInput, 10);
    if (availableYears.includes(yearToInsert)) {
      Swal.fire({ title: "Tahun Sudah Ada!", text: `Tahun anggaran ${yearToInsert} sudah ada di database. Silakan pilih di menu dropdown.`, icon: "warning", confirmButtonColor: "#3b82f6" });
      return;
    }
    setIsSubmittingYear(true);
    try {
      const paguToInsert = Number(newPaguInput) || 0;
      const { error } = await supabase.from("pagu").insert([{ tahun: yearToInsert, nominal_tahunan: paguToInsert }]);
      if (error && error.code !== "23505") throw error;
      const updatedYears = [...availableYears, yearToInsert].sort((a, b) => b - a);
      setAvailableYears(updatedYears);
      setSelectedYear(yearToInsert.toString());
      setIsAddYearModalOpen(false);
      setNewYearInput("");
      setNewPaguInput("");
      Swal.fire("Berhasil", "Tahun anggaran berhasil ditambahkan.", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal";
      Swal.fire("Error", "Gagal menambahkan tahun: " + message, "error");
    } finally {
      setIsSubmittingYear(false);
    }
  };

  return (
    <div className="p-6 max-w-full overflow-hidden flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Kendaraan & PAGU</h1>
          <p className="text-gray-500 text-sm mt-1">Monitoring anggaran (PAGU) dan daftar pemeliharaan kendaraan dinas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white text-black border border-gray-300 rounded-lg px-3 py-2 shadow-sm w-fit">
            <Calendar size={18} className="text-gray-500" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))} className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer">
              {months.map((m) => (<option key={m.value} value={m.value}>Bulan {m.label}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white text-black border border-gray-300 rounded-lg px-3 py-2 shadow-sm w-fit">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent text-sm font-medium text-gray-800 focus:outline-none cursor-pointer">
              {availableYears.map((year) => (<option key={year} value={year}>Tahun Anggaran {year}</option>))}
            </select>
          </div>
          <button type="button" onClick={() => setIsAddYearModalOpen(true)} className="flex items-center justify-center p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition text-gray-600" title="Tambah Tahun Anggaran">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <PemeliharaanStats
        paguTahunan={paguTahunan}
        sisaPaguTahunan={sisaPaguTahunan}
        paguBulanan={paguBulanan}
        realisasiBulanIni={realisasiBulanIni}
        sisaPaguBulanIni={sisaPaguBulanIni}
        bensinTahunan={bensinTahunan}
        bensinBulanan={bensinBulanan}
        pemeliharaanKategoriTahunan={pemeliharaanKategoriTahunan}
        pemeliharaanKategoriBulanan={pemeliharaanKategoriBulanan}
        selectedYear={selectedYear}
        selectedMonthName={selectedMonthName}
        onEditPagu={openEditPaguModal}
      />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm font-medium text-black placeholder:font-normal placeholder:text-gray-400" placeholder="Cari plat nomor atau nama kendaraan..." />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition">
            <Plus size={16} /> Ajukan
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-16">NO</th>
                <th className="px-6 py-4">NAMA KENDARAAN</th>
                <th className="px-6 py-4">PLAT NOMOR</th>
                <th className="px-6 py-4">KATEGORI PENGELUARAN</th>
                <th className="px-6 py-4">TOTAL BIAYA</th>
                <th className="px-6 py-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="px-6 py-5"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-7" />
                        <Skeleton className="h-7 w-7" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">{searchQuery ? "Data tidak ditemukan." : "Belum ada pengajuan pemeliharaan untuk bulan ini."}</td>
                </tr>
              ) : (
                paginatedList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{item.inventaris_kib_b?.nama_barang}{item.inventaris_kib_b?.merk_type ? ` - ${item.inventaris_kib_b.merk_type}` : ""}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{item.inventaris_kib_b?.no_polisi || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{item.kategori_pengeluaran || "Pemeliharaan"}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">Rp {Number(item.total_biaya || 0).toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-3 text-gray-400">
                        <button type="button" onClick={() => { setSelectedDetailId(item.id); setIsDetailModalOpen(true); }} className="hover:text-gray-700 transition" title="Lihat Detail"><Eye size={18} /></button>
                        <button type="button" onClick={() => { setSelectedEditId(item.id); setIsEditModalOpen(true); }} className="hover:text-blue-600 transition" title="Edit"><SquarePen size={18} /></button>
                        <button type="button" onClick={() => openPrintModal(item.id)} disabled={isPrinting} className="hover:text-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title={isPrinting ? "Sedang membuat nota..." : "Cetak 3 Nota"}><Printer size={18} /></button>
                        <button type="button" onClick={() => handleDelete(item.id, item.inventaris_kib_b?.no_polisi || "-")} className="hover:text-red-600 transition" title="Hapus"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <span className="text-sm text-gray-500 font-medium">Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} data</span>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Rows per page</span>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white cursor-pointer">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || totalPages === 0} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:hover:text-slate-700 disabled:hover:bg-transparent transition-colors"><ChevronLeft size={16} />Previous</button>
              <button type="button" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:hover:text-slate-700 disabled:hover:bg-transparent transition-colors">Next<ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {isAddYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Tambah Tahun Anggaran</h2>
              <p className="text-sm text-gray-500 mt-1.5">Masukkan tahun anggaran baru untuk ditambahkan ke dalam filter.</p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                  <input type="number" value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Contoh: 2027" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nominal PAGU Tahunan</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 text-sm font-medium">Rp.</span>
                    <input type="number" value={newPaguInput} onChange={(e) => setNewPaguInput(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2 border-t">
              <button type="button" onClick={() => setIsAddYearModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm">Batal</button>
              <button type="button" onClick={handleAddYear} disabled={isSubmittingYear} className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition shadow-sm text-sm disabled:opacity-50">{isSubmittingYear ? "Menyimpan..." : "Simpan Tahun"}</button>
            </div>
          </div>
        </div>
      )}

      {isEditPaguModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Sesuaikan PAGU Tahunan</h2>
              <p className="text-sm text-gray-500 mt-1.5">Ubah anggaran pemeliharaan untuk tahun berjalan ({selectedYear}).</p>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nominal PAGU Tahunan</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-900 text-sm font-medium">Rp.</span>
                  <input type="number" value={editPaguInput} onChange={(e) => setEditPaguInput(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2 border-t">
              <button type="button" onClick={() => setIsEditPaguModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm">Batal</button>
              <button type="button" onClick={handleSaveEditPagu} disabled={isSubmittingEditPagu} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm text-sm disabled:opacity-50">{isSubmittingEditPagu ? "Menyimpan..." : "Simpan Perubahan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Print Keterangan Pembayaran (Shadcn Style) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg border overflow-hidden mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Keterangan Kwitansi</h2>
              <p className="text-sm text-gray-500 mt-1.5">Masukkan keterangan &quot;Untuk Pembayaran&quot; yang akan tercetak di Kwitansi.</p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Untuk Pembayaran</label>
                <textarea
                  value={printKeterangan}
                  onChange={(e) => setPrintKeterangan(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal resize-none"
                  placeholder="Contoh: Belanja Jasa Tenaga Kerja Non Pegawai (Jasa Pengangkutan Sampah)..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isPrinting ? 'Menyiapkan...' : 'Cetak Dokumen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <VehicleRepairModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); void fetchData(); }} />
      <VehicleRepairDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} pemeliharaanId={selectedDetailId} />
      <VehicleRepairEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        pemeliharaanId={selectedEditId}
        onSaved={(updatedData) => {
          setPemeliharaanList((prev) =>
            prev.map((item) =>
              item.id === updatedData.id
                ? {
                  ...item,
                  tanggal_pengajuan: updatedData.tanggal_pengajuan,
                  bengkel_rekanan: updatedData.bengkel_rekanan,
                  total_biaya: updatedData.total_biaya,
                  kategori_pengeluaran: updatedData.kategori_pengeluaran,
                  inventaris_kib_b: updatedData.inventaris_kib_b,
                }
                : item
            )
          );
        }}
      />
    </div>
  );
}