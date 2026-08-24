import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { QuoteProvider } from "./lib/QuoteContext";
import { PrintReport } from "./pages/PrintReport";
import { WikiIndex } from "./pages/WikiIndex";
import { WikiReader } from "./pages/WikiReader";
import { Workbench } from "./pages/Workbench";

export function App() {
  return (
    <QuoteProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Workbench />} />
            <Route path="/wiki" element={<WikiIndex />} />
            <Route path="/wiki/:slug" element={<WikiReader />} />
            <Route path="/print" element={<PrintReport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QuoteProvider>
  );
}
