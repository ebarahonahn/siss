import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DashboardNinoComponent } from './pages/dashboard-nino/dashboard-nino.component';
import { ListaPediatricaComponent } from './pages/lista-pediatrica/lista-pediatrica.component';
import { CrecimientoChartsComponent } from './components/crecimiento-charts/crecimiento-charts.component';
import { HitosDesarrolloComponent } from './components/hitos-desarrollo/hitos-desarrollo.component';
import { CarnetVacunacionPediatricoComponent } from './components/carnet-vacunacion-pediatrico/carnet-vacunacion-pediatrico.component';
import { RegistroVacunaModalComponent } from '../vacunacion/components/registro-vacuna-modal.component';

const routes: Routes = [
  { path: '', component: ListaPediatricaComponent },
  { path: 'dashboard/:pacienteId', component: DashboardNinoComponent }
];


@NgModule({
  declarations: [
    DashboardNinoComponent,
    ListaPediatricaComponent,
    CrecimientoChartsComponent,
    HitosDesarrolloComponent,
    CarnetVacunacionPediatricoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    RegistroVacunaModalComponent
  ]
})
export class PediatriaModule { }
