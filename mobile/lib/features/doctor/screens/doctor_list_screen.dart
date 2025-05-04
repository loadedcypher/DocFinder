import 'package:flutter/material.dart';
import '../models/doctor_model.dart';
import '../services/doctor_service.dart';
import 'doctor_detail_screen.dart';
import '../../../core/theme/app_theme.dart';

class DoctorListScreen extends StatefulWidget {
  final String? specialty;
  final String? city;

  const DoctorListScreen({super.key, this.specialty, this.city});

  @override
  State<DoctorListScreen> createState() => _DoctorListScreenState();
}

class _DoctorListScreenState extends State<DoctorListScreen> {
  final DoctorService _doctorService = DoctorService();

  List<Doctor> _doctors = [];
  List<String> _specialties = [];
  List<String> _cities = [];

  String? _selectedSpecialty;
  String? _selectedCity;

  bool _isLoading = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _selectedSpecialty = widget.specialty;
    _selectedCity = widget.city;
    _loadFilters();
    _loadDoctors();
  }

  Future<void> _loadFilters() async {
    try {
      final specialties = await _doctorService.getAvailableSpecialties();
      final cities = await _doctorService.getAvailableCities();

      if (mounted) {
        setState(() {
          _specialties = specialties;
          _cities = cities;
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _loadDoctors() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });
    }

    try {
      List<Doctor> doctors;

      if (_selectedSpecialty != null && _selectedCity != null) {
        doctors = await _doctorService.getDoctorsBySpecialtyAndCity(
          _selectedSpecialty!,
          _selectedCity!,
        );
      } else if (_selectedSpecialty != null) {
        doctors = await _doctorService.getDoctorsBySpecialty(
          _selectedSpecialty!,
        );
      } else if (_selectedCity != null) {
        doctors = await _doctorService.getDoctorsByCity(_selectedCity!);
      } else {
        doctors = await _doctorService.getAllDoctors();
      }

      if (mounted) {
        setState(() {
          _doctors = doctors;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  void _applyFilters() {
    _loadDoctors();
  }

  void _resetFilters() {
    setState(() {
      _selectedSpecialty = null;
      _selectedCity = null;
    });
    _loadDoctors();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Doctors'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _resetFilters),
        ],
      ),
      body: Column(
        children: [
          // Filters section
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surfaceColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filters', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'Specialty',
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        value: _selectedSpecialty,
                        items: [
                          const DropdownMenuItem<String>(
                            value: null,
                            child: Text('All Specialties'),
                          ),
                          ..._specialties.map(
                            (specialty) => DropdownMenuItem<String>(
                              value: specialty,
                              child: Text(specialty),
                            ),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedSpecialty = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'City',
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        value: _selectedCity,
                        items: [
                          const DropdownMenuItem<String>(
                            value: null,
                            child: Text('All Cities'),
                          ),
                          ..._cities.map(
                            (city) => DropdownMenuItem<String>(
                              value: city,
                              child: Text(city),
                            ),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedCity = value;
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    child: const Text('Apply Filters'),
                  ),
                ),
              ],
            ),
          ),

          // Results count
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Results: ${_doctors.length} doctors',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                TextButton.icon(
                  onPressed: _loadDoctors,
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Refresh'),
                ),
              ],
            ),
          ),

          // Doctor list
          Expanded(child: _buildDoctorsList()),
        ],
      ),
    );
  }

  Widget _buildDoctorsList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: AppTheme.errorColor,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load doctors',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _loadDoctors,
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (_doctors.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.search_off,
              color: AppTheme.secondaryColor,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'No doctors found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'Try changing your search filters',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _doctors.length,
      itemBuilder: (context, index) {
        final doctor = _doctors[index];
        return _buildDoctorCard(doctor);
      },
    );
  }

  Widget _buildDoctorCard(Doctor doctor) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DoctorDetailScreen(doctorId: doctor.id),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Doctor photo
              CircleAvatar(
                radius: 40,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                backgroundImage:
                    doctor.photoUrl != null
                        ? NetworkImage(doctor.photoUrl!)
                        : null,
                child:
                    doctor.photoUrl == null
                        ? const Icon(
                          Icons.person,
                          size: 40,
                          color: AppTheme.primaryColor,
                        )
                        : null,
              ),
              const SizedBox(width: 16),

              // Doctor info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor.specialty,
                      style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on,
                          size: 16,
                          color: AppTheme.textSecondaryColor,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${doctor.city}, ${doctor.address}',
                            style: Theme.of(context).textTheme.bodyMedium,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // View profile button
                        OutlinedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder:
                                    (context) =>
                                        DoctorDetailScreen(doctorId: doctor.id),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          child: const Text('View Profile'),
                        ),

                        // Book appointment button
                        ElevatedButton(
                          onPressed: () {
                            // Navigate to appointment booking
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder:
                                    (context) => DoctorDetailScreen(
                                      doctorId: doctor.id,
                                      initialTabIndex: 1, // Appointments tab
                                    ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          child: const Text('Book Appointment'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
