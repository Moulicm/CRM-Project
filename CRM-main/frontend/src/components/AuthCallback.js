import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { formatApiErrorDetail } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/google-session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        setUser(response.data);
        
        // Redirect based on role
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard', { replace: true, state: { user: response.data } });
        } else if (response.data.role === 'admission_officer') {
          navigate('/officer/dashboard', { replace: true, state: { user: response.data } });
        } else {
          navigate('/management/dashboard', { replace: true, state: { user: response.data } });
        }
      } catch (error) {
        console.error('Session processing error:', error);
        alert(formatApiErrorDetail(error.response?.data?.detail) || error.message);
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
