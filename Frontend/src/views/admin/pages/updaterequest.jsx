import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Typography, Button, Box, Alert, CircularProgress, 
  Stack, Card, Divider, IconButton, Stepper, Step, StepLabel,
  Collapse, TextField, MenuItem, Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import { UseRequests } from '../../../context/RequestContext';
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_HOST } from '../../../api/Client';

function UpdateRequest({ idFromProp, onClose, isModal }) {
  const { id: idFromUrl } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequestStatus, uploadDocument, loadRequests, loading: contextLoading } = UseRequests();

  const activeId = idFromProp || idFromUrl;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const steps = ['Request', 'InProcess', 'Approve', 'Receive', 'Download'];

  useEffect(() => {
    if (requests.length === 0) loadRequests();
  }, [loadRequests, requests.length]);

  const selectedRequest = useMemo(() =>
    requests.find(r => String(r.id) === String(activeId)),
    [requests, activeId]
  );

  useEffect(() => {
    if (selectedRequest) {
      setSelectedStatus(selectedRequest.status);
      setNotes(selectedRequest.notes || '');
    }
  }, [selectedRequest]);

  const isUploaded = !!(selectedRequest?.documentUrl);

  const availableOptions = useMemo(() => {
    if (!selectedRequest) return [];
    const currentIndex = steps.indexOf(selectedRequest.status);
    return steps.filter((_, i) => i === currentIndex || i === currentIndex + 1);
  }, [selectedRequest]);

  const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); setError(''); };
  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setError(''); }
  }, []);

  const handleFullUpdate = async () => {
    setLoading(true); setError(''); setSuccess('');
    if (['Approve', 'Download'].includes(selectedStatus) && !isUploaded && !selectedFile) {
      setError("Required: Palihog upload og document.");
      setLoading(false); return;
    }
    try {
      if (selectedFile) {
        const ok = await uploadDocument(activeId, selectedFile);
        if (!ok) throw new Error("Failed to upload file.");
      }
      await updateRequestStatus(activeId, { status: selectedStatus, notes });
      setSuccess("Process updated successfully!");
      setSelectedFile(null);
      await loadRequests();
      if (isModal) setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || "Server Error.");
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading && requests.length === 0)
    return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!selectedRequest)
    return <Typography sx={{ p: 3 }}>Request not found.</Typography>;

  return (
    <Box sx={{ p: isModal ? { xs: 1, sm: 2 } : 4, maxWidth: '1200px', mx: 'auto' }}>
      {!isModal && (
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2, bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
      )}

      <Collapse in={!!error}><Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert></Collapse>
      <Collapse in={!!success}><Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>{success}</Alert></Collapse>

      {/* Stepper */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px', border: '1px solid #E0E5F2', mb: 3 }}>
        <Stepper
          activeStep={steps.indexOf(selectedRequest.status)}
          alternativeLabel
          sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
        >
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

      {/* Two-column on md+, single column on mobile */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">

        {/* LEFT: Request details + attachment */}
        <Stack spacing={2} sx={{ flex: { md: 7 }, width: '100%' }}>
          <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px', border: '1px solid #E0E5F2', boxShadow: 'none' }}>
            <Typography variant="subtitle1" fontWeight="800" color="#1B254B" mb={2}>Request Details</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="#707EAE" fontWeight="800">STUDENT</Typography>
                <Typography variant="body2" fontWeight="700">{selectedRequest.userName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="#707EAE" fontWeight="800">DOCUMENT</Typography>
                <Typography variant="body2" fontWeight="700" color="#1A237E">{selectedRequest.documentTypeName}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="#707EAE" fontWeight="800">PURPOSE</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedRequest.purpose || 'N/A'}</Typography>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px', border: '1px solid #E0E5F2', boxShadow: 'none', bgcolor: '#EEF2FF' }}>
            <Typography variant="subtitle1" fontWeight="800" color="#1B254B" mb={2}>Attachment</Typography>
            {isUploaded ? (
              <Stack spacing={2}>
                <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: '12px', border: '1px solid #E0E5F2', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 18, flexShrink: 0 }} />
                  <Typography variant="caption" fontWeight="700" noWrap>{selectedRequest.documentUrl.split('/').pop()}</Typography>
                </Box>
                <Button variant="contained" fullWidth size="small" startIcon={<FileDownloadIcon />}
                  href={`${BASE_HOST}${selectedRequest.documentUrl}`} target="_blank"
                  sx={{ borderRadius: '10px', bgcolor: '#1B254B', textTransform: 'none' }}>
                  Download File
                </Button>
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">No document uploaded.</Typography>
            )}
          </Card>
        </Stack>

        {/* RIGHT: Update form */}
        <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: '20px', flex: { md: 5 }, width: '100%', border: '2px solid #1A237E', bgcolor: 'white', boxShadow: '0px 20px 40px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight="800" color="#1B254B" mb={3}>Update Process & Finalize</Typography>
          <Stack spacing={3}>
            <TextField
              select label="Next Step" fullWidth value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            >
              {availableOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>

            <TextField
              label="Internal Remarks / Notes" fullWidth multiline rows={3}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or remarks..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            {/* Upload zone */}
            <Box
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              sx={{
                p: { xs: 2, sm: 3 },
                border: `2px dashed ${isDragging ? '#1A237E' : '#E0E5F2'}`,
                borderRadius: '18px', textAlign: 'center',
                bgcolor: isDragging ? '#F0EEFF' : '#FAFBFF',
                transition: 'all 0.2s ease', cursor: 'pointer',
              }}
            >
              <Typography variant="body2" fontWeight="700" color={isDragging ? '#1A237E' : '#707EAE'} mb={1.5}>
                {isUploaded ? 'REPLACE DOCUMENT' : 'UPLOAD DOCUMENT'}
              </Typography>
              {selectedFile ? (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}
                  sx={{ p: 1.5, bgcolor: '#EEF2FF', borderRadius: '12px', border: '1px solid #C7D2FE' }}>
                  <InsertDriveFileIcon sx={{ color: '#1A237E', fontSize: 20 }} />
                  <Typography variant="caption" fontWeight="700" color="#1A237E" noWrap sx={{ maxWidth: { xs: 120, sm: 160 } }}>
                    {selectedFile.name}
                  </Typography>
                  <IconButton size="small" onClick={() => setSelectedFile(null)} sx={{ p: 0.25 }}>
                    <CloseIcon sx={{ fontSize: 14, color: '#707EAE' }} />
                  </IconButton>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="center">
                  <CloudUploadIcon sx={{ fontSize: 28, color: isDragging ? '#1A237E' : '#A3AED0' }} />
                  <Typography variant="caption" color="#A3AED0">
                    Drag & drop, or{' '}
                    <Box component="label" sx={{ color: '#1A237E', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                      browse
                      <input type="file" hidden onChange={handleFileChange} />
                    </Box>
                  </Typography>
                </Stack>
              )}
            </Box>

            <Button variant="contained" fullWidth onClick={handleFullUpdate} disabled={loading}
              sx={{ bgcolor: '#1A237E', borderRadius: '14px', py: 1.75, fontWeight: 800, fontSize: '0.875rem', '&:hover': { bgcolor: '#311B92' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm and Update Status'}
            </Button>
          </Stack>
        </Card>

      </Stack>
    </Box>
  );
}

export default UpdateRequest;
