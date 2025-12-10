
import { ProgramLine, SimulationParams, SimulationResult, LineType, SimulationResultLine, Adjustment, CostCatalogItem, CostSummaryRow } from '../types';
import { DIRECTIONAL_ROP_PENALTY, ITEMS_RATE_A, ITEMS_RATE_B } from '../constants';

const applyAdjustment = (baseValue: number, adjustment: Adjustment | undefined, isTime: boolean, isDirectional: boolean): number => {
    let finalValue = baseValue;

    // Apply complexity penalty for directional wells on Speed/ROP
    if (!isTime && isDirectional) {
        finalValue = finalValue * DIRECTIONAL_ROP_PENALTY;
    }

    if (!adjustment) return finalValue;
    
    if (isTime) {
        // Percentage adjustment on Time
        if (adjustment.type === 'PERCENTAGE_TIME') {
            return finalValue * (1 + (adjustment.value / 100));
        }
    } else {
        // Absolute adjustment on Speed/ROP
        if (adjustment.type === 'ABSOLUTE_VALUE') {
            return Math.max(0.1, finalValue + adjustment.value);
        }
    }
    return finalValue;
};

// 1. Fixed Time Engine
const calculateFixedTime = (line: ProgramLine, adj: Adjustment | undefined, isDirectional: boolean): number => {
    return applyAdjustment(line.baseDurationHours || 0, adj, true, isDirectional);
};

// 2. Proportional Engine (Drilling & Casing)
const calculateProportionalTime = (
    line: ProgramLine, 
    distance: number, 
    adj: Adjustment | undefined,
    isDirectional: boolean
): number => {
    if (line.type === LineType.DRILLING && line.rop) {
        const effectiveRop = applyAdjustment(line.rop, adj, false, isDirectional);
        return distance / effectiveRop;
    } 
    
    if (line.type === LineType.CASING && line.casingSpeed && line.pipeLength) {
        // Time = Distance / (Joints/hr * Meters/Joint)
        const speed = line.casingSpeed; // joints per hour
        const metersPerHr = speed * line.pipeLength;
        const effectiveSpeed = applyAdjustment(metersPerHr, adj, false, isDirectional); 
        return distance / effectiveSpeed;
    }

    return 0;
};

// 3. Statistical/Depth Dependent Engine (Tripping)
const calculateTrippingTime = (
    line: ProgramLine, 
    currentDepth: number, 
    adj: Adjustment | undefined,
    isDirectional: boolean
): number => {
    if (line.trippingSpeed) {
        // Logic: Time = Depth / Speed (m/h)
        const effectiveSpeed = applyAdjustment(line.trippingSpeed, adj, false, isDirectional);
        return currentDepth / effectiveSpeed;
    }
    return 0;
};

// --- COST ENGINE ---

// Filter catalog helper
const getCatalogItem = (
    catalog: CostCatalogItem[], 
    category: string, 
    unit: string | undefined, 
    filters: { subcategory?: string, item?: string, equipmentType?: string, wellType?: string }
): CostCatalogItem | undefined => {
    return catalog.find(c => {
        if (c.category !== category) return false;
        if (unit && c.unit !== unit) return false;
        if (filters.equipmentType && c.equipmentType && c.equipmentType !== filters.equipmentType) return false;
        if (filters.wellType && c.wellType && !filters.wellType.includes(c.wellType)) return false; 
        if (filters.subcategory && c.subcategory !== filters.subcategory) return false;
        if (filters.item && c.item !== filters.item) return false;
        return true;
    });
};

const mapCategoryToGroup = (cat: string): string => {
    if (cat === 'EQUIPO') return '02.01 EQUIPO';
    if (cat === 'SERVICIOS') return '02.02 SERVICIOS';
    if (cat === 'MATERIALES') return '02.03 MATERIALES';
    return cat;
};

