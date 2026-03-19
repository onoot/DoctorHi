// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import {
  SwapHoriz as TransactionsIcon,
  Business as UnitsIcon,
  People as UsersIcon,
  Archive as ArchiveIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const Sidebar = ({ active, onSelect, isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [notifications] = useState(3);

  const menuItems = [
    {
      id: 'transactions',
      label: 'Information About the Owners',
      icon: <TransactionsIcon />,
      badge: 0
    },
    {
      id: 'units',
      label: 'Property Units',
      icon: <UnitsIcon />,
      badge: 0
    },
    {
      id: 'users',
      label: 'Users',
      icon: <UsersIcon />,
      badge: notifications
    },
    {
      id: 'users-archive',
      label: 'Users (Archive)',
      icon: <ArchiveIcon />,
      badge: 0
    }
  ];

  const handleNavClick = (section) => {
    onSelect(section);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          anchor="left"
          open={isOpen}
          onClose={onClose}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }}>
            {/* Header */}
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Doctor Height
              </Typography>
              <IconButton onClick={onClose} size="small">
                <ChevronLeftIcon />
              </IconButton>
            </Box>

            {/* Navigation */}
            <List sx={{ flex: 1, p: 2 }}>
              {menuItems.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavClick(item.id)}
                    selected={active === item.id}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.badge > 0 ? (
                        <Badge badgeContent={item.badge} color="error" variant="dot">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        fontWeight: active === item.id ? 600 : 400
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Admin User
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    admin@doctorheight.com
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Settings">
                  <IconButton size="small" color="primary">
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton size="small" color="error">
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Drawer>

        {/* Mobile menu button */}
        {!isOpen && (
          <IconButton
            onClick={onClose}
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              zIndex: 1200,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              boxShadow: 4,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </>
    );
  }

  // Desktop drawer with toggle
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: desktopOpen ? drawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: desktopOpen ? drawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Header with toggle button */}
        <Box sx={{ 
          p: desktopOpen ? 3 : 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: desktopOpen ? 'space-between' : 'center',
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 80
        }}>
          {desktopOpen ? (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Doctor Height
              </Typography>
              <Tooltip title="Collapse menu">
                <IconButton onClick={handleDesktopToggle} size="small">
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Expand menu">
              <IconButton onClick={handleDesktopToggle} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1, p: desktopOpen ? 2 : 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!desktopOpen ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => handleNavClick(item.id)}
                  selected={active === item.id}
                  sx={{
                    borderRadius: desktopOpen ? 2 : 1,
                    justifyContent: desktopOpen ? 'initial' : 'center',
                    px: desktopOpen ? 2 : 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: desktopOpen ? 40 : 'auto',
                    mr: desktopOpen ? 2 : 0,
                    justifyContent: 'center'
                  }}>
                    {item.badge > 0 && desktopOpen ? (
                      <Badge badgeContent={item.badge} color="error" variant="dot">
                        {item.icon}
                      </Badge>
                    ) : item.badge > 0 && !desktopOpen ? (
                      <Badge color="error" variant="dot">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {desktopOpen && (
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        fontWeight: active === item.id ? 600 : 400,
                        noWrap: true
                      }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        {/* Footer */}
        <Box sx={{ 
          p: desktopOpen ? 2 : 1, 
          borderTop: 1, 
          borderColor: 'divider', 
          bgcolor: 'grey.50'
        }}>
          {desktopOpen ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Admin User
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    admin@doctorheight.com
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Settings">
                  <IconButton size="small" color="primary">
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton size="small" color="error">
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Profile" placement="right">
                <IconButton size="small" color="primary">
                  <PersonIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings" placement="right">
                <IconButton size="small" color="primary">
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout" placement="right">
                <IconButton size="small" color="error">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;