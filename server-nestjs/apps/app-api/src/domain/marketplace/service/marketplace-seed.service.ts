import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MarketplaceTemplate,
  TemplateCategory,
  TemplateType,
} from '@app/entity/entities';

const SEED_TEMPLATES: Partial<MarketplaceTemplate>[] = [
  // ── Software Dev ──────────────────────────────────────────
  {
    name: 'Agile Scrum Board',
    description:
      'A complete Scrum workflow with backlog, sprint planning, daily standups, and retrospectives. Includes columns for Backlog, To Do, In Progress, Code Review, QA, and Done.',
    category: TemplateCategory.SOFTWARE_DEV,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: true,
    installCount: 342,
    rating: 4.7,
    ratingCount: 89,
    tags: ['scrum', 'agile', 'sprint', 'software'],
    version: '2.1.0',
    templateData: {
      columns: ['Backlog', 'To Do', 'In Progress', 'Code Review', 'QA', 'Done'],
      labels: ['Bug', 'Feature', 'Improvement', 'Tech Debt'],
      priorities: ['LOW', 'MEDIUM', 'HIGH'],
      defaultTasks: [
        { title: 'Set up project repository', column: 'Backlog' },
        { title: 'Define sprint goals', column: 'Backlog' },
        { title: 'Create user stories', column: 'Backlog' },
      ],
    },
  },
  {
    name: 'Kanban Development Flow',
    description:
      'Continuous delivery Kanban board optimized for engineering teams. Features WIP limits, swimlanes for different work types, and automated flow metrics.',
    category: TemplateCategory.SOFTWARE_DEV,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: true,
    installCount: 218,
    rating: 4.5,
    ratingCount: 56,
    tags: ['kanban', 'continuous-delivery', 'engineering'],
    version: '1.3.0',
    templateData: {
      columns: ['Ready', 'Development', 'Review', 'Testing', 'Deploy', 'Done'],
      wipLimits: { Development: 3, Review: 2, Testing: 2 },
      labels: ['Frontend', 'Backend', 'DevOps', 'Hotfix'],
    },
  },
  {
    name: 'Bug Tracker',
    description:
      'Structured bug tracking system with severity levels, reproduction steps, and resolution tracking. Perfect for QA teams managing defects across releases.',
    category: TemplateCategory.SOFTWARE_DEV,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 156,
    rating: 4.3,
    ratingCount: 41,
    tags: ['bugs', 'qa', 'testing', 'defects'],
    version: '1.0.0',
    templateData: {
      columns: ['Reported', 'Triaged', 'In Progress', 'Fixed', 'Verified', 'Closed'],
      labels: ['Critical', 'Major', 'Minor', 'Cosmetic'],
      customFields: ['Severity', 'Steps to Reproduce', 'Expected Result', 'Actual Result'],
    },
  },
  {
    name: 'API Development Tracker',
    description:
      'Track API endpoints from design to deployment. Includes columns for API design, implementation, documentation, and testing phases.',
    category: TemplateCategory.SOFTWARE_DEV,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 87,
    rating: 4.1,
    ratingCount: 22,
    tags: ['api', 'rest', 'backend', 'documentation'],
    version: '1.0.0',
    templateData: {
      columns: ['Design', 'Implementation', 'Testing', 'Documentation', 'Deployed'],
      labels: ['GET', 'POST', 'PUT', 'DELETE', 'GraphQL'],
    },
  },

  // ── Project Management ────────────────────────────────────
  {
    name: 'Product Roadmap',
    description:
      'Strategic product planning template with quarterly goals, feature prioritization, and milestone tracking. Ideal for product managers aligning teams on vision.',
    category: TemplateCategory.PROJECT_MANAGEMENT,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: true,
    installCount: 289,
    rating: 4.6,
    ratingCount: 73,
    tags: ['roadmap', 'product', 'strategy', 'planning'],
    version: '1.5.0',
    templateData: {
      columns: ['Ideas', 'Planned', 'In Progress', 'Shipped'],
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      milestones: ['MVP', 'Beta', 'Launch', 'Post-Launch'],
    },
  },
  {
    name: 'Project Kickoff',
    description:
      'Everything you need to start a new project: stakeholder mapping, risk assessment, timeline planning, and resource allocation all in one template.',
    category: TemplateCategory.PROJECT_MANAGEMENT,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 164,
    rating: 4.4,
    ratingCount: 38,
    tags: ['kickoff', 'planning', 'stakeholders', 'timeline'],
    version: '1.2.0',
    templateData: {
      columns: ['Discovery', 'Planning', 'Execution', 'Review', 'Complete'],
      defaultTasks: [
        { title: 'Define project scope and objectives', column: 'Discovery' },
        { title: 'Identify stakeholders', column: 'Discovery' },
        { title: 'Create project timeline', column: 'Planning' },
        { title: 'Allocate resources', column: 'Planning' },
        { title: 'Set up communication channels', column: 'Planning' },
        { title: 'Kickoff meeting', column: 'Execution' },
      ],
    },
  },
  {
    name: 'OKR Tracker',
    description:
      'Track Objectives and Key Results across your organization. Monitor progress, align teams, and measure outcomes with structured OKR methodology.',
    category: TemplateCategory.PROJECT_MANAGEMENT,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 112,
    rating: 4.2,
    ratingCount: 29,
    tags: ['okr', 'goals', 'objectives', 'key-results'],
    version: '1.0.0',
    templateData: {
      columns: ['Draft', 'Active', 'At Risk', 'Achieved'],
      labels: ['Company', 'Team', 'Individual'],
    },
  },

  // ── Marketing ─────────────────────────────────────────────
  {
    name: 'Content Calendar',
    description:
      'Plan and schedule content across all channels — blog posts, social media, newsletters, and campaigns. Includes editorial workflow and approval process.',
    category: TemplateCategory.MARKETING,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: true,
    installCount: 203,
    rating: 4.5,
    ratingCount: 52,
    tags: ['content', 'social-media', 'editorial', 'calendar'],
    version: '2.0.0',
    templateData: {
      columns: ['Ideas', 'Writing', 'Review', 'Scheduled', 'Published'],
      labels: ['Blog', 'Social', 'Newsletter', 'Video', 'Podcast'],
      defaultTasks: [
        { title: 'Define content strategy for the quarter', column: 'Ideas' },
        { title: 'Create editorial guidelines', column: 'Ideas' },
      ],
    },
  },
  {
    name: 'Product Launch Campaign',
    description:
      'End-to-end product launch playbook covering pre-launch, launch day, and post-launch activities. Coordinate marketing, sales, and support teams.',
    category: TemplateCategory.MARKETING,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 134,
    rating: 4.4,
    ratingCount: 35,
    tags: ['launch', 'campaign', 'go-to-market', 'product'],
    version: '1.1.0',
    templateData: {
      columns: ['Pre-Launch', 'Launch Week', 'Post-Launch', 'Analysis'],
      labels: ['Marketing', 'Sales', 'Support', 'Engineering'],
    },
  },

  // ── Design ────────────────────────────────────────────────
  {
    name: 'Design Sprint',
    description:
      'Google Ventures-style 5-day design sprint framework. Structured phases from problem understanding through prototyping and user testing.',
    category: TemplateCategory.DESIGN,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: true,
    installCount: 176,
    rating: 4.6,
    ratingCount: 44,
    tags: ['design-sprint', 'ux', 'prototyping', 'user-testing'],
    version: '1.0.0',
    templateData: {
      columns: ['Understand', 'Sketch', 'Decide', 'Prototype', 'Test'],
      defaultTasks: [
        { title: 'Map the challenge', column: 'Understand' },
        { title: 'Interview stakeholders', column: 'Understand' },
        { title: 'Sketch solutions', column: 'Sketch' },
        { title: 'Vote on best ideas', column: 'Decide' },
        { title: 'Build prototype', column: 'Prototype' },
        { title: 'Recruit test users', column: 'Test' },
        { title: 'Run user tests', column: 'Test' },
      ],
    },
  },
  {
    name: 'UI/UX Design System',
    description:
      'Track design system components from concept to implementation. Manage tokens, components, patterns, and documentation in a structured workflow.',
    category: TemplateCategory.DESIGN,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 93,
    rating: 4.3,
    ratingCount: 24,
    tags: ['design-system', 'ui', 'components', 'tokens'],
    version: '1.0.0',
    templateData: {
      columns: ['Proposed', 'Designing', 'Dev Handoff', 'Implemented', 'Documented'],
      labels: ['Token', 'Component', 'Pattern', 'Icon'],
    },
  },

  // ── HR ────────────────────────────────────────────────────
  {
    name: 'Employee Onboarding',
    description:
      'Comprehensive onboarding checklist for new hires. Covers IT setup, HR paperwork, team introductions, training schedule, and 30-60-90 day goals.',
    category: TemplateCategory.HR,
    type: TemplateType.WORKFLOW,
    isPublic: true,
    isFeatured: false,
    installCount: 145,
    rating: 4.5,
    ratingCount: 37,
    tags: ['onboarding', 'new-hire', 'hr', 'checklist'],
    version: '1.4.0',
    templateData: {
      columns: ['Pre-Start', 'Day 1', 'Week 1', 'Month 1', '90-Day Review'],
      defaultTasks: [
        { title: 'Prepare workstation and accounts', column: 'Pre-Start' },
        { title: 'Send welcome email with first day details', column: 'Pre-Start' },
        { title: 'Office tour and team introductions', column: 'Day 1' },
        { title: 'HR paperwork and benefits enrollment', column: 'Day 1' },
        { title: 'Development environment setup', column: 'Week 1' },
        { title: 'Assign onboarding buddy', column: 'Week 1' },
        { title: 'First project assignment', column: 'Month 1' },
        { title: '90-day performance review', column: '90-Day Review' },
      ],
    },
  },
  {
    name: 'Recruitment Pipeline',
    description:
      'Track candidates through your hiring funnel. Manage job postings, applications, interviews, and offers with a clear visual pipeline.',
    category: TemplateCategory.HR,
    type: TemplateType.WORKFLOW,
    isPublic: true,
    isFeatured: false,
    installCount: 98,
    rating: 4.2,
    ratingCount: 26,
    tags: ['recruitment', 'hiring', 'candidates', 'pipeline'],
    version: '1.0.0',
    templateData: {
      columns: ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Hired'],
      labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
    },
  },

  // ── Education ─────────────────────────────────────────────
  {
    name: 'Course Curriculum Planner',
    description:
      'Plan and organize course modules, lessons, assignments, and assessments. Track content creation progress and student feedback.',
    category: TemplateCategory.EDUCATION,
    type: TemplateType.PROJECT,
    isPublic: true,
    isFeatured: false,
    installCount: 67,
    rating: 4.1,
    ratingCount: 18,
    tags: ['course', 'curriculum', 'education', 'teaching'],
    version: '1.0.0',
    templateData: {
      columns: ['Outline', 'Creating Content', 'Review', 'Published'],
      labels: ['Lecture', 'Lab', 'Assignment', 'Quiz', 'Project'],
    },
  },

  // ── Finance ───────────────────────────────────────────────
  {
    name: 'Budget Planning',
    description:
      'Annual and quarterly budget planning workflow. Track budget requests, approvals, allocations, and spending across departments.',
    category: TemplateCategory.FINANCE,
    type: TemplateType.WORKFLOW,
    isPublic: true,
    isFeatured: false,
    installCount: 78,
    rating: 4.0,
    ratingCount: 20,
    tags: ['budget', 'finance', 'planning', 'approval'],
    version: '1.0.0',
    templateData: {
      columns: ['Draft', 'Under Review', 'Approved', 'Allocated', 'Tracking'],
      labels: ['Engineering', 'Marketing', 'Operations', 'HR'],
    },
  },
];

@Injectable()
export class MarketplaceSeedService implements OnModuleInit {
  private readonly logger = new Logger(MarketplaceSeedService.name);

  constructor(
    @InjectRepository(MarketplaceTemplate)
    private readonly templateRepo: Repository<MarketplaceTemplate>,
  ) {}

  async onModuleInit() {
    await this.seedTemplates();
  }

  private async seedTemplates(): Promise<void> {
    const existingCount = await this.templateRepo.count();
    if (existingCount > 0) {
      this.logger.log(`Marketplace already has ${existingCount} templates, skipping seed.`);
      return;
    }

    this.logger.log('Seeding marketplace templates...');

    for (const data of SEED_TEMPLATES) {
      const template = this.templateRepo.create({
        ...data,
        authorId: undefined,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      });
      await this.templateRepo.save(template);
    }

    this.logger.log(`Seeded ${SEED_TEMPLATES.length} marketplace templates.`);
  }
}
