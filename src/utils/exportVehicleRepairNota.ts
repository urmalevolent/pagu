import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// TYPE
// ==========================================

export interface VehicleRepairPrintVehicle {
  nama_barang: string | null;
  merk_type: string | null;
  no_polisi: string | null;
}

export interface VehicleRepairPrintDetail {
  id: number;
  nama_barang: string | null;
  banyaknya: number | null;
  unit: string | null;
  harga_unit: number | null;
  jumlah: number | null;
  keterangan: string | null;
}

export interface VehicleRepairPrintData {
  id: number;
  tanggal_pengajuan: string | null;
  bengkel_rekanan: string | null;
  total_biaya: number | null;
  kategori_pengeluaran: string | null;
  inventaris_kib_b:
    | VehicleRepairPrintVehicle
    | VehicleRepairPrintVehicle[]
    | null;
  pemeliharaan_detail:
    | VehicleRepairPrintDetail[]
    | null;
}

// ==========================================
// CONSTANT
// ==========================================

const NAMA_PENERIMA = "Rohadiharjo";
const NIP_PENERIMA = "Nip. 19820421 201406 1 006";

const NAMA_PPK = "I Kadek Laksana, SE, M.AP";
const NIP_PPK = "Nip. 1972102 200901 1 006";

const NAMA_CAMAT = "I Made Widiana,S.Sos, M.Si";
const NIP_CAMAT = "Nip.19650310 198602 1 004";

const NAMA_BENDAHARA = "Nyoman Nopi Arianti, A.Md";
const NIP_BENDAHARA = "Nip.19841105 200803 2 003";

const M_A = "4.01.14.01.01.57.5.2.2.03.09";

// ==========================================
// HELPER
// ==========================================

const getVehicle = (
  vehicle:
    | VehicleRepairPrintVehicle
    | VehicleRepairPrintVehicle[]
    | null
) => {
  if (Array.isArray(vehicle)) {
    return vehicle[0] ?? null;
  }
  return vehicle;
};

const formatRupiah = (
  value: number | null | undefined
) => {
  return Number(value || 0).toLocaleString(
    "id-ID"
  );
};

