Project Specification Document
Project Overview
This project aims to develop a cross-platform mobile application and a web-based admin portal to assist users in finding private doctors based on location and specialty. The mobile app will be built using Flutter for deployment on Android and iOS platforms. The admin portal will be developed using React to manage doctor records, view statistics, and generate reports. Firebase Firestore will serve as the backend database for data storage and management. The project will be organized in a monorepo to streamline development and dependency management.

Technical Requirements
Mobile App

Framework: Flutter
Platforms: Android and iOS
Database: Firebase Firestore
Authentication: Firebase Authentication
Maps: Google Maps API
Email Notifications: Firebase Functions (e.g., with sengrid via fiebase)

Admin Portal

Framework: React with MUI
Database: Firebase Firestore
Authentication: Firebase Authentication
Charts: Chart.js or similar library
CSV Handling: PapaParse or similar library

Monorepo


Structure: Separate directories for mobile and web projects


Project Structure
The monorepo will be structured as follows:
project-root/
├── mobile/              # Flutter mobile app
│   ├── lib/
│   ├── pubspec.yaml
│   └── ...
├── web/                 # React admin portal
│   ├── src/
│   ├── package.json
│   └── ...
├── shared/              # Shared code or libraries
│   ├── lib/
│   └── ...
├── firebase/            # Firebase Functions and configurations
│   ├── functions/
│   └── ...
└── README.md            # Project overview and setup instructions


mobile/: Contains the Flutter mobile app code.
web/: Contains the React admin portal code.
shared/: Houses reusable code or libraries for both projects.
firebase/: Includes Firebase Functions and configurations.


Development Guidelines
Code Style: Adhere to official Flutter and React style guides.

Features and Functionalities
Mobile App

Authentication

Sign up and sign in with email and password.
Allow unauthenticated users to browse doctors but require login for booking appointments.


Doctor Listing

Display a list of doctors with search filters for city and specialty.


Doctor Details

Show doctor details: name, specialty, city, address, phone, email, and optional photo.


Appointment Booking

Enable users to request appointments.
Send email notifications to doctors upon request.


Maps Integration

Display doctor locations using Google Maps API.



Admin Portal

Authentication

Admin login with email and password.
Role-based access control for admin functionalities.


Doctor Management

Add, edit, and delete doctor records.
Suspend doctors by updating their status.


Statistics

Display total number of doctors and breakdown by specialty.


Reporting

Generate tabular reports with a CSV download option.




Database Schema
Firestore Collections

doctors

id (string, auto-generated)
name (string)
specialty (string)
city (string)
address (string)
phone (string)
email (string)
photoUrl (string, optional)
location (geopoint)
status (string: "active" | "suspended")


users

uid (string, from Firebase Auth)
email (string)
role (string: "user" | "admin")
name (string, optional)


appointments

id (string, auto-generated)
userId (string)
doctorId (string)
date (timestamp)
status (string: "pending" | "confirmed" | "cancelled")




Authentication and Authorization

Use Firebase Authentication for both mobile and admin portal.
Implement role-based access control in the admin portal.
Restrict appointment booking to authenticated users in the mobile app.


API Integration
Mobile App

Fetch and update doctor data via Firebase Firestore.
Integrate Google Maps API for location display.
Use Firebase Functions to send appointment email notifications.

Admin Portal

- Manage doctor records and statistics with Firebase Firestore.
- Use Chart.js for visual data representation.
- Implement PapaParse for CSV report exports.




Additional Notes

- Optimize the mobile app for performance and user experience.
- Use state management (e.g., Provider/Riverpod for Flutter, Context API for React).
- Implement error handling and user feedback (e.g., loading indicators, toast messages).