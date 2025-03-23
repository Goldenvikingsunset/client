import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Collapse,
  NoSsr,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as RequirementsIcon,
  Settings as SettingsIcon,
  People as UsersIcon,
  AccountCircle,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Tune as ModulesIcon,
  ViewModule as SubModulesIcon,
  Functions as FunctionsIcon,
  PriorityHigh as PrioritiesIcon,
  AssignmentTurnedIn as StatusesIcon,
  CompareArrows as FitGapIcon,
  Lightbulb as SolutionsIcon,
  Business as DepartmentIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { FocusTrap } from '@mui/base';
import { logout } from '../../services/authService';
import { hasRole, getCurrentUser } from '../../utils/auth';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  requiredRole?: 'Admin' | 'Consultant';
  subItems?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Requirements', icon: <RequirementsIcon />, path: '/requirements' },
  { 
    text: 'Master Data', 
    icon: <SettingsIcon />, 
    path: '/master-data', 
    requiredRole: 'Admin',
    subItems: [
      { text: 'Modules', icon: <ModulesIcon />, path: '/master-data/modules', requiredRole: 'Admin' },
      { text: 'Submodules', icon: <SubModulesIcon />, path: '/master-data/submodules', requiredRole: 'Admin' },
      { text: 'Functions', icon: <FunctionsIcon />, path: '/master-data/functions', requiredRole: 'Admin' },
      { text: 'Priorities', icon: <PrioritiesIcon />, path: '/master-data/priorities', requiredRole: 'Admin' },
      { text: 'Statuses', icon: <StatusesIcon />, path: '/master-data/statuses', requiredRole: 'Admin' },
      { text: 'Fit/Gap Statuses', icon: <FitGapIcon />, path: '/master-data/fitgap', requiredRole: 'Admin' },
      { text: 'Solution Options', icon: <SolutionsIcon />, path: '/master-data/solution-options', requiredRole: 'Admin' },
      { text: 'BC Departments', icon: <DepartmentIcon />, path: '/master-data/bc-departments', requiredRole: 'Admin' },
    ]
  },
  { text: 'User Management', icon: <UsersIcon />, path: '/users', requiredRole: 'Admin' },
];

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  
  const user = getCurrentUser();
  const open = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSubMenuToggle = (text: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const drawer = (content: React.ReactNode) => (
    <FocusTrap open={mobileOpen}>
      <Box component="div" role="presentation">
        <DrawerHeader>
          <IconButton 
            onClick={handleDrawerToggle} 
            aria-label="Close navigation menu"
            tabIndex={mobileOpen ? 0 : -1}
          >
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {navigationItems.map((item) => {
            if (item.requiredRole && !hasRole(item.requiredRole)) {
              return null;
            }

            if (item.subItems && item.subItems.length > 0) {
              return (
                <React.Fragment key={item.text}>
                  <ListItem disablePadding>
                    <ListItemButton 
                      onClick={() => handleSubMenuToggle(item.text)}
                      aria-expanded={openSubMenus[item.text]}
                      aria-controls={`submenu-${item.text}`}
                      tabIndex={mobileOpen ? 0 : -1}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                      {openSubMenus[item.text] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse 
                    in={openSubMenus[item.text]} 
                    timeout="auto" 
                    unmountOnExit
                    id={`submenu-${item.text}`}
                  >
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem key={subItem.text} disablePadding>
                          <ListItemButton 
                            onClick={() => navigate(subItem.path)}
                            sx={{ pl: 4 }}
                            aria-label={subItem.text}
                            tabIndex={mobileOpen ? 0 : -1}
                          >
                            <ListItemIcon>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            }

            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => navigate(item.path)}
                  aria-label={item.text}
                  tabIndex={mobileOpen ? 0 : -1}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </FocusTrap>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="navigation-drawer"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Business Central RTM
          </Typography>
          <Box>
            <IconButton
              size="large"
              aria-controls={open ? 'menu-appbar' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              aria-label="Account menu"
            >
              {user?.username ? (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }} aria-hidden="true">
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              ) : (
                <AccountCircle aria-hidden="true" />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={open}
              onClose={handleClose}
              aria-label="User account menu"
            >
              <MenuItem onClick={handleProfile} role="menuitem">Profile</MenuItem>
              <MenuItem onClick={handleLogout} role="menuitem">Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <NoSsr>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="Navigation sidebar"
        >
          <Drawer
            id="navigation-drawer"
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer(null)}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer(null)}
          </Drawer>
        </Box>
      </NoSsr>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;