import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Betreiber from "./pages/Betreiber";
import TenantApp from "./TenantApp";

// Zentrales Routing:
//   /              -> Landing (spaeter: Verkaufs-/Marketingseite)
//   /betreiber     -> Betreibermaske (nur fuer dich)
//   /:slug         -> die App der jeweiligen Fahrschule (z.B. /saad)
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/betreiber" element={<Betreiber/>}/>
      <Route path="/:slug" element={<TenantApp/>}/>
    </Routes>
  );
}
