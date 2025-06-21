import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OperatorDashboard from './pages/OperatorDashboard';
import UserCenter from './pages/UserCenter';
import HotelDetail from './pages/HotelDetail';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Wanderlust Travel
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">Home</Button>
          {loading ? (
            <CircularProgress size={20} color="inherit" sx={{ ml: 2 }} />
          ) : user ? (
            <>
              {user.role === 'operator' && <Button color="inherit" component={Link} to="/operator">Operator Dashboard</Button>}
              <Button color="inherit" component={Link} to="/user">User Center</Button>
              <Typography variant="body1" sx={{ mx: 2, display: 'inline' }}>{user.email}</Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/operator" element={
            <ProtectedRoute requiredRole="operator">
              <OperatorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user" element={
            <ProtectedRoute>
              <UserCenter />
            </ProtectedRoute>
          } />
          <Route path="/hotel/:id" element={<HotelDetail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
