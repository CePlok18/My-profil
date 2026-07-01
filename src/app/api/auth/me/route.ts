import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return NextResponse.json(
      { message: "Sesi login tidak tersedia." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return NextResponse.json(
      { message: "Sesi login tidak valid atau sudah berakhir." },
      { status: 401 }
    );
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id,name,email,rfid_uid,role,is_active,created_at")
    .eq("id", user.id)
    .single();
  let profile = profileResult.data as Profile | null;
  let profileError = profileResult.error;

  if (profileError?.code === "42703") {
    const fallbackResult = await supabase
      .from("profiles")
      .select("id,name,email,role,is_active,created_at")
      .eq("id", user.id)
      .single();

    profile = fallbackResult.data
      ? ({ ...fallbackResult.data, rfid_uid: null } as Profile)
      : null;
    profileError = fallbackResult.error;
  }

  if (profileError || !profile) {
    return NextResponse.json(
      { message: "Profil akun belum tersedia. Hubungi admin." },
      { status: 404 }
    );
  }

  const { data: access, error: accessError } = await supabase
    .from("locker_access")
    .select(
      `
      lockers:locker_id (
        id,
        locker_number,
        name,
        status,
        current_user_id,
        last_opened_at,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (accessError) {
    return NextResponse.json(
      { message: "Data akses loker gagal dimuat." },
      { status: 500 }
    );
  }

  const lockerValue = access?.lockers;
  const locker = Array.isArray(lockerValue) ? lockerValue[0] : lockerValue;

  return NextResponse.json({
    profile,
    locker: locker ?? null
  });
}
