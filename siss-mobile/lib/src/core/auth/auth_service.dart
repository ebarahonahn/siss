import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../api/api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final ApiService _api = ApiService();
  Map<String, dynamic>? _currentUser;
  String? _token;
  bool _requiresPasswordChange = false;

  Map<String, dynamic>? get currentUser => _currentUser;
  String? get token => _token;
  bool get requiresPasswordChange => _requiresPasswordChange;

  Future<bool> login(String email, String password) async {
    try {
      final response = await _api.post('/auth/login', {
        'identificador': email,
        'contrasena': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final dynamic responseData = response.data;
        debugPrint('DEBUG: Login Response Data: $responseData');
        
        if (responseData == null) {
          throw 'Error: El servidor devolvió una respuesta vacía';
        }

        // El backend envuelve todo en un objeto { ok: bool, data: any }
        final Map<String, dynamic> body = Map<String, dynamic>.from(responseData);
        final data = body['data'];
        
        if (data == null) {
          throw 'Error: El servidor no incluyó datos en la respuesta';
        }

        final Map<String, dynamic> dataMap = Map<String, dynamic>.from(data);
        final String? accessToken = dataMap['accessToken'];
        final dynamic userData = dataMap['usuario'];
        
        _requiresPasswordChange = dataMap['requiereCambioContrasena'] ?? false;

        if (accessToken == null) {
          throw 'Error: No se recibió el token de acceso del servidor';
        }

        _token = accessToken;
        _currentUser = userData != null ? Map<String, dynamic>.from(userData) : null;
        
        // Guardar en persistencia local de forma segura
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        if (_currentUser != null) {
          await prefs.setString('user', jsonEncode(_currentUser));
        }
        
        debugPrint('DEBUG: Login exitoso. Requiere cambio clave: $_requiresPasswordChange');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      if (e is DioException) {
        final msg = e.response?.data?['message'] ?? e.message ?? 'Error de red';
        throw msg;
      }
      rethrow;
    }
  }

  Future<void> changePassword(String newPassword) async {
    try {
      await _api.post('/auth/cambiar-contrasena', {
        'nuevaContrasena': newPassword,
      });
      _requiresPasswordChange = false;
    } catch (e) {
      if (e is DioException) {
        throw e.response?.data?['message'] ?? 'Error al cambiar contraseña';
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> checkSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userStr = prefs.getString('user');
    
    if (_token != null && userStr != null) {
      _currentUser = jsonDecode(userStr);
      return true;
    }
    return false;
  }
}
