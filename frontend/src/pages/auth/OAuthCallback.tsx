import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../../stores';
import { api } from '../../services/api';
import PageLoader from '../../components/ui/PageLoader';
import { getApiError } from '../../utils';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showNotification } = useUIStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      showNotification('error', 'OAuth authentication failed');
      navigate('/login');
      return;
    }

    // Set token in header for this request, then fetch profile
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setAuth(res.data.data.user, token);
        showNotification('success', `Welcome, ${res.data.data.user.name}!`);
        navigate('/');
      })
      .catch((err) => {
        showNotification('error', getApiError(err));
        navigate('/login');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <PageLoader />;
}
