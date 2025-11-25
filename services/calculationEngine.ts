import { ProgramLine, SimulationParams, SimulationResult, LineType, SimulationResultLine, Adjustment } from '../types';
import { INITIAL_PROGRAM, DAILY_RIG_RATE, SERVICE_RATE, DIESEL_RATE, LOGGING_FLAT_COST, MOVE_COST_PER_KM } from '../constants';

const applyAdjustment = (baseValue: number, adjustment: Adjustment | undefined, isTime: boolean): number => {
    if (!adjustment) return baseValue;
    
    if (isTime) {
        // Percentage adjustment on Time
        if (adjustment.type === 'PERCENTAGE_TIME') {
            return baseValue * (1 + (adjustment.value / 100));
        }
    } else {
        // Absolute adjustment on Speed/ROP
        if (adjustment.type === 'ABSOLUTE_VALUE') {
            return Math.max(0.1, baseValue + adjustment.value);
        }
    }
    return baseValue;
};

// 1. Fixed Time Engine
const calculateFixedTime = (line: ProgramLine, adj: Adjustment | undefined): number => {
    return applyAdjustment(line.baseDurationHours || 0, adj, true);
};

// 2. Proportional Engine (Drilling & Casing)
const calculateProportionalTime = (
    line: ProgramLine, 
    distance: number, 
    adj: Adjustment | undefined
): number => {
    if (line.type === LineType.DRILLING && line.rop) {
        const effectiveRop = applyAdjustment(line.rop, adj, false);
        return distance / effectiveRop;
    } 
    
    if (line.type === LineType.CASING && line.casingSpeed && line.pipeLength) {
        // Time = Distance / (Joints/hr * Meters/Joint)
        const speed = line.casingSpeed; // joints per hour
        const metersPerHr = speed * line.pipeLength;
        const effectiveSpeed = applyAdjustment(metersPerHr, adj, false); // Treat adjustment as speed increase for simplicity in this model
        return distance / effectiveSpeed;
    }

    return 0;
};

// 3. Statistical/Depth Dependent Engine (Tripping)
const calculateTrippingTime = (
    line: ProgramLine, 
    currentDepth: number, 
    adj: Adjustment | undefined
): number => {
    if (line.trippingSpeed) {
        // Logic: Time = Depth / Speed (m/h)
        // Note: The "Speed" here is an aggregate "Tripping Speed" (e.g. 130 m/h) representing the full maneuver
        const effectiveSpeed = applyAdjustment(line.trippingSpeed, adj, false);
        return currentDepth / effectiveSpeed;
    }
    return 0;
};

const calculateLineCost = (line: ProgramLine, hours: number, dtmKm: number): number => {
    const days = hours / 24;
    let dailyRate = DAILY_RIG_RATE + SERVICE_RATE + DIESEL_RATE;
    
    // Cost logic adjustments per type if needed
    let fixedCost = 0;

    if (line.type === LineType.LOGGING) {
        fixedCost += LOGGING_FLAT_COST;
    }
    if (line.type === LineType.MOVING) {
        // For moving, we might reduce daily rate or add mileage
        fixedCost += (dtmKm * MOVE_COST_PER_KM);
    }

    return (days * dailyRate) + fixedCost;
};

