import AdminClientLayout from "./AdminClientLayout";

export const metadata = {
  title: "Admin Panel | RhockDeal",
  description: "RhockDeal administration system",
};

export default function AdminLayout({ children }) {
  return (
    <AdminClientLayout>
      {children}
    </AdminClientLayout>
  );
}
