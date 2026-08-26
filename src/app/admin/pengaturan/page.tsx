"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff, Camera, Loader2, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Cropper, { Area } from "react-easy-crop";
import Swal from "sweetalert2"; // Import SweetAlert2
import { editMyProfile } from "@/actions/userActions";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area, fileName: string): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.6,
    );
  });
}

export default function PengaturanAdminPage() {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profile, setProfile] = useState({ id: 0, nip: "", nama: "", email: "", avatar_url: "" });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data } = await supabase.from("users").select("*").eq("email", user.email).single();
        if (data) setProfile({ id: data.id, nip: data.nip, nama: data.nama, email: data.email, avatar_url: data.avatar_url });
      }
      setIsLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      setImageSrc(imageDataUrl);
      setIsCropModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUploadAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, `avatar_${profile.nip}_${Date.now()}.jpg`);

      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(`public/${croppedFile.name}`, croppedFile, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", profile.id);
      if (dbError) throw dbError;

      // 1. SWEETALERT SUKSES UPLOAD FOTO
      Swal.fire({
        icon: "success",
        title: "Foto Berhasil Diperbarui!",
        text: "Foto profil Anda telah sukses di-upload ke server.",
        confirmButtonColor: "#2563eb",
        timer: 2000,
        showConfirmButton: false,
      });

      setProfile({ ...profile, avatar_url: publicUrl });
      setIsCropModalOpen(false);
      window.dispatchEvent(new Event("local-avatar-updated"));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui";
      // 2. SWEETALERT GAGAL UPLOAD FOTO
      Swal.fire({
        icon: "error",
        title: "Gagal Mengunggah",
        text: errorMessage,
        confirmButtonColor: "#ba1a1a",
      });
    }
    setIsUploading(false);
  };

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true);
    const res = await editMyProfile({ id: profile.id, nip: profile.nip, nama: profile.nama });
    if (res.success) {
      Swal.fire({ icon: "success", title: "Profil Diperbarui!", text: "Informasi profil Anda telah berhasil disimpan.", confirmButtonColor: "#2563eb", timer: 2500, showConfirmButton: false });
      window.dispatchEvent(new Event("local-avatar-updated"));
    } else {
      Swal.fire({ icon: "error", title: "Gagal Update", text: res.message, confirmButtonColor: "#ba1a1a" });
    }
    setIsSavingProfile(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      return Swal.fire({ icon: "warning", title: "Sandi Terlalu Pendek", text: "Kata sandi minimal 6 karakter!", confirmButtonColor: "#2563eb" });
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire({ icon: "error", title: "Tidak Cocok", text: "Konfirmasi kata sandi baru tidak cocok!", confirmButtonColor: "#ba1a1a" });
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal Mengubah Sandi", text: error.message, confirmButtonColor: "#ba1a1a" });
    } else {
      // 3. SWEETALERT SUKSES UBAH PASSWORD
      Swal.fire({
        icon: "success",
        title: "Sandi Diperbarui!",
        text: "Kata sandi akun Anda telah berhasil diubah di database.",
        confirmButtonColor: "#2563eb",
        timer: 2500,
        showConfirmButton: false,
      });
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsSaving(false);
  };

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );

  const avatarImage = profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.nama}&background=0D8ABC&color=fff&size=200&bold=true`;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-slate-200 bg-white">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900">Pengaturan Akun</h3>
          <p className="text-sm text-slate-500 mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0 flex flex-col items-center gap-3">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
              <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border border-slate-200 relative group cursor-pointer shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Ubah Foto
              </button>
            </div>

            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Pengguna</label>
                <input type="text" value={profile.email} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">NIP Pegawai</label>
                <input type="text" value={profile.nip} onChange={(e) => setProfile({ ...profile, nip: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input type="text" value={profile.nama} onChange={(e) => setProfile({ ...profile, nama: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSavingProfile || !profile.nip || !profile.nama}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan Profil
                </button>
              </div>
            </div>
          </div>

          <div className="my-8 border-t border-slate-200"></div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-5">Ubah Kata Sandi</h4>
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleUpdatePassword}
            disabled={isSaving || !newPassword}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan Kata Sandi
          </button>
        </div>
      </div>

      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Sesuaikan Foto Profil</h3>
              <button onClick={() => setIsCropModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-80 bg-slate-100">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>

            <div className="p-6 bg-white space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Perbesar / Perkecil (Zoom)</label>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCropModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                  Batal
                </button>
                <button onClick={handleUploadAvatar} disabled={isUploading} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isUploading ? "Mengunggah..." : "Simpan Foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
