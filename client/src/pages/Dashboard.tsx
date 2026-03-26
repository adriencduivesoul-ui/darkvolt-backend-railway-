import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import GuestDashboard from './GuestDashboard';
import UserDashboard from './UserDashboard';
import StreamerDashboard from './StreamerDashboard';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated]);

  if (!user) return null;

  if (user.role === 'guest') return <GuestDashboard />;
  if (user.role === 'streamer') return <StreamerDashboard />;
  return <UserDashboard />;
}
