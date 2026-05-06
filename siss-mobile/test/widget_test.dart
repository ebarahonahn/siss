import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:siss_mobile/src/app.dart';

void main() {
  testWidgets('Login page smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const SissApp());

    // Verify that our login page is displayed.
    expect(find.text('Bienvenido a SISS'), findsOneWidget);
    expect(find.text('Inicie sesión para continuar'), findsOneWidget);
    expect(find.byIcon(Icons.health_and_safety), findsOneWidget);
  });
}
