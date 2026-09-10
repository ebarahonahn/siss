// Browser downloads do not use native filesystem plugins.
// This file is selected only by the web conditional export.
// ignore: deprecated_member_use, avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:async';
import 'dart:typed_data';

Future<String?> saveAndOpenPdf(List<int> bytes, String filename) async {
  final blob = html.Blob([Uint8List.fromList(bytes)], 'application/pdf');
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..download = filename
    ..style.display = 'none';
  try {
    html.document.body!.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Allow the browser to start consuming the PDF before releasing its URL.
    Timer(const Duration(minutes: 1), () => html.Url.revokeObjectUrl(url));
  }
  return null;
}
