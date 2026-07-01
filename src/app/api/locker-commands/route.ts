import { NextResponse } from "next/server";
import { publishLockerCommand } from "@/lib/mqtt";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CommandPayload = {
  lockerId?: string;
  command?: "open" | "close";
  userId?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as CommandPayload;
  const lockerId = payload.lockerId?.trim();
  const command = payload.command;
  const userId = payload.userId?.trim() || null;

  if (!lockerId || !command || !["open", "close"].includes(command)) {
    return NextResponse.json(
      { message: "Loker dan command wajib valid." },
      { status: 400 }
    );
  }

  const { data: locker, error: lockerError } = await supabase
    .from("lockers")
    .select("locker_number")
    .eq("id", lockerId)
    .single();

  if (lockerError || !locker) {
    return NextResponse.json(
      { message: lockerError?.message ?? "Loker tidak ditemukan." },
      { status: 404 }
    );
  }

  const { data: insertedCommand, error: commandError } = await supabase
    .from("locker_commands")
    .insert({
      locker_id: lockerId,
      command,
      requested_by: userId
    })
    .select("id")
    .single();

  if (commandError || !insertedCommand) {
    return NextResponse.json(
      { message: commandError?.message ?? "Gagal membuat command." },
      { status: 400 }
    );
  }

  let mqttInfo: Awaited<ReturnType<typeof publishLockerCommand>>;

  try {
    mqttInfo = await publishLockerCommand({
      commandId: insertedCommand.id,
      lockerId,
      lockerNumber: locker.locker_number,
      command
    });
  } catch (error) {
    await supabase
      .from("locker_commands")
      .update({
        status: "failed",
        processed_at: new Date().toISOString(),
        error_message:
          error instanceof Error ? error.message : "Gagal publish MQTT"
      })
      .eq("id", insertedCommand.id);

    return NextResponse.json(
      { message: "Gagal mengirim command ke MQTT broker." },
      { status: 502 }
    );
  }

  await supabase.from("locker_logs").insert({
    locker_id: lockerId,
    user_id: userId,
    action: command,
    source: "web",
    description:
      command === "open"
        ? "Perintah buka loker dikirim ke perangkat IoT."
        : "Perintah tutup loker dikirim ke perangkat IoT."
  });

  return NextResponse.json({
    message:
      command === "open"
        ? "Perintah buka loker dikirim."
        : "Perintah tutup loker dikirim.",
    commandId: insertedCommand.id,
    mqtt: mqttInfo
  });
}
