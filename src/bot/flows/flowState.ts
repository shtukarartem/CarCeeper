export type FuelFlowState =
  | {
      type: 'fuel';
      step: 'liters';
      data: Record<string, never>;
    }
  | {
      type: 'fuel';
      step: 'amount';
      data: {
        liters: number;
      };
    }
  | {
      type: 'fuel';
      step: 'mileage';
      data: {
        liters: number;
        amount: number;
      };
    };

export type ExpenseFlowState =
  | {
      type: 'expense';
      step: 'description';
      data: Record<string, never>;
    }
  | {
      type: 'expense';
      step: 'amount';
      data: {
        description: string;
      };
    };

export type ServiceFlowState =
  | {
      type: 'service';
      step: 'title';
      data: Record<string, never>;
    }
  | {
      type: 'service';
      step: 'amount';
      data: {
        title: string;
      };
    }
  | {
      type: 'service';
      step: 'serviceMileage';
      data: {
        title: string;
        amount: number;
      };
    }
  | {
      type: 'service';
      step: 'nextIntervalKm';
      data: {
        title: string;
        amount: number;
        serviceMileage: number | null;
      };
    }
  | {
      type: 'service';
      step: 'nextIntervalMonths';
      data: {
        title: string;
        amount: number;
        serviceMileage: number | null;
        nextIntervalKm: number | null;
      };
    };

export type UserFlowState = FuelFlowState | ExpenseFlowState | ServiceFlowState;

const userFlowStates = new Map<number, UserFlowState>();

export function getUserFlowState(userId: number): UserFlowState | undefined {
  return userFlowStates.get(userId);
}

export function setUserFlowState(userId: number, state: UserFlowState): void {
  userFlowStates.set(userId, state);
}

export function clearUserFlowState(userId: number): boolean {
  return userFlowStates.delete(userId);
}
