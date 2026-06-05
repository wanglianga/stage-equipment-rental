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

export enum AddShowRequestStatus {
  PENDING = 'pending',
  CHECKING = 'checking',
  APPROVED = 'approved',
  PARTIAL_APPROVED = 'partial_approved',
  REJECTED = 'rejected',
  CONFIRMED = 'confirmed',
}

export enum CheckItemStatus {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning',
  PENDING = 'pending',
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

export interface AlternativeEquipment {
  originalEquipmentId: string;
  originalEquipmentName: string;
  alternativeEquipmentId: string;
  alternativeEquipmentName: string;
  quantity: number;
  priceDifference: number;
}

export interface CheckResult {
  equipmentOccupancy: CheckItemStatus;
  venueWindow: CheckItemStatus;
  technicianAvailability: CheckItemStatus;
  depositSupplement: CheckItemStatus;
  details?: {
    equipmentConflicts?: { equipmentId: string; equipmentName: string; conflictProject: string; conflictDates: string[] }[];
    venueConflicts?: { date: string; reason: string }[];
    unavailableTechnicians?: { technicianId: string; name: string; reason: string }[];
    requiredDeposit?: number;
    currentDeposit?: number;
    additionalDeposit?: number;
  };
}

export interface TimeAdjustment {
  rehearsalPeriod: { start: string; end: string };
  outboundDate: string;
  setupDate: string;
  returnDate: string;
}

export interface AddShowRequest {
  id: string;
  projectId: string;
  project?: Project;
  requestedBy: string;
  requester?: User;
  additionalPerformanceDates: string[];
  requestedEquipment?: { equipmentId: string; quantity: number }[];
  status: AddShowRequestStatus;
  checkResult?: CheckResult;
  timeAdjustment?: TimeAdjustment;
  approvedEquipment?: { equipmentId: string; quantity: number }[];
  alternativeEquipments?: AlternativeEquipment[];
  supplierStockList?: { equipmentId: string; equipmentName: string; quantity: number; supplierId: string }[];
  alternativeConfirmed: boolean;
  additionalDeposit: number;
  additionalRentalFee: number;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  [AddShowRequestStatus.PENDING]: '待检查',
  [AddShowRequestStatus.CHECKING]: '检查中',
  [AddShowRequestStatus.APPROVED]: '已通过',
  [AddShowRequestStatus.PARTIAL_APPROVED]: '部分通过',
  [AddShowRequestStatus.REJECTED]: '已拒绝',
  [AddShowRequestStatus.CONFIRMED]: '已确认',
  [CheckItemStatus.PASS]: '通过',
  [CheckItemStatus.FAIL]: '不通过',
  [CheckItemStatus.WARNING]: '警告',
  [CheckItemStatus.PENDING]: '待检查',
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
