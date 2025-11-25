import { ProgramLine, LineType } from './types';

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

export const DAILY_RIG_RATE = 45000; // USD per day
export const SERVICE_RATE = 15000; // USD per day
export const DIESEL_RATE = 3000; // USD per day
export const LOGGING_FLAT_COST = 35000; // USD per run
export const MOVE_COST_PER_KM = 500; // USD per km

export const DEFAULT_WELLS = [
    { id: 'W-101', name: 'Pozo Exploratorio X-1', startDate: '2024-01-15', type: 'Type A' },
    { id: 'W-102', name: 'Desarrollo D-22', startDate: '2024-03-01', type: 'Type A' },
    { id: 'W-103', name: 'Desarrollo D-23', startDate: '2024-04-15', type: 'Type A' },
    { id: 'W-104', name: 'Inyector I-05', startDate: '2024-06-01', type: 'Type A' },
    { id: 'W-105', name: 'Desarrollo D-24', startDate: '2024-08-20', type: 'Type A' },
];