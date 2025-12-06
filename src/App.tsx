import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Rubric from "./pages/Rubric";
import ScoringChart from "./pages/ScoringChart";
import Assess from "./pages/Assess";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Use basename only for GitHub Pages deployment, not for Lovable preview
const basename = import.meta.env.PROD && window.location.hostname.includes('github.io') 
  ? '/kid-s-writing-helper' 
  : '';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rubric" element={<Rubric />} />
          <Route path="/scoring-chart" element={<ScoringChart />} />
          <Route path="/assess" element={<Assess />} />
          <Route path="/results/:id" element={<Results />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
