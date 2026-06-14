import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminUsers      from './pages/admin/Users';
import AdminEvents     from './pages/admin/Events';
import AdminReports    from './pages/admin/Reports';
import AdminActivity   from './pages/admin/ActivityLog';

// Staff pages
import StaffDashboard  from './pages/staff/Dashboard';
import StaffEvents     from './pages/staff/Events';
import StaffCreateEvent from './pages/staff/CreateEvent';
import StaffEvaluations from './pages/staff/Evaluations';
import FormBuilder     from './pages/staff/FormBuilder';
import StaffAnalytics  from './pages/staff/Analytics';
import QRCodes         from './pages/staff/QRCodes';

// User pages
import UserDashboard   from './pages/user/Dashboard';
import UserEvents      from './pages/user/Events';
import Evaluate        from './pages/user/Evaluate';
import JoinEvaluation  from './pages/user/JoinEvaluation';
import Submissions     from './pages/user/Submissions';
import Profile         from './pages/user/Profile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-bgBase"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const role = user?.role;

  const dashboardEl = role === 'admin' ? <AdminDashboard />  : role === 'staff' ? <StaffDashboard /> : <UserDashboard />;
  const eventsEl    = role === 'admin' ? <AdminEvents />     : role === 'staff' ? <StaffEvents />    : <UserEvents />;
  const reportsEl   = role === 'admin' ? <AdminReports />    : <StaffAnalytics />;

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<RoleRedirect />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"              element={<ProtectedRoute>{dashboardEl}</ProtectedRoute>} />
        <Route path="/events"                 element={<ProtectedRoute>{eventsEl}</ProtectedRoute>} />
        <Route path="/events/new"             element={<ProtectedRoute roles={['admin','staff']}><StaffCreateEvent /></ProtectedRoute>} />
        <Route path="/events/:id/edit"        element={<ProtectedRoute roles={['admin','staff']}><StaffCreateEvent /></ProtectedRoute>} />
        <Route path="/evaluations"            element={<ProtectedRoute roles={['admin','staff']}><StaffEvaluations /></ProtectedRoute>} />
        <Route path="/evaluations/builder"    element={<ProtectedRoute roles={['admin','staff']}><FormBuilder /></ProtectedRoute>} />
        <Route path="/evaluations/:id/builder"element={<ProtectedRoute roles={['admin','staff']}><FormBuilder /></ProtectedRoute>} />
        <Route path="/evaluate/join"          element={<ProtectedRoute roles={['user']}><JoinEvaluation /></ProtectedRoute>} />
        <Route path="/evaluate/:evaluationId" element={<ProtectedRoute roles={['user']}><Evaluate /></ProtectedRoute>} />
  {/* Analytics removed - use Reports page */}
        <Route path="/reports"                element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/users"                  element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/activity"               element={<ProtectedRoute roles={['admin']}><AdminActivity /></ProtectedRoute>} />
        <Route path="/qr-codes"               element={<ProtectedRoute roles={['admin','staff']}><QRCodes /></ProtectedRoute>} />
        <Route path="/submissions"            element={<ProtectedRoute roles={['user']}><Submissions /></ProtectedRoute>} />
  <Route path="/profile"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*"                       element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
