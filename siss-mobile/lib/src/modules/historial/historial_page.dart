import 'package:flutter/material.dart';
import 'package:siss_mobile/src/core/api/api_service.dart';
import 'package:intl/intl.dart';

class HistorialPage extends StatefulWidget {
  const HistorialPage({super.key});

  @override
  State<HistorialPage> createState() => _HistorialPageState();
}

class _HistorialPageState extends State<HistorialPage> {
  final ApiService _api = ApiService();
  List<dynamic> _episodios = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistorial();
  }

  Future<void> _loadHistorial() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isLoading = true);
    try {
      final response = await _api.get('/pacientes/mi-perfil');
      final data = response.data['data'];
      setState(() {
        _episodios = data['historialClinico'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Error al cargar el historial: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Historial Médico', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E88E5),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _episodios.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _episodios.length,
                  itemBuilder: (context, index) {
                    final ep = _episodios[index];
                    return _buildEpisodeCard(ep);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text('No se encontraron encuentros médicos', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildEpisodeCard(dynamic ep) {
    final DateTime fecha = DateTime.tryParse(ep['fecha'] ?? '') ?? DateTime.now();
    final String fechaFormateada = DateFormat('dd/MM/yyyy').format(fecha);
    final String horaFormateada = DateFormat('hh:mm a').format(fecha);
    final String medico = ep['medico'] != null 
        ? 'Dr. ${ep['medico']['nombres']} ${ep['medico']['apellidos']}'
        : 'Médico no especificado';
    
    // El establecimiento lo agregaremos en el backend en el siguiente paso
    final String establecimiento = ep['medico']?['establecimiento']?['nombre'] ?? 'Centro Médico SISS';

    final List<dynamic> diagnosticos = ep['diagnosticos'] ?? [];

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(8)),
          child: const Icon(Icons.description_outlined, color: Colors.green),
        ),
        title: Text(fechaFormateada, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('$establecimiento - $horaFormateada', style: const TextStyle(fontSize: 12)),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Atendido por:', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                Text(medico, style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 12),
                
                if (diagnosticos.isNotEmpty) ...[
                  const Text('Diagnósticos:', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                  ...diagnosticos.map((d) => Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.check_circle_outline, size: 14, color: Colors.blue),
                        const SizedBox(width: 8),
                        Expanded(child: Text('${d['codigoCIE10']} - ${d['descripcion']}', style: const TextStyle(fontSize: 13))),
                      ],
                    ),
                  )).toList(),
                  const SizedBox(height: 12),
                ],

                if (ep['analisis'] != null && ep['analisis'].toString().isNotEmpty) ...[
                  const Text('Análisis / Notas Clínicas:', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold)),
                  Text(ep['analisis'], style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic)),
                ],
              ],
            ),
          )
        ],
      ),
    );
  }
}
