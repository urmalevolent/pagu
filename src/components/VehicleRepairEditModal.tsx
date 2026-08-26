"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  X,
  Info,
  Wrench,
  Save,
  Trash2,
  ChevronDown,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { createClient } from "@/lib/supabase";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pemeliharaanId: number | null;
  onSaved?: (updatedData: SavedData) => void;
}

interface Vehicle {
  id: number;
  nama_barang: string | null;
  merk_type: string | null;
  no_polisi: string | null;
}

interface DetailItem {
  id?: number;
  pemeliharaan_id: number;
  nama_barang: string;
  banyaknya: number;
  unit: string;
  harga_unit: number;
  jumlah: number;
  keterangan: string;
}

interface SavedData {
  id: number;
  tanggal_pengajuan: string;
  bengkel_rekanan: string;
  total_biaya: number;
  kategori_pengeluaran: string;
  inventaris_kib_b: Vehicle | null;
}

interface PemeliharaanData {
  id: number;
  tanggal_pengajuan: string | null;
  bengkel_rekanan: string | null;
  inventaris_id: number | null;
  total_biaya: number | null;
  kategori_pengeluaran: string | null;
  inventaris_kib_b: Vehicle | null;
  pemeliharaan_detail: DetailItem[];
}

export default function VehicleRepairEditModal({
  isOpen,
  onClose,
  pemeliharaanId,
  onSaved,
}: EditModalProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [data, setData] =
    useState<PemeliharaanData | null>(
      null
    );

  // ==========================================
  // STATE KENDARAAN
  // ==========================================
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [
    isLoadingKendaraan,
    setIsLoadingKendaraan,
  ] = useState(false);

  const [
    isVehicleDropdownOpen,
    setIsVehicleDropdownOpen,
  ] = useState(false);

  const [searchVehicle, setSearchVehicle] =
    useState("");

  const vehicleDropdownRef =
    useRef<HTMLDivElement>(null);

  // ==========================================
  // STATE FORM HEADER
  // ==========================================
  const [
    tanggalPengajuan,
    setTanggalPengajuan,
  ] = useState("");

  const [
    bengkelRekanan,
    setBengkelRekanan,
  ] = useState("");

  const [
    inventarisId,
    setInventarisId,
  ] = useState<number | "">("");

  const [
    kategoriPengeluaran,
    setKategoriPengeluaran,
  ] = useState("");

  // ==========================================
  // STATE DETAIL
  // ==========================================
  const [details, setDetails] =
    useState<DetailItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  // ==========================================
  // LOAD DATA PEMELIHARAAN
  // ==========================================
  useEffect(() => {
    if (
      !isOpen ||
      pemeliharaanId === null
    ) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setIsLoadingKendaraan(true);

      try {
        // ==========================================
        // AMBIL DATA KENDARAAN
        // ==========================================
        const {
          data: vehicleData,
          error: vehicleError,
        } = await supabase
          .from("inventaris_kib_b")
          .select(
            "id, nama_barang, merk_type, no_polisi"
          )
          .in("kategori", [
            "roda 2",
            "roda 4",
          ]);

        if (vehicleError) {
          throw vehicleError;
        }

        setVehicles(vehicleData || []);

        // ==========================================
        // AMBIL DATA PEMELIHARAAN
        // ==========================================
        const {
          data: detailData,
          error: detailError,
        } = await supabase
          .from("pemeliharaan")
          .select(`
            id,
            tanggal_pengajuan,
            bengkel_rekanan,
            inventaris_id,
            total_biaya,
            kategori_pengeluaran,
            inventaris_kib_b (
              id,
              nama_barang,
              merk_type,
              no_polisi
            ),
            pemeliharaan_detail (
              id,
              pemeliharaan_id,
              nama_barang,
              banyaknya,
              unit,
              harga_unit,
              jumlah,
              keterangan
            )
          `)
          .eq(
            "id",
            pemeliharaanId
          )
          .single();

        if (detailError) {
          throw detailError;
        }

        const typedData =
          detailData as unknown as PemeliharaanData;

        setData(typedData);

        // ==========================================
        // SET FORM HEADER
        // ==========================================
        setTanggalPengajuan(
          typedData.tanggal_pengajuan
            ? typedData.tanggal_pengajuan.slice(
                0,
                10
              )
            : ""
        );

        setBengkelRekanan(
          typedData.bengkel_rekanan ||
            ""
        );

        setInventarisId(
          typedData.inventaris_id !==
            null
            ? typedData.inventaris_id
            : ""
        );

        setKategoriPengeluaran(
          typedData.kategori_pengeluaran ||
            ""
        );

        // ==========================================
        // SET DETAIL
        // ==========================================
        setDetails(
          (
            typedData.pemeliharaan_detail ||
            []
          ).map((item) => {
            const banyaknya =
              Number(item.banyaknya) ||
              0;

            const jumlah =
              Number(item.jumlah) ||
              0;

            const hargaUnit =
              banyaknya > 0
                ? jumlah / banyaknya
                : Number(
                    item.harga_unit
                  ) || 0;

            return {
              ...item,
              banyaknya,
              harga_unit:
                hargaUnit,
              jumlah,
              keterangan:
                item.keterangan ||
                "",
              nama_barang:
                item.nama_barang ||
                "",
              unit:
                item.unit ||
                "PCS",
            };
          })
        );

        setSearchVehicle("");
        setIsVehicleDropdownOpen(
          false
        );
      } catch (error) {
        console.error(
          "Gagal mengambil data edit:",
          error
        );

        Swal.fire(
          "Error",
          "Gagal mengambil data pemeliharaan.",
          "error"
        );
      } finally {
        setIsLoading(false);
        setIsLoadingKendaraan(
          false
        );
      }
    };

    fetchData();
  }, [
    isOpen,
    pemeliharaanId,
    supabase,
  ]);

  // ==========================================
  // MENUTUP DROPDOWN KENDARAAN SAAT KLIK LUAR
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
        setIsVehicleDropdownOpen(
          false
        );
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
  const totalBiaya =
    details.reduce(
      (total, item) =>
        total +
        (Number(item.jumlah) || 0),
      0
    );

  // ==========================================
  // FILTER KENDARAAN
  // ==========================================
  const filteredVehicles =
    vehicles.filter((vehicle) => {
      const search =
        searchVehicle.toLowerCase();

      const namaBarang =
        vehicle.nama_barang?.toLowerCase() ||
        "";

      const noPolisi =
        vehicle.no_polisi?.toLowerCase() ||
        "";

      const merkType =
        vehicle.merk_type?.toLowerCase() ||
        "";

      return (
        namaBarang.includes(search) ||
        noPolisi.includes(search) ||
        merkType.includes(search)
      );
    });

  // ==========================================
  // KENDARAAN TERPILIH
  // ==========================================
  const selectedVehicleObj =
    vehicles.find(
      (vehicle) =>
        vehicle.id.toString() ===
        String(inventarisId)
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

  // ==========================================
  // UPDATE DETAIL
  // ==========================================
  const handleDetailChange = (
    index: number,
    field: keyof DetailItem,
    value: string
  ) => {
    setDetails((prev) =>
      prev.map(
        (item, itemIndex) => {
          if (
            itemIndex !== index
          ) {
            return item;
          }

          // ==========================================
          // BANYAKNYA BERUBAH
          // ==========================================
          if (
            field === "banyaknya"
          ) {
            const banyaknya =
              Number(value) || 0;

            const jumlah =
              Number(item.jumlah) ||
              0;

            const hargaUnit =
              banyaknya > 0
                ? jumlah / banyaknya
                : 0;

            return {
              ...item,
              banyaknya,
              harga_unit:
                hargaUnit,
            };
          }

          // ==========================================
          // JUMLAH BERUBAH
          // ==========================================
          if (
            field === "jumlah"
          ) {
            const jumlah =
              Number(value) || 0;

            const banyaknya =
              Number(
                item.banyaknya
              ) || 0;

            const hargaUnit =
              banyaknya > 0
                ? jumlah / banyaknya
                : 0;

            return {
              ...item,
              jumlah,
              harga_unit:
                hargaUnit,
            };
          }

          // ==========================================
          // FIELD LAIN
          // ==========================================
          return {
            ...item,
            [field]: value,
          };
        }
      )
    );
  };

  // ==========================================
  // HAPUS DETAIL
  // ==========================================
  const handleRemoveDetail = (
    index: number
  ) => {
    if (details.length <= 1) {
      return;
    }

    setDetails((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // ==========================================
  // VALIDASI + SIMPAN
  // ==========================================
  const handleSave = async () => {
    if (pemeliharaanId === null) {
      return;
    }

    // ==========================================
    // VALIDASI HEADER
    // ==========================================
    if (!tanggalPengajuan) {
      Swal.fire(
        "Data belum lengkap",
        "Tanggal pengajuan wajib diisi.",
        "warning"
      );
      return;
    }

    if (inventarisId === "") {
      Swal.fire(
        "Data belum lengkap",
        "Kendaraan wajib dipilih.",
        "warning"
      );
      return;
    }

    if (!kategoriPengeluaran) {
      Swal.fire(
        "Data belum lengkap",
        "Kategori pengeluaran wajib dipilih.",
        "warning"
      );
      return;
    }

    // ==========================================
    // BENGKEL HANYA WAJIB UNTUK PEMELIHARAAN
    // ==========================================
    if (
      kategoriPengeluaran ===
        "Pemeliharaan" &&
      !bengkelRekanan.trim()
    ) {
      Swal.fire(
        "Data belum lengkap",
        "Bengkel rekanan wajib diisi untuk kategori Pemeliharaan.",
        "warning"
      );
      return;
    }

    // ==========================================
    // VALIDASI DETAIL
    // ==========================================
    if (details.length === 0) {
      Swal.fire(
        "Data belum lengkap",
        "Minimal harus ada satu detail barang/jasa.",
        "warning"
      );
      return;
    }

    for (
      let i = 0;
      i < details.length;
      i++
    ) {
      const item = details[i];

      if (
        !item.nama_barang.trim()
      ) {
        Swal.fire(
          "Data belum lengkap",
          `Nama Barang / Jasa pada baris ${
            i + 1
          } wajib diisi.`,
          "warning"
        );
        return;
      }

      if (
        !item.banyaknya ||
        Number(item.banyaknya) <=
          0
      ) {
        Swal.fire(
          "Data belum lengkap",
          `Banyaknya pada baris ${
            i + 1
          } wajib lebih dari 0.`,
          "warning"
        );
        return;
      }

      if (!item.unit.trim()) {
        Swal.fire(
          "Data belum lengkap",
          `Unit pada baris ${
            i + 1
          } wajib dipilih.`,
          "warning"
        );
        return;
      }

      if (
        item.jumlah === null ||
        item.jumlah ===
          undefined ||
        Number(item.jumlah) <=
          0
      ) {
        Swal.fire(
          "Data belum lengkap",
          `Jumlah Biaya pada baris ${
            i + 1
          } wajib diisi.`,
          "warning"
        );
        return;
      }
    }

    // ==========================================
    // VALIDASI TAHUN ANGGARAN
    // ==========================================
    const submitYear =
      Number(
        tanggalPengajuan.split(
          "-"
        )[0]
      );

    if (
      !submitYear ||
      submitYear < 1900
    ) {
      Swal.fire(
        "Tanggal Tidak Valid",
        "Tanggal pengajuan tidak valid.",
        "warning"
      );
      return;
    }

    setIsSaving(true);

    try {
      // ==========================================
      // CEK TAHUN DI TABEL PAGU
      // ==========================================
      const {
        data: checkPagu,
        error: paguError,
      } = await supabase
        .from("pagu")
        .select("tahun")
        .eq("tahun", submitYear)
        .maybeSingle();

      if (paguError) {
        console.error(
          "Gagal mengecek tahun PAGU:",
          paguError
        );

        throw paguError;
      }

      // ==========================================
      // TAHUN BELUM TERDAFTAR
      // ==========================================
      if (!checkPagu) {
        await Swal.fire({
          title:
            "Tahun Anggaran Belum Ada!",
          html: `
            <div style="text-align: left;">
              <p style="margin-bottom: 10px;">
                Tanggal pengajuan yang dipilih memiliki tahun
                <b>${submitYear}</b>.
              </p>

              <p>
                Tahun <b>${submitYear}</b> belum tersedia pada
                daftar Tahun Anggaran.
              </p>

              <p style="margin-top: 10px;">
                Silakan tambahkan tahun tersebut terlebih dahulu
                melalui tombol <b>+</b> pada bagian Filter Tahun
                di halaman kendaraan.
              </p>
            </div>
          `,
          icon: "warning",
          confirmButtonColor:
            "#3b82f6",
          confirmButtonText:
            "Mengerti",
        });

        setIsSaving(false);
        return;
      }

      // ==========================================
      // 1. UPDATE DATA PEMELIHARAAN
      // ==========================================
      const {
        error:
          updateHeaderError,
      } = await supabase
        .from("pemeliharaan")
        .update({
          tanggal_pengajuan:
            tanggalPengajuan,

          bengkel_rekanan:
            kategoriPengeluaran ===
            "Pemeliharaan"
              ? bengkelRekanan.trim()
              : "",

          inventaris_id:
            Number(inventarisId),

          total_biaya:
            totalBiaya,

          kategori_pengeluaran:
            kategoriPengeluaran,
        })
        .eq(
          "id",
          pemeliharaanId
        );

      if (
        updateHeaderError
      ) {
        throw updateHeaderError;
      }

      // ==========================================
      // 2. CARI DETAIL YANG DIHAPUS
      // ==========================================
      const originalIds =
        data?.pemeliharaan_detail
          ?.map(
            (item) =>
              item.id
          )
          .filter(
            (
              id
            ): id is number =>
              typeof id ===
              "number"
          ) || [];

      const currentIds =
        details
          .map(
            (item) =>
              item.id
          )
          .filter(
            (
              id
            ): id is number =>
              typeof id ===
              "number"
          );

      const deletedIds =
        originalIds.filter(
          (id) =>
            !currentIds.includes(
              id
            )
        );

      if (
        deletedIds.length >
        0
      ) {
        const {
          error:
            deleteError,
        } = await supabase
          .from(
            "pemeliharaan_detail"
          )
          .delete()
          .in(
            "id",
            deletedIds
          );

        if (deleteError) {
          throw deleteError;
        }
      }

      // ==========================================
      // 3. UPDATE / INSERT DETAIL
      // ==========================================
      const detailPayload =
        details.map(
          (item) => {
            const banyaknya =
              Number(
                item.banyaknya
              ) || 0;

            const jumlah =
              Number(
                item.jumlah
              ) || 0;

            const hargaUnit =
              banyaknya > 0
                ? jumlah /
                  banyaknya
                : 0;

            const payload: {
              id?: number;
              pemeliharaan_id: number;
              nama_barang: string;
              banyaknya: number;
              unit: string;
              harga_unit: number;
              jumlah: number;
              keterangan:
                | string
                | null;
            } = {
              pemeliharaan_id:
                pemeliharaanId,

              nama_barang:
                item.nama_barang.trim(),

              banyaknya,

              unit:
                item.unit.trim(),

              harga_unit:
                hargaUnit,

              jumlah,

              keterangan:
                item.keterangan.trim() ||
                null,
            };

            if (
              item.id !==
              undefined
            ) {
              payload.id =
                item.id;
            }

            return payload;
          }
        );

      const {
        error:
          detailError,
      } = await supabase
        .from(
          "pemeliharaan_detail"
        )
        .upsert(
          detailPayload,
          {
            onConflict:
              "id",
          }
        );

      if (detailError) {
        throw detailError;
      }

      // ==========================================
      // 4. KENDARAAN TERBARU
      // ==========================================
      const selectedVehicle =
        vehicles.find(
          (vehicle) =>
            vehicle.id ===
            Number(
              inventarisId
            )
        ) || null;

      const savedData: SavedData =
        {
          id:
            pemeliharaanId,

          tanggal_pengajuan:
            tanggalPengajuan,

          bengkel_rekanan:
            kategoriPengeluaran ===
            "Pemeliharaan"
              ? bengkelRekanan.trim()
              : "",

          total_biaya:
            totalBiaya,

          kategori_pengeluaran:
            kategoriPengeluaran,

          inventaris_kib_b:
            selectedVehicle,
        };

      onSaved?.(
        savedData
      );

      // ==========================================
      // BERHASIL
      // ==========================================
      await Swal.fire({
        title: "Berhasil!",
        text: "Data pemeliharaan berhasil diperbarui.",
        icon: "success",
        confirmButtonColor:
          "#2563eb",
      });

      onClose();

      // Refresh halaman setelah edit berhasil
      window.location.reload();
    } catch (error) {
      console.error(
        "Gagal memperbarui data:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat memperbarui data.";

      Swal.fire(
        "Gagal",
        `Data tidak berhasil diperbarui. ${message}`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="bg-white w-full max-w-7xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col mx-4">

        {/* HEADER */}

        <div className="flex justify-between items-center p-6 border-b shrink-0">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Edit Pemeliharaan Kendaraan
            </h2>

            <p className="text-sm text-gray-500">
              Ubah informasi dan rincian pemeliharaan kendaraan di bawah ini.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
          >
            <X size={20} />
          </button>

        </div>

        {/* BODY */}

        <div className="overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar p-6">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">

              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>

              <p>
                Memuat data...
              </p>

            </div>
          ) : (
            <div className="space-y-6">

              {/* SECTION 1 */}

              <div className="bg-white p-5 rounded-lg border shadow-sm">

                <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold">

                  <Info size={18} />

                  <h3>
                    INFORMASI PENGAJUAN
                  </h3>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">

                  {/* KATEGORI */}

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

                        // Bengkel hanya untuk
                        // kategori Pemeliharaan
                        if (
                          value !==
                          "Pemeliharaan"
                        ) {
                          setBengkelRekanan(
                            ""
                          );
                        }
                      }}
                      disabled={isSaving}
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

                  {/* TANGGAL */}

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Pengajuan
                    </label>

                    <input
                      type="date"
                      value={
                        tanggalPengajuan
                      }
                      onChange={(e) =>
                        setTanggalPengajuan(
                          e.target.value
                        )
                      }
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-medium bg-white"
                    />

                  </div>

                  {/* KENDARAAN */}

                  <div
                    ref={
                      vehicleDropdownRef
                    }
                    className="relative"
                  >

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kendaraan
                    </label>

                    <div
                      onClick={() => {

                        if (
                          !isLoadingKendaraan
                        ) {
                          setIsVehicleDropdownOpen(
                            !isVehicleDropdownOpen
                          );
                        }

                      }}
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

                          {filteredVehicles.map(
                            (vehicle) => (

                              <li
                                key={
                                  vehicle.id
                                }
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-800 font-medium border-b border-gray-50 last:border-0"
                                onClick={() => {

                                  setInventarisId(
                                    vehicle.id
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

                          {filteredVehicles.length ===
                            0 && (

                            <li className="px-3 py-4 text-sm text-center text-gray-500">
                              Kendaraan tidak ditemukan
                            </li>

                          )}

                        </ul>

                      </div>

                    )}

                  </div>

                  {/* BENGKEL REKANAN */}
                  {/* HANYA MUNCUL UNTUK PEMELIHARAAN */}

                  {kategoriPengeluaran ===
                    "Pemeliharaan" && (

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bengkel Rekanan
                      </label>

                      <input
                        type="text"
                        value={
                          bengkelRekanan
                        }
                        onChange={(e) =>
                          setBengkelRekanan(
                            e.target.value
                          )
                        }
                        placeholder="Contoh: Gede Jaya Motor"
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal"
                      />

                    </div>

                  )}

                </div>

              </div>

              {/* SECTION 2 */}

              <div className="bg-white rounded-lg border shadow-sm relative flex flex-col">

                <div className="sticky top-0 bg-gray-50 z-10 p-5 border-b shadow-sm rounded-t-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">

                  <div className="flex items-center gap-2 text-blue-600 font-semibold">

                    <Wrench size={18} />

                    <h3>
                      DETAIL PEMELIHARAAN
                    </h3>

                  </div>

                </div>

                <div className="p-5 space-y-4">

                  {details.length >
                  0 ? (

                    details.map(
                      (
                        item,
                        index
                      ) => {

                        const hargaUnit =
                          item.jumlah >
                            0 &&
                          item.banyaknya >
                            0
                            ? item.jumlah /
                              item.banyaknya
                            : 0;

                        return (
                          <div
                            key={
                              item.id ??
                              `new-${index}`
                            }
                            className="flex gap-2 items-start border-b pb-4 last:border-0 group animate-in fade-in slide-in-from-top-4 duration-300"
                          >

                            <div className="grid grid-cols-12 gap-3 flex-1">

                              {/* NAMA */}

                              <div className="col-span-12 md:col-span-3">

                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  Nama Barang / Jasa
                                </label>

                                <input
                                  type="text"
                                  placeholder="Contoh: Aki Kering"
                                  value={
                                    item.nama_barang
                                  }
                                  onChange={(e) =>
                                    handleDetailChange(
                                      index,
                                      "nama_barang",
                                      e.target
                                        .value
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    handleDetailChange(
                                      index,
                                      "banyaknya",
                                      e.target
                                        .value
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    handleDetailChange(
                                      index,
                                      "unit",
                                      e.target
                                        .value
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                              {/* HARGA / UNIT */}

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

                              {/* JUMLAH */}

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
                                      handleDetailChange(
                                        index,
                                        "jumlah",
                                        e.target
                                          .value
                                      )
                                    }
                                    disabled={
                                      isSaving
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
                                    handleDetailChange(
                                      index,
                                      "keterangan",
                                      e.target
                                        .value
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                              </div>

                            </div>

                            {/* HAPUS */}

                            <div className="w-10 pt-6 flex justify-end shrink-0">

                              {details.length >
                              1 ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveDetail(
                                      index
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors"
                                  title="Hapus Item"
                                >

                                  <Trash2
                                    size={
                                      18
                                    }
                                  />

                                </button>

                              ) : (

                                <div className="w-9" />

                              )}

                            </div>

                          </div>
                        );
                      }
                    )

                  ) : (

                    <div className="text-center py-8 text-gray-500 text-sm">
                      Tidak ada detail barang.
                    </div>

                  )}

                </div>

              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}

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
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition text-sm disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                isLoading
              }
              className="px-4 py-2 bg-blue-600 rounded-md text-white font-medium hover:bg-blue-700 transition shadow-sm text-sm flex items-center gap-2 disabled:bg-blue-400"
            >
              <Save size={16} />

              {isSaving
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}