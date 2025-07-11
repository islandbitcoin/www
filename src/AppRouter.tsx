import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/components/common";
import { SetupCheck } from "@/components/admin";
import { ConfigSync } from "@/components/ConfigSync";

import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminSetup from "./pages/AdminSetup";
import Setup from "./pages/Setup";
import NotFound from "./pages/NotFound";
import Health from "./pages/Health";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ConfigSync>
        <SetupCheck>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/health" element={<Health />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SetupCheck>
      </ConfigSync>
    </BrowserRouter>
  );
}
export default AppRouter;