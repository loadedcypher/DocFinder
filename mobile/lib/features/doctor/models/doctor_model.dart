import 'package:cloud_firestore/cloud_firestore.dart';

class Doctor {
  final String id;
  final String name;
  final String specialty;
  final String city;
  final String address;
  final String phone;
  final String email;
  final String? photoUrl;
  final GeoPoint location;
  final String status; // "active" or "suspended"
  
  Doctor({
    required this.id,
    required this.name,
    required this.specialty,
    required this.city,
    required this.address,
    required this.phone,
    required this.email,
    this.photoUrl,
    required this.location,
    required this.status,
  });
  
  // Factory constructor to create a Doctor from a Firestore document
  factory Doctor.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return Doctor(
      id: doc.id,
      name: data['name'] ?? '',
      specialty: data['specialty'] ?? '',
      city: data['city'] ?? '',
      address: data['address'] ?? '',
      phone: data['phone'] ?? '',
      email: data['email'] ?? '',
      photoUrl: data['photoUrl'],
      location: data['location'] ?? const GeoPoint(0, 0),
      status: data['status'] ?? 'active',
    );
  }
  
  // Convert Doctor instance to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'specialty': specialty,
      'city': city,
      'address': address,
      'phone': phone,
      'email': email,
      'photoUrl': photoUrl,
      'location': location,
      'status': status,
    };
  }
  
  // Copy method with optional parameters
  Doctor copyWith({
    String? id,
    String? name,
    String? specialty,
    String? city,
    String? address,
    String? phone,
    String? email,
    String? photoUrl,
    GeoPoint? location,
    String? status,
  }) {
    return Doctor(
      id: id ?? this.id,
      name: name ?? this.name,
      specialty: specialty ?? this.specialty,
      city: city ?? this.city,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      photoUrl: photoUrl ?? this.photoUrl,
      location: location ?? this.location,
      status: status ?? this.status,
    );
  }
}
