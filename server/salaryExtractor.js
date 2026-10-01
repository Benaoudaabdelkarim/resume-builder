/**
 * Helper to extract salary/rate information (minRate, maxRate, rateType)
 * from job description text or JSON-LD schema.
 */

function parseNumber(numStr, isK) {
  if (!numStr) return null;
  const clean = String(numStr).replace(/[$,\s]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return isK ? Math.round(num * 1000) : num;
}

function detectRateType(min, max, unitText = '') {
  const u = (unitText || '').toLowerCase();
  if (u.includes('hour') || u.includes('hr') || u === 'h') return 'hourly';
  if (u.includes('month') || u.includes('mo') || u === 'm') return 'monthly';
  if (u.includes('year') || u.includes('yr') || u.includes('annual')) return 'yearly';

  // Infer based on amount magnitude if unit is absent
  const val = max || min || 0;
  if (val > 0 && val <= 300) return 'hourly';
  if (val >= 25000) return 'yearly';
  if (val >= 2000 && val < 25000) return 'monthly';
  return 'yearly';
}

export function extractSalaryInfo(text = '', jsonLdObj = null) {
  // 1. Try parsing JSON-LD Schema.org baseSalary / estimatedSalary
  if (jsonLdObj && typeof jsonLdObj === 'object') {
    const base = jsonLdObj.baseSalary || jsonLdObj.estimatedSalary || jsonLdObj.salary;
    if (base) {
      const val = base.value || base;
      const min = parseNumber(val.minValue ?? val.value, false);
      const max = parseNumber(val.maxValue ?? val.value, false);
      const unit = val.unitText || base.unitText || '';
      if (min !== null || max !== null) {
        const finalMin = min !== null ? min : max;
        const finalMax = max !== null ? max : min;
        return {
          minRate: Math.min(finalMin, finalMax),
          maxRate: Math.max(finalMin, finalMax),
          rateType: detectRateType(finalMin, finalMax, unit),
        };
      }
    }
  }

  if (!text || typeof text !== 'string') {
    return { minRate: null, maxRate: null, rateType: null };
  }

  // 2. Regex for Range: $X - $Y [an hour | per year | /hr | etc.]
  const rangeRegex = /(?:\$|CAD\s*\$|USD\s*\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]+)?)\s*([kK])?\s*(?:-|–|—|to)\s*(?:\$|CAD\s*\$|USD\s*\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]+)?)\s*([kK])?(?:\s*(?:an?\s*hour|per\s*hour|\/\s*hr|\/\s*hour|a\s*month|per\s*month|\/\s*mo|\/\s*month|a\s*year|per\s*year|\/\s*yr|\/\s*year|annually|per\s*annum))?/i;
  
  const rangeMatch = text.match(rangeRegex);
  if (rangeMatch) {
    const isK2 = Boolean(rangeMatch[4]);
    const isK1 = Boolean(rangeMatch[2]) || (isK2 && parseFloat(rangeMatch[1]) < 1000); // e.g. $140 - $180k
    const min = parseNumber(rangeMatch[1], isK1);
    const max = parseNumber(rangeMatch[3], isK2);
    const unitMatch = rangeMatch[0].match(/(hour|hr|month|mo|year|yr|annual)/i);
    const unit = unitMatch ? unitMatch[1] : '';

    if (min !== null && max !== null) {
      return {
        minRate: Math.min(min, max),
        maxRate: Math.max(min, max),
        rateType: detectRateType(min, max, unit),
      };
    }
  }

  // 3. Regex for Single rate: $X [an hour | per year | /hr | etc.]
  const singleRegex = /(?:\$|CAD\s*\$|USD\s*\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]+)?)\s*([kK])?\s*(?:an?\s*hour|per\s*hour|\/\s*hr|\/\s*hour|a\s*month|per\s*month|\/\s*mo|\/\s*month|a\s*year|per\s*year|\/\s*yr|\/\s*year|annually|per\s*annum)/i;
  
  const singleMatch = text.match(singleRegex);
  if (singleMatch) {
    const val = parseNumber(singleMatch[1], Boolean(singleMatch[2]));
    const unitMatch = singleMatch[0].match(/(hour|hr|month|mo|year|yr|annual)/i);
    const unit = unitMatch ? unitMatch[1] : '';
    if (val !== null) {
      return {
        minRate: val,
        maxRate: val,
        rateType: detectRateType(val, val, unit),
      };
    }
  }

  return { minRate: null, maxRate: null, rateType: null };
}
