import React, { useState, useRef } from 'react';
import {
  Box, Container, Paper, Typography, TextField,
  Button, Stack, Alert, CircularProgress, Link as MuiLink,
  InputAdornment, IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, FastField } from 'formik';
import * as Yup from 'yup';
import { UseAuth } from '../../context/AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
const logo = '/LogoPurple.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// ── OTP boxes — responsive ────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/, '');
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    onChange(newDigits.join(''));
    if (val && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    e.preventDefault();
  };

  return (
    <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} justifyContent="center">
      {Array.from({ length: 6 }).map((_, i) => (
        <TextField
          key={i}
          inputRef={(el) => (inputs.current[i] = el)}
          value={digits[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            style: { textAlign: 'center', fontSize: 20, fontWeight: 700, padding: '10px 0' },
          }}
          sx={{
            width: { xs: 42, sm: 50 },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
      ))}
    </Stack>
  );
};

// ── Shared card wrapper ───────────────────────────────────────
function AuthCard({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F5F7FA', py: 4 }}>
      <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, sm: 5 }, borderRadius: 5, border: '1px solid #E0E4EC', textAlign: 'center' }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
}

const emailSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const resetSchema = Yup.object({
  newPassword: Yup.string().min(8, 'At least 8 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Required'),
});

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = UseAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Step 1: Email ─────────────────────────────────────────────
  if (step === 'email') {
    return (
      <AuthCard>
      <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#1A237E', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Box component="img" src={logo} alt="RegisTrack" sx={{ width: 100, height: 100, objectFit: 'contain' }} />
        </Box>

        <Typography variant="h5" fontWeight={900} color="#1A237E" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your registered email and we'll send a reset code.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>{error}</Alert>}

        <Formik
          initialValues={{ email: '' }}
          validationSchema={emailSchema}
          validateOnBlur
          validateOnChange={false}
          onSubmit={async (values, { setSubmitting }) => {
            setError('');
            try {
              await forgotPassword({ email: values.email });
              setEmail(values.email);
              setStep('otp');
            } catch (err) {
              setError(err.message || 'Something went wrong.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ handleSubmit, isSubmitting }) => (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <FastField name="email">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Email Address"
                    type="email"
                    error={meta.touched && Boolean(meta.error)}
                    helperText={meta.touched ? meta.error : ''}
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              </FastField>
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={isSubmitting}
                sx={{ py: 1.5, borderRadius: 3, bgcolor: '#1A237E', fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#311B92' } }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
              </Button>
            </Box>
          )}
        </Formik>

        <Typography variant="body2" sx={{ mt: 3 }} color="text.secondary">
          Remember your password?{' '}
          <MuiLink component={Link} to="/login" sx={{ fontWeight: 700, color: '#1A237E', textDecoration: 'none' }}>
            Log In
          </MuiLink>
        </Typography>
      </AuthCard>
    );
  }

  // ── Step 2: OTP ───────────────────────────────────────────────
  if (step === 'otp') {
    const handleVerifyOtp = async () => {
      if (otp.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
      setOtpLoading(true);
      setError('');
      try {
        setStep('reset');
      } finally {
        setOtpLoading(false);
      }
    };

    return (
      <AuthCard>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <Box component="img" src={logo} alt="RegisTrack" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
        </Box>

        <Typography variant="h5" fontWeight={900} color="#1A237E" gutterBottom>
          Enter Reset Code
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We sent a 6-digit code to{' '}
          <Box component="span" sx={{ fontWeight: 700, color: '#1A237E' }}>{email}</Box>
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>{error}</Alert>}

        <OtpInput value={otp} onChange={setOtp} />

        <Button
          fullWidth variant="contained" size="large"
          disabled={otpLoading} onClick={handleVerifyOtp}
          sx={{ mt: 3, mb: 1.5, py: 1.5, borderRadius: 3, bgcolor: '#1A237E', fontWeight: 700, '&:hover': { bgcolor: '#311B92' } }}
        >
          {otpLoading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
        </Button>

        <Button
          fullWidth variant="text"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => { setStep('email'); setError(''); setOtp(''); }}
          sx={{ borderRadius: 3, color: '#64748B', fontWeight: 600, textTransform: 'none' }}
        >
          Back
        </Button>
      </AuthCard>
    );
  }

  // ── Step 3: New Password ──────────────────────────────────────
  return (
    <AuthCard>
      <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
        <Box component="img" src={logo} alt="RegisTrack" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
      </Box>

      <Typography variant="h5" fontWeight={900} color="#1A237E" gutterBottom>
        Set New Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a strong new password for your account.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>{error}</Alert>}

      <Formik
        initialValues={{ newPassword: '', confirmPassword: '' }}
        validationSchema={resetSchema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            await resetPassword({ email, otp, newPassword: values.newPassword });
            navigate('/login', { state: { message: 'Password reset successful. Please log in.' } });
          } catch (err) {
            setError(err.message || 'Failed to reset password. The code may have expired.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ textAlign: 'left' }}>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <FastField name="newPassword">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    fullWidth size="small"
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    error={meta.touched && Boolean(meta.error)}
                    helperText={meta.touched ? meta.error : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNew((p) => !p)} edge="end" size="small">
                            {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              </FastField>
              <FastField name="confirmPassword">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    fullWidth size="small"
                    label="Confirm New Password"
                    type={showConfirm ? 'text' : 'password'}
                    error={meta.touched && Boolean(meta.error)}
                    helperText={meta.touched ? meta.error : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm((p) => !p)} edge="end" size="small">
                            {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                )}
              </FastField>
            </Stack>
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={isSubmitting}
              sx={{ py: 1.5, borderRadius: 3, bgcolor: '#1A237E', fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#311B92' } }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
          </Box>
        )}
      </Formik>
    </AuthCard>
  );
}
