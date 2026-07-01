import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RfidCardRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function mapCard(card: {
  id: string;
  rfid_uid: string;
  created_at: string;
} | null) {
  if (!card) {
    return null;
  }

  return {
    id: card.id,
    rfidUid: card.rfid_uid,
    createdAt: card.created_at
  };
}

function mapEnrollment(enrollment: {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  rfid_uid: string | null;
  error_message: string | null;
} | null) {
  if (!enrollment) {
    return null;
  }

  return {
    id: enrollment.id,
    status: enrollment.status,
    rfidUid: enrollment.rfid_uid,
    errorMessage: enrollment.error_message
  };
}

async function getCardAndEnrollment(lockerId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      response: NextResponse.json(
        { message: "Supabase admin client belum dikonfigurasi." },
        { status: 500 }
      )
    };
  }

  const [{ data: card }, { data: enrollment }] = await Promise.all([
    supabase
      .from("locker_rfid_cards")
      .select("id,rfid_uid,created_at")
      .eq("locker_id", lockerId)
      .maybeSingle(),
    supabase
      .from("rfid_enrollments")
      .select("id,status,rfid_uid,error_message")
      .eq("locker_id", lockerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    supabase,
    card: mapCard(card),
    enrollment: mapEnrollment(enrollment)
  };
}

export async function GET(_request: Request, { params }: RfidCardRouteProps) {
  const { id: lockerId } = await params;
  const result = await getCardAndEnrollment(lockerId);

  if ("response" in result) {
    return result.response;
  }

  return NextResponse.json({
    card: result.card,
    enrollment: result.enrollment
  });
}

export async function POST(_request: Request, { params }: RfidCardRouteProps) {
  const { id: lockerId } = await params;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const { data: locker } = await supabase
    .from("lockers")
    .select("id")
    .eq("id", lockerId)
    .maybeSingle();

  if (!locker) {
    return NextResponse.json(
      { message: "Loker tidak ditemukan." },
      { status: 404 }
    );
  }

  await supabase
    .from("rfid_enrollments")
    .update({ status: "cancelled" })
    .eq("locker_id", lockerId)
    .eq("status", "pending");

  const { data: enrollment, error } = await supabase
    .from("rfid_enrollments")
    .insert({
      locker_id: lockerId,
      status: "pending"
    })
    .select("id,status,rfid_uid,error_message")
    .single();

  if (error || !enrollment) {
    return NextResponse.json(
      { message: error?.message ?? "Gagal memulai pendaftaran kartu." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    card: null,
    enrollment: mapEnrollment(enrollment),
    message: "Mode tambah kartu aktif. Tempelkan kartu RFID ke reader."
  });
}

export async function DELETE(_request: Request, { params }: RfidCardRouteProps) {
  const { id: lockerId } = await params;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase admin client belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const { error } = await supabase
    .from("locker_rfid_cards")
    .delete()
    .eq("locker_id", lockerId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  await supabase
    .from("rfid_enrollments")
    .update({ status: "cancelled" })
    .eq("locker_id", lockerId)
    .eq("status", "pending");

  return NextResponse.json({
    card: null,
    enrollment: null,
    message: "Kartu RFID berhasil dihapus dari loker."
  });
}