export const calculateWellProgram = (
    baseProgram: ProgramLine[],
    params: SimulationParams
): SimulationResult => {
    let cumulativeTimeHours = 0;
    let cumulativeCost = 0;
    let totalDTMHours = 0;
    
    // Trackers for current state
    let lastSectionDepth = 0; // Surface
    let currentBitDepth = 0;

    const resultLines: SimulationResultLine[] = [];
    const timeCurve: { time: number; depth: number; cost: number; activity: string; dashed?: boolean }[] = [
        { time: 0, depth: 0, cost: 0, activity: 'Start' }
    ];

    // Filter Loop
    const activeLines = baseProgram.filter(line => {
        if (params.isOfflineBOP && line.isOfflineCapable) return false;
        
        // Remove Logging lines AND Item 11 (Wiper trip for logging) if No Logging is active
        if (params.isNoLogging) {
            if (line.type === LineType.LOGGING) return false;
            if (line.id === '11') return false; 
        }
        
        return true;
    });

    // 1. Pre-calculate DTM hours to handle the table requirement (Days from Spud)
    activeLines.forEach(line => {
        if (line.type === LineType.MOVING || line.id === '0') {
            const duration = calculateFixedTime(line, params.adjustments[line.id]);
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

        // Determine Section Depths (Cascading Logic)
        let targetDepth = 0;
        if (line.linkedToSection === 'GUIDE') targetDepth = params.tdGuide;
        else if (line.linkedToSection === 'ISOLATION') targetDepth = params.tdIsolation;
        
        // Calculate Duration based on Type
        switch (line.type) {
            case LineType.MOVING:
            case LineType.FLAT_TIME:
            case LineType.CEMENTING:
            case LineType.LOGGING:
                duration = calculateFixedTime(line, params.adjustments[line.id]);
                break;

            case LineType.DRILLING:
                // Start from where the previous section ended (or 0)
                depthStart = (line.linkedToSection === 'ISOLATION') ? params.tdGuide : 0;
                depthEnd = targetDepth;
                sectionDistance = Math.max(0, depthEnd - depthStart);
                
                duration = calculateProportionalTime(line, sectionDistance, params.adjustments[line.id]);
                currentBitDepth = depthEnd; // Update global depth tracker
                lastSectionDepth = depthEnd;
                break;

            case LineType.CASING:
                // Casing runs from Surface (0) to Target Depth, but physically the hole depth doesn't change
                sectionDistance = targetDepth; 
                duration = calculateProportionalTime(line, sectionDistance, params.adjustments[line.id]);
                break;

            case LineType.TRIPPING:
                // Tripping time calculation
                duration = calculateTrippingTime(line, targetDepth, params.adjustments[line.id]);
                break;
        }

        const cost = calculateLineCost(line, duration, params.dtm);
        
        // Time & Cost Accumulation
        const startTimeDays = cumulativeTimeHours / 24;
        const startCost = cumulativeCost;

        cumulativeTimeHours += duration;
        cumulativeCost += cost;

        const endTimeDays = cumulativeTimeHours / 24;
        const endCost = cumulativeCost;

        // Days From Spud Logic:
        // If it's a DTM line, we display 0 or ignore it in the "Construction Days" count.
        // If it's post-DTM, we subtract the DTM duration.
        let daysFromSpud = 0;
        if (line.type !== LineType.MOVING && line.id !== '0') {
            daysFromSpud = (cumulativeTimeHours - totalDTMHours) / 24;
        }

        resultLines.push({
            ...line,
            calculatedDuration: duration,
            calculatedCost: cost,
            cumulativeTime: endTimeDays, // Total days for backend/charts
            daysFromSpud: daysFromSpud, // Display days for table
            cumulativeCost: cumulativeCost,
            depthStart: depthStart,
            depthEnd: currentBitDepth // Visualization sticks to bit depth
        });

        // Add Graph Points
        let graphDepthStart = depthStart;
        let graphDepthEnd = depthEnd;

        // Correction for non-drilling items: Depth line stays flat at current hole depth
        if (line.type !== LineType.DRILLING) {
             graphDepthStart = currentBitDepth;
             graphDepthEnd = currentBitDepth;
        }
        
        // Point at Start of Activity
        timeCurve.push({
            time: startTimeDays,
            depth: graphDepthStart,
            cost: startCost,
            activity: `${line.activity} (Start)`
        });

        // Point at End of Activity
        timeCurve.push({
            time: endTimeDays,
            depth: graphDepthEnd,
            cost: endCost,
            activity: line.activity
        });
    });

    // Generate Net Curve (Days From Spud)
    // We take the existing Time Curve and shift the Time axis by totalDTMDays.
    // We filter out any points where Time < 0 (i.e., the DTM phase itself).
    const timeCurveNet = timeCurve.map(point => ({
        ...point,
        time: Math.max(0, point.time - totalDTMDays), // Shift time
        dashed: true // Mark as dashed for UI if needed
    })).filter((point, index) => {
        // We only want to keep points that happen AFTER DTM.
        // The original timeCurve has total accumulated time.
        // If original time <= totalDTMDays, it is part of DTM (or exactly at spud).
        // We keep the point exactly at 0 (Spud) and everything after.
        
        // Find the index in the original timeCurve where DTM ends.
        // Simpler approach: Include if calculated Net Time >= 0
        // BUT, we want to ensure we have a clean start at 0,0.
        // The mapping `Math.max(0, ...)` ensures negative times become 0.
        // We just need to make sure we don't have a flat line at 0 for the whole DTM duration if we plot it.
        // Ideally, we filter out the actual DTM points.
        
        const originalTime = timeCurve[index].time;
        // Allow a small epsilon for float comparison, but strictly > is safer for filtering "Moving" phase points except the very last one which becomes 0
        return originalTime >= totalDTMDays;
    });

    // Ensure the Net Curve starts strictly at 0,0 (or 0, currentDepth)
    if (timeCurveNet.length > 0 && timeCurveNet[0].time > 0) {
        // Should not happen if we filter >= totalDTMDays and the DTM end point exists
    }
    
    // Correction: If the first point in filtered list is > 0, we might need an anchor.
    // But since DTM is the first item, the "End of DTM" point in timeCurve has time = totalDTMDays.
    // So time - totalDTMDays = 0. So we have our 0 point.

    return {
        lines: resultLines,
        totalTimeDays: cumulativeTimeHours / 24,
        totalCost: cumulativeCost,
        timeCurve,
        timeCurveNet
    };
};