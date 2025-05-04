import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  serverTimestamp, 
  GeoPoint 
} from 'firebase/firestore';
import { db } from '../services/firebase';

export default function DoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // List of common medical specialties for the dropdown
  const specialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Family Medicine',
    'Gastroenterology',
    'General Surgery',
    'Gynecology',
    'Hematology',
    'Internal Medicine',
    'Nephrology',
    'Neurology',
    'Obstetrics',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Otolaryngology',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Rheumatology',
    'Urology'
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    photoUrl: '',
    latitude: '',
    longitude: '',
    status: 'active',
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Fetch doctor data if in edit mode
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!isEditMode) return;
      
      try {
        setFetchLoading(true);
        const doctorRef = doc(db, 'doctors', id);
        const doctorDoc = await getDoc(doctorRef);
        
        if (doctorDoc.exists()) {
          const data = doctorDoc.data();
          setFormData({
            name: data.name || '',
            specialty: data.specialty || '',
            city: data.city || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            photoUrl: data.photoUrl || '',
            latitude: data.location ? data.location.latitude.toString() : '',
            longitude: data.location ? data.location.longitude.toString() : '',
            status: data.status || 'active',
          });
        } else {
          setError('Doctor not found');
        }
      } catch (err) {
        setError('Failed to fetch doctor data');
        console.error('Error fetching doctor:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchDoctorData();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.specialty.trim()) errors.specialty = 'Specialty is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Location validation - both or none
    if (
      (formData.latitude && !formData.longitude) ||
      (!formData.latitude && formData.longitude)
    ) {
      errors.latitude = 'Both latitude and longitude are required';
      errors.longitude = 'Both latitude and longitude are required';
    }
    
    // Number validation for lat/long
    if (formData.latitude && isNaN(Number(formData.latitude))) {
      errors.latitude = 'Latitude must be a number';
    }
    
    if (formData.longitude && isNaN(Number(formData.longitude))) {
      errors.longitude = 'Longitude must be a number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare doctor data
      const doctorData = {
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        status: formData.status,
      };
      
      // Add photo URL if provided
      if (formData.photoUrl.trim()) {
        doctorData.photoUrl = formData.photoUrl.trim();
      }
      
      // Add location if both latitude and longitude are provided
      if (formData.latitude && formData.longitude) {
        doctorData.location = new GeoPoint(
          Number(formData.latitude),
          Number(formData.longitude)
        );
      }
      
      // Add or update doctor
      if (isEditMode) {
        const doctorRef = doc(db, 'doctors', id);
        await updateDoc(doctorRef, doctorData);
      } else {
        // Add creation timestamp for new doctors
        doctorData.createdAt = serverTimestamp();
        
        // Generate a new document with auto ID
        const doctorsRef = collection(db, 'doctors');
        const newDoctorRef = doc(doctorsRef);
        await setDoc(newDoctorRef, doctorData);
      }
      
      // Navigate back to doctor list
      navigate('/doctors');
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'add'} doctor: ${err.message}`);
      console.error('Error saving doctor:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Doctor' : 'Add New Doctor'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/doctors')}
        >
          Back to List
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {/* Name Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  required
                />
              </Grid>
              
              {/* Specialty Field - Dropdown */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  error={!!validationErrors.specialty}
                  helperText={validationErrors.specialty || 'Select the doctor\'s medical specialty'}
                  required
                >
                  <MenuItem value=""><em>Select a specialty</em></MenuItem>
                  {specialties.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* Email Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  required
                />
              </Grid>
              
              {/* Phone Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                  required
                />
              </Grid>
              
              {/* Photo URL Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Photo URL"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  error={!!validationErrors.photoUrl}
                  helperText={validationErrors.photoUrl || "Optional: URL to doctor's photo"}
                />
              </Grid>
              
              {/* Location Information Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Location Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {/* City Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={!!validationErrors.city}
                  helperText={validationErrors.city}
                  required
                />
              </Grid>
              
              {/* Address Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={!!validationErrors.address}
                  helperText={validationErrors.address}
                  required
                />
              </Grid>
              
              {/* Coordinates Fields */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  error={!!validationErrors.latitude}
                  helperText={validationErrors.latitude}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  error={!!validationErrors.longitude}
                  helperText={validationErrors.longitude}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <FormHelperText sx={{ m: 0 }}>
                    Enter coordinates for map display in the mobile app
                  </FormHelperText>
                </Box>
              </Grid>
              
              {/* Status Field */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
                <FormHelperText>
                  Only active doctors are visible in the mobile app
                </FormHelperText>
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12} sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditMode ? 'Update Doctor' : 'Add Doctor'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
