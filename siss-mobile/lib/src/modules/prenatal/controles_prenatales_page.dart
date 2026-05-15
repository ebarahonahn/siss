import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ControlesPrenatalesPage extends StatelessWidget {
  final Map<String, dynamic> embarazo;

  const ControlesPrenatalesPage({super.key, required this.embarazo});

  @override
  Widget build(BuildContext context) {
    final List<dynamic> controles = embarazo['controles'] ?? [];
    final fpp = DateTime.tryParse(embarazo['fpp'] ?? '');
    final String fppStr = fpp != null ? DateFormat('dd/MM/yyyy').format(fpp) : 'No definida';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Controles Prenatales', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.pink.shade400,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Resumen Header
          Container(
            padding: const EdgeInsets.all(20),
            color: Colors.pink.shade50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem('F.P.P.', fppStr, Icons.event),
                _buildSummaryItem('Riesgo', embarazo['riesgo'] ?? 'BAJO', Icons.warning_amber),
                _buildSummaryItem('Gravidez', '${embarazo['antecedentes']?['gravidez'] ?? '--'}', Icons.exposure_plus_1),
              ],
            ),
          ),
          
          Expanded(
            child: controles.isEmpty
              ? const Center(child: Text('No hay controles registrados aún.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: controles.length,
                  itemBuilder: (context, index) {
                    final control = controles[index];
                    return _buildControlCard(context, control, controles.length - index);
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.pink, size: 20),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.pink)),
      ],
    );
  }

  Widget _buildControlCard(BuildContext context, Map<String, dynamic> control, int numero) {
    final fecha = DateTime.tryParse(control['fechaControl'] ?? '');
    final String fechaStr = fecha != null ? DateFormat('dd/MM/yyyy').format(fecha) : '--';
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: Colors.pink.shade100,
          child: Text('$numero', style: const TextStyle(color: Colors.pink, fontWeight: FontWeight.bold)),
        ),
        title: Text('Control Prenatal #$numero', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Fecha: $fechaStr • Semanas: ${(double.tryParse(control['semanasGestacion']?.toString() ?? '') ?? 0.0).toStringAsFixed(1)}'),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: () {
          Navigator.push(
            context, 
            MaterialPageRoute(builder: (context) => DetalleControlPage(control: control, numero: numero))
          );
        },
      ),
    );
  }
}

class DetalleControlPage extends StatelessWidget {
  final Map<String, dynamic> control;
  final int numero;

  const DetalleControlPage({super.key, required this.control, required this.numero});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Detalle Control #$numero', style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.pink.shade400,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection('Signos Vitales y Medidas', [
              _buildDataRow('Peso Materno', '${control['peso']} kg'),
              _buildDataRow('Presión Arterial', '${control['taSistolica']}/${control['taDiastolica']} mmHg'),
              _buildDataRow('Semanas Gestación', '${(double.tryParse(control['semanasGestacion']?.toString() ?? '') ?? 0.0).toStringAsFixed(1)} sem'),
            ]),
            const SizedBox(height: 24),
            _buildSection('Hallazgos Clínicos', [
              _buildDataRow('Altura Uterina', '${control['alturaUterina'] ?? '--'} cm'),
              _buildDataRow('Frecuencia Cardiaca Fetal', '${control['fcf'] ?? '--'} LPM'),
              _buildDataRow('Movimientos Fetales', control['movimientosFetales'] == true ? 'Presentes' : 'No registrados'),
              _buildDataRow('Edema', control['edema'] == true ? 'Sí' : 'No'),
              _buildDataRow('Proteinuria', control['proteinuria'] == true ? 'Positiva' : 'Negativa'),
            ]),
            const SizedBox(height: 24),
            if (control['observaciones'] != null && control['observaciones'].toString().isNotEmpty) ...[
              const Text('Observaciones Médicas:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                child: Text(control['observaciones'], style: const TextStyle(fontStyle: FontStyle.italic)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.pink)),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(children: children),
          ),
        ),
      ],
    );
  }

  Widget _buildDataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
