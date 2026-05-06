import 'package:flutter/material.dart';
import 'package:siss_mobile/src/modules/farmacia/farmacia_page.dart';
import 'package:siss_mobile/src/modules/home/nueva_cita_page.dart';
import 'package:siss_mobile/src/modules/historial/historial_page.dart';
import 'package:siss_mobile/src/modules/inventario/stock_page.dart';
import 'package:siss_mobile/src/core/auth/auth_service.dart';
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
  final List<Map<String, dynamic>> _medicamentos = [];
  bool _isLoading = true;

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

      // 2. Cargar Perfil y Medicamentos
      try {
        final perfilResponse = await _api.get('/pacientes/mi-perfil');
        final Map<String, dynamic> perfilBody = perfilResponse.data;
        if (perfilBody.containsKey('data')) {
          final Map<String, dynamic> perfil = perfilBody['data'];
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
      }
    } catch (e) {
      debugPrint('Error cargando citas: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
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
              ],
            ),
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
                Expanded(child: Text('Dr. $medico - $especialidad', style: const TextStyle(color: Colors.white), overflow: TextOverflow.ellipsis)),
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
}
