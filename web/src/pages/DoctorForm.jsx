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
  Paper,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import LocationPicker from '../components/LocationPicker';
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
  
  // State for map location
  const [location, setLocation] = useState(null);
  
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
          const doctorData = {
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
          };
          
          setFormData(doctorData);
          
          // Set location for the map if coordinates exist
          if (data.location) {
            setLocation({
              lat: data.location.latitude,
              lng: data.location.longitude
            });
          }
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
        updatedAt: serverTimestamp(),
      };
      
      // Add location from the map picker
      if (location) {
        doctorData.location = new GeoPoint(
          location.lat,
          location.lng
        );
        // Also update form data for consistency
        formData.latitude = location.lat.toString();
        formData.longitude = location.lng.toString();
      } else if (formData.latitude && formData.longitude) {
        // Fallback to form inputs if map wasn't used
        doctorData.location = new GeoPoint(
          parseFloat(formData.latitude),
          parseFloat(formData.longitude)
        );
      }
      
      // Add photo URL if provided
      if (formData.photoUrl.trim()) {
        doctorData.photoUrl = formData.photoUrl.trim();
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
              
              {/* Map Location Picker */}
              <Grid item xs={12}>
                <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Select Location on Map
                  </Typography>
                  
                  <FormHelperText sx={{ mb: 2 }}>
                    Use the map to select the doctor's location in Botswana. You can search for an address, 
                    select from major cities, or click directly on the map.
                  </FormHelperText>
                  
                  <LocationPicker
                    initialLocation={location || (formData.latitude && formData.longitude ? 
                      { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } : null)}
                    onLocationSelect={(newLocation) => {
                      setLocation(newLocation);
                      setFormData(prev => ({
                        ...prev,
                        latitude: newLocation.lat.toString(),
                        longitude: newLocation.lng.toString()
                      }));
                      
                      // Clear any validation errors
                      if (validationErrors.latitude || validationErrors.longitude) {
                        setValidationErrors(prev => ({
                          ...prev,
                          latitude: '',
                          longitude: ''
                        }));
                      }
                    }}
                  />
                </Paper>
                
                {(validationErrors.latitude || validationErrors.longitude) && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Please select a valid location on the map
                  </Alert>
                )}
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
