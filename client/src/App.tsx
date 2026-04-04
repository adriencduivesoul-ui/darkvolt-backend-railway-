/* ============================================================
   DARKVOLT — APP ROOT
   Theme: Dark (forced) — Electric Underground design system
   ============================================================ */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import CustomCursor from "./components/CustomCursor";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import MentionsLegales from "./pages/MentionsLegales";
import CGU from "./pages/CGU";
import Confidentialite from "./pages/Confidentialite";
import Contact from "./pages/Contact";
import Artistes from "./pages/Artistes";
import RecrutementDJ from "./pages/RecrutementDJ";
import SoumettreUnMix from "./pages/SoumettreUnMix";
import LiveStream from './pages/LiveStream';
import Archives from './pages/Archives';
import AuthDiscordCallback from './pages/AuthDiscordCallback';
import StreamTest from './pages/StreamTest';
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import BlogEditor from "./pages/BlogEditor";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/auth"} component={AuthPage} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/mentions-legales"} component={MentionsLegales} />
      <Route path={"/cgu"} component={CGU} />
      <Route path={"/confidentialite"} component={Confidentialite} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/artistes"} component={Artistes} />
      <Route path={"/recrutement-dj"} component={RecrutementDJ} />
      <Route path={"/soumettre-un-mix"} component={SoumettreUnMix} />
      <Route path={"/live"} component={LiveStream} />
      <Route path={"/archives"} component={Archives} />
      <Route path={"/auth/discord"} component={AuthDiscordCallback} />
      <Route path={"/stream-test"} component={StreamTest} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/:slug"} component={BlogArticle} />
      <Route path={"/blog/editor"} component={BlogEditor} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <CustomCursor />
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: '#0a0a0a',
                  border: '1px solid rgba(57,255,20,0.2)',
                  color: '#e8e8e8',
                  fontFamily: "'Space Grotesk', sans-serif",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
