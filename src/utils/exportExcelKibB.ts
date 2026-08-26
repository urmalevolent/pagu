import * as XLSX from "xlsx";
import { AssetItem } from "./exportPdfKibB";

export const generateExcelKibB = (data: AssetItem[]) => {
  // 1. Ubah format data menjadi nama kolom Excel berbahasa Indonesia
  const excelData = data.map((item, index) => ({
    No: index + 1,
    "Kode Barang": item.kode,
    "Nama / Jenis Barang": item.nama,
    "Nomor Register": item.nomorRegister,
    "Merk / Type": item.merk,
    "Ukuran / CC": item.ukuran,
    Bahan: item.bahan,
    "Tahun Pembelian": item.tahun,
    Pabrik: item.pabrik,
    "No. Rangka": item.rangka,
    "No. Mesin": item.mesin,
    "No. Polisi": item.polisi,
    BPKB: item.bpkb,
    "Asal Usul": item.asalUsul,
    "Harga (Rp)": item.harga,
    "Lokasi Ruangan (KIR)": item.kir,
    Kondisi: item.kondisi,
    Keterangan: item.keterangan,
  }));

  // 2. Buat Worksheet & Workbook Excel
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris KIB B");

  // 3. Atur lebar kolom otomatis
  const columnWidths = [
    { wch: 5 }, // No
    { wch: 18 }, // Kode Barang
    { wch: 25 }, // Nama Barang
    { wch: 15 }, // Nomor Register
    { wch: 20 }, // Merk
    { wch: 15 }, // Ukuran
    { wch: 15 }, // Bahan
    { wch: 15 }, // Tahun
    { wch: 15 }, // Pabrik
    { wch: 18 }, // Rangka
    { wch: 18 }, // Mesin
    { wch: 15 }, // Polisi
    { wch: 15 }, // BPKB
    { wch: 18 }, // Asal Usul
    { wch: 15 }, // Harga
    { wch: 22 }, // KIR
    { wch: 15 }, // Kondisi
    { wch: 25 }, // Keterangan
  ];
  worksheet["!cols"] = columnWidths;

  // 4. Picu Download File .xlsx
  XLSX.writeFile(workbook, `Data_Inventaris_KIB_B_${Date.now()}.xlsx`);
};
