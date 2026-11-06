import 'package:flutter/foundation.dart';

class ApiConfig {
  static const String _webDesktopHost = 'localhost:5097';
  static const String _androidEmulatorHost = '10.0.2.2:5097';

  static String get _host {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return _androidEmulatorHost;
    }
    return _webDesktopHost;
  }

  static String get baseUrl => 'http://$_host/api';
  static String get baseUrl2 => 'http://$_host';


  static const String announcements = '/Announcements';
  static const String documentRequests = '/DocumentRequests';
  static const String documentRequirements = '/DocumentRequirements';
  static const String documentTypes = '/DocumentTypes';
  static const String auth = '/Auth';
  static const String users = '/Users';
}
