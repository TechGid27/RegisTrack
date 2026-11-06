import React, { useState, useRef } from 'react';
import {
  Box, Container, Paper, Typography, TextField,
  Button, Link as MuiLink, Stack, CircularProgress, Alert,
  InputAdornment, IconButton
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, FastField } from 'formik';
import * as Yup from 'yup';
import { UseAuth } from '../../context/AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const logo = '/LogoFinal.png';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string()
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Must be a valid Gmail address (@gmail.com)')
    .required('Email is required'),
  studentId: Yup.string().min(5, 'At least 5 characters').required('Student ID is required'),
  password: Yup.string().min(8, 'At least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Reusable field — supports password toggle
const FormInput = React.memo(({ name, label, type = 'text', showPw, togglePw, ...props }) => (
  <FastField name={name}>
    {({ field, meta }) => (
      <TextField
        {...field}
        {...props}
        fullWidth
        size="small"
        label={label}
        type={type === 'password' ? (showPw ? 'text' : 'password') : type}
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched ? meta.error : ''}
        InputProps={
          type === 'password'
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePw} edge="end" size="small">
                      {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            : undefined
        }
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
      />
    )}
  </FastField>
));

// OTP — 6 boxes, responsive sizing
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

const Register = () => {
  const { register, verifyEmail, resendOtp } = UseAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // password visibility
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 6) { setOtpError('Please enter the complete 6-digit OTP.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      await verifyEmail({ email: registeredEmail, otp });
      navigate('/login', { state: { message: 'Account verified! Please log in.' } });
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    setOtpError('');
    try {
      await resendOtp({ email: registeredEmail });
      setResendMsg('A new OTP has been sent to your email.');
    } catch (err) {
      setOtpError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── OTP Step ─────────────────────────────────────────────────
  if (otpStep) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F5F7FA', py: 4 }}>
        <Container maxWidth="xs">
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, sm: 5 }, borderRadius: 5, border: '1px solid #E0E4EC', textAlign: 'center' }}
          >
          {/* Icon */}

            <Typography variant="h5" fontWeight={900} color="#1A237E" gutterBottom>
              Verify your email
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We sent a 6-digit code to{' '}
              <Box component="span" sx={{ fontWeight: 700, color: '#1A237E' }}>{registeredEmail}</Box>
            </Typography>

            {otpError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>{otpError}</Alert>}
            {resendMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>{resendMsg}</Alert>}

            <OtpInput value={otp} onChange={setOtp} />

            <Button
              fullWidth variant="contained" size="large"
              disabled={otpLoading} onClick={handleVerify}
              sx={{ mt: 3, mb: 1.5, py: 1.5, borderRadius: 3, bgcolor: '#1A237E', fontWeight: 700, '&:hover': { bgcolor: '#311B92' } }}
            >
              {otpLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
            </Button>

            <Button
              fullWidth variant="text" disabled={resendLoading} onClick={handleResend}
              sx={{ borderRadius: 3, color: '#1A237E', fontWeight: 600, textTransform: 'none' }}
            >
              {resendLoading ? <CircularProgress size={20} color="inherit" /> : "Didn't receive it? Resend OTP"}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ── Registration Step ─────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F5F7FA', py: 4 }}>
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, sm: 5 }, borderRadius: 5, border: '1px solid #E0E4EC' }}
        >
          {/* Header */}
          <Stack spacing={0.5} sx={{ mb: 3.5, textAlign: 'center', alignItems: 'center' }}>
            <Typography variant="h4" fontWeight={900} color="#1A237E">
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your official details to register on RegisTrack.
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Formik
            initialValues={{ firstName: '', lastName: '', email: '', studentId: '', password: '', confirmPassword: '' }}
            validationSchema={validationSchema}
            validateOnChange={false}
            validateOnBlur
            onSubmit={async (values, { setSubmitting }) => {
              setLoading(true);
              setError('');
              try {
                await register(values);
                setRegisteredEmail(values.email);
                setOtpStep(true);
              } catch (err) {
                setError(err.message || 'Registration failed. Please try again.');
              } finally {
                setLoading(false);
                setSubmitting(false);
              }
            }}
          >
            {({ handleSubmit }) => (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>

                  {/* Name row — stacks on xs */}
                  <Stack direction={{ xs: 'row', sm: 'row' }} spacing={2}>
                    <FormInput name="firstName" label="First Name" />
                    <FormInput name="lastName" label="Last Name" />
                  </Stack>

                  <FormInput name="studentId" label="Student ID" placeholder="e.g. 2024-0001" />
                  <FormInput name="email" label="Email Address" type="email" />

                  <FormInput
                    name="password" label="Password" type="password"
                    showPw={showPw} togglePw={() => setShowPw((p) => !p)}
                  />
                  <FormInput
                    name="confirmPassword" label="Confirm Password" type="password"
                    showPw={showConfirm} togglePw={() => setShowConfirm((p) => !p)}
                  />
                </Stack>

                <Button
                  type="submit" fullWidth variant="contained" size="large"
                  disabled={loading}
                  sx={{ mt: 3.5, mb: 2.5, py: 1.5, borderRadius: 3, bgcolor: '#1A237E', fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#311B92' } }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Account'}
                </Button>

                <Typography variant="body2" textAlign="center" color="text.secondary">
                  Already have an account?{' '}
                  <MuiLink component={Link} to="/login" sx={{ fontWeight: 700, color: '#1A237E', textDecoration: 'none' }}>
                    Log In
                  </MuiLink>
                </Typography>
              </Box>
            )}
          </Formik>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
