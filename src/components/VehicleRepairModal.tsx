"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  X,
  Info,
  Wrench,
  Plus,
  Trash2,
  ChevronDown,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase";

interface ItemDetail {
  id: number;
  namaBarang: string;
  banyaknya: number;
  unit: string;
  jumlah: number;
  keterangan: string;
}

interface Vehicle {
  id: number;
  nama_barang: string | null;
  merk_type: string | null;
  no_polisi: string | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleRepairModal({
  isOpen,
  onClose,
}: ModalProps) {
  // Gunakan instance Supabase yang stabil
  // agar tidak dibuat ulang setiap render.
  const supabase = useMemo(() => createClient(), []);

  // ==========================================
  // STATE INFORMASI PENGAJUAN
  // ==========================================
  const [tanggal, setTanggal] = useState("");
  const [bengkel, setBengkel] = useState("");
  const [kendaraanId, setKendaraanId] = useState("");
  const [kategoriPengeluaran, setKategoriPengeluaran] =
    useState("");

  // ==========================================
  // STATE KENDARAAN
  // ==========================================
  const [kendaraanList, setKendaraanList] = useState<
    Vehicle[]
  >([]);
  const [isLoadingKendaraan, setIsLoadingKendaraan] =
    useState(false);
  const [
    isVehicleDropdownOpen,
    setIsVehicleDropdownOpen,
  ] = useState(false);
  const [searchVehicle, setSearchVehicle] =
    useState("");
  const vehicleDropdownRef =
    useRef<HTMLDivElement>(null);

  // ==========================================
  // STATE DETAIL PEMELIHARAAN
  // ==========================================
  const [items, setItems] = useState<ItemDetail[]>([]);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // ==========================================
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTanggal("");
      setBengkel("");
      setKendaraanId("");
      setKategoriPengeluaran("");
      setSearchVehicle("");

      setItems([
        {
          id: Date.now(),
          namaBarang: "",
          banyaknya: 1,
          unit: "PCS",
          jumlah: 0,
          keterangan: "",
        },
      ]);

      setIsVehicleDropdownOpen(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen]);

  // ==========================================
  // FETCH DATA KENDARAAN
  // ==========================================
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchKendaraan = async () => {
      setIsLoadingKendaraan(true);

      try {
        const { data, error } = await supabase
          .from("inventaris_kib_b")
          .select(
            "id, nama_barang, merk_type, no_polisi"
          )
          .in("kategori", ["roda 2", "roda 4"]);

        if (error) {
          throw error;
        }

        if (data) {
          setKendaraanList(data as Vehicle[]);
        }
      } catch (error) {
        console.error(
          "Gagal mengambil data kendaraan:",
          error
        );
      } finally {
        setIsLoadingKendaraan(false);
      }
    };

