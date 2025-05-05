import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/doctor_model.dart';
import 'dart:math' as math;

class DoctorService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final CollectionReference _doctorsCollection = FirebaseFirestore.instance.collection('doctors');
  
  // Get all doctors
  Future<List<Doctor>> getAllDoctors() async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('status', isEqualTo: 'active')
          .get();
      
      return snapshot.docs
          .map((doc) => Doctor.fromFirestore(doc))
          .toList();
    } catch (e) {
      // Return empty list on error
      return [];
    }
  }
  
  // Get doctors by specialty
  Future<List<Doctor>> getDoctorsBySpecialty(String specialty) async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('specialty', isEqualTo: specialty)
          .where('status', isEqualTo: 'active')
          .get();
      
      return snapshot.docs
          .map((doc) => Doctor.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }
  
  // Get doctors by city
  Future<List<Doctor>> getDoctorsByCity(String city) async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('city', isEqualTo: city)
          .where('status', isEqualTo: 'active')
          .get();
      
      return snapshot.docs
          .map((doc) => Doctor.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }
  
  // Get doctors by both specialty and city
  Future<List<Doctor>> getDoctorsBySpecialtyAndCity(String specialty, String city) async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('specialty', isEqualTo: specialty)
          .where('city', isEqualTo: city)
          .where('status', isEqualTo: 'active')
          .get();
      
      return snapshot.docs
          .map((doc) => Doctor.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }
  
  // Get doctor by ID
  Future<Doctor?> getDoctorById(String doctorId) async {
    try {
      final DocumentSnapshot doc = await _doctorsCollection.doc(doctorId).get();
      
      if (doc.exists) {
        return Doctor.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Get available specialties (unique values)
  Future<List<String>> getAvailableSpecialties() async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('status', isEqualTo: 'active')
          .get();
      
      final List<String> specialties = snapshot.docs
          .map((doc) => (doc.data() as Map<String, dynamic>)['specialty'] as String)
          .toSet() // Remove duplicates
          .toList();
      
      // Sort alphabetically
      specialties.sort();
      return specialties;
    } catch (e) {
      return [];
    }
  }
  
  // Get all specialties for dropdown (including from inactive doctors)
  Future<List<String>> getAllSpecialties() async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection.get();
      
      final List<String> specialties = snapshot.docs
          .map((doc) => (doc.data() as Map<String, dynamic>)['specialty'] as String)
          .where((specialty) => specialty.isNotEmpty) // Filter out empty values
          .toSet() // Remove duplicates
          .toList();
      
      // Sort alphabetically
      specialties.sort();
      return specialties;
    } catch (e) {
      return [];
    }
  }

  // Get available cities (unique values)
  Future<List<String>> getAvailableCities() async {
    try {
      final QuerySnapshot snapshot = await _doctorsCollection
          .where('status', isEqualTo: 'active')
          .get();
      
      final List<String> cities = snapshot.docs
          .map((doc) => (doc.data() as Map<String, dynamic>)['city'] as String)
          .toSet() // Remove duplicates
          .toList();
      
      // Sort alphabetically
      cities.sort();
      return cities;
    } catch (e) {
      return [];
    }
  }
  
  // Get nearby doctors based on location
  Future<List<Doctor>> getNearbyDoctors(double latitude, double longitude, double radiusInKm, {String? specialty}) async {
    try {
      // Fetch active doctors, filter by specialty if provided
      Query query = _doctorsCollection.where('status', isEqualTo: 'active');
      if (specialty != null && specialty.isNotEmpty) {
        query = query.where('specialty', isEqualTo: specialty);
      }
      
      final QuerySnapshot snapshot = await query.get();
      final List<Doctor> doctors = snapshot.docs.map((doc) => Doctor.fromFirestore(doc)).toList();
      
      // Filter by distance (since Firestore doesn't support geospatial queries directly in this context)
      final List<Doctor> nearbyDoctors = doctors.where((doctor) {
        if (doctor.location == null) return false;
        
        // Calculate distance using Haversine formula
        double distance = _calculateDistance(
          latitude, longitude,
          doctor.location.latitude, doctor.location.longitude
        );
        
        // Convert to km and filter by radius
        return distance <= radiusInKm;
      }).toList();
      
      // Sort by distance (closest first)
      nearbyDoctors.sort((a, b) {
        // At this point we know location is not null because of the filter above
        double distanceA = _calculateDistance(
          latitude, longitude,
          a.location!.latitude, a.location!.longitude
        );
        
        double distanceB = _calculateDistance(
          latitude, longitude,
          b.location!.latitude, b.location!.longitude
        );
        
        return distanceA.compareTo(distanceB);
      });
      
      return nearbyDoctors;
    } catch (e) {
      print('Error getting nearby doctors: $e');
      return [];
    }
  }
  
  // Calculate distance between two coordinates using Haversine formula (in km)
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // Earth's radius in kilometers
    
    // Convert degrees to radians
    double lat1Rad = _degreesToRadians(lat1);
    double lon1Rad = _degreesToRadians(lon1);
    double lat2Rad = _degreesToRadians(lat2);
    double lon2Rad = _degreesToRadians(lon2);
    
    // Haversine formula
    double dLat = lat2Rad - lat1Rad;
    double dLon = lon2Rad - lon1Rad;
    double a = math.pow(math.sin(dLat / 2), 2) + 
               math.cos(lat1Rad) * math.cos(lat2Rad) * 
               math.pow(math.sin(dLon / 2), 2);
    double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c; // Distance in km
  }
  
  double _degreesToRadians(double degrees) {
    return degrees * (math.pi / 180);
  }
}
