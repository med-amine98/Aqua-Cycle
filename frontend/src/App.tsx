import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

// Pages publiques
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Pricing from './pages/public/Pricing';
import Contact from './pages/public/Contact';

// Pages privées
import PrivateLayout from './components/PrivateLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/private/Dashboard';
import FarmManagement from './pages/private/FarmManagement';
import WaterManagement from './pages/private/WaterManagement';
import WasteDeclaration from './pages/private/WasteDeclaration';
import WasteMarket from './pages/private/WasteMarket';
import AnimalManagement from './pages/private/AnimalManagement';
import AnimalHealthAnalysis from './pages/private/AnimalHealthAnalysis';
import PlantHealthAnalysis from './pages/private/PlantHealthAnalysis';
import FinanceManagement from './pages/private/FinanceManagement';
import DataManagementPage from './pages/private/DataManagementPage';
import Profile from './pages/private/Profile';
import Settings from './pages/private/Settings';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Routes publiques - Accessibles sans connexion */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Routes privées - Nécessitent une connexion */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
          </Route>
          
          <Route path="/" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route path="farms" element={<FarmManagement />} />
            <Route path="water" element={<WaterManagement />} />
            <Route path="waste/declare" element={<WasteDeclaration />} />
            <Route path="waste/market" element={<WasteMarket />} />
            <Route path="animals" element={<AnimalManagement />} />
            <Route path="animals/health" element={<AnimalHealthAnalysis />} />
            <Route path="plants/health" element={<PlantHealthAnalysis />} />
            <Route path="finance" element={<FinanceManagement />} />
            <Route path="data" element={<DataManagementPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;