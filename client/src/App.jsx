import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NewPost from './pages/NewPost.jsx';
import Sports from './pages/Sports.jsx';
import PostDetail from './pages/PostDetail.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/newPost"
            element={
              <RequireAuth>
                <NewPost />
              </RequireAuth>
            }
          />
          <Route path="/sports" element={<Sports />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
