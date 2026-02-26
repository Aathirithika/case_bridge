import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

import CaseBridgeLanding from './components/CaseBridgeLanding';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerRegistration from './pages/LawyerRegistration';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import Messages from './pages/Messages';

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          <Route path="/" element={<CaseBridgeLanding />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lawyer-register" element={<LawyerRegistration />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
          <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </Router>
    </AccessibilityProvider>
  );
}

export default App;