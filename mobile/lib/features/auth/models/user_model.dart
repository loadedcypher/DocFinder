import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String role; // "user" or "admin"
  final String? name;
  
  UserModel({
    required this.uid,
    required this.email,
    required this.role,
    this.name,
  });
  
  // Factory constructor to create a UserModel from a Firestore document
  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return UserModel(
      uid: doc.id,
      email: data['email'] ?? '',
      role: data['role'] ?? 'user',
      name: data['name'],
    );
  }
  
  // Convert UserModel instance to a Map for Firestore
  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'role': role,
      'name': name,
    };
  }
  
  // Create a new instance with user role
  factory UserModel.createUser(String uid, String email, {String? name}) {
    return UserModel(
      uid: uid,
      email: email,
      role: 'user',
      name: name,
    );
  }
  
  // Copy method with optional parameters
  UserModel copyWith({
    String? uid,
    String? email,
    String? role,
    String? name,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      role: role ?? this.role,
      name: name ?? this.name,
    );
  }
}
