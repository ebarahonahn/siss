import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  final Dio _dio = Dio(
    BaseOptions(
      // Usaremos localhost + adb reverse (el método más estable para emuladores)
      baseUrl: 'http://localhost:3000/api/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 13),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  ApiService._internal() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        debugPrint('API Request: ${options.method} ${options.baseUrl}${options.path}');
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        debugPrint('API Error: ${e.message}');
        return handler.next(e);
      },
    ));
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> post(String path, dynamic data) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null) {
      return e.response?.data['message'] ?? 'Error del servidor';
    }
    
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Tiempo de espera agotado. Verifique su conexión.';
    }
    
    if (e.type == DioExceptionType.connectionError) {
      return 'No se pudo conectar al servidor. Verifique si el backend está corriendo y si la IP ${e.requestOptions.baseUrl} es accesible.';
    }

    return 'Error de conexión: ${e.message ?? 'Desconocido'}';
  }
}
