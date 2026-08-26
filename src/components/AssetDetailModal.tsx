"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Wrench, Download, ImageOff } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export type AssetType = {
  id: number;
  kode: string;
  nama: string;
  nomorRegister: string;
  merk: string;
  ukuran: string;
  bahan: string;
  tahun: string;
  pabrik: string;
  rangka: string;
  mesin: string;
  polisi: string;
  bpkb: string;
  asalUsul: string;
  harga: number | string;
  kondisi: string;
  kir: string;
  keterangan: string;
  kategori: string;
  foto?: string | null;
  kir_id?: number | null; // ID untuk Modal Edit
  asal_usul_id?: number | null; // ID untuk Modal Edit
};

type AssetDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetType | null;
};

export default function AssetDetailModal({ isOpen, onClose, asset }: AssetDetailModalProps) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setTimeout(() => {
      if (asset && typeof window !== "undefined") {
        setQrUrl(`${window.location.origin}/arsip/${asset.id}`);
      }
    }, 0);
  }, [asset]);

  if (!isOpen || !asset) return null;

  const downloadQRCode = () => {
    const canvas = document.getElementById("qrCodeAdminEl") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Stiker_QR_${asset.kode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const renderStatus = () => {
    if (asset.kondisi === "Baik")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold shadow-sm">
          <CheckCircle size={16} /> Kondisi: Baik
        </span>
      );
    if (asset.kondisi === "Rusak Ringan")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold shadow-sm">
          <Wrench size={16} /> Kondisi: Rusak Ringan
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold shadow-sm">
        <AlertTriangle size={16} /> Kondisi: Rusak Berat
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="relative flex w-full max-w-5xl max-h-[90vh] flex-col rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 md:p-6 bg-slate-50 rounded-t-xl">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Detail Informasi Inventaris</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* KOLOM KIRI: Foto & QR */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {/* --- LOGIKA FOTO KOSONG --- */}
                <div className="aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 relative shadow-sm flex items-center justify-center">
                  {asset.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.foto} alt="Foto Aset" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageOff size={48} className="opacity-50" />
                      <span className="text-xs font-medium">Tidak ada foto aset</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-start">{renderStatus()}</div>
              </div>

              <div className="w-full border-t border-slate-200 border-dashed"></div>

              <div className="flex flex-col items-center w-full gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center gap-3 w-full">
                  <QRCodeCanvas id="qrCodeAdminEl" value={qrUrl} size={140} level={"H"} includeMargin={true} />
                  <p className="text-xs font-mono text-slate-500 font-semibold">{asset.kode}</p>
                </div>
                <button onClick={downloadQRCode} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <Download size={18} /> Download Stiker QR
                </button>
              </div>
            </div>

            {/* KOLOM KANAN: Data Spesifikasi */}
            <div className="w-full lg:w-2/3 flex flex-col">
              <div className="mb-6 border-b border-slate-200 pb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{asset.nama}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">Kode Barang:</span>
                  <span className="rounded bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-700 border border-slate-200">{asset.kode}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Nomor Register", value: asset.nomorRegister },
                  { label: "Merk / Type", value: asset.merk },
                  { label: "Ukuran / CC", value: asset.ukuran },
                  { label: "Bahan", value: asset.bahan },
                  { label: "Tahun Pembelian", value: asset.tahun },
                  { label: "Pabrik", value: asset.pabrik },
                  { label: "Rangka", value: asset.rangka },
                  { label: "No Mesin", value: asset.mesin },
                  { label: "Polisi", value: asset.polisi },
                  { label: "BPKB", value: asset.bpkb },
                  { label: "Asal Usul", value: asset.asalUsul },
                  { label: "Harga (Rp)", value: `Rp ${Number(asset.harga).toLocaleString("id-ID")}` },
                  { label: "Lokasi Ruangan (KIR)", value: asset.kir },
                  { label: "Kategori", value: asset.kategori },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col border-b border-slate-100 pb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</span>
                    <span className="text-sm md:text-base font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
                <div className="flex flex-col sm:col-span-2 pt-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Keterangan</span>
                  <span className="text-sm md:text-base text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{asset.keterangan}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4 md:p-6 rounded-b-xl">
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors shadow-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
