import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MEDICAMENTOS = [
  // ANALGÉSICOS / ANTIINFLAMATORIOS
  { codigo: 'MED-001', nombreGenerico: 'Paracetamol', nombreComercial: 'Panadol', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Analgésico/Antipirético', requiereReceta: false },
  { codigo: 'MED-002', nombreGenerico: 'Ibuprofeno', nombreComercial: 'Advil', presentacion: 'Tableta 400mg', concentracion: '400mg', via: 'ORAL', grupoTerapeutico: 'AINE', requiereReceta: false },
  { codigo: 'MED-003', nombreGenerico: 'Diclofenaco', nombreComercial: 'Voltaren', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'AINE', requiereReceta: true },
  { codigo: 'MED-004', nombreGenerico: 'Naproxeno', nombreComercial: 'Naprosyn', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'AINE', requiereReceta: true },
  { codigo: 'MED-005', nombreGenerico: 'Ketorolaco', nombreComercial: 'Toradol', presentacion: 'Ampolla 30mg/mL', concentracion: '30mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'AINE', requiereReceta: true },
  { codigo: 'MED-006', nombreGenerico: 'Metamizol', nombreComercial: 'Dipirona', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Analgésico', requiereReceta: true },
  { codigo: 'MED-007', nombreGenerico: 'Tramadol', nombreComercial: 'Tramal', presentacion: 'Cápsula 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'Opioide débil', requiereReceta: true, esControlado: true },
  { codigo: 'MED-008', nombreGenerico: 'Morfina', nombreComercial: 'Morfina Sulfato', presentacion: 'Ampolla 10mg/mL', concentracion: '10mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Opioide', requiereReceta: true, esControlado: true },

  // ANTIBIÓTICOS
  { codigo: 'MED-009', nombreGenerico: 'Amoxicilina', nombreComercial: 'Amoxil', presentacion: 'Cápsula 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Penicilina', requiereReceta: true },
  { codigo: 'MED-010', nombreGenerico: 'Amoxicilina + Ácido clavulánico', nombreComercial: 'Augmentin', presentacion: 'Tableta 875/125mg', concentracion: '875/125mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Penicilina', requiereReceta: true },
  { codigo: 'MED-011', nombreGenerico: 'Azitromicina', nombreComercial: 'Zithromax', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Macrólido', requiereReceta: true },
  { codigo: 'MED-012', nombreGenerico: 'Ciprofloxacino', nombreComercial: 'Cipro', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Fluoroquinolona', requiereReceta: true },
  { codigo: 'MED-013', nombreGenerico: 'Metronidazol', nombreComercial: 'Flagyl', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Nitroimidazol', requiereReceta: true },
  { codigo: 'MED-014', nombreGenerico: 'Ceftriaxona', nombreComercial: 'Rocefin', presentacion: 'Frasco-ampolla 1g', concentracion: '1g', via: 'INYECTABLE', grupoTerapeutico: 'Antibiótico - Cefalosporina 3G', requiereReceta: true },
  { codigo: 'MED-015', nombreGenerico: 'Clindamicina', nombreComercial: 'Dalacin', presentacion: 'Cápsula 300mg', concentracion: '300mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Lincosamida', requiereReceta: true },
  { codigo: 'MED-016', nombreGenerico: 'Doxiciclina', nombreComercial: 'Vibramycin', presentacion: 'Cápsula 100mg', concentracion: '100mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Tetraciclina', requiereReceta: true },
  { codigo: 'MED-017', nombreGenerico: 'Trimetoprim/Sulfametoxazol', nombreComercial: 'Bactrim', presentacion: 'Tableta 160/800mg', concentracion: '160/800mg', via: 'ORAL', grupoTerapeutico: 'Antibiótico - Sulfonamida', requiereReceta: true },
  { codigo: 'MED-018', nombreGenerico: 'Vancomicina', nombreComercial: 'Vancocin', presentacion: 'Frasco-ampolla 500mg', concentracion: '500mg', via: 'INYECTABLE', grupoTerapeutico: 'Antibiótico - Glucopéptido', requiereReceta: true },

  // ANTIHIPERTENSIVOS / CARDIOVASCULARES
  { codigo: 'MED-019', nombreGenerico: 'Enalapril', nombreComercial: 'Vasotec', presentacion: 'Tableta 10mg', concentracion: '10mg', via: 'ORAL', grupoTerapeutico: 'IECA - Antihipertensivo', requiereReceta: true },
  { codigo: 'MED-020', nombreGenerico: 'Losartán', nombreComercial: 'Cozaar', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'ARA-II - Antihipertensivo', requiereReceta: true },
  { codigo: 'MED-021', nombreGenerico: 'Amlodipino', nombreComercial: 'Norvasc', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Bloqueador de calcio', requiereReceta: true },
  { codigo: 'MED-022', nombreGenerico: 'Metoprolol', nombreComercial: 'Lopressor', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'Betabloqueador', requiereReceta: true },
  { codigo: 'MED-023', nombreGenerico: 'Atenolol', nombreComercial: 'Tenormin', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'Betabloqueador', requiereReceta: true },
  { codigo: 'MED-024', nombreGenerico: 'Hidroclorotiazida', nombreComercial: 'HydroDIURIL', presentacion: 'Tableta 25mg', concentracion: '25mg', via: 'ORAL', grupoTerapeutico: 'Diurético tiazídico', requiereReceta: true },
  { codigo: 'MED-025', nombreGenerico: 'Furosemida', nombreComercial: 'Lasix', presentacion: 'Tableta 40mg', concentracion: '40mg', via: 'ORAL', grupoTerapeutico: 'Diurético de asa', requiereReceta: true },
  { codigo: 'MED-026', nombreGenerico: 'Digoxina', nombreComercial: 'Lanoxin', presentacion: 'Tableta 0.25mg', concentracion: '0.25mg', via: 'ORAL', grupoTerapeutico: 'Glucósido cardíaco', requiereReceta: true },
  { codigo: 'MED-027', nombreGenerico: 'Atorvastatina', nombreComercial: 'Lipitor', presentacion: 'Tableta 20mg', concentracion: '20mg', via: 'ORAL', grupoTerapeutico: 'Estatina - Hipolipemiante', requiereReceta: true },
  { codigo: 'MED-028', nombreGenerico: 'Aspirina', nombreComercial: 'Aspirina', presentacion: 'Tableta 100mg', concentracion: '100mg', via: 'ORAL', grupoTerapeutico: 'Antiagregante plaquetario', requiereReceta: false },

  // ANTIDIABÉTICOS
  { codigo: 'MED-029', nombreGenerico: 'Metformina', nombreComercial: 'Glucophage', presentacion: 'Tableta 850mg', concentracion: '850mg', via: 'ORAL', grupoTerapeutico: 'Antidiabético - Biguanida', requiereReceta: true },
  { codigo: 'MED-030', nombreGenerico: 'Glibenclamida', nombreComercial: 'Daonil', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Antidiabético - Sulfonilurea', requiereReceta: true },
  { codigo: 'MED-031', nombreGenerico: 'Insulina NPH', nombreComercial: 'Humulin N', presentacion: 'Frasco 100 UI/mL', concentracion: '100 UI/mL', via: 'INYECTABLE', grupoTerapeutico: 'Insulina - Acción intermedia', requiereReceta: true },
  { codigo: 'MED-032', nombreGenerico: 'Insulina Regular', nombreComercial: 'Humulin R', presentacion: 'Frasco 100 UI/mL', concentracion: '100 UI/mL', via: 'INYECTABLE', grupoTerapeutico: 'Insulina - Acción corta', requiereReceta: true },

  // GASTROINTESTINALES
  { codigo: 'MED-033', nombreGenerico: 'Omeprazol', nombreComercial: 'Prilosec', presentacion: 'Cápsula 20mg', concentracion: '20mg', via: 'ORAL', grupoTerapeutico: 'Inhibidor de bomba de protones', requiereReceta: true },
  { codigo: 'MED-034', nombreGenerico: 'Ranitidina', nombreComercial: 'Zantac', presentacion: 'Tableta 150mg', concentracion: '150mg', via: 'ORAL', grupoTerapeutico: 'Antihistamínico H2', requiereReceta: false },
  { codigo: 'MED-035', nombreGenerico: 'Metoclopramida', nombreComercial: 'Reglan', presentacion: 'Tableta 10mg', concentracion: '10mg', via: 'ORAL', grupoTerapeutico: 'Antiemético - Procinético', requiereReceta: true },
  { codigo: 'MED-036', nombreGenerico: 'Ondansetrón', nombreComercial: 'Zofran', presentacion: 'Tableta 8mg', concentracion: '8mg', via: 'ORAL', grupoTerapeutico: 'Antiemético - Antagonista 5-HT3', requiereReceta: true },
  { codigo: 'MED-037', nombreGenerico: 'Loperamida', nombreComercial: 'Imodium', presentacion: 'Cápsula 2mg', concentracion: '2mg', via: 'ORAL', grupoTerapeutico: 'Antidiarreico', requiereReceta: false },
  { codigo: 'MED-038', nombreGenerico: 'Hidróxido de aluminio/magnesio', nombreComercial: 'Maalox', presentacion: 'Suspensión 200/200mg/5mL', concentracion: '200/200mg/5mL', via: 'ORAL', grupoTerapeutico: 'Antiácido', requiereReceta: false },
  { codigo: 'MED-039', nombreGenerico: 'Sales de rehidratación oral', nombreComercial: 'Pedialyte', presentacion: 'Polvo sobre 27.9g', concentracion: '27.9g/L', via: 'ORAL', grupoTerapeutico: 'Hidratación oral', requiereReceta: false },

  // RESPIRATORIOS
  { codigo: 'MED-040', nombreGenerico: 'Salbutamol', nombreComercial: 'Ventolin', presentacion: 'Inhalador 100mcg/dosis', concentracion: '100mcg/dosis', via: 'INHALATORIA', grupoTerapeutico: 'Broncodilatador - Beta2 agonista', requiereReceta: true },
  { codigo: 'MED-041', nombreGenerico: 'Budesonida', nombreComercial: 'Pulmicort', presentacion: 'Inhalador 200mcg/dosis', concentracion: '200mcg/dosis', via: 'INHALATORIA', grupoTerapeutico: 'Corticoide inhalado', requiereReceta: true },
  { codigo: 'MED-042', nombreGenerico: 'Beclometasona', nombreComercial: 'Qvar', presentacion: 'Inhalador 250mcg/dosis', concentracion: '250mcg/dosis', via: 'INHALATORIA', grupoTerapeutico: 'Corticoide inhalado', requiereReceta: true },
  { codigo: 'MED-043', nombreGenerico: 'Ambroxol', nombreComercial: 'Mucosolvan', presentacion: 'Jarabe 15mg/5mL', concentracion: '15mg/5mL', via: 'ORAL', grupoTerapeutico: 'Mucolítico', requiereReceta: false },
  { codigo: 'MED-044', nombreGenerico: 'Difenhidramina', nombreComercial: 'Benadryl', presentacion: 'Cápsula 25mg', concentracion: '25mg', via: 'ORAL', grupoTerapeutico: 'Antihistamínico', requiereReceta: false },
  { codigo: 'MED-045', nombreGenerico: 'Loratadina', nombreComercial: 'Claritin', presentacion: 'Tableta 10mg', concentracion: '10mg', via: 'ORAL', grupoTerapeutico: 'Antihistamínico', requiereReceta: false },
  { codigo: 'MED-046', nombreGenerico: 'Cetirizina', nombreComercial: 'Zyrtec', presentacion: 'Tableta 10mg', concentracion: '10mg', via: 'ORAL', grupoTerapeutico: 'Antihistamínico', requiereReceta: false },

  // CORTICOIDES
  { codigo: 'MED-047', nombreGenerico: 'Prednisona', nombreComercial: 'Deltasone', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Corticoide sistémico', requiereReceta: true },
  { codigo: 'MED-048', nombreGenerico: 'Dexametasona', nombreComercial: 'Decadron', presentacion: 'Ampolla 4mg/mL', concentracion: '4mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Corticoide sistémico', requiereReceta: true },
  { codigo: 'MED-049', nombreGenerico: 'Hidrocortisona', nombreComercial: 'Solu-Cortef', presentacion: 'Frasco-ampolla 100mg', concentracion: '100mg', via: 'INYECTABLE', grupoTerapeutico: 'Corticoide sistémico', requiereReceta: true },
  { codigo: 'MED-050', nombreGenerico: 'Betametasona', nombreComercial: 'Celestone', presentacion: 'Crema 0.05%', concentracion: '0.05%', via: 'TOPICA', grupoTerapeutico: 'Corticoide tópico', requiereReceta: true },

  // NEUROLOGÍA / PSIQUIATRÍA
  { codigo: 'MED-051', nombreGenerico: 'Ácido valproico', nombreComercial: 'Depakote', presentacion: 'Tableta 500mg', concentracion: '500mg', via: 'ORAL', grupoTerapeutico: 'Antiepiléptico', requiereReceta: true },
  { codigo: 'MED-052', nombreGenerico: 'Carbamazepina', nombreComercial: 'Tegretol', presentacion: 'Tableta 200mg', concentracion: '200mg', via: 'ORAL', grupoTerapeutico: 'Antiepiléptico', requiereReceta: true },
  { codigo: 'MED-053', nombreGenerico: 'Fenitoína', nombreComercial: 'Dilantin', presentacion: 'Tableta 100mg', concentracion: '100mg', via: 'ORAL', grupoTerapeutico: 'Antiepiléptico', requiereReceta: true },
  { codigo: 'MED-054', nombreGenerico: 'Diazepam', nombreComercial: 'Valium', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Benzodiacepina', requiereReceta: true, esControlado: true },
  { codigo: 'MED-055', nombreGenerico: 'Alprazolam', nombreComercial: 'Xanax', presentacion: 'Tableta 0.5mg', concentracion: '0.5mg', via: 'ORAL', grupoTerapeutico: 'Benzodiacepina', requiereReceta: true, esControlado: true },
  { codigo: 'MED-056', nombreGenerico: 'Haloperidol', nombreComercial: 'Haldol', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Antipsicótico típico', requiereReceta: true },
  { codigo: 'MED-057', nombreGenerico: 'Fluoxetina', nombreComercial: 'Prozac', presentacion: 'Cápsula 20mg', concentracion: '20mg', via: 'ORAL', grupoTerapeutico: 'Antidepresivo - ISRS', requiereReceta: true },
  { codigo: 'MED-058', nombreGenerico: 'Sertralina', nombreComercial: 'Zoloft', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'Antidepresivo - ISRS', requiereReceta: true },
  { codigo: 'MED-059', nombreGenerico: 'Amitriptilina', nombreComercial: 'Elavil', presentacion: 'Tableta 25mg', concentracion: '25mg', via: 'ORAL', grupoTerapeutico: 'Antidepresivo tricíclico', requiereReceta: true },

  // ANTIPARASITARIOS / ANTIPALÚDICOS
  { codigo: 'MED-060', nombreGenerico: 'Albendazol', nombreComercial: 'Zentel', presentacion: 'Tableta 400mg', concentracion: '400mg', via: 'ORAL', grupoTerapeutico: 'Antiparasitario', requiereReceta: false },
  { codigo: 'MED-061', nombreGenerico: 'Mebendazol', nombreComercial: 'Vermox', presentacion: 'Tableta 100mg', concentracion: '100mg', via: 'ORAL', grupoTerapeutico: 'Antiparasitario', requiereReceta: false },
  { codigo: 'MED-062', nombreGenerico: 'Ivermectina', nombreComercial: 'Stromectol', presentacion: 'Tableta 6mg', concentracion: '6mg', via: 'ORAL', grupoTerapeutico: 'Antiparasitario', requiereReceta: true },
  { codigo: 'MED-063', nombreGenerico: 'Cloroquina', nombreComercial: 'Aralen', presentacion: 'Tableta 150mg base', concentracion: '150mg', via: 'ORAL', grupoTerapeutico: 'Antipalúdico', requiereReceta: true },

  // VITAMINAS / SUPLEMENTOS
  { codigo: 'MED-064', nombreGenerico: 'Ácido fólico', nombreComercial: 'Folvite', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Vitamina B9', requiereReceta: false },
  { codigo: 'MED-065', nombreGenerico: 'Sulfato ferroso', nombreComercial: 'Fer-In-Sol', presentacion: 'Tableta 300mg', concentracion: '300mg', via: 'ORAL', grupoTerapeutico: 'Suplemento de hierro', requiereReceta: false },
  { codigo: 'MED-066', nombreGenerico: 'Vitamina B12 (Cianocobalamina)', nombreComercial: 'Rubramin', presentacion: 'Ampolla 1000mcg/mL', concentracion: '1000mcg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Vitamina B12', requiereReceta: false },
  { codigo: 'MED-067', nombreGenerico: 'Vitamina D3 (Colecalciferol)', nombreComercial: 'Vigantoletten', presentacion: 'Tableta 1000 UI', concentracion: '1000 UI', via: 'ORAL', grupoTerapeutico: 'Vitamina D', requiereReceta: false },
  { codigo: 'MED-068', nombreGenerico: 'Calcio carbonato + Vitamina D3', nombreComercial: 'Caltrate', presentacion: 'Tableta 600mg/400UI', concentracion: '600mg/400UI', via: 'ORAL', grupoTerapeutico: 'Suplemento cálcico', requiereReceta: false },
  { codigo: 'MED-069', nombreGenerico: 'Zinc sulfato', nombreComercial: 'Zinc-C', presentacion: 'Tableta 20mg', concentracion: '20mg', via: 'ORAL', grupoTerapeutico: 'Oligoelemento', requiereReceta: false },

  // DERMATOLOGÍA
  { codigo: 'MED-070', nombreGenerico: 'Clotrimazol', nombreComercial: 'Canesten', presentacion: 'Crema 1%', concentracion: '1%', via: 'TOPICA', grupoTerapeutico: 'Antifúngico tópico', requiereReceta: false },
  { codigo: 'MED-071', nombreGenerico: 'Fluconazol', nombreComercial: 'Diflucan', presentacion: 'Cápsula 150mg', concentracion: '150mg', via: 'ORAL', grupoTerapeutico: 'Antifúngico sistémico', requiereReceta: true },
  { codigo: 'MED-072', nombreGenerico: 'Aciclovir', nombreComercial: 'Zovirax', presentacion: 'Tableta 400mg', concentracion: '400mg', via: 'ORAL', grupoTerapeutico: 'Antiviral', requiereReceta: true },
  { codigo: 'MED-073', nombreGenerico: 'Mupirocina', nombreComercial: 'Bactroban', presentacion: 'Ungüento 2%', concentracion: '2%', via: 'TOPICA', grupoTerapeutico: 'Antibiótico tópico', requiereReceta: true },
  { codigo: 'MED-074', nombreGenerico: 'Peróxido de benzoilo', nombreComercial: 'Benzac', presentacion: 'Gel 5%', concentracion: '5%', via: 'TOPICA', grupoTerapeutico: 'Acné - Queratolítico', requiereReceta: false },

  // OFTALMOLOGÍA / OTORRINOLARINGOLOGÍA
  { codigo: 'MED-075', nombreGenerico: 'Ciprofloxacino oftálmico', nombreComercial: 'Ciloxan', presentacion: 'Gotas oftálmicas 0.3%', concentracion: '0.3%', via: 'OFTALMICA', grupoTerapeutico: 'Antibiótico oftálmico', requiereReceta: true },
  { codigo: 'MED-076', nombreGenerico: 'Tobramicina + Dexametasona', nombreComercial: 'TobraDex', presentacion: 'Gotas oftálmicas 0.3%/0.1%', concentracion: '0.3%/0.1%', via: 'OFTALMICA', grupoTerapeutico: 'Antibiótico + Corticoide oftálmico', requiereReceta: true },
  { codigo: 'MED-077', nombreGenerico: 'Timolol maleato', nombreComercial: 'Timoptic', presentacion: 'Gotas oftálmicas 0.5%', concentracion: '0.5%', via: 'OFTALMICA', grupoTerapeutico: 'Antiglaucomatoso', requiereReceta: true },
  { codigo: 'MED-078', nombreGenerico: 'Ciprofloxacino ótico', nombreComercial: 'Ciprodex', presentacion: 'Gotas óticas 0.3%', concentracion: '0.3%', via: 'OTICA', grupoTerapeutico: 'Antibiótico ótico', requiereReceta: true },

  // GINECOLOGÍA / OBSTETRICIA
  { codigo: 'MED-079', nombreGenerico: 'Levonorgestrel + Etinilestradiol', nombreComercial: 'Microgynon', presentacion: 'Tableta 0.15/0.03mg', concentracion: '0.15/0.03mg', via: 'ORAL', grupoTerapeutico: 'Anticonceptivo oral combinado', requiereReceta: true },
  { codigo: 'MED-080', nombreGenerico: 'Oxitocina', nombreComercial: 'Pitocin', presentacion: 'Ampolla 10 UI/mL', concentracion: '10 UI/mL', via: 'INYECTABLE', grupoTerapeutico: 'Uterotónico', requiereReceta: true },
  { codigo: 'MED-081', nombreGenerico: 'Sulfato de magnesio', nombreComercial: 'Sulmagnesio', presentacion: 'Ampolla 500mg/mL', concentracion: '500mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Anticonvulsivante obstétrico', requiereReceta: true },
  { codigo: 'MED-082', nombreGenerico: 'Clotrimazol vaginal', nombreComercial: 'Canesten Vaginal', presentacion: 'Óvulo 100mg', concentracion: '100mg', via: 'RECTAL', grupoTerapeutico: 'Antifúngico vaginal', requiereReceta: false },

  // UROLOGÍA
  { codigo: 'MED-083', nombreGenerico: 'Tamsulosina', nombreComercial: 'Flomax', presentacion: 'Cápsula 0.4mg', concentracion: '0.4mg', via: 'ORAL', grupoTerapeutico: 'Alfabloqueador - HBP', requiereReceta: true },
  { codigo: 'MED-084', nombreGenerico: 'Finasterida', nombreComercial: 'Proscar', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Inhibidor 5-alfa reductasa', requiereReceta: true },

  // ANTICOAGULANTES / HEMATOLOGÍA
  { codigo: 'MED-085', nombreGenerico: 'Warfarina', nombreComercial: 'Coumadin', presentacion: 'Tableta 5mg', concentracion: '5mg', via: 'ORAL', grupoTerapeutico: 'Anticoagulante oral', requiereReceta: true },
  { codigo: 'MED-086', nombreGenerico: 'Heparina sódica', nombreComercial: 'Heparin Sodio', presentacion: 'Frasco 5000 UI/mL', concentracion: '5000 UI/mL', via: 'INYECTABLE', grupoTerapeutico: 'Anticoagulante parenteral', requiereReceta: true },
  { codigo: 'MED-087', nombreGenerico: 'Enoxaparina', nombreComercial: 'Clexane', presentacion: 'Jeringa 40mg/0.4mL', concentracion: '100mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Heparina de bajo peso molecular', requiereReceta: true },

  // ENDOCRINOLOGÍA / TIROIDES
  { codigo: 'MED-088', nombreGenerico: 'Levotiroxina', nombreComercial: 'Synthroid', presentacion: 'Tableta 100mcg', concentracion: '100mcg', via: 'ORAL', grupoTerapeutico: 'Hormona tiroidea', requiereReceta: true },
  { codigo: 'MED-089', nombreGenerico: 'Metimazol', nombreComercial: 'Tapazole', presentacion: 'Tableta 10mg', concentracion: '10mg', via: 'ORAL', grupoTerapeutico: 'Antitiroidea', requiereReceta: true },

  // REUMATOLOGÍA
  { codigo: 'MED-090', nombreGenerico: 'Metotrexato', nombreComercial: 'Rheumatrex', presentacion: 'Tableta 2.5mg', concentracion: '2.5mg', via: 'ORAL', grupoTerapeutico: 'DMARD - Antirreumático', requiereReceta: true },
  { codigo: 'MED-091', nombreGenerico: 'Colchicina', nombreComercial: 'Colcrys', presentacion: 'Tableta 0.6mg', concentracion: '0.6mg', via: 'ORAL', grupoTerapeutico: 'Antigotoso', requiereReceta: true },
  { codigo: 'MED-092', nombreGenerico: 'Alopurinol', nombreComercial: 'Zyloprim', presentacion: 'Tableta 300mg', concentracion: '300mg', via: 'ORAL', grupoTerapeutico: 'Uricosúrico', requiereReceta: true },
  { codigo: 'MED-093', nombreGenerico: 'Hidroxicloroquina', nombreComercial: 'Plaquenil', presentacion: 'Tableta 200mg', concentracion: '200mg', via: 'ORAL', grupoTerapeutico: 'DMARD - Antipalúdico', requiereReceta: true },

  // ONCOLOGÍA / INMUNOSUPRESORES
  { codigo: 'MED-094', nombreGenerico: 'Ciclofosfamida', nombreComercial: 'Cytoxan', presentacion: 'Tableta 50mg', concentracion: '50mg', via: 'ORAL', grupoTerapeutico: 'Agente alquilante', requiereReceta: true, esControlado: true },

  // ANESTESIA / PROCEDIMIENTOS
  { codigo: 'MED-095', nombreGenerico: 'Lidocaína', nombreComercial: 'Xylocaine', presentacion: 'Ampolla 2% 20mL', concentracion: '2%', via: 'INYECTABLE', grupoTerapeutico: 'Anestésico local', requiereReceta: true },
  { codigo: 'MED-096', nombreGenerico: 'Ketamina', nombreComercial: 'Ketalar', presentacion: 'Frasco 50mg/mL', concentracion: '50mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Anestésico disociativo', requiereReceta: true, esControlado: true },
  { codigo: 'MED-097', nombreGenerico: 'Midazolam', nombreComercial: 'Versed', presentacion: 'Ampolla 5mg/mL', concentracion: '5mg/mL', via: 'INYECTABLE', grupoTerapeutico: 'Benzodiacepina - Sedante', requiereReceta: true, esControlado: true },

  // SOLUCIONES PARENTERALES
  { codigo: 'MED-098', nombreGenerico: 'Solución salina 0.9%', nombreComercial: 'Cloruro de Sodio 0.9%', presentacion: 'Bolsa 500mL', concentracion: '9g/L', via: 'INYECTABLE', grupoTerapeutico: 'Solución parenteral', requiereReceta: true },
  { codigo: 'MED-099', nombreGenerico: 'Solución glucosada 5%', nombreComercial: 'Dextrosa 5%', presentacion: 'Bolsa 500mL', concentracion: '50g/L', via: 'INYECTABLE', grupoTerapeutico: 'Solución parenteral', requiereReceta: true },
  { codigo: 'MED-100', nombreGenerico: 'Solución Ringer Lactato', nombreComercial: 'Lactato de Ringer', presentacion: 'Bolsa 1000mL', concentracion: 'Compuesta', via: 'INYECTABLE', grupoTerapeutico: 'Solución parenteral - Electrolitos', requiereReceta: true },
];

async function main() {
  console.log('Sembrando catálogo de medicamentos...');
  let creados = 0;
  let omitidos = 0;

  for (const med of MEDICAMENTOS) {
    await prisma.medicamento.upsert({
      where: { codigo: med.codigo },
      update: {},
      create: {
        codigo:           med.codigo,
        nombreGenerico:   med.nombreGenerico,
        nombreComercial:  med.nombreComercial ?? null,
        presentacion:     med.presentacion,
        concentracion:    med.concentracion,
        via:              med.via as any,
        grupoTerapeutico: med.grupoTerapeutico,
        requiereReceta:   med.requiereReceta ?? true,
        esControlado:     med.esControlado   ?? false,
        activo:           true,
      },
    }).then(r => {
      if (r) creados++;
    }).catch(() => omitidos++);
  }

  console.log(`  ✔ ${creados} medicamentos procesados, ${omitidos} omitidos`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
