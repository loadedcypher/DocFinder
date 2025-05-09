import React from 'react';
import { Box, Typography, Paper, Avatar, TextField, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Typography>Loading profile...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>
            {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
          </Avatar>
          <Typography variant="h5" component="h1">
            User Profile
          </Typography>
        </Box>
        
        <TextField
          label="Email Address"
          value={currentUser.email || ''}
          fullWidth
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        
        {/* Add more profile fields here as needed */}
        {/* For example, if you store 'name' in AuthContext or user document:
        <TextField
          label="Full Name"
          value={currentUser.displayName || currentUser.name || ''} // Adjust based on your data
          fullWidth
          InputProps={{
            readOnly: true, // Or make it editable with a save button
          }}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        */}

        <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
          More profile editing features can be added here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
