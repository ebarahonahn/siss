import 'package:flutter/material.dart';
import 'package:siss_mobile/src/modules/farmacia/farmacia_page.dart';
import 'package:siss_mobile/src/modules/home/nueva_cita_page.dart';
import 'package:siss_mobile/src/modules/historial/historial_page.dart';
import 'package:siss_mobile/src/modules/carnet/carnet_page.dart';
import 'package:siss_mobile/src/modules/prenatal/controles_prenatales_page.dart';
import 'package:siss_mobile/src/modules/inventario/stock_page.dart';
import 'package:siss_mobile/src/core/auth/auth_service.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'dart:io';
import 'package:siss_mobile/src/core/api/api_service.dart';
import 'package:intl/intl.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ApiService _api = ApiService();
  Map<String, dynamic>? _proximaCita;
  Map<String, dynamic>? _embarazoActivo;
  final List<Map<String, dynamic>> _medicamentos = [];
  bool _isLoading = true;
  bool _downloadingPdf = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      // 1. Cargar Citas
      final citasResponse = await _api.get('/citas');
      final Map<String, dynamic> citasBody = citasResponse.data;
      debugPrint('DEBUG: Citas Response Body: $citasBody');
      
      if (citasBody.containsKey('data')) {
        final List<dynamic> citas = citasBody['data'];
        debugPrint('DEBUG: Numero de citas encontradas: ${citas.length}');
        _proximaCita = citas.isNotEmpty ? citas.first : null;
      }

      // 2. Cargar Perfil y Embarazo
      try {
        final perfilResponse = await _api.get('/pacientes/mi-perfil');
        final Map<String, dynamic> perfilBody = perfilResponse.data;
        if (perfilBody.containsKey('data')) {
          final Map<String, dynamic> perfil = perfilBody['data'];
          
          // Buscar embarazo activo
          try {
            final embResponse = await _api.get('/control-prenatal/mi-seguimiento/activo');
            if (embResponse.data != null && embResponse.data['ok'] == true) {
              _embarazoActivo = embResponse.data['data'];
            }
          } catch (e) {
            debugPrint('Error buscando embarazo activo: $e');
          }

          final List<dynamic> meds = perfil['medicamentosActivos'] ?? [];
          
          _medicamentos.clear();
          for (var m in meds) {
            final medInfo = m['medicamento'];
            _medicamentos.add({
              'nombre': medInfo['nombre'],
              'dosis': m['dosis'],
              'frecuencia': m['frecuencia'],
              'proximaToma': '--:--',
            });
          }
        }
      } catch (e) {
        debugPrint('Nota: No se pudo cargar el perfil del paciente: $e');
        _medicamentos.clear();
        _embarazoActivo = null;
      }
    } catch (e) {
      debugPrint('Error cargando citas: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _downloadPdf() async {
    if (_embarazoActivo == null) return;

    setState(() => _downloadingPdf = true);

    try {
      final id = _embarazoActivo!['id'];
      
      // Obtener el directorio temporal para guardar el archivo
      final tempDir = await getTemporaryDirectory();
      final fullPath = '${tempDir.path}/carnet_prenatal_$id.pdf';

      debugPrint('DEBUG: Iniciando descarga de PDF en $fullPath');

      // Descargar el archivo usando Dio
      final response = await _api.getDio().get(
        '/control-prenatal/export/$id/pdf',
        options: Options(
          responseType: ResponseType.bytes,
        ),
      );

      // Guardar el archivo
      final file = File(fullPath);
      await file.writeAsBytes(response.data);

      debugPrint('DEBUG: PDF guardado con éxito. Abriendo...');

      // Abrir el archivo
      final result = await OpenFilex.open(fullPath);
      
      if (result.type != ResultType.done) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('No se pudo abrir el PDF: ${result.message}')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error descargando PDF: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error al descargar el carnet PDF')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _downloadingPdf = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;
    final String nombreCompleto = user != null 
        ? '${user['nombres']} ${user['apellidos']}' 
        : 'Usuario';

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bienvenido,', style: TextStyle(fontSize: 14, color: Colors.white70)),
            Text(nombreCompleto, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
        backgroundColor: const Color(0xFF1E88E5),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none, color: Colors.white)),
          IconButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await AuthService().logout();
              if (mounted) {
                navigator.pushReplacementNamed('/');
              }
            }, 
            icon: const Icon(Icons.logout, color: Colors.white)
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Próxima Cita Card
              _buildSectionTitle('Próxima Cita'),
              const SizedBox(height: 8),
              _isLoading 
                ? const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
                : _buildAppointmentCard(_proximaCita),
              const SizedBox(height: 24),

            // Acciones Rápidas
            _buildSectionTitle('Acciones Rápidas'),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildQuickAction(Icons.calendar_month, 'Nueva Cita', Colors.blue, () async {
                  final refresh = await Navigator.push(context, MaterialPageRoute(builder: (context) => const NuevaCitaPage()));
                  if (refresh == true) _loadData();
                }),
                _buildQuickAction(Icons.medical_services_outlined, 'Recetas', Colors.orange, () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const FarmaciaPage()));
                }),
                _buildQuickAction(Icons.inventory_2_outlined, 'Stock', Colors.purple, () {
                   Navigator.push(context, MaterialPageRoute(builder: (context) => const StockPage()));
                }),
                _buildQuickAction(Icons.history, 'Historial', Colors.green, () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const HistorialPage()));
                }),
                if (_embarazoActivo != null)
                  _buildQuickAction(Icons.pregnant_woman, 'Mi Embarazo', Colors.pink, () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => ControlesPrenatalesPage(embarazo: _embarazoActivo!)));
                  })
                else
                  _buildQuickAction(Icons.qr_code_2, 'Mi Carnet', Colors.red, () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const CarnetPage()));
                  }),
              ],
            ),
            const SizedBox(height: 24),

            // Sección de Embarazo o Signos Vitales
            if (_embarazoActivo != null) ...[
              _buildSectionTitle('Estado de Embarazo'),
              const SizedBox(height: 8),
              _buildPregnancySummaryCard(_embarazoActivo!),
            ] else ...[
              _buildSectionTitle('Últimos Signos Vitales'),
              const SizedBox(height: 8),
              _buildVitalSignsCard(null), // O pasar los datos si se cargan
            ],
            const SizedBox(height: 24),

            // Medicamentos Activos
            _buildSectionTitle('Medicamentos de Hoy'),
            const SizedBox(height: 8),
            _medicamentos.isEmpty
              ? _buildEmptyMedicationsCard()
              : Column(
                  children: _medicamentos.map((m) => _buildMedicationItem(
                    m['nombre'], 
                    '${m['dosis']} - ${m['frecuencia']}', 
                    m['proximaToma']
                  )).toList(),
                ),
          ],
        ),
      ),
    ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: const Color(0xFF1E88E5),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: 'Citas'),
          BottomNavigationBarItem(icon: Icon(Icons.medication), label: 'Farmacia'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Ajustes'),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic>? cita) {
    if (cita == null) {
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Padding(
          padding: EdgeInsets.all(24.0),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.calendar_today_outlined, size: 48, color: Colors.grey),
                SizedBox(height: 16),
                Text('Sin citas programadas', style: TextStyle(color: Colors.grey, fontSize: 16)),
              ],
            ),
          ),
        ),
      );
    }

    final DateTime fecha = DateTime.parse(cita['fechaHora']);
    final String fechaFormateada = DateFormat('EEEE, d \'de\' MMMM', 'es').format(fecha);
    final String horaFormateada = DateFormat('hh:mm a').format(fecha);
    final String medico = '${cita['medico']['nombres']} ${cita['medico']['apellidos']}';
    final String especialidad = cita['especialidad']?['nombre'] ?? 'Medicina General';
    final String establecimiento = cita['establecimiento']['nombre'];

    final String estado = cita['estado'] ?? 'PROGRAMADA';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.blue.shade700, Colors.blue.shade500],
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.calendar_today, color: Colors.white),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(fechaFormateada, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(horaFormateada, style: const TextStyle(color: Colors.white70)),
                    ],
                  ),
                ),
                _buildStatusBadge(estado),
              ],
            ),
            const Divider(color: Colors.white24, height: 24),
            Row(
              children: [
                const Icon(Icons.person_outline, color: Colors.white70, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    medico.startsWith('Dr.') ? '$medico - $especialidad' : 'Dr. $medico - $especialidad',
                    style: const TextStyle(color: Colors.white),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, color: Colors.white70, size: 20),
                const SizedBox(width: 8),
                Expanded(child: Text(establecimiento, style: const TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String estado) {
    Color color;
    String label;

    switch (estado) {
      case 'PROGRAMADA':
        color = Colors.white;
        label = 'PROGRAMADA';
        break;
      case 'CONFIRMADA':
        color = Colors.greenAccent;
        label = 'CONFIRMADA';
        break;
      case 'EN_SALA':
        color = Colors.orangeAccent;
        label = 'EN SALA';
        break;
      case 'ATENDIDA':
        color = Colors.lightBlueAccent;
        label = 'ATENDIDA';
        break;
      case 'CANCELADA':
        color = Colors.redAccent;
        label = 'CANCELADA';
        break;
      case 'NO_ASISTIO':
        color = Colors.grey;
        label = 'NO ASISTIÓ';
        break;
      default:
        color = Colors.white;
        label = estado;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color == Colors.white ? Colors.blue.shade900 : Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicationItem(String name, String dose, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.medication, color: Colors.blue.shade700),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(dose, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
              ],
            ),
          ),
          Text(time, style: const TextStyle(color: Color(0xFF1E88E5), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildEmptyMedicationsCard() {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
      child: const Padding(
        padding: EdgeInsets.all(20.0),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: Colors.grey),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'No tienes medicamentos programados para hoy.',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalSignsCard(Map<String, dynamic>? signos) {
    if (signos == null || (signos['presionSistolica'] == null && signos['temperatura'] == null)) {
      return Card(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
        child: const Padding(
          padding: EdgeInsets.all(20.0),
          child: Center(
            child: Text('No hay registros recientes de signos vitales', style: TextStyle(color: Colors.grey)),
          ),
        ),
      );
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildVitalItem(Icons.favorite, 'P.A.', '${signos['presionSistolica']}/${signos['presionDiastolica']}', 'mmHg', Colors.red),
                _buildVitalItem(Icons.monitor_heart, 'F.C.', '${signos['frecuenciaCardiaca']}', 'bpm', Colors.orange),
                _buildVitalItem(Icons.thermostat, 'Temp', '${signos['temperatura']}', '°C', Colors.blue),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildVitalItem(Icons.line_weight, 'Peso', '${signos['peso']}', 'kg', Colors.green),
                _buildVitalItem(Icons.height, 'Talla', '${signos['talla']}', 'cm', Colors.purple),
                _buildVitalItem(Icons.air, 'SatO2', '${signos['saturacionO2']}', '%', Colors.cyan),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Última revisión: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(signos['fecha']))}',
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalItem(IconData icon, String label, String value, String unit, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
        Text(value != 'null' ? value : '--', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        Text(unit, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }

  Widget _buildPregnancySummaryCard(Map<String, dynamic> embarazo) {
    final fpp = DateTime.tryParse(embarazo['fpp'] ?? '');
    final String fppStr = fpp != null ? DateFormat('dd/MM/yyyy').format(fpp) : 'No definida';
    final String riesgo = embarazo['riesgo'] ?? 'BAJO';
    
    final List<dynamic> controles = embarazo['controles'] ?? [];
    final int numControles = controles.length;
    final String ultimasSemanas = numControles > 0 
        ? '${(double.tryParse(controles.first['semanasGestacion']?.toString() ?? '') ?? 0.0).toStringAsFixed(1)}' 
        : '--';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(colors: [Colors.pink.shade400, Colors.pink.shade300]),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Semanas actuales', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('En seguimiento', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
                  child: Text('Riesgo: $riesgo', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
            const Divider(color: Colors.white24, height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildPregnancyStat('Semanas', ultimasSemanas),
                _buildPregnancyStat('Controles', '$numControles'),
                _buildPregnancyStat('F.P.P.', fppStr),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => ControlesPrenatalesPage(embarazo: _embarazoActivo!)),
                    ),
                    icon: const Icon(Icons.list_alt, size: 18),
                    label: const Text('Ver Controles'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFE91E63),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _downloadingPdf ? null : _downloadPdf,
                    icon: _downloadingPdf 
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.picture_as_pdf, size: 18),
                    label: Text(_downloadingPdf ? 'Descargando...' : 'Bajar Carnet'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPregnancyStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
