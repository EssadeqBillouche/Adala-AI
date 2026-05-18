import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(baseSlug: string, repo: Repository<Organization>): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await repo.exists({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(name: string, manager?: EntityManager): Promise<Organization> {
    const repo = manager ? manager.getRepository(Organization) : this.orgRepository;
    const baseSlug = this.generateSlug(name);
    const slug = await this.generateUniqueSlug(baseSlug, repo);

    const org = repo.create({ name, slug });
    return repo.save(org);
  }
}