const calculateCostsWithDetails = (
    line: ProgramLine, 
    days: number, // Duration in days
    params: SimulationParams,
    context: { depth: number, sectionMeters: number },
    catalog: CostCatalogItem[],
    warnings: Set<string>
): { totalCost: number, details: CostSummaryRow[] } => {
    let lineCost = 0;
    const details: CostSummaryRow[] = [];
    const hours = days * 24;

    const addCost = (item: CostCatalogItem, qty: number) => {
        const amount = item.cost * qty;
        lineCost += amount;
        details.push({
            group: mapCategoryToGroup(item.category),
            item: item.subcategory,
            description: item.item,
            unit: item.unit,
            price: item.cost,
            quantity: qty,
            total: amount
        });
    };

    // 1. EQUIPMENT COST (02.01)
    
    // Logic for TARIFA A / B
    let rateItemName = '';
    if (ITEMS_RATE_A.includes(line.id)) rateItemName = 'TARIFA A';
    else if (ITEMS_RATE_B.includes(line.id)) rateItemName = 'TARIFA B';

    if (rateItemName) {
        const rateItem = getCatalogItem(catalog, 'EQUIPO', 'HS', { item: rateItemName, equipmentType: params.equipmentType });
        if (rateItem) {
            addCost(rateItem, hours);
        } else {
            warnings.add(`Missing Cost Item: EQUIPO / ${params.equipmentType} / ${rateItemName}`);
        }
    }

    // TARIFA C (Fuel) logic was removed as it's already included in the base hourly rates (A/B).
    // This prevents double-counting the fuel cost on every activity.
    // Logic for Mobilization / DTM (Item 0 Only)
    if (line.id === '0' || line.type === LineType.MOVING) {
        if (params.isFirstWell) {
            // Apply Mobilization
            const mobItem = getCatalogItem(catalog, 'EQUIPO', 'UNI', { item: 'MOVILIZACION', equipmentType: params.equipmentType });
            if (mobItem) addCost(mobItem, 1);
            else warnings.add(`Missing: EQUIPO / ${params.equipmentType} / MOVILIZACION`);
        } else {
            // Apply DTM Short
            const dtmShort = getCatalogItem(catalog, 'EQUIPO', 'UNI', { item: 'DTM CORTO', equipmentType: params.equipmentType });
            if (dtmShort) addCost(dtmShort, 1);
            else warnings.add(`Missing: EQUIPO / ${params.equipmentType} / DTM CORTO`);

            // Apply Trailer Short
            const trailerShort = getCatalogItem(catalog, 'EQUIPO', 'HS', { item: 'DTM TRAILER CORTO', equipmentType: params.equipmentType });
            if (trailerShort) addCost(trailerShort, params.trailerHours);
            else warnings.add(`Missing: EQUIPO / ${params.equipmentType} / DTM TRAILER CORTO`);
        }
        
        // DTM Excess Logic
        if (!params.isFirstWell && params.dtm > 20) {
            // Rig Excess
            const dtmExcess = getCatalogItem(catalog, 'EQUIPO', 'KM', { item: 'DTM EXCESO > 20KM', equipmentType: params.equipmentType });
            if (dtmExcess) {
                addCost(dtmExcess, params.dtm - 20);
            } else warnings.add(`Missing: EQUIPO / ${params.equipmentType} / DTM EXCESO > 20KM`);

            // Trailer Excess (Applied if dist > 20)
            const trailerExcess = getCatalogItem(catalog, 'EQUIPO', 'HS', { item: 'DTM TRAILER EXCESO', equipmentType: params.equipmentType });
             if (trailerExcess) {
                 // Assuming unit is Hours, applied to the Trailer Hours duration if the move is > 20km
                 addCost(trailerExcess, params.trailerHours); 
            } else warnings.add(`Missing: EQUIPO / ${params.equipmentType} / DTM TRAILER EXCESO`);
        }
    }

    // 2. SERVICES COST (02.02)
    const serviceItems = catalog.filter(c => c.category === 'SERVICIOS');
    
    serviceItems.forEach(svc => {
        let applies = false;
        let quantity = 0;

        // Condition 1: Check Line Specificity
        if (svc.applyToLines && !svc.applyToLines.includes(line.id)) return;
        
        // Condition 2: Directional Exclusion/Inclusion
        if (svc.requiredForDir && !params.isDirectional) return;
        if (svc.excludedForDir && params.isDirectional) return;

        // Condition 3: Geo Control
        if (svc.subcategory === 'Control Geologico' && !params.hasGeologicalControl) return;

        // Apply Logic based on Unit
        if (svc.unit === 'DIA') {
            if (!svc.applyToLines) {
                 quantity = days;
                 applies = true;
            } else if (svc.applyToLines.includes(line.id)) {
                 quantity = days;
                 applies = true;
            }
        } else if (svc.unit === 'MTS') {
            if (line.type === LineType.DRILLING && svc.applyToLines?.includes(line.id)) {
                quantity = context.sectionMeters;
                applies = true;
            }
        } else if (svc.unit === 'UNI') {
            if (svc.applyToLines?.includes(line.id)) {
                quantity = 1;
                applies = true;
            }
        } else if (svc.unit === 'MES') {
            if (line.id !== '0' && line.type !== LineType.MOVING) {
                quantity = days / 30; // pro-rated
                applies = true;
            }
        }

        if (applies) {
            addCost(svc, quantity);
        }
    });

    // 3. MATERIALS COST (02.03) - CASING Logic
    if (line.type === LineType.CASING) {
        // Guide Casing (Item 4)
        if (line.id === '4') {
            const casingItem = catalog.find(c => 
                c.category === 'MATERIALES' && 
                c.subcategory === 'Casing' && 
                c.item.includes('9-5/8') &&
                (c.wellType ? params.wellType.includes(c.wellType) : true)
            );
            const fallback = catalog.find(c => c.category === 'MATERIALES' && c.item.includes('9-5/8'));
            const finalCasing = casingItem || fallback;
            
            if (finalCasing) {
                addCost(finalCasing, context.sectionMeters);
            } else {
                warnings.add(`Missing Material: 9-5/8 Casing for ${params.wellType}`);
            }
        }

        // Isolation Casing (Item 14/15)
        if (line.id === '14' || line.id === '15') { 
             if (line.id === '14') {
                 const TD = params.tdIsolation;
                 const isConv = params.wellType.includes('Convencional');
                 
                 if (isConv) {
                     if (TD <= 2400) {
                         const k55 = catalog.find(c => c.item.includes('K55'));
                         if (k55) addCost(k55, TD);
                         else warnings.add('Missing Material: K55 Casing');
                     } else {
                         const n80 = catalog.find(c => c.item.includes('LTC N80'));
                         const k55 = catalog.find(c => c.item.includes('K55'));
                         if (n80 && k55) {
                             addCost(n80, 400);
                             addCost(k55, TD - 400);
                         } else warnings.add('Missing Material: N80/K55 Combined String');
                     }
                 } else {
                     const premiumN80 = catalog.find(c => c.item.includes('TBL N80'));
                     if (premiumN80) addCost(premiumN80, TD);
                     else warnings.add('Missing Material: TBL N80 Casing');
                 }
             }
        }
    }

    return { totalCost: lineCost, details };
};


