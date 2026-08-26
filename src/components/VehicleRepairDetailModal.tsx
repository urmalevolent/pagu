"use client";

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  X,
  Info,
  Wrench,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import Swal from "sweetalert2";

// Import fungsi PDF
import {
  generateVehicleRepairNotaPdf,
  VehicleRepairPrintData,
} from "@/utils/exportVehicleRepairNota";

// ==========================================
// TYPE DATA
// ==========================================

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pemeliharaanId: number | null;
}

interface VehicleData {
  nama_barang: string | null;
  merk_type: string | null;
  no_polisi: string | null;
}

interface PemeliharaanDetail {
  id: number;
  nama_barang: string | null;
  banyaknya: number | null;
  unit: string | null;
  harga_unit: number | null;
  jumlah: number | null;
  keterangan: string | null;
}

interface PemeliharaanData {
  id: number;
  tanggal_pengajuan: string | null;
  bengkel_rekanan: string | null;
  total_biaya: number | null;
  kategori_pengeluaran: string | null;
  inventaris_kib_b:
    | VehicleData
    | VehicleData[]
    | null;
  pemeliharaan_detail:
    | PemeliharaanDetail[]
    | null;
}

export default function VehicleRepairDetailModal({
  isOpen,
  onClose,
  pemeliharaanId,
}: DetailModalProps) {
  // Buat instance Supabase stabil
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [data, setData] =
    useState<PemeliharaanData | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isPrinting, setIsPrinting] = 
    useState(false);

  // STATE BARU: Modal Print Shadcn Style
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printKeterangan, setPrintKeterangan] = useState("");

  // ==========================================
  // FETCH DETAIL
  // ==========================================

  useEffect(() => {
    if (!isOpen || pemeliharaanId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);

      try {
        const {
          data: detailData,
          error,
        } = await supabase
          .from("pemeliharaan")
          .select(`
            *,
            inventaris_kib_b (
              nama_barang,
              merk_type,
              no_polisi
            ),
            pemeliharaan_detail (
              *
            )
          `)
          .eq("id", pemeliharaanId)
          .single();

        if (error) {
          throw error;
        }

        const rawData =
          detailData as unknown as PemeliharaanData;

        const normalizedData: PemeliharaanData = {
          ...rawData,

          inventaris_kib_b:
            Array.isArray(
              rawData.inventaris_kib_b
            )
              ? rawData.inventaris_kib_b[0] ||
                null
              : rawData.inventaris_kib_b,

          pemeliharaan_detail:
            rawData.pemeliharaan_detail ||
            [],
        };

        setData(normalizedData);
      } catch (error) {
        console.error(
          "Gagal mengambil detail:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [
    isOpen,
    pemeliharaanId,
    supabase,
  ]);

  // ==========================================
  // FORMAT TANGGAL
  // ==========================================

  const formatDate = (
    dateString: string | null
  ) => {
    if (!dateString) {
      return "-";
    }

    const d = new Date(dateString);

    return d.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // PRINT DATA / GENERATE PDF (DIUBAH)
  // ==========================================

  const openPrintModal = () => {
    if (!data) return;
    setPrintKeterangan("");
    setIsPrintModalOpen(true);
  };

  const handleConfirmPrint = async () => {
    if (isPrinting || !data) return;

    setIsPrintModalOpen(false);
    setIsPrinting(true);

    Swal.fire({
      title: "Menyiapkan nota...",
      text: "Sedang membuat PDF.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const rawData = data as unknown as VehicleRepairPrintData;
      
      const normalizedData: VehicleRepairPrintData = {
        ...rawData,
        inventaris_kib_b: Array.isArray(rawData.inventaris_kib_b) 
          ? rawData.inventaris_kib_b[0] ?? null 
          : rawData.inventaris_kib_b,
        pemeliharaan_detail: rawData.pemeliharaan_detail ?? [],
      };

      Swal.close();

      // Passing keterangan dari inputan user ke fungsi print
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
    }
  };

  // ==========================================
  // JIKA MODAL TIDAK DIBUKA
  // ==========================================

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="bg-white w-full max-w-7xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col mx-4">

        {/* ========================================== */}
        {/* HEADER MODAL */}
        {/* ========================================== */}

        <div className="flex justify-between items-center p-6 border-b shrink-0">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Detail Pemeliharaan Kendaraan
            </h2>

            <p className="text-sm text-gray-500">
              Rincian data pengajuan yang telah tersimpan di sistem.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* ========================================== */}
        {/* BODY MODAL */}
        {/* ========================================== */}

        <div className="overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar p-6">

          {isLoading || !data ? (

            <div className="flex flex-col items-center justify-center h-40 text-gray-500">

              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>

              <p>
                Memuat detail data...
              </p>

            </div>

          ) : (

            <div className="space-y-6">

              {/* ========================================== */}
              {/* SECTION 1: INFORMASI PENGAJUAN */}
              {/* ========================================== */}

              <div className="bg-white p-5 rounded-lg border shadow-sm">

                <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold">

                  <Info size={18} />

                  <h3>
                    INFORMASI PENGAJUAN
                  </h3>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* TANGGAL */}
                  <div>

                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Tanggal Pengajuan
                    </label>

                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">
                      {formatDate(
                        data.tanggal_pengajuan
                      )}
                    </div>

                  </div>

                  {/* BENGKEL */}
                  <div>

                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Bengkel Rekanan
                    </label>

                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">
                      {data.bengkel_rekanan ||
                        "-"}
                    </div>

                  </div>

                  {/* KENDARAAN */}
                  <div>

                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Kendaraan
                    </label>

                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">

                      [
                      {
                        Array.isArray(
                          data.inventaris_kib_b
                        )
                          ? data
                              .inventaris_kib_b[0]
                              ?.no_polisi
                          : data
                              .inventaris_kib_b
                              ?.no_polisi
                      }
                      ]{" "}

                      {
                        Array.isArray(
                          data.inventaris_kib_b
                        )
                          ? data
                              .inventaris_kib_b[0]
                              ?.nama_barang
                          : data
                              .inventaris_kib_b
                              ?.nama_barang
                      }{" "}

                      {
                        (
                          Array.isArray(
                            data.inventaris_kib_b
                          )
                            ? data
                                .inventaris_kib_b[0]
                                ?.merk_type
                            : data
                                .inventaris_kib_b
                                ?.merk_type
                        )
                          ? `- ${
                              Array.isArray(
                                data.inventaris_kib_b
                              )
                                ? data
                                    .inventaris_kib_b[0]
                                    ?.merk_type
                                : data
                                    .inventaris_kib_b
                                    ?.merk_type
                            }`
                          : ""
                      }

                    </div>

                  </div>

                  {/* KATEGORI */}
                  <div>

                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Kategori Pengeluaran
                    </label>

                    <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">
                      {
                        data.kategori_pengeluaran ||
                        "Pemeliharaan"
                      }
                    </div>

                  </div>

                </div>

              </div>

              {/* ========================================== */}
              {/* SECTION 2: DETAIL PEMELIHARAAN */}
              {/* ========================================== */}

              <div className="bg-white rounded-lg border shadow-sm flex flex-col">

                <div className="bg-gray-50 p-5 border-b rounded-t-lg">

                  <div className="flex items-center gap-2 text-blue-600 font-semibold">

                    <Wrench size={18} />

                    <h3>
                      DETAIL PEMELIHARAAN BARANG / JASA
                    </h3>

                  </div>

                </div>

                <div className="p-5 space-y-4">

                  {data.pemeliharaan_detail &&
                  data.pemeliharaan_detail.length >
                    0 ? (

                    data.pemeliharaan_detail.map(
                      (item: PemeliharaanDetail) => ( // <-- PERBAIKAN: Tipe 'any' diganti

                        <div
                          key={item.id}
                          className="flex gap-2 items-start border-b pb-4 last:border-0"
                        >

                          <div className="grid grid-cols-12 gap-3 flex-1">

                            {/* NAMA BARANG */}
                            <div className="col-span-12 md:col-span-3">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Nama Barang / Jasa
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">
                                {item.nama_barang ||
                                  "-"}
                              </div>

                            </div>

                            {/* BANYAKNYA */}
                            <div className="col-span-4 md:col-span-1">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Banyaknya
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium text-center">
                                {
                                  item.banyaknya ??
                                  "-"
                                }
                              </div>

                            </div>

                            {/* UNIT */}
                            <div className="col-span-4 md:col-span-1">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Unit
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium text-center">
                                {item.unit ||
                                  "-"}
                              </div>

                            </div>

                            {/* HARGA / UNIT */}
                            <div className="col-span-4 md:col-span-2">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Harga / Unit
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium">
                                Rp{" "}
                                {Number(
                                  item.harga_unit ||
                                    0
                                ).toLocaleString(
                                  "id-ID"
                                )}
                              </div>

                            </div>

                            {/* JUMLAH BIAYA */}
                            <div className="col-span-12 md:col-span-2">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Jumlah Biaya
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-emerald-50 rounded-md text-sm text-emerald-800 font-bold">
                                Rp{" "}
                                {Number(
                                  item.jumlah ||
                                    0
                                ).toLocaleString(
                                  "id-ID"
                                )}
                              </div>

                            </div>

                            {/* KETERANGAN */}
                            <div className="col-span-12 md:col-span-3">

                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Keterangan
                              </label>

                              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-800 font-medium min-h-[38px] break-words">
                                {item.keterangan ||
                                  "-"}
                              </div>

                            </div>

                          </div>

                        </div>

                      )
                    )

                  ) : (

                    <p className="text-center text-gray-500 text-sm py-4">
                      Tidak ada detail barang untuk pengajuan ini.
                    </p>

                  )}

                </div>

              </div>

            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* FOOTER */}
        {/* ========================================== */}

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between shrink-0">

          <div className="text-right ml-auto mr-6">

            <span className="text-sm font-medium text-gray-500">
              Total Keseluruhan:
            </span>

            <div className="text-xl font-bold text-blue-700">
              Rp{" "}
              {data
                ? Number(
                    data.total_biaya || 0
                  ).toLocaleString("id-ID")
                : "0"}
            </div>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={openPrintModal}
              disabled={isPrinting || !data || isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              Cetak
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 rounded-md text-white font-medium hover:bg-slate-900 transition shadow-sm text-sm"
            >
              Tutup
            </button>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL PRINT (KETERANGAN KWITANSI) SHADCN */}
      {/* ========================================== */}

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
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

    </div>
  );
}