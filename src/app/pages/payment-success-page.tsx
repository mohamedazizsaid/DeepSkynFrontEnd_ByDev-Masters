import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Stripe returns with ?session_id=...
    navigate('/dashboard?page=subscription&success=true', { replace: true });
  }, [navigate, searchParams]);

  return null;
}
