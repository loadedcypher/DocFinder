import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export default function Reports() {
  const [reportType, setReportType] = useState('doctors');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportData, setReportData] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch specialties and cities for filter dropdowns
  const fetchFilterOptions = async () => {
    try {
      const doctorsRef = collection(db, 'doctors');
      const doctorsSnapshot = await getDocs(doctorsRef);
      const doctors = doctorsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      // Extract unique specialties and cities
      const uniqueSpecialties = [...new Set(doctors.map(doctor => doctor.specialty))].filter(Boolean);
      const uniqueCities = [...new Set(doctors.map(doctor => doctor.city))].filter(Boolean);

      setSpecialties(uniqueSpecialties);
      setCities(uniqueCities);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setError('Failed to load filter options.');
    }
  };

  // Handle report type change
  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
    setReportData([]);
    setError('');
    setSuccess('');
  };

  // Generate report
  const generateReport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setReportData([]);

    try {
      let data = [];

      if (reportType === 'doctors') {
        data = await fetchDoctorReport();
      } else if (reportType === 'appointments') {
        data = await fetchAppointmentReport();
      } else if (reportType === 'specialties') {
        data = await fetchSpecialtyReport();
      }

      setReportData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report.');
      setLoading(false);
    }
  };

  // Fetch doctor report data
  const fetchDoctorReport = async () => {
    const doctorsRef = collection(db, 'doctors');
    let doctorsQuery = doctorsRef;

    // Apply filters if selected
    if (specialty) {
      doctorsQuery = query(doctorsQuery, where('specialty', '==', specialty));
    }
    if (city) {
      doctorsQuery = query(doctorsQuery, where('city', '==', city));
    }
    if (status) {
      doctorsQuery = query(doctorsQuery, where('status', '==', status));
    }

    const snapshot = await getDocs(doctorsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Format location data for display
      location: doc.data().location ? 
        `${doc.data().location.latitude}, ${doc.data().location.longitude}` : 'N/A'
    }));
  };

  // Fetch appointment report data
  const fetchAppointmentReport = async () => {
    const appointmentsRef = collection(db, 'appointments');
    const snapshot = await getDocs(appointmentsRef);
    
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date ? 
        new Date(doc.data().date.seconds * 1000).toLocaleDateString() : 'N/A'
    }));

    // Fetch doctor details to include doctor names
    const doctorIds = [...new Set(appointments.map(appointment => appointment.doctorId))];
    const doctorData = {};
    
    await Promise.all(doctorIds.map(async (doctorId) => {
      try {
        const docRef = await getDocs(query(collection(db, 'doctors'), where('id', '==', doctorId)));
        if (!docRef.empty) {
          const doctorDoc = docRef.docs[0];
          doctorData[doctorId] = doctorDoc.data().name;
        }
      } catch (error) {
        console.error(`Failed to fetch doctor ${doctorId}:`, error);
      }
    }));
    
    // Enhance appointment data with doctor names
    return appointments.map(appointment => ({
      ...appointment,
      doctorName: doctorData[appointment.doctorId] || 'Unknown Doctor'
    }));
  };

  // Fetch specialty report data
  const fetchSpecialtyReport = async () => {
    const doctorsRef = collection(db, 'doctors');
    const snapshot = await getDocs(doctorsRef);
    const doctors = snapshot.docs.map(doc => doc.data());
    
    // Group doctors by specialty
    const specialtyGroups = {};
    doctors.forEach(doctor => {
      const specialty = doctor.specialty || 'Unknown';
      if (!specialtyGroups[specialty]) {
        specialtyGroups[specialty] = {
          specialty,
          totalDoctors: 0,
          activeDoctors: 0
        };
      }
      
      specialtyGroups[specialty].totalDoctors++;
      
      if (doctor.status === 'active') {
        specialtyGroups[specialty].activeDoctors++;
      }
    });
    
    return Object.values(specialtyGroups);
  };

  // Download report as CSV
  const downloadReport = () => {
    if (reportData.length === 0) {
      setError('No data to download. Generate a report first.');
      return;
    }

    try {
      // Convert data to CSV format
      const csvData = reportData;
      
      // Create a Blob with the CSV data
      const blob = new Blob([convertToCSV(csvData)], { type: 'text/csv;charset=utf-8;' });
      
      // Create a file name
      const fileName = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Save the file
      if (window.navigator.msSaveOrOpenBlob) {
        // For IE
        window.navigator.msSaveBlob(blob, fileName);
      } else {
        // For other browsers
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setSuccess('Report downloaded successfully!');
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report.');
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).filter(key => key !== 'id');
    const headerRow = headers.join(',');
    
    const rows = data.map(item => {
      return headers
        .map(header => {
          let value = item[header] || '';
          // Handle values with commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          }
          return value;
        })
        .join(',');
    });
    
    return [headerRow, ...rows].join('\n');
  };

  // Get column headers based on report type
  const getReportColumns = () => {
    switch (reportType) {
      case 'doctors':
        return ['Name', 'Specialty', 'City', 'Address', 'Email', 'Phone', 'Status'];
        
      case 'appointments':
        return ['Doctor Name', 'Date', 'Status', 'User ID'];
        
      case 'specialties':
        return ['Specialty', 'Total Doctors', 'Active Doctors'];
        
      default:
        return [];
    }
  };

  // Get table data based on report type
  const getTableData = () => {
    if (!reportData.length) return [];

    switch (reportType) {
      case 'doctors':
        return reportData.map(doctor => ({
          name: doctor.name || 'N/A',
          specialty: doctor.specialty || 'N/A',
          city: doctor.city || 'N/A',
          address: doctor.address || 'N/A',
          email: doctor.email || 'N/A',
          phone: doctor.phone || 'N/A',
          status: doctor.status || 'N/A'
        }));
        
      case 'appointments':
        return reportData.map(appointment => ({
          doctorName: appointment.doctorName || 'N/A',
          date: appointment.date || 'N/A',
          status: appointment.status || 'N/A',
          userId: appointment.userId || 'N/A'
        }));
        
      case 'specialties':
        return reportData.map(item => ({
          specialty: item.specialty || 'N/A',
          totalDoctors: item.totalDoctors || 0,
          activeDoctors: item.activeDoctors || 0
        }));
        
      default:
        return [];
    }
  };

  return (
    <>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Reports</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="doctors">Doctors Report</MenuItem>
                <MenuItem value="appointments">Appointments Report</MenuItem>
                <MenuItem value="specialties">Specialties Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {reportType === 'doctors' && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Specialty</InputLabel>
                  <Select
                    value={specialty}
                    label="Specialty"
                    onChange={(e) => setSpecialty(e.target.value)}
                  >
                    <MenuItem value="">All Specialties</MenuItem>
                    {specialties.map((spec) => (
                      <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>City</InputLabel>
                  <Select
                    value={city}
                    label="City"
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <MenuItem value="">All Cities</MenuItem>
                    {cities.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={generateReport}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="outlined"
                onClick={downloadReport}
                startIcon={<DownloadIcon />}
                disabled={reportData.length === 0 || loading}
              >
                Download CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : reportData.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Results
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {getReportColumns().map((column) => (
                      <TableCell key={column}>{column}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getTableData().map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, i) => (
                        <TableCell key={i}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Total results: {reportData.length}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">
              No report data to display. Please generate a report.
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
