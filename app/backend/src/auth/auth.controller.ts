import { Controller, Post, Body, UseGuards, Request, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import type { AuthenticatedUser, ValidatedUser } from './interfaces/jwt-payload.interface';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 3600 * 1000, // 1 hour
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully. Returns JWT token and user info' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(registerDto);
    const payload = { email: user.email, sub: user.id, role: user.role, orgId: user.organizationId };
    const access_token = this.authService['jwtService'].sign(payload);

    res.cookie('access_token', access_token, COOKIE_OPTIONS);

    const { id, email, firstName, lastName, role, organization, createdAt, updatedAt } = user;
    return res.json({
      user: { id, email, firstName, lastName, role, organization, createdAt, updatedAt },
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token and user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest & { user: ValidatedUser },
    @Res() res: Response,
  ) {
    const { access_token } = await this.authService.login(req.user);

    res.cookie('access_token', access_token, COOKIE_OPTIONS);

    const { id, email, firstName, lastName, role, organization, createdAt, updatedAt } = req.user;
    return res.json({
      user: { id, email, firstName, lastName, role, organization, createdAt, updatedAt },
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear auth cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res() res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return res.json({ message: 'Logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    const fullUser = await this.usersService.findById(user.userId);
    if (!fullUser) {
      return {
        id: user.userId,
        email: user.email,
        firstName: null,
        lastName: null,
        role: user.role,
        organizationId: user.orgId,
      };
    }
    const { id, email, firstName, lastName, role, organizationId, createdAt, updatedAt } = fullUser;
    return { id, email, firstName, lastName, role, organizationId, createdAt, updatedAt };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @Get('admin-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only endpoint' })
  @ApiResponse({ status: 200, description: 'Admin data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  getAdminData(@CurrentUser() user: AuthenticatedUser) {
    return { message: 'This is protected data for admins/owners', user };
  }
}
