import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../../core/theme/app_theme.dart';
import '../models/appointment_model.dart';
import '../services/appointment_service.dart';
import '../../doctor/services/doctor_service.dart';
import '../../doctor/models/doctor_model.dart';

class AppointmentListScreen extends StatefulWidget {
  const AppointmentListScreen({super.key});

  @override
  State<AppointmentListScreen> createState() => _AppointmentListScreenState();
}

class _AppointmentListScreenState extends State<AppointmentListScreen>
    with SingleTickerProviderStateMixin {
  final AppointmentService _appointmentService = AppointmentService();
  final DoctorService _doctorService = DoctorService();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  late TabController _tabController;
  List<Appointment> _appointments = [];
  final Map<String, Doctor?> _doctorsCache = {};

  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    if (_auth.currentUser == null) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final appointments = await _appointmentService.getUserAppointments(
        _auth.currentUser!.uid,
      );

      // Load doctor details for each appointment
      for (final appointment in appointments) {
        if (!_doctorsCache.containsKey(appointment.doctorId)) {
          final doctor = await _doctorService.getDoctorById(
            appointment.doctorId,
          );
          _doctorsCache[appointment.doctorId] = doctor;
        }
      }

      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _hasError = true;
        _isLoading = false;
      });
    }
  }

  List<Appointment> _getFilteredAppointments(String status) {
    return _appointments
        .where((appointment) => appointment.status == status)
        .toList();
  }

  Future<void> _cancelAppointment(Appointment appointment) async {
    try {
      final success = await _appointmentService.cancelAppointment(
        appointment.id,
      );
      if (success) {
        setState(() {
          final index = _appointments.indexWhere((a) => a.id == appointment.id);
          if (index != -1) {
            _appointments[index] = appointment.cancel();
          }
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Appointment cancelled successfully')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to cancel appointment')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If not logged in, show login prompt
    if (_auth.currentUser == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Appointments')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.account_circle,
                size: 64,
                color: AppTheme.secondaryColor,
              ),
              const SizedBox(height: 16),
              Text(
                'Please log in to view your appointments',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // Navigate to login screen
                },
                child: const Text('Log In'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Confirmed'),
            Tab(text: 'Past'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAppointments,
          ),
        ],
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _hasError
              ? _buildErrorWidget()
              : TabBarView(
                controller: _tabController,
                children: [
                  // Upcoming (Pending) appointments
                  _buildAppointmentsList(
                    _getFilteredAppointments('pending'),
                    showCancelButton: true,
                  ),

                  // Confirmed appointments
                  _buildAppointmentsList(
                    _getFilteredAppointments('confirmed'),
                    showCancelButton: true,
                  ),

                  // Past appointments (cancelled or past date)
                  _buildAppointmentsList(
                    _getFilteredAppointments('cancelled') +
                        _appointments
                            .where(
                              (a) =>
                                  a.date.isBefore(DateTime.now()) &&
                                  a.status != 'cancelled',
                            )
                            .toList(),
                    showCancelButton: false,
                  ),
                ],
              ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 64),
          const SizedBox(height: 16),
          Text(
            'Failed to load appointments',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Please check your connection and try again',
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadAppointments,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsList(
    List<Appointment> appointments, {
    required bool showCancelButton,
  }) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.calendar_today,
              size: 64,
              color: AppTheme.secondaryColor,
            ),
            const SizedBox(height: 16),
            Text(
              'No appointments found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Book an appointment with a doctor to get started',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    // Sort appointments by date
    appointments.sort((a, b) => a.date.compareTo(b.date));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appointment = appointments[index];
        final doctor = _doctorsCache[appointment.doctorId];

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date and status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      DateFormat('MMM dd, yyyy').format(appointment.date),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    _buildStatusChip(appointment.status),
                  ],
                ),
                const SizedBox(height: 8),

                // Time
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppTheme.textSecondaryColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('hh:mm a').format(appointment.date),
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Doctor info
                if (doctor != null) ...[
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                        backgroundImage:
                            doctor.photoUrl != null
                                ? NetworkImage(doctor.photoUrl!)
                                : null,
                        child:
                            doctor.photoUrl == null
                                ? const Icon(
                                  Icons.person,
                                  color: AppTheme.primaryColor,
                                )
                                : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doctor.name,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(
                              doctor.specialty,
                              style: Theme.of(context).textTheme.bodyMedium!
                                  .copyWith(color: AppTheme.primaryColor),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ] else ...[
                  Text(
                    'Doctor information not available',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                ],

                // Actions
                if (showCancelButton &&
                    appointment.status != 'cancelled' &&
                    appointment.date.isAfter(DateTime.now()))
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => _cancelAppointment(appointment),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.errorColor,
                        side: const BorderSide(color: AppTheme.errorColor),
                      ),
                      child: const Text('Cancel Appointment'),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    late final Color backgroundColor;
    late final Color textColor;
    late final String label;

    switch (status) {
      case 'pending':
        backgroundColor = AppTheme.warningColor.withOpacity(0.2);
        textColor = AppTheme.warningColor;
        label = 'Pending';
        break;
      case 'confirmed':
        backgroundColor = AppTheme.successColor.withOpacity(0.2);
        textColor = AppTheme.successColor;
        label = 'Confirmed';
        break;
      case 'cancelled':
        backgroundColor = AppTheme.errorColor.withOpacity(0.2);
        textColor = AppTheme.errorColor;
        label = 'Cancelled';
        break;
      default:
        backgroundColor = AppTheme.textSecondaryColor.withOpacity(0.2);
        textColor = AppTheme.textSecondaryColor;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
