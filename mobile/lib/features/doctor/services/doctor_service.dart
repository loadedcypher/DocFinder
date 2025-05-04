import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/doctor_model.dart';

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
      
      return cities;
    } catch (e) {
      return [];
    }
  }
}
