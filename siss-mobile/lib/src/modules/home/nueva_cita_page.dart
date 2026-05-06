import 'package:flutter/material.dart';
import 'package:siss_mobile/src/core/api/api_service.dart';
import 'package:siss_mobile/src/core/auth/auth_service.dart';

class NuevaCitaPage extends StatefulWidget {
  const NuevaCitaPage({super.key});

  @override
  State<NuevaCitaPage> createState() => _NuevaCitaPageState();
}

class _NuevaCitaPageState extends State<NuevaCitaPage> {
  final ApiService _api = ApiService();
  
  List<dynamic> _establecimientos = [];
  List<dynamic> _especialidades = [];
  List<dynamic> _medicos = [];
  
  int? _selectedEstablecimientoId;
  int? _selectedEspecialidadId;
  int? _selectedMedicoId;
  
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadEstablecimientos();
  }

  Future<void> _loadEstablecimientos() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final response = await _api.get('/establecimientos/lista/simple');
      setState(() {
        _establecimientos = response.data['data'] ?? [];
      });
    } catch (e) {
      debugPrint('Error loading establishments: $e');
      setState(() => _error = 'Error: $e');
    }
 finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadEspecialidades(int establecimientoId) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() { _isLoading = true; _medicos = []; _selectedMedicoId = null; _selectedEspecialidadId = null; });
    try {
      final response = await _api.get('/especialidades', queryParameters: {
        'establecimientoId': establecimientoId,
      });
      setState(() {
        _especialidades = response.data['data'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Error al cargar especialidades')));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMedicos(int especialidadId) async {
    if (_selectedEstablecimientoId == null) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() { _isLoading = true; _selectedMedicoId = null; });
    try {
      final response = await _api.get('/usuarios/medicos-establecimiento', queryParameters: {
        'establecimientoId': _selectedEstablecimientoId,
        'especialidadId': especialidadId,
      });
      setState(() {
        _medicos = response.data['data'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(const SnackBar(content: Text('Error al cargar médicos')));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String? _proximaHoraFormateada;
  String? _proximaHoraISO;

  Future<void> _checkDisponibilidad(int medicoId) async {
    if (_selectedEstablecimientoId == null) return;
    setState(() { _isLoading = true; _proximaHoraFormateada = null; _proximaHoraISO = null; });
    try {
      final hoy = DateTime.now().toIso8601String().split('T')[0];
      final horarioResp = await _api.get('/citas/horario-disponible', queryParameters: {
        'medicoId': medicoId,
        'fecha': hoy,
        'establecimientoId': _selectedEstablecimientoId,
      });

      final String iso = horarioResp.data['data']['siguienteHoraISO'];
      final DateTime dt = DateTime.parse(iso);
      
      setState(() {
        _proximaHoraISO = iso;
        _proximaHoraFormateada = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _agendarCita() async {
    if (_selectedMedicoId == null || _proximaHoraISO == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No hay horario disponible seleccionado')));
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    setState(() => _isLoading = true);
    try {
      await _api.post('/citas', {
        'pacienteId': AuthService().currentUser?['pacienteId'],
        'medicoId': _selectedMedicoId,
        'establecimientoId': _selectedEstablecimientoId,
        'especialidadId': _selectedEspecialidadId,
        'fechaHora': _proximaHoraISO,
        'tipo': 'CONSULTA_GENERAL',
        'motivo': 'Cita agendada vía App Móvil',
      });

      if (mounted) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Cita agendada exitosamente'), backgroundColor: Colors.green),
        );
        navigator.pop(true);
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
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
        title: const Text('Nueva Cita (Hoy)'),
        backgroundColor: const Color(0xFF1E88E5),
        foregroundColor: Colors.white,
      ),
      body: _isLoading && _establecimientos.isEmpty 
        ? const Center(child: CircularProgressIndicator())
        : Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Sigue los pasos para agendar tu atención para el día de hoy.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 32),
                
                // 1. Establecimiento
                _buildDropdown(
                  label: '1. Seleccione Centro de Salud',
                  value: _selectedEstablecimientoId,
                  items: _establecimientos,
                  onChanged: (val) {
                    setState(() {
                      _selectedEstablecimientoId = val;
                      _selectedEspecialidadId = null;
                      _selectedMedicoId = null;
                    });
                    if (val != null) _loadEspecialidades(val);
                  },
                ),
                const SizedBox(height: 24),

                // 2. Especialidad
                _buildDropdown(
                  label: '2. Seleccione Especialidad',
                  value: _selectedEspecialidadId,
                  items: _especialidades,
                  enabled: _selectedEstablecimientoId != null,
                  onChanged: (val) {
                    setState(() {
                      _selectedEspecialidadId = val;
                      _selectedMedicoId = null;
                    });
                    if (val != null) _loadMedicos(val);
                  },
                ),
                const SizedBox(height: 24),

                // 3. Médico
                _buildDropdown(
                  label: '3. Seleccione Médico',
                  value: _selectedMedicoId,
                  items: _medicos.map((m) => {
                    'id': m['id'],
                    'nombre': 'Dr. ${m['nombres']} ${m['apellidos']}'
                  }).toList(),
                  enabled: _selectedEspecialidadId != null,
                  onChanged: (val) {
                    setState(() {
                      _selectedMedicoId = val;
                      _error = null;
                    });
                    if (val != null) _checkDisponibilidad(val);
                  },
                ),
                
                if (_proximaHoraFormateada != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time, color: Colors.blue),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Horario sugerido para hoy:', style: TextStyle(fontSize: 12, color: Colors.blue)),
                                Text(_proximaHoraFormateada!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                
                const Spacer(),
                
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(_error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                  ),

                ElevatedButton(
                  onPressed: _isLoading ? null : _agendarCita,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E88E5),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('AGENDAR PARA HOY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                const SizedBox(height: 16),
                const Text(
                  '* Solo se permiten 3 citas por médico al día vía App.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required dynamic value,
    required List<dynamic> items,
    required void Function(int?) onChanged,
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        InputDecorator(
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            filled: !enabled,
            fillColor: enabled ? null : Colors.grey[100],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: value,
              isExpanded: true,
              hint: Text(enabled ? 'Seleccionar...' : 'Primero complete el paso anterior'),
              items: items.map<DropdownMenuItem<int>>((item) {
                return DropdownMenuItem<int>(
                  value: item['id'],
                  child: Text(item['nombre'] ?? ''),
                );
              }).toList(),
              onChanged: enabled ? onChanged : null,
            ),
          ),
        ),
      ],
    );
  }
}
