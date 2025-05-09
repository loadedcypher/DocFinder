import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import 'features/doctor/models/doctor_model.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/config/firebase_config.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/home/screens/home_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/doctor/screens/doctor_list_screen.dart';
import 'features/doctor/screens/doctor_detail_screen.dart';
import 'features/appointment/screens/appointment_list_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/map/screens/doctor_map_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase
  try {
    await FirebaseConfig.initialize();
  } catch (e) {
    // Handle Firebase initialization error
    print('Failed to initialize Firebase: $e');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AuthProvider())],
      child: MaterialApp(
        title: AppConstants.appName,
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        home: const DocFinderApp(),
        onGenerateRoute: (settings) {
          if (settings.name == '/doctor/details') {
            // Pass the doctor object to the detail screen
            final Doctor doctor = settings.arguments as Doctor;
            return MaterialPageRoute(
              builder:
                  (context) => DoctorDetailScreen(
                    doctorId: doctor.id,
                    initialTabIndex: 0,
                  ),
            );
          } else if (settings.name == '/register') {
            // Registration screen route
            return MaterialPageRoute(
              builder:
                  (context) =>
                      RegisterScreen(onLoginTap: () => Navigator.pop(context)),
            );
          }

          // Regular routes
          if (settings.name == '/home') {
            return MaterialPageRoute(builder: (context) => const HomeScreen());
          } else if (settings.name == '/doctors') {
            return MaterialPageRoute(
              builder: (context) => const DoctorListScreen(),
            );
          } else if (settings.name == '/map') {
            return MaterialPageRoute(
              builder: (context) => const DoctorMapScreen(),
            );
          } else if (settings.name == '/appointments') {
            return MaterialPageRoute(
              builder: (context) => const AppointmentListScreen(),
            );
          } else if (settings.name == '/profile') {
            return MaterialPageRoute(
              builder: (context) => ProfileScreen(onLogoutSuccess: () {}),
            );
          }

          return null;
        },
      ),
    );
  }
}

class DocFinderApp extends StatefulWidget {
  const DocFinderApp({super.key});

  @override
  State<DocFinderApp> createState() => _DocFinderAppState();
}

class _DocFinderAppState extends State<DocFinderApp> {
  int _currentIndex = 0;
  bool _showAuthPages = false; // Keep false by default to allow guest access
  bool _isRegistering = false;

  // Page names for routes
  static const Map<String, String> _routes = {
    '/home': 'Home',
    '/doctors': 'Doctors',
    '/map': 'Map',
    '/appointments': 'Appointments',
    '/profile': 'Profile',
  };

  @override
  Widget build(BuildContext context) {
    // If showing auth pages, render the login or register screen
    // This keeps the check simple so users can continue as guest
    if (_showAuthPages) {
      return _isRegistering
          ? RegisterScreen(onLoginTap: _toggleRegisterLogin)
          : LoginScreen(onRegisterTap: _toggleRegisterLogin);
    }

    // Otherwise show the main app interface
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // Home Tab
          const HomeScreen(),

          // Doctors Tab
          const DoctorListScreen(),

          // Map Tab
          const DoctorMapScreen(),

          // Appointments Tab
          const AppointmentListScreen(),

          // Profile Tab
          ProfileScreen(
            onLogoutSuccess: () {
              // Show auth pages after logout
              setState(() {
                _currentIndex = 0;
                _showAuthPages = true;
              });
            },
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondaryColor,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.medical_services),
            label: 'Doctors',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Map'),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Appointments',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  void _toggleRegisterLogin() {
    setState(() {
      _isRegistering = !_isRegistering;
    });
  }

  @override
  void initState() {
    super.initState();

    // We don't force authentication check on startup anymore
    // This allows guest access by default
  }
}
