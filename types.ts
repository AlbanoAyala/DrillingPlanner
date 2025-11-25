export enum LineType {
    DRILLING = 'DRILLING',
    FLAT_TIME = 'FLAT_TIME',
    LOGGING = 'LOGGING',
    CASING = 'CASING',
    MOVING = 'MOVING',
    TRIPPING = 'TRIPPING', // For "Maniobras" that depend on depth/speed
    CEMENTING = 'CEMENTING'
}

export interface CostItem {
    id: string;
    description: string;
    unitCost: number; // Daily rate or fixed cost
    unit: 'DAY' | 'FIXED' | 'METER';
    category: string;
}

export interface ProgramLine {
    id: string;
    phase: string;
    activity: string;
    type: LineType;
    baseDurationHours?: number; // For Fixed items
    
    // Calculation Parameters
    rop?: number; // m/h (For Drilling)
    casingSpeed?: number; // joints/h (For Casing)
    pipeLength?: number; // m/joint (For Casing)
    trippingSpeed?: number; // m/h (For Tripping/Maniobras)
    
    // Context
    linkedToSection?: 'GUIDE' | 'ISOLATION'; // To determine depth used in calculation
    isOfflineCapable?: boolean; // Can be skipped if Offline BOP is on
}

export interface SimulationParams {
    tdGuide: number;
    tdIsolation: number;
    dtm: number; // Distance in km
    isOfflineBOP: boolean;
    isNoLogging: boolean;
    adjustments: Record<string, Adjustment>; 
}

export interface Adjustment {
    type: 'ABSOLUTE_VALUE' | 'PERCENTAGE_TIME'; // ABSOLUTE_VALUE adds to ROP/Speed, PERCENTAGE adds to time
    value: number; 
}

export interface SimulationResultLine extends ProgramLine {
    calculatedDuration: number; // hours
    calculatedCost: number;
    cumulativeTime: number; // days (Total)
    daysFromSpud: number; // days (Construction only)
    cumulativeCost: number;
    depthStart: number;
    depthEnd: number;
}

export interface SimulationResult {
    lines: SimulationResultLine[];
    totalTimeDays: number;
    totalCost: number;
    timeCurve: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[];
    timeCurveNet: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[];
}

export interface AnnualScenario {
    inflationRate: number;
    globalEfficiency: number;
    wells: {
        id: string;
        name: string;
        startDate: string;
        type: string;
    }[];
}