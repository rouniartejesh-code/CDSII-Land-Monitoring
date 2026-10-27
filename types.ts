
export enum PlotStatus {
  RUNNING = 'RUNNING',
  CLOSED = 'CLOSED',
  PARTIAL = 'PARTIAL',
  VACANT = 'VACANT',
  IDLE = 'IDLE'
}

export enum DetectionSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  NORMAL = 'NORMAL'
}

export enum EnforcementStage {
  DETECTION = 'DETECTION',
  VERIFICATION = 'VERIFICATION',
  NOTICE_ISSUED = 'NOTICE_ISSUED',
  LEGAL_ACTION = 'LEGAL_ACTION',
  RESOLVED = 'RESOLVED'
}

export type District = 'Raipur' | 'Durg' | 'Bilaspur' | 'Korba' | 'Raigarh' | 'Dhamtari';

export interface IndustrialZone {
  id: string;
  name: string;
  district: District;
  leaseRatePerSqm: number;
  penaltyMultiplier: number; 
}

export interface StatutoryDues {
  leasePayments: number;
  waterCharges: number;
  otherDues: number;
  totalOutstanding: number;
}

export interface Plot {
  id: string;
  allotmentId: string;
  industryName: string;
  plotNumber: string;
  areaM2: number;
  builtAreaM2: number;
  status: PlotStatus;
  encroached: boolean;
  encroachmentAreaM2: number;
  lastSurveyDate: string;
  lastSurveySource: 'Satellite' | 'Drone' | 'Manual' | 'On-Site Drawing';
  coordinates: [number, number][]; 
  builtCoordinates?: [number, number][]; 
  severity: DetectionSeverity;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  statutoryDues: StatutoryDues;
  lastPaymentDate: string;
  officerAssigned: string;
  enforcementStage: EnforcementStage;
  district: District;
  zoneId: string;
  detectionConfidence: number;
}
