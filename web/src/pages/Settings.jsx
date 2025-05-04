import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { updateEmail, updatePassword } from 'firebase/auth';

export default function Settings() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSection, setSelectedSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    darkMode: false,
    compactView: false,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const userDocRef = doc(db, 'admins', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            displayName: userData.displayName || '',
            email: currentUser.email || '',
            phone: userData.phone || '',
          });
          
          if (userData.settings) {
            setNotificationSettings({
              emailNotifications: userData.settings.emailNotifications ?? true,
              appNotifications: userData.settings.appNotifications ?? true,
            });
            
            setAppearanceSettings({
              darkMode: userData.settings.darkMode ?? false,
              compactView: userData.settings.compactView ?? false,
            });
          }
        } else {
          // Initialize with empty data
          setProfileData({
            displayName: '',
            email: currentUser.email || '',
            phone: '',
          });
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [currentUser]);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate input
      if (!profileData.displayName.trim()) {
        setError('Display name is required');
        setLoading(false);
        return;
      }
      
      // Update profile in Firestore
      const userDocRef = doc(db, 'admins', currentUser.uid);
      await setDoc(userDocRef, {
        displayName: profileData.displayName,
        phone: profileData.phone,
      }, { merge: true });
      
      // Update email if changed
      if (profileData.email !== currentUser.email) {
        await updateEmail(currentUser, profileData.email);
      }
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        setLoading(false);
        return;
      }
      
      // Update password in Firebase Auth
      await updatePassword(currentUser, passwordData.newPassword);
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccess('Password updated successfully');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Update settings in Firestore
      const userDocRef = doc(db, 'admins', currentUser.uid);
      await setDoc(userDocRef, {
        settings: {
          ...notificationSettings
        }
      }, { merge: true });
      
      setSuccess('Notification settings updated successfully');
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err.message || 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Update settings in Firestore
      const userDocRef = doc(db, 'admins', currentUser.uid);
      await setDoc(userDocRef, {
        settings: {
          darkMode: appearanceSettings.darkMode,
          compactView: appearanceSettings.compactView,
        }
      }, { merge: true });
      
      setSuccess('Appearance settings updated successfully');
    } catch (err) {
      console.error('Error updating appearance settings:', err);
      setError(err.message || 'Failed to update appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'profile':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Profile Information</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Display Name"
                    fullWidth
                    name="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone"
                    fullWidth
                    name="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'security':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Security Settings</Typography>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Current Password"
                    fullWidth
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="New Password"
                    fullWidth
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Confirm New Password"
                    fullWidth
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePassword}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Update Password'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      case 'notifications':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Notification Settings</Typography>
              <Divider sx={{ mb: 3 }} />
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        name="emailNotifications"
                      />
                    }
                    label="Email Notifications"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.appNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          appNotifications: e.target.checked
                        })}
                        name="appNotifications"
                      />
                    }
                    label="App Notifications"
                  />
                </ListItem>
                <ListItem>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveNotifications}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        );
        
      case 'appearance':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Appearance Settings</Typography>
              <Divider sx={{ mb: 3 }} />
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appearanceSettings.darkMode}
                        onChange={(e) => setAppearanceSettings({
                          ...appearanceSettings,
                          darkMode: e.target.checked
                        })}
                        name="darkMode"
                      />
                    }
                    label="Dark Mode"
                  />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appearanceSettings.compactView}
                        onChange={(e) => setAppearanceSettings({
                          ...appearanceSettings,
                          compactView: e.target.checked
                        })}
                        name="compactView"
                      />
                    }
                    label="Compact View"
                  />
                </ListItem>
                <ListItem>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAppearance}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Settings</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper>
            <List component="nav">
              <ListItemButton
                selected={selectedSection === 'profile'}
                onClick={() => setSelectedSection('profile')}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
              <ListItemButton
                selected={selectedSection === 'security'}
                onClick={() => setSelectedSection('security')}
              >
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText primary="Security" />
              </ListItemButton>
              <ListItemButton
                selected={selectedSection === 'notifications'}
                onClick={() => setSelectedSection('notifications')}
              >
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </ListItemButton>
              <ListItemButton
                selected={selectedSection === 'appearance'}
                onClick={() => setSelectedSection('appearance')}
              >
                <ListItemIcon>
                  <PaletteIcon />
                </ListItemIcon>
                <ListItemText primary="Appearance" />
              </ListItemButton>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          {renderContent()}
        </Grid>
      </Grid>
    </>
  );
}
