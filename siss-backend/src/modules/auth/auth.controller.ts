import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.renovarToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: any) {
    return this.authService.cerrarSesion(user.id);
  }

  @Post('recuperar-contrasena')
  @HttpCode(HttpStatus.OK)
  recuperarContrasena(@Body('identificador') identificador: string) {
    return this.authService.solicitarRecuperacion(identificador);
  }
 
  @Post('cambiar-contrasena')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cambiarContrasena(
    @CurrentUser() user: any,
    @Body('nuevaContrasena') nuevaContrasena: string,
  ) {
    return this.authService.cambiarContrasena(user.id, nuevaContrasena);
  }
}