    fetchKendaraan();
  }, [isOpen, supabase]);

  // ==========================================
  // MENUTUP DROPDOWN SAAT KLIK DI LUAR
  // ==========================================
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        vehicleDropdownRef.current &&
        !vehicleDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsVehicleDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ==========================================
  // TOTAL BIAYA
  // ==========================================
  const totalBiaya = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + (Number(item.jumlah) || 0),
      0
    );
  }, [items]);

  // ==========================================
  // TAMBAH ITEM
  // ==========================================
  const addItem = () => {
    const newItem: ItemDetail = {
      id: Date.now(),
      namaBarang: "",
      banyaknya: 1,
      unit: "PCS",
      jumlah: 0,
      keterangan: "",
    };

    // Item baru muncul paling atas
    setItems((prev) => [newItem, ...prev]);
  };

  // ==========================================
  // HAPUS ITEM
  // ==========================================
  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems((prev) =>
        prev.filter(
          (item) => item.id !== id
        )
      );
    }
  };

  // ==========================================
  // UPDATE ITEM
  // ==========================================
  const updateItem = (
    id: number,
    field: keyof ItemDetail,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  // ==========================================
  // SUBMIT & VALIDASI
  // ==========================================
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // ==========================================
    // VALIDASI FIELD UTAMA
    // ==========================================
    if (
      !tanggal ||
      !kendaraanId ||
      !kategoriPengeluaran
    ) {
      Swal.fire(
        "Error",
        "Harap lengkapi semua field informasi pengajuan.",
        "error"
      );

      return;
    }

    // Bengkel hanya wajib untuk kategori Pemeliharaan
    if (
      kategoriPengeluaran === "Pemeliharaan" &&
      !bengkel.trim()
    ) {
      Swal.fire(
        "Error",
        "Bengkel rekanan wajib diisi untuk kategori Pemeliharaan.",
        "error"
      );

      return;
    }

    // ==========================================
    // VALIDASI DETAIL
    // ==========================================
    if (items.length === 0) {
      Swal.fire(
        "Error",
        "Minimal harus ada satu detail pemeliharaan.",
        "error"
      );

      return;
    }

    for (
      let i = 0;
      i < items.length;
      i++
    ) {
      const item = items[i];

      if (!item.namaBarang.trim()) {
        Swal.fire(
          "Error",
          `Nama Barang / Jasa pada baris ${
            i + 1
          } wajib diisi.`,
          "error"
        );

        return;
      }

      if (
        !item.banyaknya ||
        Number(item.banyaknya) <= 0
      ) {
        Swal.fire(
          "Error",
          `Banyaknya pada baris ${
            i + 1
          } wajib lebih dari 0.`,
          "error"
        );

        return;
      }

      if (!item.unit) {
        Swal.fire(
          "Error",
          `Unit pada baris ${
            i + 1
          } wajib dipilih.`,
          "error"
        );

        return;
      }

      if (
        item.jumlah === null ||
        item.jumlah === undefined ||
        Number(item.jumlah) <= 0
      ) {
        Swal.fire(
          "Error",
          `Jumlah Biaya pada baris ${
            i + 1
          } wajib diisi.`,
          "error"
        );

        return;
      }
    }

    setIsSubmitting(true);

    try {
      // ==========================================
      // VALIDASI TAHUN ANGGARAN
      // ==========================================

      const submitYear = Number(
        tanggal.split("-")[0]
      );

      if (
        !submitYear ||
        submitYear < 1900
      ) {
        Swal.fire(
          "Error",
          "Tanggal pengajuan tidak valid.",
          "error"
        );

        setIsSubmitting(false);
        return;
      }

      // ==========================================
      // CEK TAHUN DI TABEL PAGU
      // ==========================================
      const {
        data: checkPagu,
        error: paguErr,
      } = await supabase
        .from("pagu")
        .select("tahun")
        .eq("tahun", submitYear)
        .maybeSingle();

      if (paguErr) {
        console.error(
          "Error cek tahun PAGU:",
          paguErr
        );

        throw paguErr;
      }

      // ==========================================
      // TAHUN BELUM ADA
      // ==========================================
      if (!checkPagu) {
        await Swal.fire({
          title:
            "Tahun Anggaran Belum Ada!",
          html: `
            <div style="text-align: left;">
              <p style="margin-bottom: 10px;">
                Tahun pengajuan
                <b>${submitYear}</b>
                belum tersedia pada daftar Tahun Anggaran.
              </p>

              <p>
                Silakan tambahkan tahun
                <b>${submitYear}</b>
                terlebih dahulu melalui tombol
                <b>Tambah Tahun Anggaran (+)</b>
                pada halaman Daftar Kendaraan & PAGU.
              </p>
            </div>
          `,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Mengerti",
        });

        setIsSubmitting(false);
        return;
      }

      // ==========================================
      // INSERT KE TABEL PEMELIHARAAN
      // ==========================================
      const {
        data: pemeliharaan,
        error: pemeliharaanError,
      } = await supabase
        .from("pemeliharaan")
        .insert([
          {
            tanggal_pengajuan: tanggal,

            // Bengkel hanya diisi untuk kategori Pemeliharaan.
            // Untuk kategori lain gunakan string kosong agar
            // tidak mengirim NULL ke kolom database.
            bengkel_rekanan:
              kategoriPengeluaran ===
              "Pemeliharaan"
                ? bengkel.trim()
                : "",

            inventaris_id:
              parseInt(kendaraanId, 10),

            kategori_pengeluaran:
              kategoriPengeluaran,

            total_biaya:
              totalBiaya,
          },
        ])
        .select()
        .single();

      if (pemeliharaanError) {
        console.error(
          "Supabase insert pemeliharaan gagal:",
          JSON.stringify(
            {
              message:
                pemeliharaanError.message,
              details:
                pemeliharaanError.details,
              hint:
                pemeliharaanError.hint,
              code:
                pemeliharaanError.code,
            },
            null,
            2
          )
        );

        throw pemeliharaanError;
      }

      // ==========================================
      // INSERT DETAIL PEMELIHARAAN
      // ==========================================
      const detailItems =
        items.map((item) => ({
          pemeliharaan_id:
            pemeliharaan.id,

          nama_barang:
            item.namaBarang.trim(),

          banyaknya:
            Number(item.banyaknya),

          unit:
            item.unit,

          harga_unit:
            Number(item.jumlah) /
            (Number(item.banyaknya) || 1),

          jumlah:
            Number(item.jumlah),

          keterangan:
            item.keterangan.trim() ||
            null,
        }));

      const {
        error: detailError,
      } = await supabase
        .from("pemeliharaan_detail")
        .insert(detailItems);

      if (detailError) {
        throw detailError;
      }

      // ==========================================
      // BERHASIL
      // ==========================================
      await Swal.fire({
        title: "Berhasil!",
        text: `Pengajuan pemeliharaan kendaraan untuk tahun ${submitYear} berhasil disimpan.`,
        icon: "success",
        confirmButtonColor: "#3b82f6",
      });

      onClose();
      window.location.reload();
    } catch (error: unknown) {
      console.error(
        "Error submitting data:",
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      Swal.fire(
        "Error",
        "Gagal menyimpan pengajuan: " +
          errorMessage,
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // FILTER KENDARAAN
  // ==========================================
  const filteredKendaraan =
    kendaraanList.filter((vehicle) => {
      const namaBarang =
        vehicle.nama_barang
          ?.toLowerCase() || "";

      const noPolisi =
        vehicle.no_polisi
          ?.toLowerCase() || "";

      const search =
        searchVehicle.toLowerCase();

      return (
        namaBarang.includes(search) ||
        noPolisi.includes(search)
      );
    });

  // ==========================================
  // KENDARAAN TERPILIH
  // ==========================================
  const selectedVehicleObj =
    kendaraanList.find(
      (vehicle) =>
        vehicle.id.toString() ===
        kendaraanId
    );

  const displayVehicleName =
    selectedVehicleObj
      ? `[${selectedVehicleObj.no_polisi || "-"}] ${
          selectedVehicleObj.nama_barang ||
          "-"
        } ${
          selectedVehicleObj.merk_type
            ? `- ${selectedVehicleObj.merk_type}`
            : ""
        }`
      : isLoadingKendaraan
        ? "Memuat data kendaraan..."
        : "Pilih kendaraan...";

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="bg-white w-full max-w-7xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col mx-4">

        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}

        <div className="flex justify-between items-center p-6 border-b shrink-0">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Ajukan Pemeliharaan Kendaraan
            </h2>

            <p className="text-sm text-gray-500">
              Lengkapi informasi pengajuan pemeliharaan kendaraan di bawah ini.
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
        {/* BODY */}
        {/* ========================================== */}

        <div className="overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar p-6">

          <form
            id="repair-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >

            {/* ========================================== */}
            {/* SECTION 1 */}
            {/* ========================================== */}

            <div className="bg-white p-5 rounded-lg border shadow-sm">

              <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold">
                <Info size={18} />

                <h3>
                  INFORMASI PENGAJUAN
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">

                {/* TANGGAL */}
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Pengajuan
                  </label>

                  <input
                    type="date"
                    name="tanggal_pengajuan"
                    value={tanggal}
                    onChange={(e) =>
                      setTanggal(
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-medium"
                  />

                </div>

                 {/* KATEGORI PENGELUARAN */}
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Pengeluaran
                  </label>

                  <select
                    value={
                      kategoriPengeluaran
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setKategoriPengeluaran(
                        value
                      );

                      // Bengkel hanya digunakan
                      // untuk kategori Pemeliharaan.
                      if (
                        value !==
                        "Pemeliharaan"
                      ) {
                        setBengkel("");
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-medium bg-white"
                  >

                    <option
                      value=""
                      className="text-gray-400"
                    >
                      Pilih kategori...
                    </option>

                    <option value="Bensin">
                      Bensin
                    </option>

                    <option value="Pemeliharaan">
                      Pemeliharaan
                    </option>

                    <option value="Lainnya">
                      Lainnya
                    </option>

                  </select>

                </div>


                {/* KENDARAAN */}
                <div
                  ref={vehicleDropdownRef}
                  className="relative"
                >

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kendaraan
                  </label>

                  <div
                    onClick={() =>
                      !isLoadingKendaraan &&
                      setIsVehicleDropdownOpen(
                        !isVehicleDropdownOpen
                      )
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium flex justify-between items-center ${
                      isLoadingKendaraan
                        ? "bg-gray-100 cursor-not-allowed text-gray-400"
                        : "bg-white cursor-pointer text-black"
                    }`}
                  >

                    <span className="truncate">
                      {
                        displayVehicleName
                      }
                    </span>

                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        isVehicleDropdownOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />

                  </div>

                  {isVehicleDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg top-full left-0">

                      <div className="p-2 border-b flex items-center gap-2">

                        <Search
                          size={16}
                          className="text-gray-400"
                        />

                        <input
                          type="text"
                          className="w-full text-sm focus:outline-none text-black font-medium placeholder:font-normal"
                          placeholder="Cari plat nomor atau nama..."
                          value={
                            searchVehicle
                          }
                          onChange={(e) =>
                            setSearchVehicle(
                              e.target.value
                            )
                          }
                          autoFocus
                        />

                      </div>

                      <ul className="max-h-48 overflow-y-auto custom-scrollbar">

                        {filteredKendaraan.map(
                          (vehicle) => (
                            <li
                              key={
                                vehicle.id
                              }
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-800 font-medium border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setKendaraanId(
                                  vehicle.id.toString()
                                );

                                setIsVehicleDropdownOpen(
                                  false
                                );

                                setSearchVehicle(
                                  ""
                                );
                              }}
                            >
                              [
                              {
                                vehicle.no_polisi ||
                                "-"
                              }
                              ]{" "}
                              {
                                vehicle.nama_barang ||
                                "-"
                              }{" "}
                              {
                                vehicle.merk_type
                                  ? `- ${vehicle.merk_type}`
                                  : ""
                              }
                            </li>
                          )
                        )}

                        {filteredKendaraan.length ===
                          0 && (
                          <li className="px-3 py-4 text-sm text-center text-gray-500">
                            Kendaraan tidak ditemukan
                          </li>
                        )}

                      </ul>

                    </div>
                  )}

                </div>

                {/* BENGKEL REKANAN
                    HANYA MUNCUL JIKA PEMELIHARAAN */}
                {kategoriPengeluaran ===
                  "Pemeliharaan" && (
                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bengkel Rekanan
                    </label>

                    <input
                      type="text"
                      value={bengkel}
                      onChange={(e) =>
                        setBengkel(
                          e.target.value
                        )
                      }
                      placeholder="Contoh: Gede Jaya Motor"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal"
                    />

                  </div>
                )}

              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 2 */}
            {/* ========================================== */}

            <div className="bg-white rounded-lg border shadow-sm relative flex flex-col">

              <div className="sticky top-0 bg-gray-50 z-10 p-5 border-b shadow-sm rounded-t-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">

                <div className="flex items-center gap-2 text-blue-600 font-semibold">

                  <Wrench size={18} />

                  <h3>
                    DETAIL PEMELIHARAAN
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white text-blue-600 font-bold rounded-md hover:bg-blue-50 transition border border-blue-200 shadow-sm w-fit"
                >
                  <Plus size={16} />
                  item lain
                </button>

              </div>

              <div className="p-5 space-y-4">

                {items.map((item) => {

                  const hargaUnit =
                    item.jumlah > 0 &&
                    item.banyaknya > 0
                      ? item.jumlah /
                        item.banyaknya
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-2 items-start border-b pb-4 last:border-0 group animate-in fade-in slide-in-from-top-4 duration-300"
                    >

                      <div className="grid grid-cols-12 gap-3 flex-1">

                        {/* NAMA BARANG */}
                        <div className="col-span-12 md:col-span-3">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Nama Barang / Jasa
                          </label>

                          <input
                            type="text"
                            placeholder="Contoh: Aki Kering"
                            value={
                              item.namaBarang
                            }
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "namaBarang",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal"
                          />

                        </div>

                        {/* BANYAKNYA */}
                        <div className="col-span-4 md:col-span-1">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Banyaknya
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              item.banyaknya ||
                              ""
                            }
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "banyaknya",
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                        </div>

                        {/* UNIT */}
                        <div className="col-span-4 md:col-span-1">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Unit
                          </label>

                          <select
                            value={
                              item.unit
                            }
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unit",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium bg-white"
                          >

                            <option value="PCS">
                              PCS
                            </option>

                            <option value="Buah">
                              Buah
                            </option>

                            <option value="Set">
                              Set
                            </option>

                            <option value="Liter">
                              Liter
                            </option>

                            <option value="Jasa">
                              Jasa
                            </option>

                          </select>

                        </div>

                        {/* HARGA UNIT */}
                        <div className="col-span-4 md:col-span-2">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Harga / Unit
                          </label>

                          <div className="relative">

                            <span className="absolute left-3 top-2 text-gray-600 text-sm font-medium">
                              Rp
                            </span>

                            <input
                              type="text"
                              disabled
                              value={hargaUnit.toLocaleString(
                                "id-ID"
                              )}
                              className="w-full pl-8 pr-3 py-2 border border-gray-200 bg-gray-100 rounded-md text-sm font-semibold text-black"
                            />

                          </div>

                        </div>

                        {/* JUMLAH BIAYA */}
                        <div className="col-span-12 md:col-span-2">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Jumlah Biaya
                          </label>

                          <div className="relative">

                            <span className="absolute left-3 top-2 text-gray-600 text-sm font-medium">
                              Rp
                            </span>

                            <input
                              type="number"
                              placeholder="0"
                              value={
                                item.jumlah ||
                                ""
                              }
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "jumlah",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                          </div>

                        </div>

                        {/* KETERANGAN */}
                        <div className="col-span-12 md:col-span-3">

                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Keterangan
                          </label>

                          <input
                            type="text"
                            placeholder="Catatan..."
                            value={
                              item.keterangan
                            }
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "keterangan",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal"
                          />

                        </div>

                      </div>

                      {/* HAPUS ITEM */}
                      <div className="w-10 pt-6 flex justify-end shrink-0">

                        {items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                item.id
                              )
                            }
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus Item"
                          >
                            <Trash2
                              size={18}
                            />
                          </button>
                        ) : (
                          <div className="w-9"></div>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          </form>

        </div>

        {/* ========================================== */}
        {/* FOOTER */}
        {/* ========================================== */}

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between shrink-0">

          <div className="text-right ml-auto mr-6">

            <span className="text-sm font-medium text-gray-500">
              Total Biaya:
            </span>

            <div className="text-xl font-bold text-blue-700">
              Rp{" "}
              {totalBiaya.toLocaleString(
                "id-ID"
              )}
            </div>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              form="repair-form"
              className="px-4 py-2 bg-blue-600 rounded-md text-white font-medium hover:bg-blue-700 transition shadow-sm text-sm flex items-center gap-2 disabled:bg-blue-400"
            >
              <Wrench size={16} />

              {isSubmitting
                ? "Menyimpan..."
                : "Ajukan Pemeliharaan"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}