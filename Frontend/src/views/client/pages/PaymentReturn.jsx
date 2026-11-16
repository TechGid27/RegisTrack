import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { requestService } from '../../../api/RequestService';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const cancelled = searchParams.get('cancelled') === 'true';
  const [paymentStatus, setPaymentStatus] = useState('Checking');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyPayment = useCallback(async () => {
    if (!requestId) {
      setError('Payment request reference is missing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await requestService.verifyPayment(requestId);
      setPaymentStatus(result.paymentStatus);
    } catch (err) {
      setError(err.message || 'Could not verify the payment.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', p: 3, pt: 10 }}>
      <Paper sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h5" fontWeight={800}>Online payment status</Typography>
          {loading && <CircularProgress size={28} />}
          {!loading && paymentStatus === 'Paid' && (
            <Alert severity="success" sx={{ width: '100%' }}>Payment confirmed. Your request is being processed.</Alert>
          )}
          {!loading && paymentStatus !== 'Paid' && !error && (
            <Alert severity="info" sx={{ width: '100%' }}>
              {cancelled
                ? 'Checkout was canceled or is still incomplete.'
                : 'Payment has not been confirmed yet. It may take a moment to update.'}
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          <Stack direction="row" spacing={1}>
            <Button onClick={verifyPayment} disabled={loading}>Check again</Button>
            <Button component={RouterLink} to="/dashboard" variant="contained">Dashboard</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
