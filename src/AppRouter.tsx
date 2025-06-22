import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/components/common";
import { SetupCheck } from "@/components/admin";

import Index from "./pages/Index";
import About from "./pages/About";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminSetup from "./pages/AdminSetup";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SetupCheck>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/setup" element={<Setup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SetupCheck>
    </BrowserRouter>
  );
}
export default AppRouter;