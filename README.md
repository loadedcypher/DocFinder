# DocFinder

A cross-platform solution for finding private doctors based on location and specialty.

## Project Structure

This project is organized as a monorepo with the following structure:

```
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
```

## Setup Instructions

### Prerequisites

- Node.js and npm
- Flutter SDK
- Firebase CLI
- Google Cloud SDK (optional)

### Web Portal (Admin)

```bash
# Install dependencies
cd web
npm install

# Run development server
npm run dev
```

### Mobile App

```bash
# Install dependencies
cd mobile
flutter pub get

# Run the app
flutter run
```

### Firebase Setup

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init
```

## Features

### Mobile App
- Authentication with Firebase
- Doctor search with filters
- Doctor profiles and details
- Appointment booking
- Google Maps integration

### Admin Portal
- Admin authentication with role-based access
- Doctor management (CRUD operations)
- Statistics and visualization
- Report generation with CSV export

## Technologies

- **Mobile**: Flutter, Firebase Auth, Firebase Firestore, Google Maps API
- **Web**: React, Material UI, Firebase, Chart.js
- **Backend**: Firebase Firestore, Firebase Functions
