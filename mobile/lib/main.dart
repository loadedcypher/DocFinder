import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/services.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/config/firebase_config.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/home/screens/home_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/doctor/screens/doctor_list_screen.dart';
import 'features/appointment/screens/appointment_list_screen.dart';
import 'features/profile/screens/profile_screen.dart';

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
  final bool _showAuthPages = false;
  bool _isRegistering = false;

  @override
  Widget build(BuildContext context) {
    // If showing auth pages, render the login or register screen
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

          // Appointments Tab
          const AppointmentListScreen(),

          // Profile Tab
          ProfileScreen(
            onLogoutSuccess: () {
              // Reset to home tab after logout
              setState(() {
                _currentIndex = 0;
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
}
