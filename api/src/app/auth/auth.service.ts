import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../entities';
import { LoginDto, RegisterDto, IAuthResponse, IJwtPayload } from '@workspace/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private auditService: AuditService
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<IAuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      roleLevel: user.role.level,
      organizationId: user.organizationId,
    };

    const access_token = this.jwtService.sign(payload);

    // Log login
    await this.auditService.logLogin(user.id, ipAddress, userAgent);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword as any,
    };
  }

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate role exists
    const role = await this.roleRepository.findOne({
      where: { id: registerDto.roleId },
    });

    if (!role) {
      throw new ConflictException('Invalid role');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Load relations for JWT
    const userWithRelations = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'organization'],
    });

    // Create JWT payload
    const payload: IJwtPayload = {
      sub: userWithRelations.id,
      email: userWithRelations.email,
      roleId: userWithRelations.roleId,
      roleName: userWithRelations.role.name,
      roleLevel: userWithRelations.role.level,
      organizationId: userWithRelations.organizationId,
    };

    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userWithoutPassword } = userWithRelations;

    return {
      access_token,
      user: userWithoutPassword as any,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'organization'],
    });
  }
}