import 'package:flutter/material.dart';
import 'package:siss_mobile/src/core/api/api_service.dart';

class StockPage extends StatefulWidget {
  const StockPage({super.key});

  @override
  State<StockPage> createState() => _StockPageState();
}

class _StockPageState extends State<StockPage> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _resultados = [];
  bool _isLoading = false;

  Future<void> _buscar(String query) async {
    if (query.length < 2) return;
    
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isLoading = true);
    try {
      final response = await _api.get('/inventario/buscar-existencias', queryParameters: {'q': query});
      setState(() {
        _resultados = response.data['data'] ?? [];
      });
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Error al buscar: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Buscar Medicamentos', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1E88E5),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Nombre o código del medicamento...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _resultados = []);
                  },
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                filled: true,
                fillColor: Colors.grey[200],
              ),
              onSubmitted: _buscar,
              onChanged: (val) {
                if (val.length > 2) _buscar(val);
              },
            ),
          ),
          if (_isLoading)
            const LinearProgressIndicator(),
          Expanded(
            child: _resultados.isEmpty && !_isLoading
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _resultados.length,
                    itemBuilder: (context, index) {
                      return _buildMedicationResultCard(_resultados[index]);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.medication_liquid_sharp, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            _searchController.text.isEmpty 
              ? 'Busca un medicamento para ver disponibilidad' 
              : 'No se encontraron existencias para "${_searchController.text}"',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicationResultCard(dynamic item) {
    final List<dynamic> existencias = item['existencias'] ?? [];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.medication, color: Colors.blue),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['nombre'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('${item['presentacion']} - ${item['concentracion']}', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Código: ${item['codigo']}', style: TextStyle(color: Colors.grey[400], fontSize: 11)),
              ],
            ),
          ),
          const Divider(height: 1),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.grey[50],
            child: const Text('Disponibilidad por Centro:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
          ),
          ...existencias.map((e) => _buildEstablishmentStockItem(e)).toList(),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildEstablishmentStockItem(dynamic e) {
    final bool hasStock = e['cantidad'] > 0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(e['nombre'], style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                if (e['departamento'] != null)
                  Text(e['departamento'], style: TextStyle(color: Colors.grey[500], fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: hasStock ? Colors.green[50] : Colors.red[50],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              hasStock ? 'Disponible' : 'Sin existencia',
              style: TextStyle(
                color: hasStock ? Colors.green[700] : Colors.red[700],
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
