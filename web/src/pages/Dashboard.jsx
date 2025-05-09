import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    suspendedDoctors: 0,
    totalSpecialties: 0,
  });
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get doctors collection
        const doctorsRef = collection(db, 'doctors');
        
        // Get all doctors
        const doctorsSnapshot = await getDocs(doctorsRef);
        const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get active doctors count
        const activeDoctors = doctors.filter(doc => doc.status === 'active').length;
        
        // Get suspended doctors count
        const suspendedDoctors = doctors.filter(doc => doc.status === 'suspended').length;
        
        // Get unique specialties
        const specialties = [...new Set(doctors.map(doc => doc.specialty))].length;
        
        // Get recent doctors
        const recentDoctorsQuery = query(
          doctorsRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentDoctorsSnapshot = await getDocs(recentDoctorsQuery);
        const recentDoctorsList = recentDoctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStats({
          totalDoctors: doctors.length,
          activeDoctors,
          suspendedDoctors,
          totalSpecialties: specialties,
        });
        
        setRecentDoctors(recentDoctorsList);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/doctors/add"
        >
          Add New Doctor
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Doctors" 
            value={stats.totalDoctors} 
            icon={<PeopleIcon />} 
            color="primary" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Doctors" 
            value={stats.activeDoctors} 
            icon={<PeopleIcon />} 
            color="success" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Suspended Doctors" 
            value={stats.suspendedDoctors} 
            icon={<PeopleIcon />} 
            color="error" 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Specialties" 
            value={stats.totalSpecialties} 
            icon={<BarChartIcon />} 
            color="info" 
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Doctors */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recently Added Doctors
            </Typography>
            <Divider sx={{ my: 2 }} />
            {recentDoctors.length > 0 ? (
              <List>
                {recentDoctors.map((doctor) => (
                  <ListItem
                    key={doctor.id}
                    divider
                    secondaryAction={
                      <Button 
                        variant="outlined" 
                        size="small"
                        component={Link}
                        to={`/doctors/edit/${doctor.id}`}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={doctor.name}
                      secondary={`${doctor.specialty} • ${doctor.city}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No doctors added yet</Typography>
              </Box>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to="/doctors"
                endIcon={<PeopleIcon />}
              >
                View All Doctors
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                component={Link}
                to="/doctors/add"
              >
                Add New Doctor
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<BarChartIcon />}
                component={Link}
                to="/statistics"
              >
                View Statistics
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DescriptionIcon />}
                component={Link}
                to="/reports"
              >
                Generate Reports
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
