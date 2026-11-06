import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, Chip, LinearProgress,
  Button, Avatar, Stack, Container, Dialog, DialogContent, IconButton, Fade
} from '@mui/material';
import { Grid } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { UseAuth } from '../../../context/AuthContext'; 
import { UseRequests } from '../../../context/RequestContext';
import NewRequest from './request'; 

export default function StudentDashboard() {
  const { user } = UseAuth();
  const { requests, loading, loadRequests } = UseRequests();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRequests(user.id); 
    }
  }, [user, loadRequests]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

 const activeStatuses = ['request', 'inprocess', 'approve', 'receive'];

  const activeRequests = requests.filter(r => {
    const s = r.status?.toLowerCase().trim(); 
    return activeStatuses.includes(s);
  });
  const historyRequests = requests.filter(r => 
    r.status === 'Download'
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 5, pb: 8 }}>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight="800" color="#1B254B" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Vince'}.
          </Typography>
          <Typography color="#707EAE" variant="body1">
            Track your academic credentials and submit new requests to the ACLC College Registrar.
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          onClick={handleOpen}
          startIcon={<AddIcon />} 
          sx={{ 
            bgcolor: '#1A237E', 
            borderRadius: '14px', 
            px: 4, py: 1.8, 
            textTransform: 'none', 
            fontWeight: 'bold',
            boxShadow: '0 10px 20px rgba(26, 35, 126, 0.25)',
            '&:hover': { bgcolor: '#311B92', transform: 'translateY(-2px)' }
          }}
        >
          Document Request
        </Button>
      </Box>

      <Grid container spacing={4}>

        <Grid size={{ xs: 12, md: 8 }} width="100%">
          {/* SECTION: ACTIVE REQUESTS */}

          <Typography variant="h6" fontWeight="800" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#1B254B' }}>
            <DescriptionIcon sx={{ color: '#1A237E' }} /> Active Requests
          </Typography>

          <Grid container spacing={3} sx={{ mb: 6 }}>
            {loading ? (
              <Grid size={{ xs: 12 }}><Typography color="#707EAE">Fetching your requests...</Typography></Grid>
            ) : activeRequests.length > 0 ? (
              activeRequests.map((req) => (
                <Grid size={{ xs: 12, sm: 6 }} key={req.id}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: '24px', width: '100%', border: '1px solid #f0f0f0', transition: '0.3s', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.05)' } }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Chip 
                        label={
                          req.status === 'Request'   ? 'PENDING' :
                          req.status === 'InProcess' ? 'IN PROCESS' :
                          req.status === 'Approve'   ? 'APPROVED' :
                          req.status === 'Receive'   ? 'READY FOR PICKUP' :
                          req.status?.toUpperCase() || 'PENDING'
                        }
                        size="small" 
                        sx={{ 
                          bgcolor: 
                            req.status === 'Receive'   ? '#fff9e6' :
                            req.status === 'Approve'   ? '#e8f5e9' :
                            req.status === 'InProcess' ? '#fff3e0' :
                            '#EEF2FF',
                          color:
                            req.status === 'Receive'   ? '#fbb100' :
                            req.status === 'Approve'   ? '#1b5e20' :
                            req.status === 'InProcess' ? '#e65100' :
                            '#1A237E',
                          fontWeight: '900', fontSize: '0.65rem', borderRadius: '8px'
                        }} 
                      />
                      <Typography variant="caption" color="#A3AED0" fontWeight="600">{req.referenceNumber}</Typography>
                    </Stack>
                    
                    <Typography variant="h6" fontWeight="800" color="#1B254B">{req.documentTypeName}</Typography>
                    <Typography variant="caption" color="#707EAE" display="block" sx={{ mb: 4, minHeight: '40px' }}>
                      {req.purpose || 'Official school document request.'}
                    </Typography>
                    
                    {req.status === 'Ready' ? (
                      <Button endIcon={<ArrowForwardIcon />} sx={{ textTransform: 'none', fontWeight: '700', p: 0, color: '#1A237E' }}>
                        View Pickup Details
                      </Button>
                    ) : (
                      <Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={
                            req.status === 'Request'   ? 15 :
                            req.status === 'InProcess' ? 40 :
                            req.status === 'Approve'   ? 65 :
                            req.status === 'Receive'   ? 85 :
                            0
                          }
                          sx={{ height: 6, borderRadius: 5, bgcolor: '#EEF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#1A237E' } }} 
                        />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'right', fontWeight: 'bold', color: '#1A237E' }}>
                          {req.status === 'Request'   ? '15%' :
                           req.status === 'InProcess' ? '40%' :
                           req.status === 'Approve'   ? '65%' :
                           req.status === 'Receive'   ? '85%' :
                           '0%'}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid size={{ xs: 12 }}>
                <Card elevation={0} sx={{ p: 4, borderRadius: '24px', border: '2px dashed #E0E5F2', textAlign: 'center' }}>
                  <Typography color="#A3AED0">You have no active document requests.</Typography>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* SECTION: REQUEST HISTORY */}
          <Typography variant="h6" fontWeight="800" sx={{ mb: 3, color: '#1B254B' }}>Request History</Typography>
          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            {/* Table Header — hidden on mobile */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, p: 2, bgcolor: '#fbfcfd', borderBottom: '1px solid #f0f0f0' }}>
              <Typography variant="caption" fontWeight="800" color="#A3AED0" sx={{ flex: 2 }}>DOCUMENT</Typography>
              <Typography variant="caption" fontWeight="800" color="#A3AED0" sx={{ flex: 1.5 }}>DATE SUBMITTED</Typography>
              <Typography variant="caption" fontWeight="800" color="#A3AED0" sx={{ flex: 1, textAlign: 'center' }}>STATUS</Typography>
              <Typography variant="caption" fontWeight="800" color="#A3AED0" sx={{ flex: 1.5, textAlign: 'right' }}>ACTION</Typography>
            </Box>

            {historyRequests.length > 0 ? historyRequests.map((item) => (
              <Box key={item.id} sx={{
                p: 2.5,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1.5, sm: 0 },
                borderBottom: '1px solid #fbfbfb',
                '&:last-child': { borderBottom: 'none' }
              }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 2 }}>
                  <Avatar sx={{ bgcolor: '#EEF2FF', color: '#1A237E', borderRadius: '12px' }}>
                    <DescriptionIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="700" color="#1B254B">{item.documentTypeName}</Typography>
                    <Typography variant="caption" color="#A3AED0">{item.referenceNumber}</Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ flex: 1.5, color: '#707EAE' }}>
                  {new Date(item.requestDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
                <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                  <Typography variant="caption" sx={{ color: '#A3AED0', fontStyle: 'italic' }}>Completed</Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flex: 1.5, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  {item.documentUrl && (
                    <Button component="a" href={`http://localhost:5097${item.documentUrl}`} target="_blank"
                      size="small" sx={{ textTransform: 'none', fontWeight: '700', color: '#1A237E' }}>
                      Download
                    </Button>
                  )}
                </Stack>
              </Box>
            )) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="#A3AED0">No finished requests yet.</Typography>
              </Box>
            )}
          </Card>
        </Grid>


      </Grid>

      {/* Dialog (Modal) */}
      <Dialog 
        open={openModal} 
        onClose={handleClose} 
        TransitionComponent={Fade} 
        transitionDuration={400} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={handleClose} sx={{ color: '#A3AED0' }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ pt: 0 }}>
          <NewRequest sx={{ mt: 2, width: '100%' }} isModal={true} onCancel={handleClose} onSuccess={handleClose} />
        </DialogContent>
      </Dialog>
    </Container>
  );
}