class ApiConfig {
  // Use your PC's local IP so physical devices/emulators can reach the backend.
  // Android emulator: use 10.0.2.2 instead of 192.168.x.x
  // Physical device: use your PC's actual LAN IP (e.g. 192.168.1.5)
  // static const String _host = '192.168.1.5:5097';

  static const String baseUrl = 'http://localhost:5097/api';
  static const String baseUrl2 = 'http://localhost:5097';


  static const String announcements = '/Announcements';
  static const String documentRequests = '/DocumentRequests';
  static const String documentRequirements = '/DocumentRequirements';
  static const String documentTypes = '/DocumentTypes';
  static const String auth = '/Auth';
  static const String users = '/Users';
}
