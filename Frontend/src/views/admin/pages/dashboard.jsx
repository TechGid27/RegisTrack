import React, { useEffect, useMemo } from 'react';
import { 
  Box, Grid, Typography, Card, Stack, IconButton, 
  CircularProgress, Tooltip
} from '@mui/material';

// Icons
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

import { UseRequests } from '../../../context/RequestContext';

export default function AdminDashboard() {
  const { requests, loading, error, loadRequests } = UseRequests();

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const dynamicStats = useMemo(() => {
    const counts = {
      request: requests.filter(r => r.status === 'Request').length,
      inProcess: requests.filter(r => r.status === 'InProcess').length,
      approved: requests.filter(r => r.status === 'Approve').length,
      received: requests.filter(r => r.status === 'Receive').length,
      downloaded: requests.filter(r => r.status === 'Download').length,
    };

    return [
      { label: 'Pending', value: counts.request, color: '#1A237E' },
      { label: 'In Process', value: counts.inProcess, color: '#FFB547' },
      { label: 'Approved', value: counts.approved, color: '#05CD99' },
      { label: 'Received', value: counts.received, color: '#1A237E' },
      { label: 'Released', value: counts.downloaded, color: '#A3AED0' },
    ];
  }, [requests]);

  // I-filter ang 'Request' status para sa priority list
  const pendingRequests = requests.filter(r => r.status === 'Request').slice(0, 5);

  return (
    <Box> {/* Content ra gyud ni, wala na'y Drawer dinhi */}
      
      {/* 1. TOP BAR / HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="#1B254B">Administrative Overview</Typography>
          <Typography color="text.secondary">
            {loading ? "Updating data..." : "Welcome back, Registrar. Here's what needs your attention."}
          </Typography>
        </Box>

      </Box>

      {/* 2. STATS ROW */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {dynamicStats.map((stat, i) => (
          <Grid item xs={12} sm={6} md={2.4} key={i}>
            <Card sx={{ p: 3, borderRadius: 5, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <Typography variant="overline" color="text.secondary" fontWeight="700">{stat.label}</Typography>
              <Typography variant="h4" fontWeight="900" sx={{ my: 1, color: stat.color }}>
                {loading ? <CircularProgress size={20} /> : stat.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 3. CRITICAL REQUESTS SECTION */}
      <Grid container spacing={4}>
        <Grid item xs={12} width='100%'>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, width: '100%', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="800" color="#1B254B">Critical Pending Requests</Typography>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={() => loadRequests()}
                size="small"
                sx={{
                  bgcolor: '#EEF2FF',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#EEF2FF', transform: 'rotate(180deg)' },
                  transition: 'transform 0.4s ease',
                }}
              >
                <RefreshIcon sx={{ color: '#1A237E', fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

          <Stack spacing={2}>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((req) => (
                <Card key={req.id} sx={{ p: 2.5, borderRadius: 5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, border: '1px solid #f0f0f0', boxShadow: 'none' }}>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: '#EEF2FF', borderRadius: 3, color: '#1A237E', flexShrink: 0 }}>
                      <PendingActionsIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="800" color="#1B254B">
                        {req.documentTypeName || 'Document Request'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {req.userName || 'Student Name'} • Reference No: {req.referenceNumber}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography variant="caption" fontWeight="bold" color="#A3AED0">STATUS</Typography>
                      <Typography variant="body2" fontWeight="700" color="#1A237E">{req.status}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" sx={{ bgcolor: '#EEF2FF' }} title="View Details">
                        <VisibilityIcon fontSize="small"/>
                      </IconButton>
                      <IconButton size="small" sx={{ bgcolor: '#EEF2FF' }} title="Approve Now">
                        <CheckCircleIcon fontSize="small" color="success"/>
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              ))
            ) : (
              <Card sx={{ p: 5, borderRadius: 5, border: '2px dashed #E0E4EC', textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {loading ? "Loading requests..." : "No critical pending requests found."}
                </Typography>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}