import 'package:flutter/material.dart';
import 'package:siss_mobile/src/app.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es', null);
  runApp(const SissApp());
}
