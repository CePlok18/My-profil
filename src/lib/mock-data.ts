import type { Locker } from "@/types/database";

export const mockLockers: Locker[] = [
  {
    id: "locker-1",
    locker_number: 1,
    name: "Loker 1",
    status: "available",
    current_user_id: null,
    last_opened_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "locker-2",
    locker_number: 2,
    name: "Loker 2",
    status: "occupied",
    current_user_id: "sample-user",
    last_opened_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "locker-3",
    locker_number: 3,
    name: "Loker 3",
    status: "occupied",
    current_user_id: null,
    last_opened_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "locker-4",
    locker_number: 4,
    name: "Loker 4",
    status: "occupied",
    current_user_id: "sample-user-2",
    last_opened_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
