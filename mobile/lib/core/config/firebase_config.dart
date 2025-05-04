import 'package:doc_finder/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';

class FirebaseConfig {
  static Future<void> initialize() async {
    await Firebase.initializeApp(
      // To configure Firebase properly, you need to place the firebase_options.dart file here
      // and uncomment the line below
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }
}

// Note: To properly configure Firebase, you need to:
// 1. Register your app with Firebase console
// 2. Install Firebase CLI
// 3. Run 'flutterfire configure' command in the project directory
// 4. This will create firebase_options.dart file automatically
