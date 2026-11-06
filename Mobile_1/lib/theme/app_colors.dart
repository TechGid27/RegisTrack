import 'package:flutter/material.dart';

/// Shared color palette — mirrors the website #1A237E system.
/// Use these constants everywhere instead of raw Color() literals.
abstract class AppColors {
  // ── Primary ──────────────────────────────────────────────────
  static const Color primary      = Color(0xFF1A237E); // #1A237E
  static const Color primaryDark  = Color(0xFF311B92); // #311B92  hover/dark
  static const Color primaryLight = Color(0xFFEEF2FF); // #EEF2FF  tint/bg

  // ── Text ─────────────────────────────────────────────────────
  static const Color textDark     = Color(0xFF0F172A); // #0F172A  headings
  static const Color textBody     = Color(0xFF334155); // #334155  body
  static const Color textSlate    = Color(0xFF64748B); // #64748B  secondary
  static const Color textMuted    = Color(0xFF94A3B8); // #94A3B8  captions
  static const Color textRead     = Color(0xFF475569); // #475569  read items

  // ── Background ───────────────────────────────────────────────
  static const Color bgDefault    = Color(0xFFF4F7FE); // #F4F7FE  scaffold
  static const Color bgCard       = Color(0xFFFFFFFF); // white    cards
  static const Color bgSubtle     = Color(0xFFF8FAFF); // subtle   inputs

  // ── Border ───────────────────────────────────────────────────
  static const Color border       = Color(0xFFE7E9F4); // #E7E9F4
  static const Color borderMuted  = Color(0xFFE2E8F0); // drag handle

  // ── Status (semantic — kept intentional) ─────────────────────
  static const Color statusPending    = Color(0xFF1A237E); // primary blue
  static const Color statusProcess    = Color(0xFFFFB547); // amber
  static const Color statusApproved  = Color(0xFF05CD99); // green
  static const Color statusReceive    = Color(0xFF311B92); // primary dark
  static const Color statusDone       = Color(0xFF64748B); // slate

  // ── Semantic feedback ────────────────────────────────────────
  static const Color success      = Color(0xFF05CD99);
  static const Color warning      = Color(0xFFFFB547);
  static const Color error        = Color(0xFFEF4444);
  static const Color errorLight   = Color(0xFFFFF5F5);
  static const Color errorBorder  = Color(0xFFFCA5A5);
}
