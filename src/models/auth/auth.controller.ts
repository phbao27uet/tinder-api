import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialsDto } from './dto';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';
import { RtGuard } from './guards/rt.guard';
import { GetRt } from '@shared/decorators';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthGuard } from './guards/auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: CredentialsDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  async logout(@GetCurrentUserId() userId: number) {
    return this.authService.logout(userId);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@GetCurrentUserId() userId: number) {
    return this.authService.me(userId);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }
  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetCurrentUserId() userId: number,
  ) {
    console.log({ userId, changePasswordDto });

    return this.authService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(RtGuard)
  @Get('refresh')
  async refreshToken(
    @GetRt() refreshToken: string,
    @GetCurrentUserId() userId: number,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
