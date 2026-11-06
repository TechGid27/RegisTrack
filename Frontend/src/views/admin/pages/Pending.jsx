import { useEffect, useState, useMemo } from 'react';
import { 
  Box, Typography, Stack, Card, IconButton, Chip, 
  CircularProgress, TextField, InputAdornment, Button,
  Dialog, DialogContent, DialogTitle, Tabs, Tab,
  Alert, Collapse,
  useMediaQuery, useTheme
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';

import { UseRequests } from '../../../context/RequestContext'; 
import UpdateRequest from './updaterequest';

export default function AllRequests() {
  const { requests, loading, error, loadRequests } = UseRequests();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentTab, setCurrentTab] = useState('All');

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filteredData = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = currentTab === 'All' || r.status === currentTab;
      return matchesSearch && matchesTab;
    });
  }, [requests, searchTerm, currentTab]);

  const handleOpenUpdate = (id) => { setSelectedId(id); setOpenModal(true); };
  const handleCloseModal = () => { setOpenModal(false); setSelectedId(null); };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Request':   return { bg: '#E1F5FE', text: '#01579B' };
      case 'InProcess': return { bg: '#FFF3E0', text: '#E65100' };
      case 'Approve':   return { bg: '#E8F5E9', text: '#1B5E20' };
      case 'Receive':   return { bg: '#F3E5F5', text: '#4A148C' };
      default:          return { bg: '#EEF2FF', text: '#707EAE' };
    }
  };

  return (
    <Box sx={{ p: { xs: 0, md: 2 } }}>
      {/* Error Banner */}
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>
      </Collapse>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="#1B254B" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Request Manager
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Monitor and process all student document requests in one place.
          </Typography>
        </Box>
        <IconButton
          onClick={() => loadRequests()}
          size={isMobile ? 'small' : 'medium'}
          sx={{ borderRadius: 3, bgcolor: '#1A237E', color: 'white', flexShrink: 0, '&:hover': { bgcolor: '#311B92' }, width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, fontSize: isMobile ? '1rem' : '1.2rem' }}
        >
          🔄
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onChange={(e, v) => setCurrentTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: { xs: '0.75rem', md: '0.9rem' }, minWidth: { xs: 70, md: 110 }, px: { xs: 1, md: 2 } },
          '& .Mui-selected': { color: '#1A237E !important' },
          '& .MuiTabs-indicator': { bgcolor: '#1A237E', height: 3, borderRadius: '3px' },
        }}
      >
        <Tab label="All" value="All" />
        <Tab label="Pending" value="Request" />
        <Tab label="In Progress" value="InProcess" />
        <Tab label="Approved" value="Approve" />
        <Tab label="Received" value="Receive" />
        <Tab label="Completed" value="Download" />
      </Tabs>

      {/* Search */}
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search student or reference number..."
        variant="outlined"
        size={isMobile ? 'small' : 'medium'}
        sx={{
          mb: 3,
          bgcolor: 'white',
          borderRadius: 4,
          '& .MuiOutlinedInput-root': { borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E0E5F2' },
          '& fieldset': { border: 'none' },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#1A237E', fontSize: { xs: 18, md: 22 } }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#1A237E' }} />
        </Box>
      ) : filteredData.length === 0 ? (
        <Card sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 6, border: '2px dashed #E0E4EC', bgcolor: 'transparent' }}>
          <Typography variant="h6" color="text.secondary" fontWeight="600" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            {searchTerm ? `No results for "${searchTerm}"` : `No ${currentTab} requests found.`}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredData.map((req) => {
            const s = getStatusColor(req.status);
            return (
              <Card
                key={req.id}
                sx={{
                  p: { xs: 2, md: 3 },
                  borderRadius: 4,
                  border: '1px solid #E0E5F2',
                  transition: '0.3s',
                  '&:hover': { boxShadow: '0 12px 30px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* Status icon */}
                  <Box sx={{ p: 1.5, bgcolor: s.bg, borderRadius: 3, color: s.text, display: 'flex', flexShrink: 0 }}>
                    <FilterListIcon fontSize="small" />
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="800" color="#1B254B" noWrap>
                      {req.documentTypeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" noWrap>
                      {req.userName} •{' '}
                      <Typography component="span" variant="body2" sx={{ color: '#1A237E', fontWeight: 800 }}>
                        {req.referenceNumber}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="#A3AED0" sx={{ mt: 0.5, display: 'block' }}>
                      {new Date(req.requestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                </Stack>

                {/* Status + Manage row */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Chip
                    label={req.status}
                    size="small"
                    sx={{ bgcolor: s.bg, color: s.text, fontWeight: 800, borderRadius: '8px', fontSize: '0.7rem' }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleOpenUpdate(req.id)}
                    startIcon={<VisibilityIcon />}
                    size="small"
                    sx={{
                      borderRadius: '10px',
                      bgcolor: '#EEF2FF',
                      color: '#1A237E',
                      boxShadow: 'none',
                      textTransform: 'none',
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#1A237E', color: 'white' },
                    }}
                  >
                    Manage
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Modal — fullScreen on mobile */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: 6 }, p: { xs: 0, sm: 1 } } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1B254B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 3 } }}>
          Update Request Status
          <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1, sm: 2 } }}>
          {selectedId && (
            <UpdateRequest idFromProp={selectedId} isModal={true} onClose={handleCloseModal} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
