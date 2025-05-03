/*  Simple math helpers  (no DOM access)
    ---------------------------------------------------------- */

/** euclidean distance ² */
const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;

/**
 * Returns true when two “points” are closer than `threshold` px.
 * Works with:
 *   – { centroid : [x,y] }      teeth
 *   – { position : [x,y] }      apex / base
 */
export function arePointsNear(a, b, threshold = 30) {
	if (!a || !b) return false;

	const [ax, ay] = a.centroid  ?? a.position ?? [];
	const [bx, by] = b.centroid  ?? b.position ?? [];

	return dist2(ax, ay, bx, by) < threshold ** 2;
}

/** classic dental quadrant from relative (0,0) image centre */
export function calculateQuadrant({ x, y }) {
	if ( x >= 0 && y < 0) return 1;
	if ( x <  0 && y < 0) return 2;
	if ( x <  0 && y >=0) return 3;
	return 4;            //  x >= 0 && y >= 0
}