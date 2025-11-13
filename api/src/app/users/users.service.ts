import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role, Organization } from '../entities';
import { CreateUserDto, UpdateUserDto, IRequestUser, IUser } from '@workspace/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  async create(createUserDto: CreateUserDto, currentUser: IRequestUser): Promise<IUser> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate organization
    const organization = await this.organizationRepository.findOne({
      where: { id: createUserDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if current user has access to this organization
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(createUserDto.organizationId)) {
      throw new ForbiddenException('You cannot create users in this organization');
    }

    // Validate role
    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check role hierarchy - users cannot create users with higher or equal role level
    if (role.level >= currentUser.roleLevel) {
      throw new ForbiddenException('You cannot create users with equal or higher role level');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Audit log
    await this.auditService.log(
      currentUser.userId,
      'CREATE' as any,
      'USER' as any,
      savedUser.id,
      `Created user: ${savedUser.email}`
    );

    // Load relations and remove password
    const userWithRelations = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'organization'],
    });

    const { password, ...userWithoutPassword } = userWithRelations;
    return userWithoutPassword as IUser;
  }

  async findAll(currentUser: IRequestUser): Promise<IUser[]> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds })
      .getMany();

    // Remove passwords
    return users.map(({ password, ...user }) => user as IUser);
  }

  async findOne(id: string, currentUser: IRequestUser): Promise<IUser> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('You do not have access to this user');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: IRequestUser): Promise<IUser> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('You do not have access to this user');
    }

    // If updating role, check hierarchy
    if (updateUserDto.roleId) {
      const newRole = await this.roleRepository.findOne({
        where: { id: updateUserDto.roleId },
      });

      if (!newRole) {
        throw new NotFoundException('Role not found');
      }

      if (newRole.level >= currentUser.roleLevel) {
        throw new ForbiddenException('You cannot assign equal or higher role level');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Audit log
    await this.auditService.log(
      currentUser.userId,
      'UPDATE' as any,
      'USER' as any,
      user.id,
      `Updated user: ${user.email}`
    );

    const userWithRelations = await this.userRepository.findOne({
      where: { id: updatedUser.id },
      relations: ['role', 'organization'],
    });

    const { password, ...userWithoutPassword } = userWithRelations;
    return userWithoutPassword as IUser;
  }

  async remove(id: string, currentUser: IRequestUser): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
    if (!accessibleOrgIds.includes(user.organizationId)) {
      throw new ForbiddenException('You do not have access to this user');
    }

    // Cannot delete users with equal or higher role level
    if (user.role.level >= currentUser.roleLevel) {
      throw new ForbiddenException('You cannot delete users with equal or higher role level');
    }

    // Cannot delete self
    if (user.id === currentUser.userId) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    await this.userRepository.remove(user);

    // Audit log
    await this.auditService.log(
      currentUser.userId,
      'DELETE' as any,
      'USER' as any,
      id,
      `Deleted user: ${user.email}`
    );
  }

  private async getAccessibleOrganizationIds(user: IRequestUser): Promise<string[]> {
    // Owners can see all organizations
    if (user.roleLevel === 3) {
      const allOrgs = await this.organizationRepository.find();
      return allOrgs.map(org => org.id);
    }

    // Admins and Viewers see their own org and child orgs
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['children'],
    });

    if (!userOrg) {
      return [user.organizationId];
    }

    const orgIds = [userOrg.id];

    // Add child organizations recursively
    const addChildOrgs = async (org: Organization) => {
      if (org.children && org.children.length > 0) {
        for (const child of org.children) {
          orgIds.push(child.id);
          const childWithChildren = await this.organizationRepository.findOne({
            where: { id: child.id },
            relations: ['children'],
          });
          if (childWithChildren) {
            await addChildOrgs(childWithChildren);
          }
        }
      }
    };

    await addChildOrgs(userOrg);

    return orgIds;
  }
}