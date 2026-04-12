import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Documents from "./pages/Documents";
import Media from "./pages/Media";
import Shortcuts from "./pages/Shortcuts";

import MyFiles from "./pages/MyFiles";
import Upload from "./pages/Upload";
import Folders from "./pages/Folders";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

// ✅ User Sidebar pages
import SharedWithMe from "./pages/SharedWithMe";
import SharedByMe from "./pages/SharedByMe";
import Collaboration from "./pages/Collaboration";
import ActivityHistory from "./pages/ActivityHistory";

// ✅ Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminFiles from "./pages/admin/AdminFiles";
import AdminFileSharingControl from "./pages/admin/AdminFileSharingControl";
import CollaborationActivity from "./pages/admin/CollaborationActivity";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPayments from "./pages/admin/AdminPayments";

// 🧪 Testing pages
import Kanban from "./pages/Kanban";

import StorageUsed from "./pages/StorageUsed";

import Trash from "./pages/Trash";

import SharedFile from "./pages/SharedFile";
import Plans from "./pages/Plans";
import ProtectedRoute from "./auth/ProtectedRoute";
import { SearchProvider } from "./context/SearchContext";

import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= PUBLIC ================= */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ================= USER ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/files"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <MyFiles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Upload />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/folders"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Folders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shared-with"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <SharedWithMe />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shared-by"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <SharedByMe />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collab"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Collaboration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <ActivityHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Documents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/media"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Media />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shortcuts"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Shortcuts />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/files"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminFiles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sharing"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminFileSharingControl />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <CollaborationActivity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trash"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Trash />
              </ProtectedRoute>
            }
          />

          <Route
            path="/storage"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <StorageUsed />
              </ProtectedRoute>
            }
          />

          {/* ================= TESTING ================= */}
          <Route path="/kanban" element={<Kanban />} />

          {/* ================= PUBLIC SHARED FILE ================= */}
          <Route path="/shared/:token" element={<SharedFile />} />

          {/* ================= PLANS ================= */}
          <Route
            path="/plans"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <Plans />
              </ProtectedRoute>
            }
          />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<h1>Page Not Found</h1>} />



        </Routes>
      </BrowserRouter>
    </SearchProvider>
  );
}

export default App;
