import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RfidScanPayload = {
  rfidUid?: string;
};

type LockerCommand = "open" | "close";

type LockerReference = {
  locker_id: string;
  user_id: string | null;
  locker_number?: number;
  locker_name?: string;
};

function isAuthorized(request: Request) {
  const configuredKey = process.env.IOT_DEVICE_KEY;

  if (!configuredKey) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("deviceKey");
  const headerKey = request.headers.get("x-iot-device-key");

  return queryKey === configuredKey || headerKey === configuredKey;
}

function normalizeRfidUid(value?: string | null) {
  const normalized = value?.replace(/[^a-fA-F0-9]/g, "").toUpperCase() ?? "";
  return normalized || null;
}

async function getNextCommand(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  lockerId: string
): Promise<LockerCommand> {
  const { data: latestCommand } = await supabase
    .from("locker_commands")
    .select("command")
    .eq("locker_id", lockerId)
    .eq("status", "processed")
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestCommand?.command === "open" ? "close" : "open";
}

async function createRfidCommand(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  locker: LockerReference
) {
  const nextCommand = await getNextCommand(supabase, locker.locker_id);

  const { data: insertedCommand, error: commandError } = await supabase
    .from("locker_commands")
    .insert({
      locker_id: locker.locker_id,
      command: nextCommand,
      source: "rfid",
      requested_by: locker.user_id
    })
    .select("id")
    .single();

  if (commandError || !insertedCommand) {
    return {
      response: NextResponse.json(
        { message: commandError?.message ?? "Gagal membuat command RFID." },
        { status: 400 }
      )
    };
  }

  await supabase.from("locker_logs").insert({
    locker_id: locker.locker_id,
    user_id: locker.user_id,
    action: nextCommand,
    source: "rfid",
    description:
      nextCommand === "open"
        ? "Kartu RFID valid, perintah buka loker dibuat."
        : "Kartu RFID valid, perintah tutup loker dibuat."
  });

  return {
    response: NextResponse.json({
      message:
        nextCommand === "open"
          ? "RFID valid. Perintah buka loker dikirim."
          : "RFID valid. Perintah tutup loker dikirim.",
      commandId: insertedCommand.id,
      command: nextCommand,
      userId: locker.user_id,
      lockerId: locker.locker_id,
      lockerNumber: locker.locker_number,
      lockerName: locker.locker_name
    })
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as RfidScanPayload;
  const rfidUid = normalizeRfidUid(payload.rfidUid);

  if (!rfidUid) {
    return NextResponse.json(
      { message: "UID RFID wajib dikirim." },
      { status: 400 }
    );
  }

  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: enrollment } = await supabase
    .from("rfid_enrollments")
    .select("id,locker_id")
    .eq("status", "pending")
    .gte("created_at", twoMinutesAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollment) {
    const { error: cardError } = await supabase
      .from("locker_rfid_cards")
      .upsert(
        {
          locker_id: enrollment.locker_id,
          rfid_uid: rfidUid,
          updated_at: new Date().toISOString()
        },
        { onConflict: "locker_id" }
      );

    if (cardError) {
      await supabase
        .from("rfid_enrollments")
        .update({
          status: "failed",
          rfid_uid: rfidUid,
          error_message:
            cardError.code === "23505"
              ? "Kartu RFID ini sudah terdaftar pada loker lain."
              : cardError.message,
          completed_at: new Date().toISOString()
        })
        .eq("id", enrollment.id);

      return NextResponse.json(
        {
          mode: "enrollment",
          message:
            cardError.code === "23505"
              ? "Kartu RFID ini sudah terdaftar pada loker lain."
              : cardError.message
        },
        { status: 409 }
      );
    }

    await supabase
      .from("rfid_enrollments")
      .update({
        status: "completed",
        rfid_uid: rfidUid,
        error_message: null,
        completed_at: new Date().toISOString()
      })
      .eq("id", enrollment.id);

    return NextResponse.json({
      mode: "enrollment",
      message: "Kartu RFID berhasil didaftarkan ke loker.",
      lockerId: enrollment.locker_id,
      rfidUid
    });
  }

  const { data: lockerCard, error: lockerCardError } = await supabase
    .from("locker_rfid_cards")
    .select(
      `
      locker_id,
      lockers:locker_id (
        locker_number,
        name
      )
    `
    )
    .eq("rfid_uid", rfidUid)
    .maybeSingle();

  if (lockerCardError) {
    return NextResponse.json(
      { message: lockerCardError.message },
      { status: 400 }
    );
  }

  if (lockerCard?.locker_id) {
    const locker = Array.isArray(lockerCard.lockers)
      ? lockerCard.lockers[0]
      : lockerCard.lockers;

    const result = await createRfidCommand(supabase, {
      locker_id: lockerCard.locker_id,
      user_id: null,
      locker_number: locker?.locker_number,
      locker_name: locker?.name
    });

    return result.response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,name,is_active")
    .eq("rfid_uid", rfidUid)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 400 });
  }

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { message: "Kartu RFID tidak terdaftar atau user tidak aktif." },
      { status: 404 }
    );
  }

  const { data: access, error: accessError } = await supabase
    .from("locker_access")
    .select(
      `
      locker_id,
      lockers:locker_id (
        locker_number,
        name
      )
    `
    )
    .eq("user_id", profile.id)
    .maybeSingle();

  if (accessError) {
    return NextResponse.json({ message: accessError.message }, { status: 400 });
  }

  if (!access?.locker_id) {
    return NextResponse.json(
      { message: "User RFID belum memiliki akses loker." },
      { status: 404 }
    );
  }

  const locker = Array.isArray(access.lockers)
    ? access.lockers[0]
    : access.lockers;

  const result = await createRfidCommand(supabase, {
    locker_id: access.locker_id,
    user_id: profile.id,
    locker_number: locker?.locker_number,
    locker_name: locker?.name
  });

  return result.response;
}
