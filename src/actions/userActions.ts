"use server";

import { createClient } from "@supabase/supabase-js";

// Menggunakan Kunci Superadmin (Bisa bypass RLS)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// 1. CREATE USER (Sudah ada sebelumnya)
export async function createNewUser(formData: { email: string; kataSandi: string; nip: string; nama: string; role: string }) {
  try {
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.kataSandi,
      email_confirm: true,
    });
    if (authError) throw new Error(authError.message);

    const { error: dbError } = await supabaseAdmin.from("users").insert([{ email: formData.email, nip: formData.nip, nama: formData.nama, role: formData.role }]);
    if (dbError) throw new Error(dbError.message);

    return { success: true, message: "Pengguna berhasil dibuat!" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 2. EDIT USER (NIP, Nama & Role)
export async function editUser(formData: { id: number; nip: string; nama: string; role: string }) {
  try {
    const { error } = await supabaseAdmin.from("users").update({ nip: formData.nip, nama: formData.nama, role: formData.role }).eq("id", formData.id);

    if (error) throw new Error(error.message);
    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. DELETE USER ACCOUNT
export async function deleteUserAccount(id: number, email: string) {
  try {
    // A. Hapus profil dari tabel kita
    await supabaseAdmin.from("users").delete().eq("id", id);

    // B. Cari ID asli di Supabase Auth dan hapus akses login-nya
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers();
    if (users) {
      const authUser = users.find((u) => u.email === email);
      if (authUser) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      }
    }
    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 4. RESET PASSWORD
export async function resetUserPassword(email: string) {
  try {
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find((u) => u.email === email);

    if (authUser) {
      // Reset paksa ke password default
      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: "CamatKuta2026!" });
      if (error) throw new Error(error.message);
      return { success: true };
    }
    throw new Error("Email tidak ditemukan di sistem Auth.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 5. EDIT PROFIL SENDIRI (NIP & Nama)
export async function editMyProfile(formData: { id: number; nip: string; nama: string }) {
  try {
    const { error } = await supabaseAdmin.from("users").update({ nip: formData.nip, nama: formData.nama }).eq("id", formData.id);

    if (error) throw new Error(error.message);
    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
