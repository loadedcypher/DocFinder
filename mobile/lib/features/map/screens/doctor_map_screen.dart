import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:doc_finder/features/doctor/models/doctor_model.dart';
import 'package:doc_finder/features/doctor/services/doctor_service.dart';

class DoctorMapScreen extends StatefulWidget {
  const DoctorMapScreen({super.key});

  @override
  State<DoctorMapScreen> createState() => _DoctorMapScreenState();
}

class _DoctorMapScreenState extends State<DoctorMapScreen> {
  final Completer<GoogleMapController> _controller = Completer<GoogleMapController>();
  final DoctorService _doctorService = DoctorService();
  
  // Default camera position (will be updated with user's location)
  static const CameraPosition _defaultPosition = CameraPosition(
    target: LatLng(0, 0),
    zoom: 14.0,
  );

  Position? _currentPosition;
  Set<Marker> _markers = {};
  List<Doctor> _nearbyDoctors = [];
  bool _isLoading = true;
  String _selectedSpecialty = '';
  List<String> _specialties = [];
  double _searchRadius = 5.0; // In kilometers
  
  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _loadSpecialties();
  }

  Future<void> _loadSpecialties() async {
    try {
      List<String> specialties = await _doctorService.getAllSpecialties();
      setState(() {
        _specialties = specialties;
      });
    } catch (e) {
      print('Error loading specialties: $e');
    }
  }

  void _filterDoctors() {
    if (_currentPosition != null) {
      _loadNearbyDoctors();
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showLocationDisabledAlert();
        setState(() => _isLoading = false);
        return;
      }
      
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showLocationDeniedAlert();
          setState(() => _isLoading = false);
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        _showLocationPermanentlyDeniedAlert();
        setState(() => _isLoading = false);
        return;
      }
      
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );
      
      setState(() {
        _currentPosition = position;
      });
      
      _animateToCurrentLocation();
      _loadNearbyDoctors();
    } catch (e) {
      print('Error getting location: $e');
      setState(() => _isLoading = false);
    }
  }
  
  Future<void> _animateToCurrentLocation() async {
    if (_controller.isCompleted) {
      final GoogleMapController controller = await _controller.future;
      if (_currentPosition != null) {
        controller.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(
                _currentPosition!.latitude,
                _currentPosition!.longitude
              ),
              zoom: 14.0,
            ),
          ),
        );
      }
    }
  }
  
  Future<void> _loadNearbyDoctors() async {
    if (_currentPosition == null) return;
    
    setState(() => _isLoading = true);
    
    try {
      List<Doctor> doctors = await _doctorService.getNearbyDoctors(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        _searchRadius,
        specialty: _selectedSpecialty.isEmpty ? null : _selectedSpecialty,
      );
      
      setState(() {
        _nearbyDoctors = doctors;
        _updateMapMarkers();
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading nearby doctors: $e');
      setState(() => _isLoading = false);
    }
  }
  
  void _updateMapMarkers() {
    Set<Marker> markers = {};
    
    // Add user's current location marker
    if (_currentPosition != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'Your Location'),
        ),
      );
    }
    
    // Add markers for each doctor
    for (var doctor in _nearbyDoctors) {
      if (doctor.location != null) {
        markers.add(
          Marker(
            markerId: MarkerId(doctor.id ?? 'doctor_${_nearbyDoctors.indexOf(doctor)}'),
            position: LatLng(doctor.location!.latitude, doctor.location!.longitude),
            infoWindow: InfoWindow(
              title: doctor.name,
              snippet: doctor.specialty,
              onTap: () {
                Navigator.pushNamed(
                  context, 
                  '/doctors/details',
                  arguments: doctor,
                );
              },
            ),
          ),
        );
      }
    }
    
    setState(() {
      _markers = markers;
    });
  }
  
  void _showLocationDisabledAlert() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Location Services Disabled'),
        content: const Text('Please enable location services to use this feature.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
  
  void _showLocationDeniedAlert() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Location Permission Denied'),
        content: const Text('Please grant location permission to use this feature.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
  
  void _showLocationPermanentlyDeniedAlert() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Location Permission Permanently Denied'),
        content: const Text(
          'Please enable location permission from app settings to use this feature.'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Nearby Doctors'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNearbyDoctors,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search filters
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                // Specialty dropdown
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        hint: const Text('Select Specialty'),
                        value: _selectedSpecialty.isEmpty ? null : _selectedSpecialty,
                        items: [
                          const DropdownMenuItem<String>(
                            value: '',
                            child: Text('All Specialties'),
                          ),
                          ..._specialties.map((String specialty) {
                            return DropdownMenuItem<String>(
                              value: specialty,
                              child: Text(specialty),
                            );
                          }).toList(),
                        ],
                        onChanged: (String? value) {
                          setState(() {
                            _selectedSpecialty = value ?? '';
                            _filterDoctors();
                          });
                        },
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Search radius slider
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Radius: ${_searchRadius.toStringAsFixed(1)} km'),
                      Slider(
                        value: _searchRadius,
                        min: 1.0,
                        max: 20.0,
                        divisions: 38,
                        onChanged: (value) {
                          setState(() {
                            _searchRadius = value;
                          });
                        },
                        onChangeEnd: (value) {
                          _filterDoctors();
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Map
          Expanded(
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: _defaultPosition,
                  markers: _markers,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  onMapCreated: (GoogleMapController controller) {
                    _controller.complete(controller);
                    if (_currentPosition != null) {
                      _animateToCurrentLocation();
                    }
                  },
                ),
                if (_isLoading)
                  Container(
                    color: Colors.black.withOpacity(0.3),
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
              ],
            ),
          ),
          // List of nearby doctors
          Container(
            height: 150,
            color: Colors.white,
            child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _nearbyDoctors.isEmpty
                ? const Center(child: Text('No doctors found nearby'))
                : ListView.separated(
                    padding: const EdgeInsets.all(8),
                    scrollDirection: Axis.horizontal,
                    itemCount: _nearbyDoctors.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final doctor = _nearbyDoctors[index];
                      return SizedBox(
                        width: 250,
                        child: Card(
                          elevation: 2,
                          child: InkWell(
                            onTap: () {
                              Navigator.pushNamed(
                                context, 
                                '/doctors/details',
                                arguments: doctor,
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundImage: doctor.photoUrl != null && doctor.photoUrl!.isNotEmpty
                                          ? NetworkImage(doctor.photoUrl!)
                                          : null,
                                        child: doctor.photoUrl == null || doctor.photoUrl!.isEmpty
                                          ? Text(doctor.name[0])
                                          : null,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              doctor.name,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              doctor.specialty,
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    doctor.city,
                                    style: const TextStyle(fontSize: 12),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    doctor.address,
                                    style: const TextStyle(fontSize: 12),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const Spacer(),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        Navigator.pushNamed(
                                          context, 
                                          '/doctor/details',
                                          arguments: doctor,
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        minimumSize: const Size(0, 30),
                                      ),
                                      child: const Text('View Details'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
