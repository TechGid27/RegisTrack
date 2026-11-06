import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
const logo = '/LogoPurple.png';
import {
  Box, Drawer, Toolbar, List, Typography, Avatar, Stack,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Chip, Badge, Snackbar, Alert, IconButton, AppBar, useMediaQuery, useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LayersIcon from '@mui/icons-material/Layers';
import LogoutIcon from '@mui/icons-material/Logout';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ViewListIcon from '@mui/icons-material/ViewList';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import { UseAuth } from '../context/AuthContext';
import { UseRequests } from '../context/RequestContext';

const drawerWidth = 280;

const ADMIN_MENU = [
  { text: 'Dashboard',       icon: <DashboardIcon />,          path: '/admin/dashboard' },
  { text: 'Request Manager', icon: <PendingActionsIcon />,     path: '/admin/pending' },
  { text: 'Announcements',   icon: <PostAddIcon />,            path: '/admin/announcement-lists' },
  { text: 'Document Types',  icon: <FolderCopyOutlinedIcon />, path: '/admin/document' },
  { text: 'Requirements',    icon: <LayersIcon />,             path: '/admin/requirements' },
];

const STAFF_MENU = [
  { text: 'Dashboard',       icon: <DashboardIcon />,      path: '/staff/dashboard' },
  { text: 'Request Manager', icon: <PendingActionsIcon />, path: '/admin/pending' },
  { text: 'Announcements',   icon: <ViewListIcon />,       path: '/announcements' },
];

export default function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { logout, user } = UseAuth();
  const { requests, loadRequests, newRequestNotification } = UseRequests();
  const [pendingCount, setPendingCount] = useState(0);
  const [showNewRequestAlert, setShowNewRequestAlert] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Staff') loadRequests();
  }, [user, loadRequests]);

  useEffect(() => {
    setPendingCount(requests.filter(r => r.status === 'Request').length);
  }, [requests]);

  useEffect(() => {
    if (newRequestNotification && !newRequestNotification.type) {
      setShowNewRequestAlert(true);
    }
  }, [newRequestNotification]);

  const isStaff = user?.role === 'Staff';
  const menuItems = isStaff ? STAFF_MENU : ADMIN_MENU;

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate('/login');
  };

  const initials = user?.firstName?.charAt(0).toUpperCase() ?? 'A';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Admin User';
  const roleLabel = user?.role ?? 'Admin';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Toolbar sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src={logo} alt="RegisTrack" sx={{ width: 36, height: 36, objectFit: 'contain' }} />
          <Typography variant="h6" fontWeight={900} color="#1B254B">RegisTrack</Typography>
        </Box>
      </Toolbar>

      {/* User card */}
      <Box sx={{ px: 2, py: 2.5, mb: 3, bgcolor: '#EEF2FF', borderRadius: 4, mx: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#1B254B', fontWeight: 800 }}>{initials}</Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" fontWeight={800} color="#1B254B" noWrap>{fullName}</Typography>
          <Chip label={roleLabel} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E8EAF6', color: '#1A237E', mt: 0.25 }} />
        </Box>
      </Box>

      {/* Nav */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.text === 'Request Manager' && pendingCount > 0;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 3,
                  bgcolor: isActive ? '#EEF2FF' : 'transparent',
                  color: isActive ? '#1A237E' : '#A3AED0',
                  '&:hover': { bgcolor: '#EEF2FF' },
                  transition: '0.2s',
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#1A237E' : '#A3AED0', minWidth: 40 }}>
                  {showBadge ? (
                    <Badge badgeContent={pendingCount} color="error" max={99}>
                      {React.cloneElement(item.icon, { fontSize: 'small' })}
                    </Badge>
                  ) : React.cloneElement(item.icon, { fontSize: 'small' })}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.875rem' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ mb: 3, px: 1 }}>
        <Divider sx={{ mb: 2, borderColor: '#EEF2FF' }} />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: '#FF5B5B', '&:hover': { bgcolor: '#FFF5F5' }, transition: '0.2s' }}>
            <ListItemIcon sx={{ color: '#FF5B5B', minWidth: 40 }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.875rem' }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      <Snackbar
        open={showNewRequestAlert}
        autoHideDuration={6000}
        onClose={() => setShowNewRequestAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ position: 'fixed', minWidth: '20%', width: 'auto', bottom: '20px' }}
      >
        <Alert onClose={() => setShowNewRequestAlert(false)} severity="info"
          sx={{ width: '100%', fontWeight: 600, bgcolor: '#EEF2FF', color: '#1A237E', '& .MuiAlert-icon': { color: '#1A237E' } }}
        >
          🔔 New Request {newRequestNotification?.userName} - {newRequestNotification?.documentType}
        </Alert>
      </Snackbar>

      {/* Mobile top AppBar */}
      {isMobile && (
        <AppBar position="fixed" elevation={0}
          sx={{ bgcolor: 'white', borderBottom: '1px solid #E0E4EC', color: '#1B254B', zIndex: theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: '#1A237E' }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="img" src={logo} alt="RegisTrack" sx={{ width: 28, height: 28, objectFit: 'contain' }} />
              <Typography variant="h6" fontWeight={900} color="#1B254B">RegisTrack</Typography>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop: permanent drawer */}
      {!isMobile && (
        <Drawer variant="permanent"
          sx={{
            width: drawerWidth, flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'white', borderRight: '1px solid #E0E4EC' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile: temporary drawer */}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: 'white' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
