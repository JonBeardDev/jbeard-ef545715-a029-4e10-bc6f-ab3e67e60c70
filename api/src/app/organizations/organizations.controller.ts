import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '@workspace/auth';
import { IRequestUser } from '@workspace/data';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>
  ) {}

  @Get()
  async findAll(@CurrentUser() user: IRequestUser) {
    // Owners see all organizations
    if (user.roleLevel === 3) {
      return this.organizationRepository.find({
        relations: ['parent'],
        order: { name: 'ASC' }
      });
    }

    // Others see their org and children
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['children', 'parent']
    });

    if (!userOrg) {
      return [];
    }

    const orgs = [userOrg];
    
    // Add children recursively
    const addChildren = async (org: Organization) => {
      if (org.children && org.children.length > 0) {
        for (const child of org.children) {
          orgs.push(child);
          const childWithChildren = await this.organizationRepository.findOne({
            where: { id: child.id },
            relations: ['children']
          });
          if (childWithChildren) {
            await addChildren(childWithChildren);
          }
        }
      }
    };

    await addChildren(userOrg);

    return orgs;
  }
}