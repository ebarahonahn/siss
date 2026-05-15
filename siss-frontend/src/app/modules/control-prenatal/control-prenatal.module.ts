import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ListaEmbarazadasComponent } from './pages/lista-embarazadas/lista-embarazadas.component';
import { FichaPerinatalComponent } from './pages/ficha-perinatal/ficha-perinatal.component';
import { PrenatalChartsComponent } from './components/prenatal-charts/prenatal-charts.component';
import { CarnetDigitalComponent } from './components/carnet-digital/carnet-digital.component';

const routes: Routes = [
  { path: '', component: ListaEmbarazadasComponent },
  { path: 'ficha/:id', component: FichaPerinatalComponent }
];

@NgModule({
  declarations: [
    ListaEmbarazadasComponent,
    FichaPerinatalComponent,
    PrenatalChartsComponent,
    CarnetDigitalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ControlPrenatalModule { }
