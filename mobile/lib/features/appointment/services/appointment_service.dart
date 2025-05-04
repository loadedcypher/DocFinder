import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/appointment_model.dart';

class AppointmentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final CollectionReference _appointmentsCollection = FirebaseFirestore.instance.collection('appointments');
  
  // Book a new appointment
  Future<String?> bookAppointment(Appointment appointment) async {
    try {
      final DocumentReference docRef = await _appointmentsCollection.add(appointment.toMap());
      return docRef.id;
    } catch (e) {
      return null;
    }
  }
  
  // Get user appointments
  Future<List<Appointment>> getUserAppointments(String userId) async {
    try {
      final QuerySnapshot snapshot = await _appointmentsCollection
          .where('userId', isEqualTo: userId)
          .orderBy('date', descending: true)
          .get();
      
      return snapshot.docs
          .map((doc) => Appointment.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }
  
  // Get doctor appointments
  Future<List<Appointment>> getDoctorAppointments(String doctorId) async {
    try {
      final QuerySnapshot snapshot = await _appointmentsCollection
          .where('doctorId', isEqualTo: doctorId)
          .orderBy('date', descending: true)
          .get();
      
      return snapshot.docs
          .map((doc) => Appointment.fromFirestore(doc))
          .toList();
    } catch (e) {
      return [];
    }
  }
  
  // Update appointment status
  Future<bool> updateAppointmentStatus(String appointmentId, String status) async {
    try {
      await _appointmentsCollection.doc(appointmentId).update({'status': status});
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Get appointment by ID
  Future<Appointment?> getAppointmentById(String appointmentId) async {
    try {
      final DocumentSnapshot doc = await _appointmentsCollection.doc(appointmentId).get();
      
      if (doc.exists) {
        return Appointment.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // Listen to appointments in real-time
  Stream<List<Appointment>> streamUserAppointments(String userId) {
    return _appointmentsCollection
        .where('userId', isEqualTo: userId)
        .orderBy('date', descending: true)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => Appointment.fromFirestore(doc))
              .toList();
        });
  }
  
  // Cancel appointment
  Future<bool> cancelAppointment(String appointmentId) async {
    return await updateAppointmentStatus(appointmentId, 'cancelled');
  }
}
