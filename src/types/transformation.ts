export type TransformationMilestoneStatus =
  | 'pending'
  | 'completed'
  | 'skipped'
  | string;

export type TransformationMilestone = {
  id?: string;
  transformationTargetId?: string;
  weekNumber: number;
  targetWeightKg: number;
  targetBodyFat?: number | null;
  status: TransformationMilestoneStatus;
  createdAt?: string;
};

export type TransformationStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' | string;

export type Transformation = {
  id: string;
  currentWeightKg: number;
  targetWeightKg: number;
  currentBodyFat: number | null;
  targetBodyFat: number | null;
  bmi: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  dailyProtein: number;
  estimatedWeeks: number;
  targetPhysique?: string | null;
  goal?: string | null;
  status: TransformationStatus;
  milestones?: TransformationMilestone[];
  createdAt?: string;
  updatedAt?: string;
};

export type TransformationHistoryItem = Transformation & {
  archivedAt?: string;
};

export type TransformationHistoryMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TransformationHistoryResponse = {
  items: TransformationHistoryItem[];
  meta?: TransformationHistoryMeta;
};
