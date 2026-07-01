export type UserRole = "admin" | "user";

export type LockerStatus = "available" | "occupied";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  rfid_uid: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

export type Locker = {
  id: string;
  locker_number: number;
  name: string;
  status: LockerStatus;
  current_user_id: string | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
};
