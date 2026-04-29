'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">siss-frontend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AgendasComponent.html" data-type="entity-link" >AgendasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BuscadorPacienteComponent.html" data-type="entity-link" >BuscadorPacienteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CitasComponent.html" data-type="entity-link" >CitasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConstructorFormularioComponent.html" data-type="entity-link" >ConstructorFormularioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardComponent.html" data-type="entity-link" >DashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EpidemiologiaDashboardComponent.html" data-type="entity-link" >EpidemiologiaDashboardComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EstadisticasHospitalariasComponent.html" data-type="entity-link" >EstadisticasHospitalariasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FarmaciaComponent.html" data-type="entity-link" >FarmaciaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GestionHospitalizacionComponent.html" data-type="entity-link" >GestionHospitalizacionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GestionLotesModalComponent.html" data-type="entity-link" >GestionLotesModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GestionReportesComponent.html" data-type="entity-link" >GestionReportesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HistoriaClinicaComponent.html" data-type="entity-link" >HistoriaClinicaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InfraestructuraModalComponent.html" data-type="entity-link" >InfraestructuraModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InventarioVacunasComponent.html" data-type="entity-link" >InventarioVacunasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LaboratorioComponent.html" data-type="entity-link" >LaboratorioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ListaPlantillasComponent.html" data-type="entity-link" >ListaPlantillasComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginComponent.html" data-type="entity-link" >LoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MainLayoutComponent.html" data-type="entity-link" >MainLayoutComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoDiagnosticosComponent.html" data-type="entity-link" >MantenimientoDiagnosticosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoEstablecimientosComponent.html" data-type="entity-link" >MantenimientoEstablecimientosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoInventarioComponent.html" data-type="entity-link" >MantenimientoInventarioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoLaboratorioComponent.html" data-type="entity-link" >MantenimientoLaboratorioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoLoginComponent.html" data-type="entity-link" >MantenimientoLoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoMedicamentosComponent.html" data-type="entity-link" >MantenimientoMedicamentosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoRadiologiaComponent.html" data-type="entity-link" >MantenimientoRadiologiaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MantenimientoRolesComponent.html" data-type="entity-link" >MantenimientoRolesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MovimientosInventarioComponent.html" data-type="entity-link" >MovimientosInventarioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationComponent.html" data-type="entity-link" >NotificationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NuevaConsultaComponent.html" data-type="entity-link" >NuevaConsultaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PacientesComponent.html" data-type="entity-link" >PacientesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PermisosUsuariosComponent.html" data-type="entity-link" >PermisosUsuariosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RecetasPacienteComponent.html" data-type="entity-link" >RecetasPacienteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RegistroVacunaModalComponent.html" data-type="entity-link" >RegistroVacunaModalComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportesComponent.html" data-type="entity-link" >ReportesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TriajeComponent.html" data-type="entity-link" >TriajeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UsuariosComponent.html" data-type="entity-link" >UsuariosComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/VacunacionComponent.html" data-type="entity-link" >VacunacionComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/DateUtils.html" data-type="entity-link" >DateUtils</a>
                            </li>
                            <li class="link">
                                <a href="classes/DateValidators.html" data-type="entity-link" >DateValidators</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AgendasService.html" data-type="entity-link" >AgendasService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CatalogosService.html" data-type="entity-link" >CatalogosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CitasService.html" data-type="entity-link" >CitasService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardService.html" data-type="entity-link" >DashboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DiagnosticosService.html" data-type="entity-link" >DiagnosticosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DispensacionService.html" data-type="entity-link" >DispensacionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EpidemiologiaService.html" data-type="entity-link" >EpidemiologiaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EstablecimientosService.html" data-type="entity-link" >EstablecimientosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FormulariosService.html" data-type="entity-link" >FormulariosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GeoService.html" data-type="entity-link" >GeoService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HistoriaClinicaService.html" data-type="entity-link" >HistoriaClinicaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HospitalizacionService.html" data-type="entity-link" >HospitalizacionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InactivityService.html" data-type="entity-link" >InactivityService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InventarioService.html" data-type="entity-link" >InventarioService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LaboratorioService.html" data-type="entity-link" >LaboratorioService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LoginImagesService.html" data-type="entity-link" >LoginImagesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MedicamentosService.html" data-type="entity-link" >MedicamentosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PacientesService.html" data-type="entity-link" >PacientesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ParametrosService.html" data-type="entity-link" >ParametrosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RadiologiaService.html" data-type="entity-link" >RadiologiaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReferenciasService.html" data-type="entity-link" >ReferenciasService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportePdfService.html" data-type="entity-link" >ReportePdfService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportesService.html" data-type="entity-link" >ReportesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RolesService.html" data-type="entity-link" >RolesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServiciosService.html" data-type="entity-link" >ServiciosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SocketService.html" data-type="entity-link" >SocketService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TriajeService.html" data-type="entity-link" >TriajeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UsuariosService.html" data-type="entity-link" >UsuariosService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/VacunacionService.html" data-type="entity-link" >VacunacionService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActualizarDto.html" data-type="entity-link" >ActualizarDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActualizarUsuarioPayload.html" data-type="entity-link" >ActualizarUsuarioPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgendaBase.html" data-type="entity-link" >AgendaBase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-1.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AsignacionUsuario.html" data-type="entity-link" >AsignacionUsuario</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AsignarDto.html" data-type="entity-link" >AsignarDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Cama.html" data-type="entity-link" >Cama</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CatalogosData.html" data-type="entity-link" >CatalogosData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CatDiagnostico.html" data-type="entity-link" >CatDiagnostico</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CitaPendienteTriaje.html" data-type="entity-link" >CitaPendienteTriaje</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfigGeneral.html" data-type="entity-link" >ConfigGeneral</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CrearTriajePayload.html" data-type="entity-link" >CrearTriajePayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CrearUsuarioPayload.html" data-type="entity-link" >CrearUsuarioPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateDispensacion.html" data-type="entity-link" >CreateDispensacion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardKPIs.html" data-type="entity-link" >DashboardKPIs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DispensacionDetalle.html" data-type="entity-link" >DispensacionDetalle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Establecimiento.html" data-type="entity-link" >Establecimiento</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExamenLaboratorio.html" data-type="entity-link" >ExamenLaboratorio</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExamenRadiologico.html" data-type="entity-link" >ExamenRadiologico</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExcepcionAgenda.html" data-type="entity-link" >ExcepcionAgenda</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Habitacion.html" data-type="entity-link" >Habitacion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoriaClinica.html" data-type="entity-link" >HistoriaClinica</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InventarioItem.html" data-type="entity-link" >InventarioItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ListaUsuarios.html" data-type="entity-link" >ListaUsuarios</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginImage.html" data-type="entity-link" >LoginImage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginResponse.html" data-type="entity-link" >LoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Medicamento.html" data-type="entity-link" >Medicamento</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ModuloPermiso.html" data-type="entity-link" >ModuloPermiso</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MovimientoConProducto.html" data-type="entity-link" >MovimientoConProducto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MovimientoInventario.html" data-type="entity-link" >MovimientoInventario</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NavItem.html" data-type="entity-link" >NavItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NavSection.html" data-type="entity-link" >NavSection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificacionEpidemiologica.html" data-type="entity-link" >NotificacionEpidemiologica</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Notification.html" data-type="entity-link" >Notification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecetaHistorial.html" data-type="entity-link" >RecetaHistorial</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Rol.html" data-type="entity-link" >Rol</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sala.html" data-type="entity-link" >Sala</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Servicio.html" data-type="entity-link" >Servicio</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UsuarioActual.html" data-type="entity-link" >UsuarioActual</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UsuarioResumen.html" data-type="entity-link" >UsuarioResumen</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/NombreRutaActivaPipe.html" data-type="entity-link" >NombreRutaActivaPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});