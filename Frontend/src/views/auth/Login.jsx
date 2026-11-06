import React, { useState } from 'react';
import { 
  Box, Paper, Typography, TextField,
  Button, Link as MuiLink, 
  Stack, InputAdornment, IconButton, Alert 
} from '@mui/material';
import { Grid } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UseAuth } from '../../context/AuthContext'; 
import { Formik, FastField } from 'formik';
import * as Yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const logo = '/LogoFinal.png';

const validationSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const FormInput = React.memo(({ name, label, type = 'text', showPassword, togglePassword }) => (
  <FastField name={name}>
    {({ field, meta }) => (
      <TextField
        {...field}
        fullWidth
        margin="normal"
        label={label}
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        error={meta.touched && Boolean(meta.error)}
        helperText={meta.touched ? meta.error : ''}
        InputProps={
          type === 'password'
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            : undefined
        }
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      />
    )}
  </FastField>
));

const Login = () => {
  const { login } = UseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const successMsg = location.state?.message || '';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Grid container sx={{ flex: 1, justifyContent: 'center' }}>

        {/* ── LEFT PANEL — hidden on mobile ── */}
        <Grid
          size={{ md: 7 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1A237E 0%, #311B92 100%)',
            color: 'white',
            p: 6,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="RegisTrack"
              sx={{ width: '100%', height: 120, objectFit: 'cover' }}
            />
            <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-1px' }}>
              RegisTrack
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', maxWidth: 420, opacity: 0.85, fontWeight: 400 }}>
              Ang modernong paagi sa pag-request ug pag-track sa imong academic documents.
            </Typography>
          </Box>
        </Grid>

        {/* ── RIGHT PANEL — form ── */}
        <Grid
          size={{ xs: 12, md: 5 }}
          component={Paper}
          elevation={0}
          square
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'white',
            borderLeft: { md: '1px solid #E0E4EC' },
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 420,
              mx: 'auto',
              px: { xs: 3, sm: 5 },
              py: { xs: 5, md: 0 },
            }}
          >
            {/* Mobile-only branding */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src="/LogoPurple.png"
                alt="RegisTrack"
                sx={{ width: 80, height: 80, objectFit: 'contain', mb: 1 }}
              />
              <Typography variant="h5" fontWeight={900} color="#1A237E">
                RegisTrack
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Academic Document Tracking System
              </Typography>
            </Box>

            <Stack spacing={0.5} sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={800} color="#1A237E">
                Welcome Back!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please provide your account details
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              validateOnChange={false}
              validateOnBlur
              onSubmit={async (values, { setSubmitting }) => {
                setError('');
                const result = await login(values);
                if (result.success) {
                  const role = result.user?.role;
                  if (role === 'Admin') navigate('/admin/dashboard');
                  else if (role === 'Staff') navigate('/staff/dashboard');
                  else navigate('/dashboard');
                } else {
                  setError(result.message || 'Sayop ang email o password.');
                }
                setSubmitting(false);
              }}
            >
              {({ handleSubmit, isSubmitting }) => (
                <Box component="form" noValidate onSubmit={handleSubmit}>
                  <FormInput name="email" label="Email Address" type="email" />
                  <FormInput
                    name="password"
                    label="Password"
                    type="password"
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword((p) => !p)}
                  />

                  <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                    <MuiLink
                      component={Link}
                      to="/forgot-password"
                      sx={{ fontSize: '0.85rem', color: '#1A237E', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Forgot password?
                    </MuiLink>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      mt: 3, mb: 2.5, py: 1.5, borderRadius: 3,
                      bgcolor: '#1A237E', fontWeight: 700,
                      fontSize: '1rem',
                      '&:hover': { bgcolor: '#311B92' },
                    }}
                  >
                    {isSubmitting ? 'Logging in...' : 'Log In'}
                  </Button>

                  <Typography variant="body2" textAlign="center" color="text.secondary">
                    Don't have an account?{' '}
                    <MuiLink
                      component={Link}
                      to="/register"
                      sx={{ fontWeight: 700, color: '#1A237E', textDecoration: 'none' }}
                    >
                      Sign Up
                    </MuiLink>
                  </Typography>
                </Box>
              )}
            </Formik>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Login;
