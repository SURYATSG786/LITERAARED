import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VoiceGuideListener } from './components/VoiceGuideListener';
import SkyBackdrop from './components/SkyBackdrop';
import Landing from './pages/Landing';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import MentorLogin from './pages/MentorLogin';
import AdminPortal from './pages/AdminPortal';
import MentorDashboard from './pages/MentorDashboard';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Courses from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import Certificate from './pages/Certificate';
import Profile from './pages/Profile';
import VoicePracticePage from './pages/VoicePracticePage';
import League from './pages/League';
import Community from './pages/Community';
import WritingPracticePage from './pages/WritingPracticePage';
import Shop from './pages/Shop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/mentor/Toast';
import './i18n';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
        <VoiceGuideListener />
        <BrowserRouter>
          <SkyBackdrop />
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Landing />} />
            <Route path="/mentor-login" element={<MentorLogin />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/admin-portal" element={<AdminPortal />} />
              <Route path="/mentor-dashboard" element={<AdminPortal />} />
              <Route path="/mentor/*" element={<AdminPortal />} />

              <Route path="/assessment" element={<Assessment />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/league" element={<League />} />
              <Route path="/community" element={<Community />} />
              <Route path="/voice-practice" element={<VoicePracticePage />} />
              <Route path="/writing-practice" element={<WritingPracticePage />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/course/:id" element={<CoursePlayer />} />
              <Route path="/certificate" element={<Certificate />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </ErrorBoundary>
);
}
