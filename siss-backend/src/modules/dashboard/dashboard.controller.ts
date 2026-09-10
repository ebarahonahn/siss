import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user);
  }

  @Get('agenda')
  async getAgenda(@CurrentUser() user: any) {
    if (user.rol !== 'MEDICO') return [];
    return this.dashboardService.getAgendaHoy(user);
  }
}
