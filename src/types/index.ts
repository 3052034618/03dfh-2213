export type RiskLevel = 'low' | 'warn' | 'high';

export type WaybillStatus = 'pending' | 'loading' | 'transit' | 'arriving' | 'completed';

export type PackageCondition = 'good' | 'slight_damage' | 'damaged';

export interface WarningRecord {
  id: string;
  time: string;
  type: 'temp' | 'route' | 'traffic' | 'detour';
  level: RiskLevel;
  title: string;
  description: string;
  temperature?: number;
}

export interface TemperaturePoint {
  time: string;
  value: number;
}

export interface RoutePoint {
  id: string;
  name: string;
  status: 'done' | 'current' | 'pending';
  time?: string;
  description?: string;
}

export interface Waybill {
  id: string;
  waybillNo: string;
  goodsName: string;
  goodsWeight: string;
  shipper: string;
  receiver: string;
  receiverAddress: string;
  carrier: string;
  plateNo: string;
  driverName: string;
  driverPhone: string;
  status: WaybillStatus;
  statusText: string;
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  agreeTempRange: {
    min: number;
    max: number;
  };
  riskLevel: RiskLevel;
  riskText: string;
  estimatedArrival: string;
  loadingTime?: string;
  departureTime?: string;
  progress: number;
  routePoints: RoutePoint[];
  warnings: WarningRecord[];
  tempHistory: TemperaturePoint[];
  createTime: string;
}

export interface ReceiptForm {
  waybillId: string;
  actualTemperature: number | null;
  packageCondition: PackageCondition | null;
  isRejected: boolean;
  rejectReason?: string;
  remark?: string;
  operatorName?: string;
  operateTime?: string;
}

export type ExceptionType = 'temp_out_of_range' | 'package_damaged' | 'rejected';
export type ExceptionStatus = 'pending' | 'in_progress' | 'resolved';

export interface ExceptionRecord {
  id: string;
  waybillId: string;
  type: ExceptionType;
  status: ExceptionStatus;
  title: string;
  description: string;
  actualTemp?: number;
  agreedMin?: number;
  agreedMax?: number;
  packageCondition?: PackageCondition;
  photoUrls?: string[];
  handleRemark?: string;
  createdAt: string;
  updatedAt?: string;
  handledAt?: string;
  handlerName?: string;
}
