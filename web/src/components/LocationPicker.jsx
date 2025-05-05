import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, LoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { Box, TextField, Paper, Typography, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';

// Configuration
const BOTSWANA_CENTER = { lat: -22.328474, lng: 24.684866 }; // Center of Botswana
const DEFAULT_ZOOM = 6;
const API_KEY = 'AIzaSyBFWTPkuN6SO0zEjKc2QCj8SQMg50e0vSo'; // API key from environment variable

// Major cities in Botswana with their coordinates
const BOTSWANA_CITIES = [
  { name: 'Gaborone', location: { lat: -24.6282, lng: 25.9231 } },
  { name: 'Francistown', location: { lat: -21.1661, lng: 27.5166 } },
  { name: 'Molepolole', location: { lat: -24.4, lng: 25.5 } },
  { name: 'Maun', location: { lat: -19.9833, lng: 23.4167 } },
  { name: 'Serowe', location: { lat: -22.3867, lng: 26.7092 } },
  { name: 'Kanye', location: { lat: -24.9667, lng: 25.3333 } },
  { name: 'Mahalapye', location: { lat: -23.1, lng: 26.8167 } },
  { name: 'Palapye', location: { lat: -22.55, lng: 27.1333 } },
  { name: 'Jwaneng', location: { lat: -24.6, lng: 24.6667 } },
  { name: 'Lobatse', location: { lat: -25.2167, lng: 25.6833 } },
];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const LocationPicker = ({ initialLocation, onLocationSelect }) => {
  // State for the marker position
  const [markerPosition, setMarkerPosition] = useState(
    initialLocation || BOTSWANA_CENTER
  );
  
  // State for the search box
  const [searchBox, setSearchBox] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  
  // State for predefined city dropdown
  const [showCitiesList, setShowCitiesList] = useState(false);

  // Set map and marker position when initialLocation changes
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setMarkerPosition(initialLocation);
    }
  }, [initialLocation]);

  // Handle map click
  const handleMapClick = useCallback((event) => {
    const newPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setMarkerPosition(newPosition);
    if (onLocationSelect) {
      onLocationSelect(newPosition);
    }
  }, [onLocationSelect]);

  // Handle search box load
  const onSearchBoxLoad = useCallback((ref) => {
    setSearchBox(ref);
  }, []);

  // Handle place selection from search
  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const newPosition = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMarkerPosition(newPosition);
        if (onLocationSelect) {
          onLocationSelect(newPosition);
        }
        setSearchValue(''); // Clear the search input
      }
    }
  }, [searchBox, onLocationSelect]);

  // Handle selecting a city from the predefined list
  const handleCitySelect = (city) => {
    setMarkerPosition(city.location);
    if (onLocationSelect) {
      onLocationSelect(city.location);
    }
    setShowCitiesList(false);
    setSearchValue(city.name);
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <LoadScript
        googleMapsApiKey={API_KEY}
        libraries={['places']}
      >
        <Box sx={{ mb: 2, position: 'relative' }}>
          <StandaloneSearchBox
            onLoad={onSearchBoxLoad}
            onPlacesChanged={onPlacesChanged}
          >
            <TextField
              fullWidth
              placeholder="Search for a location in Botswana"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setShowCitiesList(true)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      title="Show major cities"
                      onClick={() => setShowCitiesList(!showCitiesList)}
                    >
                      <MyLocationIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </StandaloneSearchBox>
          
          {/* City dropdown */}
          {showCitiesList && (
            <Paper 
              elevation={3} 
              sx={{ 
                position: 'absolute', 
                width: '100%', 
                zIndex: 1, 
                mt: 0.5,
                maxHeight: '200px',
                overflowY: 'auto' 
              }}
            >
              {BOTSWANA_CITIES.map((city) => (
                <Box 
                  key={city.name} 
                  sx={{ 
                    p: 1.5, 
                    '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } 
                  }}
                  onClick={() => handleCitySelect(city)}
                >
                  <Typography variant="body2">{city.name}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition}
          zoom={DEFAULT_ZOOM}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          <Marker position={markerPosition} draggable={true} onDragEnd={(e) => {
            const newPosition = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            setMarkerPosition(newPosition);
            if (onLocationSelect) {
              onLocationSelect(newPosition);
            }
          }} />
        </GoogleMap>
      </LoadScript>
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Lat: {markerPosition.lat.toFixed(6)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Lng: {markerPosition.lng.toFixed(6)}
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationPicker;
