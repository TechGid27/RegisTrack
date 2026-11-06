import 'package:flutter/material.dart';
import 'screens/splash_screen.dart';
import 'theme/app_colors.dart';

void main() {
  runApp(const RegisTrackApp());
}

class RegisTrackApp extends StatelessWidget {
  const RegisTrackApp({super.key});

  // ── Shared palette (mirrors website #1A237E system) ──────────
  static const Color primary     = AppColors.primary;
  static const Color primaryDark = AppColors.primaryDark;
  static const Color primaryLight= AppColors.primaryLight;
  static const Color bgDefault   = AppColors.bgDefault;
  static const Color textDark    = AppColors.textDark;
  static const Color textSlate   = AppColors.textSlate;
  static const Color borderColor = AppColors.border;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RegisTrack',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          primary: primary,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: bgDefault,
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: bgDefault,
          foregroundColor: textDark,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: textDark,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: borderColor),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: borderColor),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: borderColor),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: primary, width: 2),
          ),
          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
          labelStyle: const TextStyle(color: textSlate),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: textDark),
          bodyMedium: TextStyle(color: Color(0xFF334155)),
          titleLarge: TextStyle(color: textDark, fontWeight: FontWeight.bold),
        ),
      ),
      home: const SplashScreen(),
    );
  }
}

