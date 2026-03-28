import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard?page=subscription&cancelled=true', { replace: true });
  }, [navigate]);

  return null;
}
