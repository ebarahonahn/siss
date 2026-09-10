import 'package:flutter/material.dart';
import 'package:siss_mobile/src/core/api/api_service.dart';
import 'package:intl/intl.dart';

class FarmaciaPage extends StatefulWidget {
  final int? recetaId;
  const FarmaciaPage({super.key, this.recetaId});

  @override
  State<FarmaciaPage> createState() => _FarmaciaPageState();
}

class _FarmaciaPageState extends State<FarmaciaPage> {
  final ApiService _api = ApiService();
  List<dynamic> _recetas = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRecetas();
  }

  Future<void> _loadRecetas() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    
    try {
      debugPrint('FARMACIA: Solicitando perfil y recetas...');
      final response = await _api.get('/pacientes/mi-perfil');
      
      if (!mounted) return;

      if (response.data != null && response.data['ok'] == true) {
        final data = response.data['data'];
        setState(() {
          _recetas = data?['recetas'] ?? [];
          if (widget.recetaId != null) {
            _recetas = _recetas.where((r) => r['id'] == widget.recetaId).toList();
          }
        });
        debugPrint('FARMACIA: Carga exitosa. Recetas: ${_recetas.length}');
      } else {
        debugPrint('FARMACIA: La respuesta no tiene el formato esperado');
      }
    } catch (e) {
      debugPrint('FARMACIA: Error al cargar: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar recetas: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Mis Recetas', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF1E88E5),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadRecetas,
              child: _recetas.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _recetas.length,
                      itemBuilder: (context, index) {
                        final receta = _recetas[index];
                        return _buildRecetaCard(receta);
                      },
                    ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.medication_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text('No tienes recetas registradas aún', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildRecetaCard(dynamic receta) {
    final fecha = DateTime.tryParse(receta['creadaEn'] ?? '');
    final String fechaFormateada = fecha == null
        ? 'Fecha no disponible'
        : DateFormat('dd/MM/yyyy').format(fecha.toLocal());
    final String establecimiento = receta['establecimiento']?['nombre'] ?? 'Centro Médico SISS';
    final List<dynamic> detalles = receta['detalles'] ?? [];
    final bool esVigente = receta['activo'] ?? true;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: ExpansionTile(
        initiallyExpanded: widget.recetaId != null,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: esVigente ? Colors.blue[50] : Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.assignment_outlined, color: esVigente ? Colors.blue : Colors.grey),
        ),
        title: Text('Receta - $fechaFormateada', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(establecimiento, style: const TextStyle(fontSize: 12)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: esVigente ? Colors.green[50] : Colors.red[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            esVigente ? 'VIGENTE' : 'VENCIDA',
            style: TextStyle(color: esVigente ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Medicamentos recetados:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 8),
                ...detalles.map((d) => _buildMedicationItem(d)).toList(),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildMedicationItem(dynamic d) {
    final med = d['medicamento'] ?? {};
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.circle, size: 8, color: Colors.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(med['nombreGenerico'] ?? med['nombreComercial'] ?? 'Medicamento desconocido', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text('${d['dosis'] ?? 'Dosis no especificada'} - Cada ${d['frecuencia'] ?? 'N/A'}', style: TextStyle(fontSize: 13, color: Colors.grey[700])),
                Text('Cantidad recetada: ${d['cantidad'] ?? 0}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
                if (d['indicaciones'] != null)
                  Text('Indicaciones: ${d['indicaciones']}', style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
