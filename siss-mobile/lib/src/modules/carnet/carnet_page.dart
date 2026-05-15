import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:siss_mobile/src/core/auth/auth_service.dart';
import 'package:siss_mobile/src/core/api/api_service.dart';
import 'package:intl/intl.dart';

class CarnetPage extends StatefulWidget {
  const CarnetPage({super.key});

  @override
  State<CarnetPage> createState() => _CarnetPageState();
}

class _CarnetPageState extends State<CarnetPage> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _perfil;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPerfil();
  }

  Future<void> _loadPerfil() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get('/pacientes/mi-perfil');
      if (response.data != null && response.data['ok'] == true) {
        setState(() {
          _perfil = response.data['data'];
        });
      }
    } catch (e) {
      debugPrint('Error cargando perfil: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;
    final String nombreCompleto = _perfil != null 
        ? '${_perfil!['nombres']} ${_perfil!['apellidos']}' 
        : (user != null ? '${user['nombres']} ${user['apellidos']}' : 'Usuario');
    
    final String dni = _perfil?['dni'] ?? user?['dni'] ?? '---';
    final String expediente = _perfil?['numeroExpediente'] ?? '---';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Carnet Digital', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E88E5),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                // Carnet Card
                Card(
                  elevation: 8,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
                      ),
                    ),
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Icon(Icons.health_and_safety, color: Colors.white, size: 30),
                            Text('SISS - Honduras', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: QrImageView(
                            data: dni,
                            version: QrVersions.auto,
                            size: 180.0,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          nombreCompleto,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'DNI: $dni',
                          style: const TextStyle(color: Colors.white70, fontSize: 16),
                        ),
                        Text(
                          'Expediente: $expediente',
                          style: const TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                
                // Información Adicional
                _buildInfoSection('Información del Paciente', [
                  _buildInfoRow(Icons.calendar_today, 'Fecha Nacimiento', _formatFecha(_perfil?['fechaNacimiento'])),
                  _buildInfoRow(Icons.bloodtype, 'Tipo de Sangre', _perfil?['tipoSangre']?['nombre'] ?? 'No especificado'),
                  _buildInfoRow(Icons.person, 'Sexo', _perfil?['sexo']?['nombre'] ?? 'No especificado'),
                  _buildInfoRow(Icons.location_on, 'Establecimiento', _perfil?['establecimiento']?['nombre'] ?? 'Centro Base'),
                ]),
              ],
            ),
          ),
    );
  }

  String _formatFecha(String? fechaStr) {
    if (fechaStr == null) return '---';
    try {
      final fecha = DateTime.parse(fechaStr);
      return DateFormat('dd/MM/yyyy').format(fecha);
    } catch (e) {
      return fechaStr;
    }
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(children: children),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF1E88E5), size: 20),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}
