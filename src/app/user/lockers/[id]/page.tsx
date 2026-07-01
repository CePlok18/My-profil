import { UserLockerDetailClient } from "@/components/dashboard/UserLockerDetailClient";

type UserLockerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UserLockerDetailPage({
  params
}: UserLockerDetailPageProps) {
  const { id } = await params;

  return <UserLockerDetailClient lockerId={id} />;
}
