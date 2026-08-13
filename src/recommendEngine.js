// ── Code Obsidian Recommendation Engine ─────────────────────────────────────
import { analyzeGaps } from './skillEngine';

/**
 * Recommends external courses and certifications based on user's skill gaps.
 * Uses deterministic ranking based on analyzeGaps() output.
 *
 * @param {Object} skills - User's skill state object
 * @param {Array} catalog - Array of course/cert items from courseCatalog.json
 * @param {Object} options - { limit: number }
 * @returns {Array} Ranked list of recommended course items
 */
export function recommendCourses(skills, catalog, { limit = 6 } = {}) {
    if (!catalog || !Array.isArray(catalog) || catalog.length === 0) return [];

    // 1. Calculate gap scores using canonical analyzeGaps
    const gaps = analyzeGaps(skills || {});
    const gapMap = new Map();
    gaps.forEach(g => {
        const skillName = g.name || g.skill || '';
        if (skillName) {
            gapMap.set(skillName.toLowerCase(), g.gapScore);
        }
    });

    // 2. Score catalog entries based on skill tag gap overlap
    const scoredCatalog = catalog.map(item => {
        let score = 0;
        const matchingGaps = [];

        (item.skillTags || []).forEach(tag => {
            const lowerTag = tag.toLowerCase();
            if (gapMap.has(lowerTag)) {
                const gapVal = gapMap.get(lowerTag);
                score += gapVal;
                matchingGaps.push({ tag, gapScore: gapVal });
            }
        });

        return {
            ...item,
            recommendScore: score,
            matchingGaps
        };
    });

    // 3. Sort by highest score first
    scoredCatalog.sort((a, b) => b.recommendScore - a.recommendScore);

    // 4. Diversify providers (avoid returning 6 entries from the exact same provider back-to-back)
    const result = [];
    const providerCounts = new Map();

    for (const item of scoredCatalog) {
        if (result.length >= limit) break;
        const count = providerCounts.get(item.provider) || 0;
        if (count < 2 || result.length >= catalog.length - 2) {
            result.push(item);
            providerCounts.set(item.provider, count + 1);
        }
    }

    // Fill remaining if limit not met
    if (result.length < limit) {
        for (const item of scoredCatalog) {
            if (result.length >= limit) break;
            if (!result.some(r => r.id === item.id)) {
                result.push(item);
            }
        }
    }

    return result;
}
