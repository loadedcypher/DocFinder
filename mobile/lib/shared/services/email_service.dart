import 'package:url_launcher/url_launcher.dart';

class EmailService {
  /// Send an email to a doctor for appointment booking
  /// Returns true if the email app was opened successfully
  static Future<bool> sendAppointmentRequest({
    required String doctorEmail,
    required String doctorName,
    required String patientName,
    required String requestedDate,
    String? patientPhone,
    String? additionalInfo,
  }) async {
    final String subject = 'Appointment Request: $patientName';
    
    // Build the email body
    String body = 'Dear Dr. $doctorName,\n\n'
        'I would like to request an appointment on $requestedDate.\n\n'
        'Patient Information:\n'
        'Name: $patientName\n';
    
    // Add optional information if available
    if (patientPhone != null && patientPhone.isNotEmpty) {
      body += 'Phone: $patientPhone\n';
    }
    
    if (additionalInfo != null && additionalInfo.isNotEmpty) {
      body += '\nAdditional Information:\n$additionalInfo\n';
    }
    
    body += '\nPlease confirm this appointment or suggest an alternative time. '
        'Thank you for your consideration.\n\n'
        'Best Regards,\n'
        '$patientName';
    
    // Construct the email URI
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: doctorEmail,
      query: _encodeQueryParameters({
        'subject': subject,
        'body': body,
      }),
    );
    
    // Launch the email app
    if (await canLaunchUrl(emailUri)) {
      return launchUrl(emailUri);
    } else {
      throw 'Could not launch email app';
    }
  }
  
  // Helper method to encode query parameters
  static String _encodeQueryParameters(Map<String, String> params) {
    return params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
  }
}
