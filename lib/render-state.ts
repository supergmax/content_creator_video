/**
 * Shared in-memory render progress map.
 * Kept outside route files so Next.js route type checks don't reject it.
 */
export const renderProgress: Map<string, number> = new Map();
