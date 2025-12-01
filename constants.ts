
import { ProgramLine, LineType, Well, CostCatalogItem } from './types';

// Based on the user provided "Plan de Perforación" table (Items 0 - 17)
export const INITIAL_PROGRAM: ProgramLine[] = [
    { 
        id: '0', phase: 'Movilización', activity: 'DTM de equipo', 
        type: LineType.MOVING, baseDurationHours: 75, linkedToSection: undefined 
    },
    { 
        id: '1', phase: 'Guía', activity: 'Perfora c/trépano 13-1/2" hasta TD (+ service)', 
        type: LineType.DRILLING, rop: 25, linkedToSection: 'GUIDE' 
    },
    { 
        id: '2', phase: 'Guía', activity: 'Circula + saca a superficie. Mbra de Calibre. Desarma BHA.', 
        type: LineType.TRIPPING, trippingSpeed: 82, linkedToSection: 'GUIDE' 
    },
    { 
        id: '3', phase: 'Guía', activity: 'Prepara para entubar', 
        type: LineType.FLAT_TIME, baseDurationHours: 2.5, linkedToSection: 'GUIDE' 
    },
    { 
        id: '4', phase: 'Guía', activity: 'Entuba cañería guia de 9 5/8"', 
        type: LineType.CASING, casingSpeed: 7, pipeLength: 14, linkedToSection: 'GUIDE' 
    },
    { 
        id: '5', phase: 'Guía', activity: 'Circula, prepara para cementar y cementa + top job', 
        type: LineType.CEMENTING, baseDurationHours: 4.5, linkedToSection: 'GUIDE' 
    },
    { 
        id: '6', phase: 'Guía', activity: 'Recupera caño de maniobra + instala sección "A"', 
        type: LineType.FLAT_TIME, baseDurationHours: 2.75, linkedToSection: 'GUIDE' 
    },
    { 
        id: '7', phase: 'Guía', activity: 'Monta BOP y lineas de choke y kill', 
        type: LineType.FLAT_TIME, baseDurationHours: 4, linkedToSection: 'GUIDE' 
    },
    { 
        id: '8', phase: 'Guía', activity: 'Prueba BOP', 
        type: LineType.FLAT_TIME, baseDurationHours: 4, isOfflineCapable: true, linkedToSection: 'GUIDE' 
    },
    { 
        id: '9', phase: 'Aislación', activity: 'Arma BHA con trepano de 8 3/4" / MDF / Stb / Tijera...', 
        type: LineType.FLAT_TIME, baseDurationHours: 12.75, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '10', phase: 'Aislación', activity: 'Perfora hasta TD (+ Circulaciones + Registros + Service)', 
        type: LineType.DRILLING, rop: 30, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '11', phase: 'Aislación', activity: 'Circula + Mbra de Calibre - saca hasta zto 9-5/8" - baja a TD...', 
        type: LineType.TRIPPING, trippingSpeed: 130, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '12', phase: 'Aislación', activity: 'Circula y saca total para perfilar', 
        type: LineType.TRIPPING, trippingSpeed: 160, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '13', phase: 'Aislación', activity: 'Acondiciona + Perfila + Desmonta', 
        type: LineType.LOGGING, baseDurationHours: 24, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '14', phase: 'Aislación', activity: 'Prepara + Entuba Csg de 5 1/2"', 
        type: LineType.CASING, casingSpeed: 11, pipeLength: 14, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '15', phase: 'Aislación', activity: 'Circula en el fondo. Acondiciona Lodo', 
        type: LineType.FLAT_TIME, baseDurationHours: 2.25, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '16', phase: 'Aislación', activity: 'Prepara equipo y cementa. Desmonta Cía de cementación.', 
        type: LineType.CEMENTING, baseDurationHours: 5, linkedToSection: 'ISOLATION' 
    },
    { 
        id: '17', phase: 'Aislación', activity: 'Levanta BOP + Asienta Csg 5-1/2" en cuñas + Empaqueta...', 
        type: LineType.FLAT_TIME, baseDurationHours: 6, linkedToSection: 'ISOLATION' 
    }
];

// Definition of which lines use Rate A vs Rate B
export const ITEMS_RATE_A = ['1', '2', '9', '10', '11', '12'];
export const ITEMS_RATE_B = ['3', '4', '5', '6', '7', '8', '13', '14', '15', '16', '17'];

