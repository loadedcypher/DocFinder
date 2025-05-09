import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const doctorsRef = collection(db, 'doctors');
        const doctorsSnapshot = await getDocs(doctorsRef);
        const doctorsList = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Extract unique specialties and cities for filters
        const uniqueSpecialties = [...new Set(doctorsList.map(doctor => doctor.specialty))];
        const uniqueCities = [...new Set(doctorsList.map(doctor => doctor.city))];
        
        setDoctors(doctorsList);
        setFilteredDoctors(doctorsList);
        setSpecialties(uniqueSpecialties);
        setCities(uniqueCities);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    let filtered = [...doctors];

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply specialty filter
    if (filterSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialty === filterSpecialty);
    }

    // Apply city filter
    if (filterCity) {
      filtered = filtered.filter(doctor => doctor.city === filterCity);
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(doctor => doctor.status === filterStatus);
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchTerm, filterSpecialty, filterCity, filterStatus]);

  // Handle doctor status change (activate/suspend)
  const handleStatusChange = async () => {
    if (!currentDoctor) return;

    try {
      const doctorRef = doc(db, 'doctors', currentDoctor.id);
      const newStatus = currentDoctor.status === 'active' ? 'suspended' : 'active';
      
      await updateDoc(doctorRef, {
        status: newStatus
      });

      // Update local state
      setDoctors(prevDoctors => prevDoctors.map(doctor => 
        doctor.id === currentDoctor.id ? { ...doctor, status: newStatus } : doctor
      ));

      setStatusDialogOpen(false);
      setCurrentDoctor(null);
    } catch (error) {
      console.error('Error updating doctor status:', error);
    }
  };

  // Handle doctor deletion
  const handleDeleteDoctor = async () => {
    if (!currentDoctor) return;

    try {
      await deleteDoc(doc(db, 'doctors', currentDoctor.id));

      // Update local state
      setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor.id !== currentDoctor.id));

      setDeleteDialogOpen(false);
      setCurrentDoctor(null);
    } catch (error) {
      console.error('Error deleting doctor:', error);
    }
  };

  const openStatusDialog = (doctor) => {
    setCurrentDoctor(doctor);
    setStatusDialogOpen(true);
  };

  const openDeleteDialog = (doctor) => {
    setCurrentDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Doctors
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

      {/* Filters */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Search filter */}
          <TextField
            variant="outlined"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            size="small"
          />

          {/* Specialty filter */}
          <TextField
            select
            variant="outlined"
            label="Specialty"
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            sx={{ minWidth: '150px' }}
            size="small"
          >
            <MenuItem value="">All Specialties</MenuItem>
            {specialties.map((specialty) => (
              <MenuItem key={specialty} value={specialty}>
                {specialty}
              </MenuItem>
            ))}
          </TextField>

          {/* City filter */}
          <TextField
            select
            variant="outlined"
            label="City"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            sx={{ minWidth: '150px' }}
            size="small"
          >
            <MenuItem value="">All Cities</MenuItem>
            {cities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </TextField>

          {/* Status filter */}
          <TextField
            select
            variant="outlined"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: '150px' }}
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>
        </Box>
      </Card>

      {/* Doctors Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Specialty</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell component="th" scope="row">
                    {doctor.name}
                  </TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell>{doctor.city}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{doctor.email}</Typography>
                    <Typography variant="body2" color="textSecondary">{doctor.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doctor.status === 'active' ? 'Active' : 'Suspended'}
                      color={doctor.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <IconButton component={Link} to={`/doctors/edit/${doctor.id}`}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={doctor.status === 'active' ? 'Suspend' : 'Activate'}>
                        <IconButton color={doctor.status === 'active' ? 'warning' : 'success'} onClick={() => openStatusDialog(doctor)}>
                          {doctor.status === 'active' ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => openDeleteDialog(doctor)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      No doctors found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>
          {currentDoctor?.status === 'active' ? 'Suspend Doctor' : 'Activate Doctor'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentDoctor?.status === 'active'
              ? `Are you sure you want to suspend Dr. ${currentDoctor?.name}? They will no longer appear in the mobile app.`
              : `Are you sure you want to activate Dr. ${currentDoctor?.name}? They will appear in the mobile app.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            color={currentDoctor?.status === 'active' ? 'warning' : 'success'}
            variant="contained"
          >
            {currentDoctor?.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Doctor Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Doctor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete Dr. {currentDoctor?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteDoctor}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
