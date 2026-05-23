import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen bg-[#F4EFE6] pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
