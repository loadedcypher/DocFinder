class AppConstants {
  // API Related
  static const String baseUrl = 'https://docfinder-api.example.com';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  
  // App Info
  static const String appName = 'DocFinder';
  static const String appVersion = '1.0.0';
  
  // Map Related
  static const double defaultZoom = 13.0;
  static const double defaultLatitude = 37.7749; // Default location (San Francisco)
  static const double defaultLongitude = -122.4194;
  
  // Routes
  static const String homeRoute = '/';
  static const String loginRoute = '/login';
  static const String registerRoute = '/register';
  static const String doctorListRoute = '/doctors';
  static const String doctorDetailsRoute = '/doctors/:id';
  static const String appointmentRoute = '/appointment';
  static const String profileRoute = '/profile';
}
