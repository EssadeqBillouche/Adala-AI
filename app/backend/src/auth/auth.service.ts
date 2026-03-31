import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, ValidatedUser } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<ValidatedUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: ValidatedUser): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      orgId: user.organization.id,
    };
    await this.usersService.updateLastLogin(user.id);
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Create organization
    const orgName = registerDto.organizationName || `${registerDto.firstName} ${registerDto.lastName}'s Org`;

    const org = await this.organizationsService.create(orgName);

    // Hash password
    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltOrRounds);

    // Create User
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      organizationId: org.id,
      organization: org,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }
}
