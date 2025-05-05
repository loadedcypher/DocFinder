import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/doctor_model.dart';
import '../services/doctor_service.dart';
import '../../appointment/services/appointment_service.dart';
import '../../appointment/models/appointment_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/services/email_service.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;
  final int initialTabIndex;

  const DoctorDetailScreen({
    super.key,
    required this.doctorId,
    this.initialTabIndex = 0,
  });

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen>
    with SingleTickerProviderStateMixin {
  final DoctorService _doctorService = DoctorService();
  final AppointmentService _appointmentService = AppointmentService();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  late TabController _tabController;
  Doctor? _doctor;
  bool _isLoading = true;
  bool _hasError = false;

  // For map
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};

  // For appointment booking
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 9, minute: 0);
  final TextEditingController _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    _loadDoctorData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _mapController?.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctorData() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final doctor = await _doctorService.getDoctorById(widget.doctorId);

      if (doctor != null) {
        setState(() {
          _doctor = doctor;
          _isLoading = false;

          // Set up map marker
          _markers = {
            Marker(
              markerId: MarkerId(doctor.id),
              position: LatLng(
                doctor.location.latitude,
                doctor.location.longitude,
              ),
              infoWindow: InfoWindow(
                title: doctor.name,
                snippet: doctor.address,
              ),
            ),
          };
        });
      } else {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  Future<void> _bookAppointment() async {
    if (_auth.currentUser == null) {
      Fluttertoast.showToast(
        msg: 'Please sign in to book an appointment',
        backgroundColor: AppTheme.errorColor,
      );
      return;
    }

    if (_doctor == null) return;

    // Combine date and time
    final DateTime appointmentDateTime = DateTime(
      _selectedDate.year,
      _selectedDate.month,
      _selectedDate.day,
      _selectedTime.hour,
      _selectedTime.minute,
    );

    // Format date and time for email
    final String formattedDate = 
        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} at '
        '${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}';

    // Create appointment in Firestore
    final appointment = Appointment.createPending(
      userId: _auth.currentUser!.uid,
      doctorId: _doctor!.id,
      date: appointmentDateTime,
      // Add notes to the appointment if your model supports it
      // If not, you'll need to modify your Appointment model
    );
    
    // Store the notes for email even if we don't save them in Firestore
    final String notes = _noteController.text;

    try {
      // Save the appointment to database
      final appointmentId = await _appointmentService.bookAppointment(
        appointment,
      );

      if (appointmentId != null) {
        // Show dialog asking if they want to also send an email
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Appointment Requested'),
            content: const Text(
                'Your appointment has been saved. Would you like to also send an email request to the doctor?'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                child: const Text('No'),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  await _sendEmailRequest(formattedDate, notes);
                },
                child: const Text('Yes, send email'),
              ),
            ],
          ),
        );
      } else {
        Fluttertoast.showToast(
          msg: 'Failed to book appointment',
          backgroundColor: AppTheme.errorColor,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'An error occurred',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }
  
  // Send email request to the doctor
  Future<void> _sendEmailRequest(String formattedDate, String notes) async {
    try {
      final user = _auth.currentUser;
      if (user == null || _doctor == null) return;
      
      bool emailSent = await EmailService.sendAppointmentRequest(
        doctorEmail: _doctor!.email,
        doctorName: _doctor!.name,
        patientName: user.displayName ?? 'Patient',
        requestedDate: formattedDate,
        patientPhone: user.phoneNumber,
        additionalInfo: notes,
      );
      
      if (emailSent) {
        Fluttertoast.showToast(
          msg: 'Email request sent to doctor',
          backgroundColor: AppTheme.successColor,
        );
      } else {
        Fluttertoast.showToast(
          msg: 'Could not send email request',
          backgroundColor: AppTheme.errorColor,
        );
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Error sending email: ${e.toString()}',
        backgroundColor: AppTheme.errorColor,
      );
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );

    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_doctor?.name ?? 'Doctor Details'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Profile'),
            Tab(text: 'Appointment'),
            Tab(text: 'Location'),
          ],
        ),
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _hasError
              ? _buildErrorWidget()
              : TabBarView(
                controller: _tabController,
                children: [
                  _buildProfileTab(),
                  _buildAppointmentTab(),
                  _buildLocationTab(),
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
            'Failed to load doctor details',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Please check your connection and try again',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadDoctorData,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileTab() {
    if (_doctor == null) return const SizedBox.shrink();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Doctor header with photo
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 64,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  backgroundImage:
                      _doctor!.photoUrl != null
                          ? NetworkImage(_doctor!.photoUrl!)
                          : null,
                  child:
                      _doctor!.photoUrl == null
                          ? const Icon(
                            Icons.person,
                            size: 64,
                            color: AppTheme.primaryColor,
                          )
                          : null,
                ),
                const SizedBox(height: 16),
                Text(
                  _doctor!.name,
                  style: Theme.of(context).textTheme.displaySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  _doctor!.specialty,
                  style: Theme.of(context).textTheme.titleLarge!.copyWith(
                    color: AppTheme.primaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Contact information section
          Text(
            'Contact Information',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _buildInfoItem(Icons.phone, 'Phone', _doctor!.phone),
          const SizedBox(height: 12),
          _buildInfoItem(Icons.email, 'Email', _doctor!.email),
          const SizedBox(height: 12),
          _buildInfoItem(
            Icons.location_on,
            'Address',
            '${_doctor!.address}, ${_doctor!.city}',
          ),
          const SizedBox(height: 32),

          // Book appointment button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                _tabController.animateTo(1); // Switch to appointment tab
              },
              icon: const Icon(Icons.calendar_today),
              label: const Text('Book Appointment'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppTheme.primaryColor, size: 24),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                  color: AppTheme.textSecondaryColor,
                ),
              ),
              const SizedBox(height: 4),
              Text(value, style: Theme.of(context).textTheme.bodyLarge),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAppointmentTab() {
    if (_doctor == null) return const SizedBox.shrink();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          Text(
            'Book an Appointment',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Select your preferred date and time to request an appointment with Dr. ${_doctor!.name}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 32),

          // Date selection
          Text('Date', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _selectDate(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.dividerColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const Icon(Icons.calendar_today),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Time selection
          Text('Time', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _selectTime(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.dividerColor),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${_selectedTime.hour}:${_selectedTime.minute.toString().padLeft(2, '0')}',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const Icon(Icons.access_time),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Notes field
          TextField(
            controller: _noteController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notes for the doctor',
              hintText: 'Any specific concerns or additional information',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 32),

          // Authentication warning if not logged in
          if (_auth.currentUser == null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.warningColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.warningColor),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: AppTheme.warningColor,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'You need to be logged in to book an appointment',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 32),

          // Book button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _auth.currentUser != null ? _bookAppointment : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                disabledBackgroundColor: AppTheme.primaryColor.withOpacity(0.3),
              ),
              child: const Text('Request Appointment'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationTab() {
    if (_doctor == null) return const SizedBox.shrink();

    return Column(
      children: [
        // Map
        Expanded(
          child: GoogleMap(
            initialCameraPosition: CameraPosition(
              target: LatLng(
                _doctor!.location.latitude,
                _doctor!.location.longitude,
              ),
              zoom: 14,
            ),
            markers: _markers,
            onMapCreated: (controller) {
              setState(() {
                _mapController = controller;
              });
            },
          ),
        ),

        // Address card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Address', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${_doctor!.address}, ${_doctor!.city}',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    // Open location in maps app
                    final lat = _doctor!.location.latitude;
                    final lng = _doctor!.location.longitude;
                    final url = 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url));
                    }
                  },
                  icon: const Icon(Icons.directions),
                  label: const Text('Get Directions'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
