import { PrismaClient, BicycleStatus, MaintenanceStatus, StudentStatus, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ensurePostgresRunning } from '../src/embeddedDb.js';

let prisma: PrismaClient;

async function main() {
  await ensurePostgresRunning(5432);
  prisma = new PrismaClient();
  console.log('[Seed] Seeding CycleLoop database...');

  // 1. Initial Pricing (₹12.50/hr as per spec)
  const existingPricing = await prisma.pricing.findFirst();
  if (!existingPricing) {
    await prisma.pricing.create({
      data: {
        hourlyRate: 12.50,
        effectiveFrom: new Date(),
        updatedBy: 'SYSTEM_BOOTSTRAP',
        note: 'Default campus launch pricing'
      }
    });
    console.log('[Seed] Default hourly pricing ₹12.50 created.');
  }

  // 2. Admins
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const operatorPasswordHash = await bcrypt.hash('Operator@123', 10);

  await prisma.admin.upsert({
    where: { email: 'admin@campuscycle.edu' },
    update: {},
    create: {
      name: 'Campus Transport Director',
      email: 'admin@campuscycle.edu',
      passwordHash: adminPasswordHash,
      role: AdminRole.SUPER_ADMIN
    }
  });

  await prisma.admin.upsert({
    where: { email: 'operator@campuscycle.edu' },
    update: {},
    create: {
      name: 'Station Fleet Manager',
      email: 'operator@campuscycle.edu',
      passwordHash: operatorPasswordHash,
      role: AdminRole.OPERATOR
    }
  });
  console.log('[Seed] Admins created (admin@campuscycle.edu / Admin@123).');

  // 3. Students
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  const studentsData = [
    {
      name: 'Aarav Sharma',
      rollNo: '21CS042',
      branch: 'Computer Science & Engineering',
      email: 'aarav@campuscycle.edu',
      phone: '+91 98765 43210',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Priya Patel',
      rollNo: '21EC019',
      branch: 'Electronics & Communication',
      email: 'priya@campuscycle.edu',
      phone: '+91 98765 43211',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Rohan Verma',
      rollNo: '22ME088',
      branch: 'Mechanical Engineering',
      email: 'rohan@campuscycle.edu',
      phone: '+91 98765 43212',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    }
  ];

  for (const s of studentsData) {
    await prisma.student.upsert({
      where: { email: s.email },
      update: {},
      create: s
    });
  }
  console.log('[Seed] Test students created (e.g. aarav@campuscycle.edu / Student@123).');

  // 4. Bicycles
  const bicyclesData = [
    {
      bicycleCode: 'CYC-001',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'Campus Cruiser Pro V2',
      location: 'Main Gate Station',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-002',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'Campus Cruiser Pro V2',
      location: 'Central Library Hub',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-003',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'EcoRide Single-Speed',
      location: 'Hostel Block 3 Hub',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-004',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'EcoRide Single-Speed',
      location: 'Sports Complex Stand',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-005',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'Campus Cruiser Pro V2',
      location: 'Cafeteria Junction',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-006',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'EcoRide Single-Speed',
      location: 'Academic Block B',
      status: BicycleStatus.AVAILABLE
    },
    {
      bicycleCode: 'CYC-007',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'Campus Cruiser Pro V2',
      location: 'Workshop Depot',
      status: BicycleStatus.MAINTENANCE
    },
    {
      bicycleCode: 'CYC-008',
      qrToken: 'cyc_tok_' + crypto.randomBytes(16).toString('hex'),
      model: 'EcoRide Single-Speed',
      location: 'Main Gate Station',
      status: BicycleStatus.AVAILABLE
    }
  ];

  for (const b of bicyclesData) {
    const existing = await prisma.bicycle.findUnique({ where: { bicycleCode: b.bicycleCode } });
    if (!existing) {
      const createdBike = await prisma.bicycle.create({ data: b });
      if (b.status === BicycleStatus.MAINTENANCE) {
        await prisma.maintenance.create({
          data: {
            bicycleId: createdBike.id,
            description: 'Scheduled brake pad alignment and tire pressure check.',
            status: MaintenanceStatus.IN_PROGRESS
          }
        });
      }
    }
  }
  console.log('[Seed] 8 Bicycles seeded across campus stations.');

  // 5. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: 'SYSTEM',
      actorType: 'SYSTEM',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'System',
      entityId: 'ROOT',
      metadata: JSON.stringify({ message: 'CampusCycle system bootstrapped with initial fleet and pricing.' })
    }
  });

  console.log('[Seed] Complete!');
  process.exit(0);
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