const formatDate = (
  dateString: string | null
) => {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

const getYear = (
  dateString: string | null
) => {
  if (!dateString) {
    return new Date().getFullYear();
  }

  const year = Number(
    dateString.slice(0, 4)
  );

  return (
    year ||
    new Date().getFullYear()
  );
};

// HELPER: Mengubah Angka ke Terbilang (Contoh: 705000 -> Tujuh ratus lima ribu rupiah)
const pembilang = (nilai: number): string => {
  const simpan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (nilai < 12) return simpan[nilai];
  if (nilai < 20) return pembilang(nilai - 10) + " belas";
  if (nilai < 100) return pembilang(Math.floor(nilai / 10)) + (nilai % 10 !== 0 ? " puluh " + pembilang(nilai % 10) : " puluh");
  if (nilai < 200) return "seratus " + (nilai - 100 !== 0 ? pembilang(nilai - 100) : "");
  if (nilai < 1000) return pembilang(Math.floor(nilai / 100)) + " ratus" + (nilai % 100 !== 0 ? " " + pembilang(nilai % 100) : "");
  if (nilai < 2000) return "seribu " + (nilai - 1000 !== 0 ? pembilang(nilai - 1000) : "");
  if (nilai < 1000000) return pembilang(Math.floor(nilai / 1000)) + " ribu" + (nilai % 1000 !== 0 ? " " + pembilang(nilai % 1000) : "");
  if (nilai < 1000000000) return pembilang(Math.floor(nilai / 1000000)) + " juta" + (nilai % 1000000 !== 0 ? " " + pembilang(nilai % 1000000) : "");
  return "";
};

const angkaKeTerbilang = (nilai: number): string => {
  if (nilai === 0) return "Nol rupiah";
  let result = pembilang(nilai).trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + " rupiah";
};

// ==========================================
// PAGE 1: ORDER BARANG
// ==========================================

const drawOrderBarangPage = (
  doc: jsPDF,
  data: VehicleRepairPrintData
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const vehicle = getVehicle(data.inventaris_kib_b);
  const details = data.pemeliharaan_detail || [];
  const year = getYear(data.tanggal_pengajuan);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Nomor", marginLeft, 16);
  doc.text(":", marginLeft + 22, 16);
  doc.setFont("helvetica", "normal");
  doc.text("027/     /Sekret", marginLeft + 26, 16);
  doc.setFont("helvetica", "bold");
  doc.text("Kuta Selatan,", pageWidth - 65, 16);
  doc.text(String(year), pageWidth - 25, 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Lamp.", marginLeft, 22);
  doc.text(":", marginLeft + 22, 22);
  doc.setFont("helvetica", "normal");
  doc.text("-", marginLeft + 26, 22);
  doc.setFont("helvetica", "bold");
  doc.text("Kepada,", pageWidth - 65, 22);
  doc.text("Prihal", marginLeft, 28);
  doc.text(":", marginLeft + 22, 28);
  doc.setFont("helvetica", "normal");
  doc.text("Order Barang", marginLeft + 26, 28);
  doc.line(marginLeft + 26, 29, marginLeft + 50, 29);
  doc.setFont("helvetica", "bold");
  doc.text("Yth.", pageWidth - 65, 28);
  doc.text("di -", pageWidth - 65, 34);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(9);
  doc.text("T e m p a t", pageWidth - 28, 41, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const vehicleText = `Kendaraan: ${vehicle?.nama_barang || "-"}${vehicle?.merk_type ? ` - ${vehicle.merk_type}` : ""} | Plat: ${vehicle?.no_polisi || "-"} | Tanggal: ${formatDate(data.tanggal_pengajuan)}`;
  doc.text(vehicleText, marginLeft, 47, { maxWidth: contentWidth });

  const minRows = 14;
  const tableRows = Array.from(
    { length: Math.max(minRows, details.length) },
    (_, index) => {
      const detail = details[index];
      if (!detail) return ["-", "-", "-", "-"];
      return [
        String(index + 1),
        detail.nama_barang || "-",
        `${Number(detail.banyaknya || 0)} ${detail.unit || "-"}`,
        detail.keterangan || "-",
      ];
    }
  );

  autoTable(doc, {
    startY: 52,
    margin: { left: marginLeft, right: marginRight },
    head: [["No.", "Nama / Jenis Barang", "Banyaknya", "Keterangan"]],
    body: tableRows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, textColor: 0, lineColor: 0, lineWidth: 0.25, cellPadding: 1.8, valign: "middle" },
    headStyles: { fontStyle: "bold", textColor: 0, fillColor: 255, lineColor: 0, lineWidth: 0.3, halign: "center" },
    columnStyles: { 0: { cellWidth: 12, halign: "center" }, 1: { cellWidth: 72 }, 2: { cellWidth: 30, halign: "center" }, 3: { cellWidth: 54 } },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        hookData.cell.styles.minCellHeight = 7;
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 155;
  const signatureTop = finalY + 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Yang Menerima Pesanan", marginLeft + 38, signatureTop, { align: "center" });
  doc.text("Pejabat Pembuat Komitmen", pageWidth - 52, signatureTop, { align: "center" });
  doc.setLineWidth(0.25);
  doc.line(marginLeft + 10, signatureTop + 25, marginLeft + 65, signatureTop + 25);
  doc.setFont("helvetica", "bold");
  doc.text(NAMA_PPK, pageWidth - 52, signatureTop + 28, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(NIP_PPK, pageWidth - 52, signatureTop + 34, { align: "center" });
};

// ==========================================
// PAGE 2: NOTA
// ==========================================

const drawNotaPage = (
  doc: jsPDF,
  data: VehicleRepairPrintData
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const details = data.pemeliharaan_detail || [];
  const year = getYear(data.tanggal_pengajuan);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("-", pageWidth - 94, 15);
  doc.setFont("helvetica", "bold");
  doc.text(String(year), pageWidth - 14, 15, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.text("Tuan", pageWidth / 2 - 18, 23, { align: "right" });
  doc.text("Bendahara Pengeluaran", pageWidth / 2 + 2, 23);
  doc.text("Toko", pageWidth / 2 - 18, 30, { align: "right" });
  doc.text("Camat Kuta Selatan", pageWidth / 2 + 2, 30);
  doc.text("di.", pageWidth / 2 + 2, 37);
  doc.setFont("helvetica", "bold");
  doc.text("Tempat", pageWidth / 2 + 40, 45, { align: "center" });
  doc.line(pageWidth / 2 + 28, 46, pageWidth / 2 + 52, 46);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("NOTA No. :", marginLeft, 53);

  const minRows = 14;
  const tableRows = Array.from(
    { length: Math.max(minRows, details.length) },
    (_, index) => {
      const detail = details[index];
      if (!detail) return ["-", "-", "-", "-", "-"];
      return [
        String(Number(detail.banyaknya || 0)),
        detail.unit || "-",
        detail.nama_barang || "-",
        formatRupiah(detail.harga_unit),
        formatRupiah(detail.jumlah),
      ];
    }
  );

  const totalBiaya = details.reduce((sum, detail) => sum + Number(detail.jumlah || 0), 0);

  autoTable(doc, {
    startY: 56,
    margin: { left: marginLeft, right: marginRight },
    head: [[{ content: "BANYAKNYA", colSpan: 2 }, "NAMA BARANG", "HARGA", "JUMLAH"]],
    body: tableRows,
    foot: [
      [
        { content: "Jumlah Rp.", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        { content: formatRupiah(totalBiaya), styles: { halign: "right", fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, textColor: 0, lineColor: 0, lineWidth: 0.25, cellPadding: 1.8, valign: "middle" },
    headStyles: { fontStyle: "bold", fillColor: 255, textColor: 0, halign: "center", lineColor: 0, lineWidth: 0.3 },
    footStyles: { fillColor: 255, textColor: 0, fontStyle: "bold", lineColor: 0, lineWidth: 0.3 },
    columnStyles: { 0: { cellWidth: 12, halign: "right" }, 1: { cellWidth: 12, halign: "left" }, 2: { cellWidth: 72 }, 3: { cellWidth: 36, halign: "right" }, 4: { cellWidth: 38, halign: "right" } },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        hookData.cell.styles.minCellHeight = 7.2;
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 175;
  const signatureTop = finalY + 7;
  const signatureLeftX = 55;
  const signatureRightX = 155;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Tanda Terima", signatureLeftX, signatureTop, { align: "center" });
  doc.text("Pengurus Barang", signatureLeftX, signatureTop + 6, { align: "center" });
  doc.text("Hormat Kami/Penjual", signatureRightX, signatureTop, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(NAMA_PENERIMA, signatureLeftX, signatureTop + 34, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(NIP_PENERIMA, signatureLeftX, signatureTop + 40, { align: "center" });
  doc.setLineWidth(0.25);
  doc.line(signatureRightX - 35, signatureTop + 36, signatureRightX + 35, signatureTop + 36);
};

// ==========================================
// PAGE 3: KWITANSI (NEW)
// ==========================================

const drawKwitansiPage = (
  doc: jsPDF,
  data: VehicleRepairPrintData,
  keteranganPembayaran: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;
  const year = getYear(data.tanggal_pengajuan);
  
  const totalBiaya = data.pemeliharaan_detail?.reduce((sum, detail) => sum + Number(detail.jumlah || 0), 0) || 0;
  const terbilangStr = angkaKeTerbilang(totalBiaya);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Bagian Header (Kiri)
  doc.text("Kasbuno", marginLeft, 20);
  doc.text(":", marginLeft + 20, 20);
  doc.text("Tanggal", marginLeft, 26);
  doc.text(":", marginLeft + 20, 26);

  // Bagian Header (Kanan)
  doc.text("Tahun", pageWidth / 2 + 10, 20);
  doc.text(":", pageWidth / 2 + 30, 20);
  doc.text(String(year), pageWidth / 2 + 35, 20);

  doc.text("M. A.", pageWidth / 2 + 10, 26);
  doc.text(":", pageWidth / 2 + 30, 26);
  doc.text(M_A, pageWidth / 2 + 35, 26);

  doc.text("No. Kwit", pageWidth / 2 + 10, 32);
  doc.text(":", pageWidth / 2 + 30, 32);

  // Garis Pembatas
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 35, pageWidth - marginRight, 35);
  doc.setLineWidth(0.25);
  doc.line(marginLeft, 36, pageWidth - marginRight, 36);

  // Konten Kwitansi
  doc.setFont("helvetica", "bold");
  doc.text("Sudah terima dari", marginLeft, 45);
  doc.setFont("helvetica", "normal");
  doc.text(":", marginLeft + 40, 45);
  doc.text("Bupati Badung", marginLeft + 45, 45);

  doc.setFont("helvetica", "bold");
  doc.text("Banyaknya uang", marginLeft, 55);
  doc.setFont("helvetica", "normal");
  doc.text(":", marginLeft + 40, 55);

  // Kotak Biru Muda (Terbilang Huruf)
  doc.setFillColor(224, 224, 224);
  doc.rect(marginLeft + 45, 49, 135, 12, "FD");
  doc.text(terbilangStr, marginLeft + 47, 56);

  doc.setFont("helvetica", "bold");
  doc.text("Untuk Pembayaran", marginLeft, 70);
  doc.setFont("helvetica", "normal");
  doc.text(":", marginLeft + 40, 70);
  
  // Teks Keterangan (Multi-line)
  doc.text(keteranganPembayaran, marginLeft + 45, 70, { maxWidth: 135, lineHeightFactor: 1.5 });

  // Kotak Terbilang Angka
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.text("Terbilang Rp.", marginLeft, 98);
  doc.setFillColor(224, 224, 224);
  doc.rect(marginLeft + 45, 90, 50, 12, "FD");
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(totalBiaya), marginLeft + 70, 98, { align: "center" });

  // Kotak "Dibuat untuk I, II, III, IV"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 70, 105, 50, 6);
  doc.text("Dibuat untuk  I, II, III, IV.", pageWidth - 45, 109, { align: "center" });

  // Tanda Tangan
  const sigLeftX = marginLeft + 30;
  const sigRightX = pageWidth - 45;

  doc.text("Camat Kuta Selatan", sigLeftX, 115, { align: "center" });
  doc.text("Yang menerima", sigRightX, 115, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(NAMA_CAMAT, sigLeftX, 140, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(sigLeftX - 25, 141, sigLeftX + 25, 141);
  doc.setFont("helvetica", "normal");
  doc.text(NIP_CAMAT, sigLeftX, 145, { align: "center" });

  doc.text("Lunas dibayar", sigLeftX, 155, { align: "center" });
  doc.text("Bendahara Pengeluaran", sigLeftX, 161, { align: "center" });
  doc.text("Kantor Camat Kuta Selatan", sigLeftX, 167, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text(NAMA_BENDAHARA, sigLeftX, 195, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(sigLeftX - 25, 196, sigLeftX + 25, 196);
  doc.setFont("helvetica", "normal");
  doc.text(NIP_BENDAHARA, sigLeftX, 200, { align: "center" });
};

// ==========================================
// EXPORT PDF
// ==========================================

export const generateVehicleRepairNotaPdf = (
  data: VehicleRepairPrintData,
  keteranganPembayaran: string // <-- Parameter baru untuk halaman 3
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  drawOrderBarangPage(doc, data);
  
  doc.addPage();
  drawNotaPage(doc, data);
  
  doc.addPage();
  drawKwitansiPage(doc, data, keteranganPembayaran);

  const vehicle = getVehicle(data.inventaris_kib_b);
  const plate = vehicle?.no_polisi?.replace(/[^a-zA-Z0-9]/g, "_") || "kendaraan";
  const date = data.tanggal_pengajuan?.slice(0, 10).replace(/-/g, "") || "tanggal";

  doc.save(`nota-kwitansi-pemeliharaan-${plate}-${date}.pdf`);
};