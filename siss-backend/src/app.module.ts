import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { EspecialidadesModule } from './modules/especialidades/especialidades.module';
import { FormulariosModule } from './modules/formularios/formularios.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { TriajeModule } from './modules/triaje/triaje.module';
import { RolesModule } from './modules/roles/roles.module';
import { EstablecimientosModule } from './modules/establecimientos/establecimientos.module';
import { GeoModule } from './modules/geo/geo.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { HistoriaClinicaModule } from './modules/historia-clinica/historia-clinica.module';
import { CitasModule } from './modules/citas/citas.module';
import { DiagnosticosModule } from './modules/diagnosticos/diagnosticos.module';
import { MedicamentosModule } from './modules/medicamentos/medicamentos.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { LaboratorioModule } from './modules/laboratorio/laboratorio.module';
import { RadiologiaModule } from './modules/radiologia/radiologia.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { DispensacionModule } from './modules/dispensacion/dispensacion.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { ReferenciasModule } from './modules/referencias/referencias.module';
import { ParametrosModule } from './modules/parametros/parametros.module';
import { AgendasModule } from './modules/agendas/agendas.module';
import { VacunacionModule } from './modules/vacunacion/vacunacion.module';
import { EpidemiologiaModule } from './modules/epidemiologia/epidemiologia.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HospitalizacionModule } from './modules/hospitalizacion/hospitalizacion.module';
import { LoginImagesModule } from './modules/login-images/login-images.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { SolicitudesUsuarioModule } from './modules/solicitudes-usuario/solicitudes-usuario.module';
import { ControlPrenatalModule } from './modules/control-prenatal/control-prenatal.module';
import { PediatriaModule } from './modules/pediatria/pediatria.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    PacientesModule,
    EspecialidadesModule,
    FormulariosModule,
    NotificacionesModule,
    UsuariosModule,
    TriajeModule,
    RolesModule,
    EstablecimientosModule,
    GeoModule,
    CatalogosModule,
    HistoriaClinicaModule,
    CitasModule,
    DiagnosticosModule,
    MedicamentosModule,
    InventarioModule,
    LaboratorioModule,
    RadiologiaModule,
    ServiciosModule,
    DispensacionModule,
    ReportesModule,
    ReferenciasModule,
    ParametrosModule,
    AgendasModule,
    VacunacionModule,
    EpidemiologiaModule,
    DashboardModule,
    HospitalizacionModule,
    LoginImagesModule,
    ConfiguracionModule,
    SolicitudesUsuarioModule,
    ControlPrenatalModule,
    PediatriaModule,
  ],

})
export class AppModule {}
