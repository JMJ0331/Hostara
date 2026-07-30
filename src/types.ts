export type Platform = 'Airbnb' | 'Booking' | 'Direct' | 'Vrbo' | 'Other';

export type ReservationStatus = 'active' | 'completed' | 'cancelled';

export type CleaningStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number; // e.g. 15 for 15% management fee
  payoutMethod?: string;
  accountNumber?: string;
}

export interface Property {
  id: string;
  name: string; // e.g., "Apartamento 101"
  group: string; // e.g., "Rialto Residences", "Palma Luxury Suites", "Unidades Individuales"
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  cleaningCost: number; // Cost per cleaning
  icalUrl?: string; // iCal feed URL
  platformDefault: Platform;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  capacity?: number;
  nightlyRateDefault?: number;
  active: boolean;
  notes?: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyGroup: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  platform: Platform;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  totalPaid: number;
  cleaningCost: number;
  netAmount: number; // totalPaid - cleaningCost
  status: ReservationStatus;
  externalId?: string; // UID from iCal to prevent duplicates
  notes?: string;
  payoutStatus?: 'pending' | 'paid';
  createdVia?: 'ical' | 'manual';
  syncedAt?: string;
}

export interface CleaningTask {
  id: string;
  reservationId?: string;
  propertyId: string;
  propertyName: string;
  propertyGroup: string;
  scheduledDate: string; // YYYY-MM-DD (typically checkout date)
  status: CleaningStatus;
  assignedCleaner: string;
  cleanerPhone?: string;
  cost: number;
  notes?: string;
  completedAt?: string;
}

export interface SyncLog {
  id: string;
  propertyId: string;
  propertyName: string;
  syncedAt: string;
  status: 'success' | 'error';
  reservationsFound: number;
  reservationsCreated: number;
  reservationsUpdated: number;
  message?: string;
}

export interface DashboardStats {
  activeBookings: number;
  checkOutsToday: number;
  checkInsToday: number;
  pendingCleaningCount: number;
  totalRevenue: number;
  totalCleaningExpenses: number;
  netIncome: number;
  occupancyRatePercentage: number;
}

export interface FinancialReport {
  period: string;
  grossIncome: number;
  totalCleaningCosts: number;
  totalManagementFees: number;
  netIncome: number;
  byProperty: {
    propertyId: string;
    propertyName: string;
    propertyGroup: string;
    bookingsCount: number;
    nightsCount: number;
    grossIncome: number;
    cleaningCost: number;
    managementFee: number;
    ownerPayout: number;
  }[];
}
