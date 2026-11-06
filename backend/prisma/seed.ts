import { PrismaClient, BicycleStatus, MaintenanceStatus, StudentStatus, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ensurePostgresRunning } from '../src/embeddedDb.js';

let prisma: PrismaClient;

async function main() {
  await ensurePostgresRunning(5432);
  prisma = new PrismaClient();
  console.log('[Seed] Seeding CycleLoop database with authentic student records...');

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
  console.log('[Seed] Admins verified (admin@campuscycle.edu / Admin@123).');

  // 3. Clear old mock data
  console.log('[Seed] Clearing old mock student records and test rental histories...');
  await prisma.payment.deleteMany({});
  await prisma.rental.deleteMany({});
  await prisma.student.deleteMany({});

  // 4. Seed Specified NIT Andhra Student Accounts
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  const studentsData = [
    {
      name: 'Arpit Kumar Ranjan',
      rollNo: '525005',
      branch: 'Electrical and Electronics Engineering',
      email: '525005@student.nitandhra.ac.in',
      phone: '+91 98765 52505',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Anshuman Mishra',
      rollNo: '525004',
      branch: 'Electrical and Electronics Engineering',
      email: '525004@student.nitandhra.ac.in',
      phone: '+91 98765 52504',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Linkan Sarkar',
      rollNo: '525040',
      branch: 'Electrical and Electronics Engineering',
      email: '525040@student.nitandhra.ac.in',
      phone: '+91 98765 52540',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Karthepan Murali Kannan',
      rollNo: '525029',
      branch: 'Electrical and Electronics Engineering',
      email: '525029@student.nitandhra.ac.in',
      phone: '+91 98765 52529',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    },
    {
      name: 'Midathada Chaitanya Naidu',
      rollNo: '525042',
      branch: 'Electrical and Electronics Engineering',
      email: '525042@student.nitandhra.ac.in',
      phone: '+91 98765 52542',
      passwordHash: studentPasswordHash,
      status: StudentStatus.ACTIVE
    }
  ];

  for (const s of studentsData) {
    await prisma.student.create({
      data: s
    });
  }
  console.log('[Seed] Seeded 5 official students for Electrical and Electronics Engineering:');
  studentsData.forEach(s => console.log(`  - ${s.name} (${s.rollNo}) | ${s.email}`));

  // 5. Bicycles Fleet
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
    } else {
      // Reset status to AVAILABLE except for maintenance
      await prisma.bicycle.update({
        where: { id: existing.id },
        data: {
          status: b.status,
          location: b.location
        }
      });
    }
  }
  console.log('[Seed] 8 Bicycles verified across campus stations.');

  // 6. Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: 'SYSTEM',
      actorType: 'SYSTEM',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'System',
      entityId: 'ROOT',
      metadata: JSON.stringify({ message: 'CampusCycle system refreshed with official Electrical & Electronics students.' })
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
    if (prisma) await prisma.$disconnect();
  });
