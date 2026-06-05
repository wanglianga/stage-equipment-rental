export enum UserRole {
  BROKER = 'broker',
  TECHNICIAN = 'technician',
  SUPPLIER = 'supplier',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VENUE_CONFIRMED = 'venue_confirmed',
  EQUIPMENT_LOCKED = 'equipment_locked',
  IN_PROGRESS = 'in_progress',
  RETURNED = 'returned',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

export enum EquipmentCategory {
  LIGHTING = 'lighting',
  AUDIO = 'audio',
  CONSOLE = 'console',
  CABLE = 'cable',
  STAND = 'stand',
  CASE = 'case',
}

export enum ScheduleStatus {
  REQUESTED = 'requested',
  LOCKED = 'locked',
  OUTBOUND = 'outbound',
  SETUP = 'setup',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum InspectionType {
  OUTBOUND = 'outbound',
  RETURN = 'return',
}

export enum DamageType {
  NORMAL_WEAR = 'normal_wear',
  MISSING = 'missing',
  OVERDUE = 'overdue',
  ONSITE_DAMAGE = 'onsite_damage',
  SUPPLIER_SHORTAGE = 'supplier_shortage',
}

export enum SettlementStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  DISPUTED = 'disputed',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  phone?: string;
  company?: string;
}

export interface Project {
  id: string;
  name: string;
  brokerId: string;
  broker?: User;
  status: ProjectStatus;
  performanceDates: string[];
  rehearsalPeriod?: { start: string; end: string };
  stageSpecs?: { width: number; depth: number; height: number; type: string };
  equipmentList?: { equipmentId: string; quantity: number }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  supplierId: string;
  supplier?: User;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  specs?: Record<string, any>;
  dailyRate: number;
  deposit: number;
  totalQuantity: number;
  availableQuantity: number;
  depositTerms?: Record<string, any>;
  createdAt: string;
}

export interface Schedule {
  id: string;
  projectId: string;
  project?: Project;
  equipmentId: string;
  equipment?: Equipment;
  quantity: number;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  inspections?: Inspection[];
  createdAt: string;
}

export interface VenueConfirmation {
  id: string;
  projectId: string;
  project?: Project;
  technicianId: string;
  technician?: User;
  setupWindow?: { start: string; end: string };
  powerConditions?: { totalKW: number; phases: number; outlets: string };
  riggingPoints?: { count: number; maxLoad: number; type: string };
  restrictions?: Record<string, any>;
  confirmed: boolean;
  notes?: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  scheduleId: string;
  schedule?: Schedule;
  type: InspectionType;
  inspectorId: string;
  inspector?: User;
  inspectionDate: string;
  notes?: string;
  items?: InspectionItem[];
  createdAt: string;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  inspection?: Inspection;
  equipmentId: string;
  equipment?: Equipment;
  damageType?: DamageType;
  description?: string;
  photoUrls?: string[];
  deductionAmount: number;
  responsibility?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  projectId: string;
  project?: Project;
  totalRentalFee: number;
  totalDeposit: number;
  totalDeduction: number;
  finalAmount: number;
  status: SettlementStatus;
  items?: SettlementItem[];
  notes?: string;
  createdAt: string;
}

export interface SettlementItem {
  id: string;
  settlementId: string;
  equipmentId: string;
  equipment?: Equipment;
  quantity: number;
  rentalDays: number;
  rentalFee: number;
  deductionType?: DamageType;
  deductionAmount: number;
  inspectionItemId?: string;
  responsibility?: string;
  photoUrl?: string;
  createdAt: string;
}

const _LABELS: Record<string, string> = {
  [UserRole.BROKER]: '演出经纪',
  [UserRole.TECHNICIAN]: '剧院技术部',
  [UserRole.SUPPLIER]: '设备供应商',
  [EquipmentCategory.LIGHTING]: '灯光',
  [EquipmentCategory.AUDIO]: '音响',
  [EquipmentCategory.CONSOLE]: '控台',
  [EquipmentCategory.CABLE]: '线材',
  [EquipmentCategory.STAND]: '支架',
  [EquipmentCategory.CASE]: '运输箱',
  [DamageType.NORMAL_WEAR]: '正常磨损',
  [DamageType.MISSING]: '缺件',
  [DamageType.OVERDUE]: '超时占用',
  [DamageType.ONSITE_DAMAGE]: '现场损坏',
  [DamageType.SUPPLIER_SHORTAGE]: '供应商漏发',
  [SettlementStatus.PENDING]: '待确认',
  [SettlementStatus.CONFIRMED]: '已确认',
  [SettlementStatus.PAID]: '已付款',
  [SettlementStatus.DISPUTED]: '有争议',
};

const _PROJECT_LABELS: Record<string, string> = {
  [ProjectStatus.DRAFT]: '草稿',
  [ProjectStatus.SUBMITTED]: '已提交',
  [ProjectStatus.VENUE_CONFIRMED]: '场馆已确认',
  [ProjectStatus.EQUIPMENT_LOCKED]: '设备已锁定',
  [ProjectStatus.IN_PROGRESS]: '进行中',
  [ProjectStatus.RETURNED]: '已归还',
  [ProjectStatus.SETTLED]: '已结算',
  [ProjectStatus.CANCELLED]: '已取消',
};

const _SCHEDULE_LABELS: Record<string, string> = {
  [ScheduleStatus.REQUESTED]: '已申请',
  [ScheduleStatus.LOCKED]: '已锁定',
  [ScheduleStatus.OUTBOUND]: '已出库',
  [ScheduleStatus.SETUP]: '装台中',
  [ScheduleStatus.RETURNED]: '已归还',
  [ScheduleStatus.CANCELLED]: '已取消',
};

const _INSPECTION_LABELS: Record<string, string> = {
  [InspectionType.OUTBOUND]: '出库点验',
  [InspectionType.RETURN]: '归还点验',
};

export const LABELS = { ..._LABELS, ..._PROJECT_LABELS, ..._SCHEDULE_LABELS, ..._INSPECTION_LABELS };
