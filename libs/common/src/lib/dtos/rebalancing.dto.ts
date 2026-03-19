export interface RebalancingAction {
  tagId: string;
  tagName: string;
  type: 'BUY' | 'SELL';
  amount: number;
  percentage: number;
  currentAllocation: number;
  targetAllocation: number;
}

export interface CustomAllocationItem {
  tagId: string;
  tagName: string;
  currentAllocation: number;
  targetAllocation: number;
  currentValue: number;
  targetValue: number;
  color?: string;
  drift: number;
}

export interface CustomAllocationResponse {
  items: CustomAllocationItem[];
  totalValue: number;
  totalTargetAllocation: number;
  hasDrift: boolean;
  rebalancingActions: RebalancingAction[];
}
