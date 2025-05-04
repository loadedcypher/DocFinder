import 'package:cloud_firestore/cloud_firestore.dart';

class Appointment {
  final String id;
  final String userId;
  final String doctorId;
  final DateTime date;
  final String status; // "pending", "confirmed", or "cancelled"
  
  Appointment({
    required this.id,
    required this.userId,
    required this.doctorId,
    required this.date,
    required this.status,
  });
  
  // Factory constructor to create an Appointment from a Firestore document
  factory Appointment.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return Appointment(
      id: doc.id,
      userId: data['userId'] ?? '',
      doctorId: data['doctorId'] ?? '',
      date: (data['date'] as Timestamp).toDate(),
      status: data['status'] ?? 'pending',
    );
  }
  
  // Convert Appointment instance to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'doctorId': doctorId,
      'date': Timestamp.fromDate(date),
      'status': status,
    };
  }
  
  // Create a new pending appointment
  factory Appointment.createPending({
    required String userId,
    required String doctorId,
    required DateTime date,
  }) {
    return Appointment(
      id: '', // This will be assigned by Firestore
      userId: userId,
      doctorId: doctorId,
      date: date,
      status: 'pending',
    );
  }
  
  // Copy method with optional parameters
  Appointment copyWith({
    String? id,
    String? userId,
    String? doctorId,
    DateTime? date,
    String? status,
  }) {
    return Appointment(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      doctorId: doctorId ?? this.doctorId,
      date: date ?? this.date,
      status: status ?? this.status,
    );
  }
  
  // Helper methods to update status
  Appointment confirm() => copyWith(status: 'confirmed');
  Appointment cancel() => copyWith(status: 'cancelled');
}
