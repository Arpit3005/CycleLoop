export type UserType = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  branch?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'OPERATOR';
  type: UserType;
}

export type BicycleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'DECOMMISSIONED';

export interface Bicycle {
  id: string;
  bicycleCode: string;
  model: string;
  location: string;
  status: BicycleStatus;
  qrToken?: string;
  _count?: {
    rentals: number;
    maintenance: number;
  };
}

export type RentalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ActiveRental {
  id: string;
  bicycleId: string;
  bicycleCode: string;
  model: string;
  location: string;
  qrToken: string;
  startTime: string;
  serverTime: string;
  elapsedMinutes: number;
  hourlyRate: number;
  estimatedAmount: number;
  student: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
  };
}

export interface Rental {
  id: string;
  bicycleCode: string;
  model: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  hourlyRate: number;
  totalAmount?: number;
  status: RentalStatus;
  student?: {
    id: string;
    name: string;
    rollNo: string;
    branch: string;
    email: string;
  };
  payment?: {
    id: string;
    orderId: string;
    paymentId?: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    updatedAt?: string;
  };
}

export interface Payment {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  rental?: {
    id: string;
    bicycleCode: string;
    durationMinutes: number;
    startTime: string;
    endTime: string;
  };
}

export interface Pricing {
  id: string;
  hourlyRate: number;
  effectiveFrom: string;
  updatedBy: string;
  note?: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  bicycleId: string;
  description: string;
  resolutionNotes?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  bicycle?: {
    bicycleCode: string;
    model: string;
    location: string;
  };
}

export interface DashboardStats {
  totalStudents: number;
  totalBicycles: number;
  availableBicycles: number;
  rentedBicycles: number;
  maintenanceBicycles: number;
  activeRentals: number;
  completedRentals: number;
  totalRevenue: number;
  pendingPayments: number;
  currentHourlyRate: number;
}
