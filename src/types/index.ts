export type LocationId = string;
export type EmployeeId = string;
export type RequestId = string;

export interface Balance {
  employeeId: EmployeeId;
  locationId: LocationId;
  available: number;
  updatedAt: string; // ISO 8601
}

export interface TimeOffRequest {
  id: RequestId;
  employeeId: EmployeeId;
  locationId: LocationId;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  resolvedAt?: string;
  balanceDeducted?: boolean;
}

export type RequestStatus =
  | 'pending-optimistic'   // Not yet sent to HCM
  | 'pending-hcm'          // Sent, awaiting HCM confirmation
  | 'pending'              // HCM confirmed, awaiting manager
  | 'approved'
  | 'denied'
  | 'rolled-back'          // HCM rejected, optimistic deduction reversed
  | 'unconfirmed';         // Silent failure — not confirmed, not denied

export interface Employee {
  id: EmployeeId;
  name: string;
  locationIds: LocationId[];
}

export interface Manager {
  id: string;
  name: string;
  managesEmployeeIds: EmployeeId[];
}

export interface HCMConfig {
  silentFailMode: boolean;
  delayMs: number;
  conflictMode: boolean;
  anniversaryBonus: number;
}

export interface OptimisticEntry {
  requestId: RequestId;
  employeeId: EmployeeId;
  locationId: LocationId;
  optimisticDeduction: number;
  submittedAt: number; // Date.now()
}

export interface ConflictEntry {
  employeeId: EmployeeId;
  locationId: LocationId;
  cachedValue: number;
  hcmValue: number;
  detectedAt: number;
}
