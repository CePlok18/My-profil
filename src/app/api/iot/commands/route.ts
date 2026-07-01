import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CompleteCommandPayload = {
  commandId?: string;
  success?: boolean;
  errorMessage?: string;
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

export async function GET(request: Request) {
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

  const { data: command, error } = await supabase
    .from("locker_commands")
    .select(
      `
      id,
      command,
      locker_id,
      lockers:locker_id (
        locker_number
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (!command) {
    return NextResponse.json({ command: null });
  }

  await supabase
    .from("locker_commands")
    .update({ status: "processing" })
    .eq("id", command.id);

  const lockerValue = Array.isArray(command.lockers)
    ? command.lockers[0]
    : command.lockers;

  return NextResponse.json({
    command: {
      id: command.id,
      action: command.command,
      lockerId: command.locker_id,
      lockerNumber: lockerValue?.locker_number
    }
  });
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

  const payload = (await request.json()) as CompleteCommandPayload;
  const commandId = payload.commandId?.trim();

  if (!commandId) {
    return NextResponse.json(
      { message: "Command ID wajib dikirim." },
      { status: 400 }
    );
  }

  const { data: command, error: commandError } = await supabase
    .from("locker_commands")
    .select("id,locker_id,command")
    .eq("id", commandId)
    .single();

  if (commandError || !command) {
    return NextResponse.json(
      { message: commandError?.message ?? "Command tidak ditemukan." },
      { status: 404 }
    );
  }

  const success = payload.success !== false;

  const { error: updateError } = await supabase
    .from("locker_commands")
    .update({
      status: success ? "processed" : "failed",
      processed_at: new Date().toISOString(),
      error_message: success ? null : payload.errorMessage ?? "Gagal diproses ESP32"
    })
    .eq("id", commandId);

  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (success && command.command === "open") {
    await supabase
      .from("lockers")
      .update({
        last_opened_at: new Date().toISOString()
      })
      .eq("id", command.locker_id);
  }

  return NextResponse.json({ message: "Command selesai diproses." });
}
