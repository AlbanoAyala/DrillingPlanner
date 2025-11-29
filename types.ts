
export enum LineType {
    DRILLING = 'DRILLING',
    FLAT_TIME = 'FLAT_TIME',
    LOGGING = 'LOGGING',
    CASING = 'CASING',
    MOVING = 'MOVING',
    TRIPPING = 'TRIPPING', // For "Maniobras" that depend on depth/speed
    CEMENTING = 'CEMENTING'
}

export interface CostCatalogItem {
    category: 'EQUIPO' | 'SERVICIOS' | 'MATERIALES';
    subcategory: string; // e.g., 'H-202', 'Direccional', 'Casing'
    item: string; // Description
    unit: 'DIA' | 'UNI' | 'KM' | 'MTS' | 'MES' | 'HS';
    cost: number;
    // Filters
    equipmentType?: string; // For Equipment category
    wellType?: string; // For Materials/Services specific logic
    requiredForDir?: boolean; // For Service logic
    excludedForDir?: boolean; // For Service logic
    applyToLines?: string[]; // Specific lines this applies to (e.g., Bits on line 10)
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
    
    // Helper
    totalMeter?: number;
}

export interface SimulationParams {
    tdGuide: number;
    tdIsolation: number;
    dtm: number; // Distance in km
    trailerHours: number; // New param for Trailer calculation
    
    // Config Flags
    equipmentType: string; // e.g. 'H-202'
    isFirstWell: boolean; // Determines Mob vs DTM Short
    wellType: string; // 'Convencional', 'NOC', etc.
    
    isOfflineBOP: boolean;
    isNoLogging: boolean;
    isDirectional: boolean; 
    hasGeologicalControl: boolean; 
    
    adjustments: Record<string, Adjustment>; 
    
    // User Input
    userNotes?: string; // Specific operational premises or risk notes
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

// Structure for the Cost Summary Table (AFE style)
export interface CostSummaryRow {
    group: string; // e.g. "02.01 EQUIPO"
    item: string; // e.g. "H-202"
    description: string; // e.g. "TARIFA DIARIA"
    unit: string;
    price: number;
    quantity: number;
    total: number;
}

export interface SimulationResult {
    lines: SimulationResultLine[];
    totalTimeDays: number;
    totalCost: number;
    timeCurve: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[];
    timeCurveNet: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[];
    costSummary: CostSummaryRow[];
    warnings: string[]; // Feedback for missing data
}

export interface Well {
    id: string;
    name: string; // "Pozo"
    type: string; // "Pozo tipo"
    startDate: string; // "Fecha"
    equipment: string; // "Equipo" (e.g. H-202)
    done: boolean; // "Hecho"
}

export interface AnnualScenario {
    inflationRate: number;
    globalEfficiency: number;
    wells: Well[];
}

export interface Scenario {
    id: string;
    wellId: string;
    name: string;
    createdAt: number;
    params: SimulationParams;
}
