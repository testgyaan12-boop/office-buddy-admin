import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import CrudPage from './components/CrudPage';
import Companies from './pages/Companies';
import Config from './pages/Config';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reminders from './pages/Reminders';
import Subscription from './pages/Subscription';
import Users from './pages/Users';
import {
  customAdsRes,
  documentsRes,
  remindersRes,
} from './resources';
import type { JSX } from 'react';

function Guard({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Guard><Dashboard /></Guard>} />
          <Route path="/users" element={<Guard><Users /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/documents" element={<Guard><CrudPage resource={documentsRes} /></Guard>} />
          <Route path="/companies" element={<Guard><Companies /></Guard>} />
          <Route path="/subscriptions" element={<Guard><Subscription /></Guard>} />
          <Route path="/reminders" element={<Guard><Reminders /></Guard>} />
          <Route path="/custom-ads" element={<Guard><CrudPage resource={customAdsRes} /></Guard>} />
          <Route path="/config" element={<Guard><Config /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