export const MOCKED_COST_CATALOG: CostCatalogItem[] = [
    // === 02.01 EQUIPO ===
    
    // --- H-202 ---
    { category: 'EQUIPO', subcategory: 'H-202', item: 'MOVILIZACION', unit: 'UNI', cost: 1500000.00, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'DTM CORTO', unit: 'UNI', cost: 107932.58, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'DTM EXCESO > 20KM', unit: 'KM', cost: 2158.65, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'DTM TRAILER CORTO', unit: 'HS', cost: 20000.00, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'DTM TRAILER EXCESO', unit: 'HS', cost: 1535.63, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'TARIFA A', unit: 'HS', cost: 1458.85, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'TARIFA B', unit: 'HS', cost: 1382.06, equipmentType: 'H-202' },
    { category: 'EQUIPO', subcategory: 'H-202', item: 'TARIFA C', unit: 'HS', cost: 1382.06, equipmentType: 'H-202' }, // Fuel
    { category: 'EQUIPO', subcategory: 'H-202', item: 'VARIOS', unit: 'UNI', cost: 72171.54, equipmentType: 'H-202' },

    // --- H-203 (Added to match user request: "If there are 10 rigs, take tariffs associated with that RIG") ---
    // Assuming slightly different/higher costs for H-203 for simulation variety
    { category: 'EQUIPO', subcategory: 'H-203', item: 'MOVILIZACION', unit: 'UNI', cost: 1550000.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'DTM CORTO', unit: 'UNI', cost: 110000.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'DTM EXCESO > 20KM', unit: 'KM', cost: 2200.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'DTM TRAILER CORTO', unit: 'HS', cost: 21000.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'DTM TRAILER EXCESO', unit: 'HS', cost: 1600.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'TARIFA A', unit: 'HS', cost: 1500.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'TARIFA B', unit: 'HS', cost: 1420.00, equipmentType: 'H-203' },
    { category: 'EQUIPO', subcategory: 'H-203', item: 'TARIFA C', unit: 'HS', cost: 1400.00, equipmentType: 'H-203' }, // Fuel
    { category: 'EQUIPO', subcategory: 'H-203', item: 'VARIOS', unit: 'UNI', cost: 75000.00, equipmentType: 'H-203' },


    // --- 02.02 SERVICIOS (Generic - Applies to all rigs unless filtered) ---
    { category: 'SERVICIOS', subcategory: 'General', item: 'DIESEL', unit: 'DIA', cost: 3000 },
    { category: 'SERVICIOS', subcategory: 'General', item: 'LODO / FLUIDOS', unit: 'DIA', cost: 2500 },
    
    // Servicios Condicionales (Direccional)
    { category: 'SERVICIOS', subcategory: 'Direccional', item: 'HERRAMIENTAS DIR', unit: 'DIA', cost: 6500, requiredForDir: true },
    { category: 'SERVICIOS', subcategory: 'Direccional', item: 'PERSONAL DIR', unit: 'DIA', cost: 1200, requiredForDir: true },

    // Servicios Condicionales (Convencional / Vertical)
    { category: 'SERVICIOS', subcategory: 'Medicion', item: 'SINGLE SHOT / INCLINATION', unit: 'UNI', cost: 1500, excludedForDir: true, applyToLines: ['9', '10', '11', '12', '13'] },

    // Specific Items
    { category: 'SERVICIOS', subcategory: 'Trepanos', item: 'TREPANO 13 1/2', unit: 'MTS', cost: 250, applyToLines: ['1'] }, 
    { category: 'SERVICIOS', subcategory: 'Trepanos', item: 'TREPANO 8 3/4', unit: 'MTS', cost: 450, applyToLines: ['10'] }, 
    
    { category: 'SERVICIOS', subcategory: 'Tijeras', item: 'ALQUILER MENSUAL', unit: 'MES', cost: 18000 }, 
    
    { category: 'SERVICIOS', subcategory: 'Control Geologico', item: 'MUD LOGGING UNIT', unit: 'DIA', cost: 1200 },

    { category: 'SERVICIOS', subcategory: 'Logging', item: 'PERFILAJE STANDARD', unit: 'UNI', cost: 45000, applyToLines: ['13'] },
    
    // --- 02.03 MATERIALES - CASING ---
    // Guide Casing (Item 4)
    { category: 'MATERIALES', subcategory: 'Casing', item: '9-5/8 32.3 STC H40', unit: 'MTS', cost: 95, wellType: 'Convencional' },
    { category: 'MATERIALES', subcategory: 'Casing', item: '9-5/8 32.3 TXP-LW H40', unit: 'MTS', cost: 130, wellType: 'NOC Premium + DwC' }, 
    { category: 'MATERIALES', subcategory: 'Casing', item: '9-5/8 32.3 TXP-LW H40', unit: 'MTS', cost: 130, wellType: 'NOC BTC' },

    // Isolation Casing (Item 15/14)
    { category: 'MATERIALES', subcategory: 'Casing', item: '5-1/2 17 LTC K55', unit: 'MTS', cost: 65 }, 
    { category: 'MATERIALES', subcategory: 'Casing', item: '5-1/2 17 LTC N80', unit: 'MTS', cost: 85 }, 
    { category: 'MATERIALES', subcategory: 'Casing', item: '5-1/2 17 TBL N80', unit: 'MTS', cost: 110 }, 
];


