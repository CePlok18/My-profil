import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  rfidUid?: string;
  lockerId?: string;
};

function normalizeRfidUid(value?: string | null) {
  const normalized = value?.replace(/[^a-fA-F0-9]/g, "").toUpperCase() ?? "";
  return normalized || null;
}

async function findUserByEmail(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  email: string
) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email === email) ?? null;
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as CreateUserPayload;
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const password = payload.password?.trim();
  const rfidUid = normalizeRfidUid(payload.rfidUid);
  const lockerId = payload.lockerId?.trim();

  if (!name || !email || !password || !lockerId) {
    return NextResponse.json(
      { message: "Nama, email, password, dan loker wajib diisi." },
      { status: 400 }
    );
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

  let user = createdUser.user;
  let createdNewUser = Boolean(user);

  if (createError || !user) {
    const existingUser = await findUserByEmail(supabase, email);

    if (!existingUser) {
      return NextResponse.json(
        { message: createError?.message ?? "Gagal membuat user." },
        { status: 400 }
      );
    }

    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { name }
      });

    if (updateError || !updatedUser.user) {
      return NextResponse.json(
        { message: updateError?.message ?? "Gagal memperbarui user." },
        { status: 400 }
      );
    }

    user = updatedUser.user;
    createdNewUser = false;
  }

  if (!user) {
    return NextResponse.json(
      { message: "Gagal menyiapkan akun user." },
      { status: 400 }
    );
  }

  if (rfidUid) {
    const { data: existingRfidOwner } = await supabase
      .from("profiles")
      .select("id")
      .eq("rfid_uid", rfidUid)
      .maybeSingle();

    if (existingRfidOwner && existingRfidOwner.id !== user.id) {
      if (createdNewUser) {
        await supabase.auth.admin.deleteUser(user.id);
      }

      return NextResponse.json(
        { message: "ID kartu RFID ini sudah dipakai user lain." },
        { status: 400 }
      );
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    name,
    email,
    rfid_uid: rfidUid,
    role: "user",
    is_active: true
  });

  if (profileError) {
    if (createdNewUser) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json(
      { message: profileError.message },
      { status: 400 }
    );
  }

  const { data: selectedLocker } = await supabase
    .from("lockers")
    .select("current_user_id")
    .eq("id", lockerId)
    .maybeSingle();

  if (!selectedLocker) {
    if (createdNewUser) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json(
      { message: "Loker tidak ditemukan." },
      { status: 400 }
    );
  }

  if (
    selectedLocker?.current_user_id &&
    selectedLocker.current_user_id !== user.id
  ) {
    if (createdNewUser) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json(
      { message: "Loker ini sudah digunakan oleh user lain." },
      { status: 400 }
    );
  }

  await supabase
    .from("lockers")
    .update({
      status: "available",
      current_user_id: null
    })
    .eq("current_user_id", user.id);

  await supabase.from("locker_access").delete().eq("user_id", user.id);

  const { error: accessError } = await supabase.from("locker_access").insert({
    user_id: user.id,
    locker_id: lockerId
  });

  if (accessError) {
    if (createdNewUser) {
      await supabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json(
      {
        message:
          accessError.code === "23505"
            ? "User, loker, atau kartu RFID ini sudah dipasangkan ke akses lain."
            : accessError.message
      },
      { status: 400 }
    );
  }

  await supabase
    .from("lockers")
    .update({
      status: "occupied",
      current_user_id: user.id
    })
    .eq("id", lockerId);

  return NextResponse.json({
    message: createdNewUser
      ? "User berhasil dibuat."
      : "User berhasil diperbarui dan dipasangkan ke loker.",
    userId: user.id
  });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { message: "User ID wajib dikirim." },
      { status: 400 }
    );
  }

  const { data: access } = await supabase
    .from("locker_access")
    .select("locker_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json(
      { message: deleteError.message },
      { status: 400 }
    );
  }

  if (access?.locker_id) {
    await supabase
      .from("lockers")
      .update({
        status: "available",
        current_user_id: null
      })
      .eq("id", access.locker_id);
  }

  return NextResponse.json({
    message: "Akun user berhasil dihapus."
  });
}
