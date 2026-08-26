"use client";

import { useState, useEffect } from "react";
import { Search, Edit, Eye, AlertTriangle, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase";
import AssetDetailModal, { AssetType } from "@/components/AssetDetailModal";
import AssetEditModal from "@/components/AssetEditModal";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetItem } from "@/utils/exportPdfKibB";

export default function PemeliharaanPage() {
  const [dataPemeliharaan, setDataPemeliharaan] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<AssetItem | null>(null);

  const supabase = createClient();

  const fetchPemeliharaan = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("inventaris_kib_b").select("*, kir:master_kir(nama_ruangan), asal_usul:master_asal_usul(nama_asal)").in("kondisi", ["Rusak Ringan", "Rusak Berat"]).order("id", { ascending: false });

    if (!error && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedData: AssetItem[] = data.map((item: Record<string, any>) => ({
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
        kategori: item.kategori || "lainnya",
        foto: item.foto_url || null,
      }));
      setDataPemeliharaan(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPemeliharaan();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = dataPemeliharaan.filter((item) => item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.kode.includes(searchTerm));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Pemeliharaan Aset</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar inventaris yang membutuhkan perbaikan atau tindakan (Rusak Ringan / Rusak Berat).</p>
        </div>

        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari aset rusak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* SKELETON LOADER INTEGRASI */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full min-h-100">
        <div className="overflow-x-auto w-full flex-1">
          <table className="min-w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">Kode Barang</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Kondisi</th>
                <th className="px-6 py-4">Lokasi (KIR)</th>
                <th className="px-6 py-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {isLoading ? (
                /* SKELETON LOADER UNTUK 3 BARIS TABEL */
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-6" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-5">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{item.kode}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.nama}</td>
                    <td className="px-6 py-4">
                      {item.kondisi === "Rusak Ringan" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                          <Wrench size={12} /> Rusak Ringan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/50">
                          <AlertTriangle size={12} /> Rusak Berat
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.kir}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAsset(item as unknown as AssetType);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setAssetToEdit(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Update Status & Perbaikan"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Hebat! Tidak ada aset yang rusak atau menunggu tindakan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} asset={selectedAsset} />
      <AssetEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} asset={assetToEdit} onSave={() => fetchPemeliharaan()} />
    </div>
  );
}
