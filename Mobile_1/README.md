# RegisTrack Mobile

Flutter mobile application for students, staff, and administrators of the RegisTrack document request system.

## Backend Host

API settings are defined in `lib/services/api_config.dart`.

The default host is:

```text
http://localhost:5097/api
```

Update this file depending on the test device:

| Environment | API host example |
|---|---|
| Android emulator | `http://10.0.2.2:5097/api` |
| Windows desktop or iOS simulator | `http://localhost:5097/api` |
| Physical device on the same network | `http://<PC-LAN-IP>:5097/api` |

`localhost` refers to the mobile device when used on an emulator or physical phone. Use the computer's actual LAN IPv4 address for physical devices and make sure the API accepts LAN connections through the Windows firewall.

## Prerequisites

- Flutter SDK with Dart 3.11.1 or newer
- The RegisTrack API running on port `5097`
- Android Studio, Xcode, or another configured Flutter target

## Setup

```bash
flutter pub get
flutter run
```

For a specific target:

```bash
flutter run -d chrome
flutter run -d windows
flutter run -d android
```

## Main Features

- Registration, login, forgot password, and OTP verification
- Document request submission and tracking
- Document types and requirements
- Announcements and public document lookup
- Student, staff, and administrator dashboards
- SignalR request notifications

## Main Technologies

- Flutter and Dart
- HTTP package
- Shared Preferences
- File Picker
- SignalR NetCore

Assets are stored in `assets/images/` and registered in `pubspec.yaml`.
