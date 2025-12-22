import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { resetWorkspaceState } from '../features/workspaceSlice';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setAuthFromOAuth } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('userId');
      const email = searchParams.get('email');
      const name = searchParams.get('name');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!accessToken || !refreshToken || !userId || !email) {
        setError('Invalid callback parameters');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Store auth data
        setAuthFromOAuth({
          accessToken,
          refreshToken,
          user: {
            id: userId,
            email: decodeURIComponent(email),
            name: name ? decodeURIComponent(name) : undefined,
          },
        });

        // Clear old workspace state
        dispatch(resetWorkspaceState());

        toast.success('Login successful!');
        navigate('/');
      } catch (err) {
        setError('Failed to complete authentication');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch, setAuthFromOAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Authentication Failed
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {error}
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-zinc-900 dark:text-white animate-spin" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Completing sign in...
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Please wait while we complete your authentication
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
