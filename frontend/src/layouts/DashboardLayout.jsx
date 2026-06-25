import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, Navbar } from "@/components/public";

export default function Dashboardlayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="dashboard min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[240px]">
        <Navbar onMenu={() => setOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
