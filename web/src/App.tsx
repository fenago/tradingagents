import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/lib/theme"
import { AuthProvider } from "@/hooks/useAuth"
import { AuthGate } from "@/components/auth/AuthGate"
import { AppShell } from "@/components/layout/AppShell"
import { LandingRoute } from "@/routes/Landing"
import { DashboardRoute } from "@/routes/Dashboard"
import { RunRoute } from "@/routes/Run"
import { NewRunRoute } from "@/routes/NewRun"
import { WatchlistRoute } from "@/routes/Watchlist"
import { TrackRecordRoute } from "@/routes/TrackRecord"
import { PortfolioRoute } from "@/routes/Portfolio"
import { SettingsRoute } from "@/routes/Settings"
import { PricingRoute } from "@/routes/Pricing"
import { BillingSuccessRoute } from "@/routes/BillingSuccess"
import { LoginRoute } from "@/routes/Login"
import { AuthCallbackRoute } from "@/routes/AuthCallback"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingRoute />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/auth/callback" element={<AuthCallbackRoute />} />

              {/* Authenticated app */}
              <Route
                element={
                  <AuthGate>
                    <AppShell />
                  </AuthGate>
                }
              >
                <Route path="/dashboard" element={<DashboardRoute />} />
                <Route path="/runs/new" element={<NewRunRoute />} />
                <Route path="/runs/:id" element={<RunRoute />} />
                <Route path="/watchlist" element={<WatchlistRoute />} />
                <Route path="/track-record" element={<TrackRecordRoute />} />
                <Route path="/portfolio" element={<PortfolioRoute />} />
                <Route path="/pricing" element={<PricingRoute />} />
                <Route path="/billing/success" element={<BillingSuccessRoute />} />
                <Route path="/settings" element={<SettingsRoute />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
