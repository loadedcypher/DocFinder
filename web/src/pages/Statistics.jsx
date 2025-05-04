import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});
  const [doctorsByCity, setDoctorsByCity] = useState({});
  const [doctorsByStatus, setDoctorsByStatus] = useState({});
  const [appointmentsByMonth, setAppointmentsByMonth] = useState({});

  // Colors for charts
  const chartColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
    'rgba(78, 129, 188, 0.8)',
    'rgba(225, 113, 115, 0.8)',
  ];

  useEffect(() => {
    const fetchStatisticsData = async () => {
      try {
        setLoading(true);

        // Fetch doctors data
        const doctorsRef = collection(db, 'doctors');
        const doctorsSnapshot = await getDocs(doctorsRef);
        const doctors = doctorsSnapshot.docs.map(doc => doc.data());

        // Process doctor data by specialty
        const specialtyData = {};
        doctors.forEach(doctor => {
          const specialty = doctor.specialty || 'Unknown';
          specialtyData[specialty] = (specialtyData[specialty] || 0) + 1;
        });
        setDoctorsBySpecialty(specialtyData);

        // Process doctor data by city
        const cityData = {};
        doctors.forEach(doctor => {
          const city = doctor.city || 'Unknown';
          cityData[city] = (cityData[city] || 0) + 1;
        });
        setDoctorsByCity(cityData);

        // Process doctor data by status
        const statusData = {
          active: 0,
          suspended: 0,
        };
        doctors.forEach(doctor => {
          const status = doctor.status || 'active';
          statusData[status] = (statusData[status] || 0) + 1;
        });
        setDoctorsByStatus(statusData);

        // Fetch appointments data
        const appointmentsRef = collection(db, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsRef);
        const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

        // Process appointment data by month
        const monthData = {};
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Initialize all months with zero
        months.forEach(month => {
          monthData[month] = 0;
        });

        // Count appointments for each month
        appointments.forEach(appointment => {
          if (appointment.date) {
            const date = appointment.date.toDate ? appointment.date.toDate() : new Date(appointment.date);
            const month = months[date.getMonth()];
            monthData[month] = (monthData[month] || 0) + 1;
          }
        });
        setAppointmentsByMonth(monthData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching statistics data:', err);
        setError('Failed to fetch statistics data');
        setLoading(false);
      }
    };

    fetchStatisticsData();
  }, []);

  // Prepare data for doctors by specialty chart
  const specialtyChartData = {
    labels: Object.keys(doctorsBySpecialty),
    datasets: [
      {
        label: 'Number of Doctors',
        data: Object.values(doctorsBySpecialty),
        backgroundColor: chartColors,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for doctors by city chart
  const cityChartData = {
    labels: Object.keys(doctorsByCity),
    datasets: [
      {
        label: 'Doctors by City',
        data: Object.values(doctorsByCity),
        backgroundColor: chartColors,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for doctors by status chart
  const statusChartData = {
    labels: Object.keys(doctorsByStatus),
    datasets: [
      {
        data: Object.values(doctorsByStatus),
        backgroundColor: [
          'rgba(52, 168, 83, 0.8)', // green for active
          'rgba(234, 67, 53, 0.8)', // red for suspended
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for appointments by month chart
  const appointmentsChartData = {
    labels: Object.keys(appointmentsByMonth),
    datasets: [
      {
        label: 'Appointments',
        data: Object.values(appointmentsByMonth),
        borderColor: 'rgba(66, 133, 244, 0.8)',
        backgroundColor: 'rgba(66, 133, 244, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Doctors Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Doctors',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Doctor Status Distribution',
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Appointments by Month',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Appointments',
        },
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Doctors by Specialty Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Doctors by Specialty
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300 }}>
              <Bar data={specialtyChartData} options={barChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Doctor Status Distribution Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Doctor Status
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={statusChartData} options={pieChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Doctors by City Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Doctors by City
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300 }}>
              <Bar data={cityChartData} options={{
                ...barChartOptions,
                plugins: {
                  ...barChartOptions.plugins,
                  title: {
                    display: true,
                    text: 'Doctors by City',
                  },
                },
              }} />
            </Box>
          </Paper>
        </Grid>

        {/* Appointments by Month Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointments by Month
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: 300 }}>
              <Line data={appointmentsChartData} options={lineChartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Doctors
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {Object.values(doctorsBySpecialty).reduce((a, b) => a + b, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Active Doctors
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {doctorsByStatus.active || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Specialties
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {Object.keys(doctorsBySpecialty).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cities Covered
                  </Typography>
                  <Typography variant="h3" color="secondary.main">
                    {Object.keys(doctorsByCity).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
