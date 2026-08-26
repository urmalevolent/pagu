import React from "react";
import {
  DollarSign,
  Wallet,
  CreditCard,
  Activity,
  TrendingDown,
  TrendingUp,
  Edit3,
  Fuel,
  Wrench,
} from "lucide-react";

export interface PemeliharaanStatsProps {
  paguTahunan: number;
  sisaPaguTahunan: number;
  paguBulanan: number;
  realisasiBulanIni: number;
  sisaPaguBulanIni: number;
  bensinTahunan?: number;
  bensinBulanan?: number;
  pemeliharaanKategoriTahunan?: number;
  pemeliharaanKategoriBulanan?: number;
  selectedYear: string | number;
  selectedMonthName: string | undefined;
  onEditPagu?: () => void;
  hideBensinStats?: boolean;
}

export default function PemeliharaanStats({
  paguTahunan,
  sisaPaguTahunan,
  paguBulanan,
  realisasiBulanIni,
  sisaPaguBulanIni,
  bensinTahunan = 0,
  bensinBulanan = 0,
  pemeliharaanKategoriTahunan = 0,
  pemeliharaanKategoriBulanan = 0,
  selectedYear,
  selectedMonthName,
  onEditPagu,
  hideBensinStats = false,
}: PemeliharaanStatsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-500">Total PAGU Tahunan</h3>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-800">Rp {paguTahunan.toLocaleString("id-ID")}</div>
              {onEditPagu && (
                <button type="button" onClick={onEditPagu} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition tooltip" title="Sesuaikan PAGU">
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Anggaran pemeliharaan tahun ini</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-500">Sisa PAGU Tahunan</h3>
            <Wallet className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold ${sisaPaguTahunan < 0 ? "text-red-600" : "text-gray-800"}`}>
              {sisaPaguTahunan < 0 ? `- Rp ${Math.abs(sisaPaguTahunan).toLocaleString("id-ID")}` : `Rp ${sisaPaguTahunan.toLocaleString("id-ID")}`}
            </div>
            <p className="text-xs text-gray-400 mt-1">Sisa anggaran untuk tahun {selectedYear}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-500">Alokasi Jatah Bulanan</h3>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">Rp {paguBulanan.toLocaleString("id-ID")}</div>
            <p className="text-xs text-gray-400 mt-1">Sistem bagi rata 12 bulan</p>
          </div>
        </div>
        <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${sisaPaguBulanIni < 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className="flex items-center justify-between pb-2">
            <h3 className={`tracking-tight text-sm font-medium ${sisaPaguBulanIni < 0 ? "text-red-600" : "text-emerald-700"}`}>
              Status Bulan {selectedMonthName} {selectedYear}
            </h3>
            <Activity className={`h-4 w-4 ${sisaPaguBulanIni < 0 ? "text-red-400" : "text-emerald-400"}`} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${sisaPaguBulanIni < 0 ? "text-red-700" : "text-emerald-800"}`}>
              Rp {realisasiBulanIni.toLocaleString("id-ID")}
            </div>
            <div className={`flex items-center gap-1.5 mt-1 text-xs font-bold uppercase tracking-wide ${sisaPaguBulanIni < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {sisaPaguBulanIni < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {sisaPaguBulanIni < 0 ? `Kekurangan Rp ${Math.abs(sisaPaguBulanIni).toLocaleString("id-ID")}` : `Sisa Rp ${sisaPaguBulanIni.toLocaleString("id-ID")}`}
            </div>
          </div>
        </div>
      </div>

      {!hideBensinStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium text-gray-500">Total Bensin Pertahun</h3>
              <Fuel className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Rp {bensinTahunan.toLocaleString("id-ID")}</div>
              <p className="text-xs text-gray-400 mt-1">Total pengeluaran bensin {selectedYear}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium text-gray-500">Total Bensin Perbulan</h3>
              <Fuel className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Rp {bensinBulanan.toLocaleString("id-ID")}</div>
              <p className="text-xs text-gray-400 mt-1">Pengeluaran bensin bulan {selectedMonthName}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium text-gray-500">Total Pemeliharaan Pertahun</h3>
              <Wrench className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Rp {pemeliharaanKategoriTahunan.toLocaleString("id-ID")}</div>
              <p className="text-xs text-gray-400 mt-1">Total biaya pemeliharaan {selectedYear}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium text-gray-500">Total Pemeliharaan Perbulan</h3>
              <Wrench className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Rp {pemeliharaanKategoriBulanan.toLocaleString("id-ID")}</div>
              <p className="text-xs text-gray-400 mt-1">Biaya pemeliharaan bulan {selectedMonthName}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
