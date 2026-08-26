import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 1. Definisikan tipe data agar TypeScript aman
export type AssetItem = {
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
  harga: number;
  kondisi: string;
  kir: string;
  keterangan: string;
  kategori?: string;
};

// 2. Fungsi Utama untuk Menggambar Template PDF
export const generatePdfKibB = async (data: AssetItem[]) => {
  // Buat dokumen A4 Landscape
  const doc = new jsPDF("landscape", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  // Load Image
  const imgUrl = "/images/logo-badung.png";
  const img = new Image();
  img.src = imgUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  if (img.complete && img.naturalWidth > 0) {
    const logoWidth = 20;
    const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth;
    doc.addImage(img, "PNG", 15, 12, logoWidth, logoHeight);
  }

  // --- KOP SURAT ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PEMERINTAH KABUPATEN BADUNG", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("REKAPITULASI KARTU INVENTARIS BARANG (KIB) B", pageWidth / 2, 26, { align: "center" });
  doc.text("PERALATAN DAN MESIN", pageWidth / 2, 32, { align: "center" });

  // Garis Bawah Kop
  doc.setLineWidth(0.5);
  doc.line(15, 38, pageWidth - 15, 38);

  // --- METADATA ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Kiri
  doc.setFont("helvetica", "bold");
  doc.text("Provinsi", 15, 45);
  doc.setFont("helvetica", "normal");
  doc.text(": PROVINSI BALI", 45, 45);
  doc.setFont("helvetica", "bold");
  doc.text("Kab./Kota", 15, 50);
  doc.setFont("helvetica", "normal");
  doc.text(": PEMERINTAH KABUPATEN BADUNG", 45, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Bidang", 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(": Gubernur/Bupati/Walikota", 45, 55);

  // Kanan
  doc.setFont("helvetica", "bold");
  doc.text("Unit Organisasi", 140, 45);
  doc.setFont("helvetica", "normal");
  doc.text(": Kecamatan Kuta Selatan", 185, 45);
  doc.setFont("helvetica", "bold");
  doc.text("Sub Unit Org.", 140, 50);
  doc.setFont("helvetica", "normal");
  doc.text(": Kecamatan Kuta Selatan", 185, 50);
  doc.setFont("helvetica", "bold");
  doc.text("NO. KODE LOKASI", 140, 55);
  doc.setFont("helvetica", "normal");
  doc.text(": 12.01.14.01.02.06.01.01.1994", 185, 55);

  // --- OLAH DATA TABEL ---
  const totalHarga = data.reduce((sum, item) => sum + item.harga, 0);

  const tableData = data.map((item, index) => [
    index + 1,
    item.kode,
    item.nama,
    item.nomorRegister,
    item.merk,
    item.ukuran,
    item.bahan,
    item.tahun,
    item.pabrik,
    item.rangka,
    item.mesin,
    item.polisi,
    item.bpkb,
    item.asalUsul,
    item.harga.toLocaleString("id-ID"),
    item.keterangan,
  ]);

  // --- GAMBAR TABEL ---
  autoTable(doc, {
    startY: 62,
    theme: "grid",
    showFoot: "lastPage",
    styles: { fontSize: 7, font: "helvetica", lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: "center", valign: "middle", fontStyle: "bold" },
    bodyStyles: { valign: "top" },
    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    head: [
      [
        { content: "No", rowSpan: 2 },
        { content: "Kode Barang", rowSpan: 2 },
        { content: "Jenis Barang /\nNama Barang", rowSpan: 2 },
        { content: "Nomor\nRegister", rowSpan: 2 },
        { content: "Merk/Type", rowSpan: 2 },
        { content: "Ukuran/CC", rowSpan: 2 },
        { content: "Bahan", rowSpan: 2 },
        { content: "Tahun\nPembelian", rowSpan: 2 },
        { content: "Nomor", colSpan: 5 },
        { content: "Asal Usul", rowSpan: 2 },
        { content: "Harga\n(ribuan Rp)", rowSpan: 2 },
        { content: "Keterangan", rowSpan: 2 },
      ],
      ["Pabrik", "Rangka", "Mesin", "Polisi", "BPKB"],
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16"],
    ],
    body: tableData,
    foot: [[{ content: "TOTAL", colSpan: 14, styles: { halign: "right", fontStyle: "bold" } }, { content: totalHarga.toLocaleString("id-ID"), styles: { halign: "right", fontStyle: "bold" } }, ""]],
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 30 },
      3: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 15, halign: "center" },
      14: { halign: "right" },
    },
  });

  // --- TANDA TANGAN ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  const pageHeight = doc.internal.pageSize.getHeight();

  if (finalY + 40 > pageHeight) {
    doc.addPage();
    finalY = 20;
  }

  // Kiri
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("MENGETAHUI", 50, finalY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Camat Kuta Selatan", 50, finalY + 5, { align: "center" });
  doc.text("( .................................................... )", 50, finalY + 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("NIP.", 20, finalY + 35);

  // Kanan
  doc.text("Badung, ....................................", pageWidth - 60, finalY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Pengurus Barang", pageWidth - 60, finalY + 5, { align: "center" });
  doc.text("( .................................................... )", pageWidth - 60, finalY + 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("NIP.", pageWidth - 90, finalY + 35);

  // Simpan
  doc.save("Rekap_KIB_B_Kuta_Selatan.pdf");
};
