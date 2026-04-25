# SISS - Sistema Integral de Servicios de Salud

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tech](https://img.shields.io/badge/tech-Angular%20%7C%20NestJS%20%7C%20MySQL-green)

El **Sistema Integral de Servicios de Salud (SISS)** es una plataforma empresarial diseñada para la gestión clínica, administrativa y de salud pública. Este sistema permite la estandarización de procesos hospitalarios, garantizando la trazabilidad de la atención médica y el control eficiente de insumos.

## 🚀 Módulos Principales

*   **Historia Clínica Digital (EMR)**: Gestión completa del encuentro médico bajo metodología SOAP y codificación CIE-10.
*   **Agendas y Citas**: Planificación multi-establecimiento con control de slots y excepciones.
*   **Programa Ampliado de Inmunizaciones (PAI)**: Control nacional de vacunas, lotes y carnetización.
*   **Farmacia e Inventario**: Trazabilidad FEFO, control de lotes, prescripción y dispensación.
*   **Vigilancia Epidemiológica**: Alertas automatizadas por diagnósticos críticos y georeferenciación.
*   **Apoyo Diagnóstico**: Integración de Laboratorio Clínico y Radiología.

## 🛠️ Stack Tecnológico

*   **Frontend**: Angular (Interfaz de alta densidad).
*   **Backend**: NestJS / Node.js (Arquitectura modular).
*   **Base de Datos**: MySQL con Prisma ORM.
*   **Reportes**: Motor PDF integrado.

## 📂 Estructura del Proyecto

```text
siss/
├── siss-backend/      # API Rest, servicios y lógica de negocio (NestJS)
│   ├── prisma/        # Schema de base de datos y migraciones
│   └── src/           # Código fuente del servidor
├── siss-frontend/     # Aplicación web cliente (Angular)
│   └── src/app/       # Módulos, componentes y servicios
└── docs/              # Documentación generada
```

## 📖 Documentación Relacionada

Para más detalles técnicos y funcionales, consulte los siguientes archivos en la raíz:

1.  **[SISS Overview (HTML)](./SISS_Overview.html)**: Documentación completa compartible con diagramas.
2.  **[SISS Presentación](./SISS_Presentacion.html)**: Diapositivas interactivas para demostraciones.
3.  **[SISS Documentación (MD)](./SISS_Documentacion_Sistema.md)**: Detalle técnico en formato Markdown.

## ⚙️ Configuración Rápida

### Backend
1. Navegar a `siss-backend/`.
2. Instalar dependencias: `npm install`.
3. Configurar `.env` con la URL de MySQL.
4. Generar cliente Prisma: `npx prisma generate`.
5. Iniciar servidor: `npm run start:dev`.

### Frontend
1. Navegar a `siss-frontend/`.
2. Instalar dependencias: `npm install`.
3. Iniciar aplicación: `npm start`.

---
© 2026 SISS. Todos los derechos reservados.
