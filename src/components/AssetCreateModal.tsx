"use client";

import { useState, useEffect, useRef } from "react";
import { X, Info, Wrench, ImagePlus, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Swal from "sweetalert2";

type AssetCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
};

// --- FUNGSI HELPER UNTUK KOMPRESI GAMBAR (CANVAS API) ---
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Gagal inisialisasi kompresor"));
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal kompres gambar"));
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AssetCreateModal({ isOpen, onClose, onSave }: AssetCreateModalProps) {
  const supabase = createClient();

  const [listKir, setListKir] = useState<{ id: number; nama_ruangan: string }[]>([]);
  const [listAsal, setListAsal] = useState<{ id: number; nama_asal: string }[]>([]);

  const [kodeBarang, setKodeBarang] = useState("");
  const [noRegister, setNoRegister] = useState("0000");
  const [namaBarang, setNamaBarang] = useState("");
  const [merkType, setMerkType] = useState("");
  const [ukuranCc, setUkuranCc] = useState("");
  const [bahan, setBahan] = useState("");
  const [tahunBeli, setTahunBeli] = useState("");
  const [pabrik, setPabrik] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [kategori, setKategori] = useState("lainnya");

  const [noRangka, setNoRangka] = useState("");
  const [noMesin, setNoMesin] = useState("");
  const [noPolisi, setNoPolisi] = useState("");
  const [noBpkb, setNoBpkb] = useState("");
  const [asalUsulId, setAsalUsulId] = useState("");
  const [harga, setHarga] = useState("");
  const [kondisi, setKondisi] = useState("Baik");
  const [kirId, setKirId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // STATE SENSOR DRAG & DROP
  const [isDragging, setIsDragging] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchMasterData = async () => {
        const { data: dataKir } = await supabase.from("master_kir").select("*");
        const { data: dataAsal } = await supabase.from("master_asal_usul").select("*");
        if (dataKir) setListKir(dataKir);
        if (dataAsal) setListAsal(dataAsal);
      };
      fetchMasterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  // LOGIKA PROSES FILE (Shared)
  const processFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
      Swal.fire({
        icon: "error",
        title: "Format Tidak Didukung",
        text: "Sistem tidak menerima file format HEIC (Apple). Silakan gunakan format JPG, JPEG, atau PNG.",
        confirmButtonColor: "#ba1a1a",
      });
      return;
    }

    try {
      setIsLoading(true);
      const compressedFile = await compressImage(file, 800, 800, 0.7);
      setSelectedFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal Memproses", text: "Gagal mengompres gambar.", confirmButtonColor: "#ba1a1a" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // SENSOR DRAG & DROP HTML5
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalFotoUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `asset_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage.from("assets").upload(filePath, selectedFile, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("assets").getPublicUrl(uploadData.path);
        finalFotoUrl = publicUrl;
      }

      const newAsset = {
        kode_barang: kodeBarang,
        nama_barang: namaBarang,
        nomor_register: noRegister,
        merk_type: merkType,
        ukuran_cc: ukuranCc,
        bahan: bahan,
        tahun_beli: tahunBeli,
        pabrik: pabrik,
        no_rangka: noRangka,
        no_mesin: noMesin,
        no_polisi: noPolisi,
        no_bpkb: noBpkb,
        asal_usul_id: asalUsulId ? Number(asalUsulId) : null,
        harga: harga ? Number(harga) : 0,
        kondisi: kondisi,
        kir_id: kirId ? Number(kirId) : null,
        keterangan: keterangan,
        kategori: kategori,
        foto_url: finalFotoUrl,
      };

      const { error } = await supabase.from("inventaris_kib_b").insert([newAsset]);

      if (error) throw error;

      Swal.fire({
        icon: "success",
        title: "Data Disimpan!",
        text: "Data inventaris baru berhasil ditambahkan ke sistem.",
        confirmButtonColor: "#2563eb",
        timer: 2000,
        showConfirmButton: false,
      });

      setKodeBarang("");
      setNoRegister("0000");
      setNamaBarang("");
      setMerkType("");
      setUkuranCc("");
      setBahan("");
      setTahunBeli("");
      setPabrik("");
      setKeterangan("");
      setNoRangka("");
      setNoMesin("");
      setNoPolisi("");
      setNoBpkb("");
      setAsalUsulId("");
      setHarga("");
      setKondisi("Baik");
      setKirId("");
      setKategori("lainnya");
      setSelectedFile(null);
      setImagePreview(null);

      if (onSave) onSave();
      onClose();
      // PERBAIKAN: Mengubah tipe catch error menjadi 'unknown' agar aman dari aturan no-explicit-any
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui";
      Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: errorMessage, confirmButtonColor: "#ba1a1a" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 sm:py-12 md:p-8 overflow-y-auto" onClick={onClose}>
      <div className="relative flex w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white rounded-t-xl sticky top-0 z-20">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Tambah Data Inventaris Baru</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Lengkapi form di bawah ini untuk mencatat aset baru ke dalam sistem KIB B.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          <form id="createAssetForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase tracking-wide">
                <Info size={18} /> Informasi Utama
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Kode Barang <span className="text-red-500">*</span>
                  </label>
                  <input required value={kodeBarang} onChange={(e) => setKodeBarang(e.target.value)} className={inputClass} placeholder="Mis: 02.06.01..." type="text" />
                </div>
                <div>
                  <label className={labelClass}>No Register</label>
                  <input value={noRegister} onChange={(e) => setNoRegister(e.target.value)} className={inputClass} placeholder="0001" type="text" />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Nama Barang / Jenis <span className="text-red-500">*</span>
                </label>
                <input required value={namaBarang} onChange={(e) => setNamaBarang(e.target.value)} className={inputClass} placeholder="Masukkan nama barang" type="text" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Merk/Type</label>
                  <input value={merkType} onChange={(e) => setMerkType(e.target.value)} className={inputClass} placeholder="Mis: Toyota / Avanza" type="text" />
                </div>
                <div>
                  <label className={labelClass}>Ukuran/CC</label>
                  <input value={ukuranCc} onChange={(e) => setUkuranCc(e.target.value)} className={inputClass} placeholder="Mis: 1500cc" type="text" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bahan</label>
                  <input value={bahan} onChange={(e) => setBahan(e.target.value)} className={inputClass} placeholder="Mis: Besi/Kayu/Plastik" type="text" />
                </div>
                <div>
                  <label className={labelClass}>Tahun Beli</label>
                  <input value={tahunBeli} onChange={(e) => setTahunBeli(e.target.value)} className={inputClass} placeholder="YYYY" type="number" min="1900" max="2099" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pabrik</label>
                  <input value={pabrik} onChange={(e) => setPabrik(e.target.value)} className={inputClass} placeholder="Nama pabrik" type="text" />
                </div>
                <div>
                  <label className={labelClass}>
                    Lokasi Ruangan (KIR) <span className="text-red-500">*</span>
                  </label>
                  <select required value={kirId} onChange={(e) => setKirId(e.target.value)} className={`${inputClass} bg-white cursor-pointer`}>
                    <option disabled value="">
                      Pilih Ruangan...
                    </option>
                    {listKir.map((kir) => (
                      <option key={kir.id} value={kir.id}>
                        {kir.nama_ruangan}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Kategori</label>
                <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={`${inputClass} bg-white cursor-pointer`}>
                  <option value="roda 2">Roda 2</option>
                  <option value="roda 4">Roda 4</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Keterangan Khusus</label>
                <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Catatan mengenai barang ini..."></textarea>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase tracking-wide">
                <Wrench size={18} /> Spesifikasi Khusus & Harga
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    No. Rangka <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input value={noRangka} onChange={(e) => setNoRangka(e.target.value)} className={inputClass} placeholder="-" type="text" />
                </div>
                <div>
                  <label className={labelClass}>
                    No. Mesin <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input value={noMesin} onChange={(e) => setNoMesin(e.target.value)} className={inputClass} placeholder="-" type="text" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    No. Polisi <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input value={noPolisi} onChange={(e) => setNoPolisi(e.target.value)} className={inputClass} placeholder="Mis: DK 1234 CD" type="text" />
                </div>
                <div>
                  <label className={labelClass}>
                    BPKB <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <input value={noBpkb} onChange={(e) => setNoBpkb(e.target.value)} className={inputClass} placeholder="-" type="text" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      Asal Usul <span className="text-red-500">*</span>
                    </label>
                    <select required value={asalUsulId} onChange={(e) => setAsalUsulId(e.target.value)} className={`${inputClass} bg-white cursor-pointer`}>
                      <option disabled value="">
                        Pilih Asal...
                      </option>
                      {listAsal.map((asal) => (
                        <option key={asal.id} value={asal.id}>
                          {asal.nama_asal}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Kondisi Saat Ini <span className="text-red-500">*</span>
                    </label>
                    <select required value={kondisi} onChange={(e) => setKondisi(e.target.value)} className={`${inputClass} bg-white cursor-pointer`}>
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Harga (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-semibold text-sm">Rp</span>
                    <input value={harga} onChange={(e) => setHarga(e.target.value)} className={`${inputClass} pl-10`} placeholder="0" type="number" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>
                  Upload Foto Aset <span className="text-slate-400 font-normal ml-1">(Maks 5MB)</span>
                </label>
                <input type="file" accept="image/jpeg, image/png, image/gif" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group transform duration-200
                    ${isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400"}
                  `}
                >
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-semibold text-xs">Ganti / Seret Foto Baru</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 mb-2">
                        <ImagePlus size={24} />
                      </div>
                      <p className="text-xs font-bold text-blue-600 mb-1">Klik untuk upload atau seret file ke sini</p>
                      <p className="text-[10px] text-slate-400 font-medium">Mendukung format JPG, JPEG, PNG, GIF</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 z-20">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            Batal
          </button>
          <button
            type="submit"
            form="createAssetForm"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isLoading ? "Menyimpan..." : "Simpan Data Inventaris"}
          </button>
        </div>
      </div>
    </div>
  );
}
