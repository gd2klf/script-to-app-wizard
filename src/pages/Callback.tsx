
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { oktaAuth } from '@/services/oktaAuth';

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    oktaAuth.handleCallback()
      .then(() => {
        navigate('/');
      })
      .catch(error => {
        console.error('Error handling callback:', error);
        navigate('/');
      });
  }, [navigate]);

  return <div>Processing authentication...</div>;
};

export default Callback;
