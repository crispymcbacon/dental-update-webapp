/*  Business-logic helpers for teeth & points
    (pure functions – no DOM, no Svelte)                     */

import { calculateQuadrant } from './geometry.js';

/* ────────────────────────────────────────────────────────────
   INTERNAL HELPERS
   ---------------------------------------------------------------- */

/** next incremental id for teeth[] */
const nextToothId  = (teeth) => teeth.length
	? Math.max(...teeth.map(t => t.tooth_id)) + 1
	: 1;

/** next incremental id for apex/base arrays */
const nextPointId  = (arr) => arr.length
	? Math.max(...arr.map(p => p.point_id)) + 1
	: 1;

/** clone utility */
const clone = (o) => structuredClone(o);

/** recompute relative_position & quadrant */
export function recalcTooth(tooth, imgSize) {
	const [h, w] = imgSize;
	tooth.relative_position = { x: tooth.centroid[0] - w / 2, y: tooth.centroid[1] - h / 2 };
	tooth.quadrant          = calculateQuadrant(tooth.relative_position);
}

/* ────────────────────────────────────────────────────────────
   PUBLIC API – every function receives *data*, returns *NEW data*
   (immutability = time-travel + undo is trivial)              */

/**
 *  Add a new central point (“tooth”) at svg-coords (x,y)
 *  • prompts for unique number happens at component level – here we
 *    just receive the chosen number.
 */
export function addTooth(data, { x, y }, toothNumber) {
	const d = clone(data);
	const id = nextToothId(d.teeth);

	const newTooth = {
		tooth_id  : id,
		tooth_number : toothNumber,
		centroid  : [x, y],
		area      : 0, width: 0, height: 0, bbox: [0,0,0,0],
		confidence: 1.0,   // default
		relative_position : {}, quadrant : 0
	};

	recalcTooth(newTooth, d.image_size);
	d.teeth.push(newTooth);
	return d;
}

/** move existing tooth (drag) */
export function moveTooth(data, tooth_number, { x, y }) {
	const d = clone(data);
	const t = d.teeth.find(t => t.tooth_number === tooth_number);
	if (!t) return d;
	t.centroid = [x, y];
	recalcTooth(t, d.image_size);
	return d;
}

/** delete tooth completely */
export function deleteTooth(data, tooth_number) {
	const d = clone(data);
	// Find the tooth to get its number if needed for points, before filtering teeth array
	const toothToDelete = d.teeth.find(t => t.tooth_number === tooth_number);
	if (!toothToDelete) return d; // Tooth not found

	d.teeth = d.teeth.filter(t => t.tooth_number !== tooth_number);

	// also wipe apex/base bound to that tooth number
	if (d.apex_points ) d.apex_points  = d.apex_points .filter(p => p.tooth_number !== tooth_number);
	if (d.base_points ) d.base_points  = d.base_points .filter(p => p.tooth_number !== tooth_number);
	return d;
}

/* ---------- apex & base points --------------------------------- */

/** insert apex OR base near a given toothNumber */
export function addPoint(data, type /* 'apex' | 'base' */, toothNumber, { x, y }) {
	const key = type === 'apex' ? 'apex_points' : 'base_points';
	const d   = clone(data);

	// init array if missing
	if (!d[key]) {
		d[key] = [];
	}

	if (d[key].some(p => p.tooth_number === toothNumber))
		throw new Error(`${type} already exists for tooth ${toothNumber}`);

	const newPoint = {
		point_id    : nextPointId(d[key]),
		tooth_number: toothNumber,
		position    : [x, y],
		type
	};
	d[key].push(newPoint);
	return d;
}

/** move apex/base by its id */
export function movePoint(data, type /* 'apex' | 'base' */, point_id, { x, y }) {
	const key = type === 'apex' ? 'apex_points' : 'base_points';
	const d   = clone(data);
	const p   = d[key]?.find(p => p.point_id === point_id);
	if (p) p.position = [x, y];
	return d;
}

/** delete apex/base by id */
export function deletePoint(data, type /* 'apex' | 'base' */, point_id) {
	const key = type === 'apex' ? 'apex_points' : 'base_points';
	const d   = clone(data);
	if (d[key]) d[key] = d[key].filter(p => p.point_id !== point_id);
	return d;
}

/* ────────────────────────────────────────────────────────────
   SIMPLE VIEW HELPERS (no state)                               */

export const MIN_SCALE = 0.1;

export const zoomIn  = (scale, step = 0.1) => scale + step;
export const zoomOut = (scale, step = 0.1) => Math.max(MIN_SCALE, scale - step);

export const toggleFlag = (flag) => !flag;