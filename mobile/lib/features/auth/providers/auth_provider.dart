import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _user;
  UserModel? _userModel;
  bool _isLoading = false;
  
  // Getters
  User? get user => _user;
  UserModel? get userModel => _userModel;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  
  // Constructor to initialize and listen to auth state changes
  AuthProvider() {
    _initializeAuth();
  }
  
  // Initialize auth state
  Future<void> _initializeAuth() async {
    _isLoading = true;
    notifyListeners();
    
    // Listen to auth state changes
    _authService.authStateChanges.listen((User? user) async {
      _user = user;
      
      if (user != null) {
        // Fetch user data from Firestore
        await _fetchUserData(user.uid);
      } else {
        _userModel = null;
      }
      
      _isLoading = false;
      notifyListeners();
    });
  }
  
  // Fetch user data from Firestore
  Future<void> _fetchUserData(String uid) async {
    _userModel = await _authService.getUserData(uid);
    notifyListeners();
  }
  
  // Sign in with email and password
  Future<bool> signIn(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      await _authService.signInWithEmailAndPassword(email, password);
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Register with email and password
  Future<bool> register(String email, String password, String name) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      await _authService.registerWithEmailAndPassword(email, password, name);
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Sign out
  Future<void> signOut() async {
    try {
      _isLoading = true;
      notifyListeners();
      
      await _authService.signOut();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Reset password
  Future<bool> resetPassword(String email) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      await _authService.resetPassword(email);
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