export const calculateWellProgram = (
    baseProgram: ProgramLine[],
    params: SimulationParams,
    catalog: CostCatalogItem[]
): SimulationResult => {
    let cumulativeTimeHours = 0;
    let cumulativeCost = 0;
    let totalDTMHours = 0;
    let currentBitDepth = 0;

    const resultLines: SimulationResultLine[] = [];
    const warnings = new Set<string>();
    let allCostDetails: CostSummaryRow[] = [];

    const timeCurve: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[] = [
        { time: 0, depth: 0, cost: 0, activity: 'Start' }
    ];

    const activeLines = baseProgram.filter(line => {
        if (params.isOfflineBOP && line.isOfflineCapable) return false;
        if (params.isNoLogging) {
            if (line.type === LineType.LOGGING) return false;
            if (line.id === '11') return false; 
        }
        return true;
    });

    // 1. Pre-calculate DTM hours
    activeLines.forEach(line => {
        if (line.type === LineType.MOVING || line.id === '0') {
            const duration = calculateFixedTime(line, params.adjustments[line.id], params.isDirectional);
            totalDTMHours += duration;
        }
    });

    const totalDTMDays = totalDTMHours / 24;

    // 2. Calculation Loop
    activeLines.forEach(line => {
        let duration = 0;
        let depthStart = currentBitDepth;
        let depthEnd = currentBitDepth;
        let sectionDistance = 0;

        let targetDepth = 0;
        if (line.linkedToSection === 'GUIDE') targetDepth = params.tdGuide;
        else if (line.linkedToSection === 'ISOLATION') targetDepth = params.tdIsolation;
        
        switch (line.type) {
            case LineType.MOVING:
            case LineType.FLAT_TIME:
            case LineType.CEMENTING:
            case LineType.LOGGING:
                duration = calculateFixedTime(line, params.adjustments[line.id], params.isDirectional);
                break;

            case LineType.DRILLING:
                depthStart = (line.linkedToSection === 'ISOLATION') ? params.tdGuide : 0;
                depthEnd = targetDepth;
                sectionDistance = Math.max(0, depthEnd - depthStart);
                duration = calculateProportionalTime(line, sectionDistance, params.adjustments[line.id], params.isDirectional);
                currentBitDepth = depthEnd; 
                break;

            case LineType.CASING:
                sectionDistance = targetDepth; 
                duration = calculateProportionalTime(line, sectionDistance, params.adjustments[line.id], params.isDirectional);
                break;

            case LineType.TRIPPING:
                duration = calculateTrippingTime(line, targetDepth, params.adjustments[line.id], params.isDirectional);
                break;
        }

        // Apply Cost Engine
        const costResult = calculateCostsWithDetails(
            line, 
            duration / 24, 
            params, 
            { depth: targetDepth, sectionMeters: sectionDistance },
            catalog,
            warnings
        );
        
        // Accumulate details
        allCostDetails = [...allCostDetails, ...costResult.details];

        const startTimeDays = cumulativeTimeHours / 24;
        const startCost = cumulativeCost;

        cumulativeTimeHours += duration;
        cumulativeCost += costResult.totalCost;

        const endTimeDays = cumulativeTimeHours / 24;
        const endCost = cumulativeCost;

        let daysFromSpud = 0;
        if (line.type !== LineType.MOVING && line.id !== '0') {
            daysFromSpud = (cumulativeTimeHours - totalDTMHours) / 24;
        }

        resultLines.push({
            ...line,
            calculatedDuration: duration,
            calculatedCost: costResult.totalCost,
            cumulativeTime: endTimeDays,
            daysFromSpud: daysFromSpud,
            cumulativeCost: cumulativeCost,
            depthStart: depthStart,
            depthEnd: currentBitDepth 
        });

        let graphDepthStart = depthStart;
        let graphDepthEnd = depthEnd;

        if (line.type !== LineType.DRILLING) {
             graphDepthStart = currentBitDepth;
             graphDepthEnd = currentBitDepth;
        }
        
        timeCurve.push({
            time: startTimeDays,
            depth: graphDepthStart,
            cost: startCost,
            activity: `${line.activity} (Start)`
        });

        timeCurve.push({
            time: endTimeDays,
            depth: graphDepthEnd,
            cost: endCost,
            activity: line.activity
        });
    });

    // 3. Aggregate Cost Summary
    const aggregatedSummary: CostSummaryRow[] = [];
    const map = new Map<string, CostSummaryRow>();

    allCostDetails.forEach(detail => {
        const key = `${detail.group}|${detail.item}|${detail.description}|${detail.price}`;
        if (map.has(key)) {
            const existing = map.get(key)!;
            existing.quantity += detail.quantity;
            existing.total += detail.total;
        } else {
            map.set(key, { ...detail });
        }
    });

    const sortedSummary = Array.from(map.values()).sort((a, b) => {
        if (a.group < b.group) return -1;
        if (a.group > b.group) return 1;
        if (a.item < b.item) return -1;
        if (a.item > b.item) return 1;
        return 0;
    });

    const timeCurveNet = timeCurve.map(point => ({
        ...point,
        time: Math.max(0, point.time - totalDTMDays), 
        dashed: true 
    })).filter((point, index) => {
        const originalTime = timeCurve[index].time;
        return originalTime >= totalDTMDays;
    });

    return {
        lines: resultLines,
        totalTimeDays: cumulativeTimeHours / 24,
        totalCost: cumulativeCost,
        timeCurve,
        timeCurveNet,
        costSummary: sortedSummary,
        warnings: Array.from(warnings)
    };
};
