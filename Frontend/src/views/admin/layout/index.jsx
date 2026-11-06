import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import AdminHeader from '../../../components/AdminHeader';

const drawerWidth = 280;

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <AdminHeader />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: '#F4F7FE',
          // On mobile, offset the fixed AppBar height
          mt: { xs: '64px', md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