export const DIRECTIONAL_ROP_PENALTY = 0.85; 

export const MOCKED_ACTIVITY_SCHEDULE: Well[] = [
    { id: 'PC-4030', name: 'PC-4030', type: 'Convencional', equipment: 'H-202', startDate: '2026-01-01', done: false },
    { id: 'PCx-4034', name: 'PCx-4034', type: 'Convencional', equipment: 'H-203', startDate: '2026-01-16', done: false },
    { id: 'EH-5019', name: 'EH-5019', type: 'Convencional', equipment: 'H-202', startDate: '2026-01-31', done: false },
    { id: 'EH-5020', name: 'EH-5020', type: 'Convencional', equipment: 'H-203', startDate: '2026-02-15', done: false },
    { id: 'EH-5021', name: 'EH-5021', type: 'Convencional', equipment: 'H-202', startDate: '2026-03-02', done: false },
    { id: 'PC-4032', name: 'PC-4032', type: 'NOC Premium + DwC', equipment: 'H-203', startDate: '2026-03-17', done: false },
    { id: 'PCx-40342', name: 'PCx-40342', type: 'NOC Premium + DwC', equipment: 'H-202', startDate: '2026-04-01', done: false },
    { id: 'EH-50191', name: 'EH-50191', type: 'NOC Premium + DwC', equipment: 'H-203', startDate: '2026-04-16', done: false },
    { id: 'EH-50201', name: 'EH-50201', type: 'NOC Premium + DwC', equipment: 'H-202', startDate: '2026-05-01', done: false },
    { id: 'EH-50212', name: 'EH-50212', type: 'Convencional', equipment: 'H-203', startDate: '2026-05-16', done: false },
    { id: 'PC-40302', name: 'PC-40302', type: 'Convencional', equipment: 'H-202', startDate: '2026-05-31', done: false },
    { id: 'PCx-40342-2', name: 'PCx-40342', type: 'Convencional', equipment: 'H-203', startDate: '2026-06-15', done: false },
    { id: 'EH-50193', name: 'EH-50193', type: 'Convencional', equipment: 'H-202', startDate: '2026-06-30', done: false },
    { id: 'EH-50203', name: 'EH-50203', type: 'Convencional', equipment: 'H-203', startDate: '2026-07-15', done: false },
    { id: 'EH-50213', name: 'EH-50213', type: 'Convencional', equipment: 'H-202', startDate: '2026-07-30', done: false },
    { id: 'PC-40303', name: 'PC-40303', type: 'Convencional', equipment: 'H-203', startDate: '2026-08-14', done: false },
    { id: 'PCx-40343', name: 'PCx-40343', type: 'Convencional', equipment: 'H-202', startDate: '2026-08-29', done: false },
    { id: 'EH-50194', name: 'EH-50194', type: 'Convencional', equipment: 'H-203', startDate: '2026-09-13', done: false },
    { id: 'EH-50204', name: 'EH-50204', type: 'Convencional', equipment: 'H-202', startDate: '2026-09-28', done: false },
    { id: 'EH-50214', name: 'EH-50214', type: 'Convencional', equipment: 'H-203', startDate: '2026-10-13', done: false },
    { id: 'PC-40304', name: 'PC-40304', type: 'Convencional', equipment: 'H-202', startDate: '2026-10-28', done: false },
    { id: 'PCx-40344', name: 'PCx-40344', type: 'Convencional', equipment: 'H-203', startDate: '2026-11-12', done: false },
    { id: 'EH-50195', name: 'EH-50195', type: 'Convencional', equipment: 'H-202', startDate: '2026-11-27', done: false },
    { id: 'EH-50205', name: 'EH-50205', type: 'Convencional', equipment: 'H-203', startDate: '2026-12-12', done: false },
    { id: 'EH-50215', name: 'EH-50215', type: 'NOC BTC', equipment: 'H-202', startDate: '2026-12-27', done: false },
];