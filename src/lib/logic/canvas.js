/**
 *  Minimal helpers for the free-hand segmentation layer
 *  All functions receive a <canvas> element & its 2d ctx.
 *  ------------------------------------------------------*/
import JSZip from 'jszip';

/* ===== colors & line style ===== */
export function randomColor() {
	return (
		'#' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
	);
}

export function setupCanvas(canvas, imgSize, color = '#ff0000') {
	canvas.width = imgSize[1]; // [h,w]  in your JSON
	canvas.height = imgSize[0];
	const ctx = canvas.getContext('2d');

	ctx.lineWidth = 10;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.strokeStyle = color;

	return ctx;
}

/* ===== drawing utilities ===== */
export function beginStroke(e, ctx, canvas) {
	const [x, y] = canvasCoords(e, canvas);
	ctx.beginPath();
	ctx.moveTo(x, y);
	return true; // flag "isDrawing"
}

export function continueStroke(e, ctx, canvas, isDrawing) {
	if (!isDrawing) return;
	const [x, y] = canvasCoords(e, canvas);
	ctx.lineTo(x, y);
	ctx.stroke();
}

/* helper – translate page-coords to canvas-coords */
function canvasCoords(e, canvas) {
	const rect = canvas.getBoundingClientRect();
	const x = (e.clientX - rect.left) * (canvas.width / rect.width);
	const y = (e.clientY - rect.top) * (canvas.height / rect.height);
	return [x, y];
}

/* ===== merge drawn layer with original mask and download ===== */
export function downloadMergedMask(drawingCanvas, originalMaskDataURI, baseFilename = 'mask') {
	if (!drawingCanvas || !originalMaskDataURI) return;

	const maskImg = new Image();
	maskImg.src = originalMaskDataURI;

	maskImg.onload = () => {
		const { naturalWidth: w, naturalHeight: h } = maskImg;
		const tmp = Object.assign(document.createElement('canvas'), { width: w, height: h });
		const ctx = tmp.getContext('2d');

		// paint original mask first
		ctx.drawImage(maskImg, 0, 0, w, h);

		// composite new drawing (scaled)
		ctx.globalCompositeOperation = 'lighten';
		ctx.drawImage(drawingCanvas, 0, 0, w, h); // auto-scale

		const link = document.createElement('a');
		link.download = `${baseFilename}_mask.png`;
		link.href = tmp.toDataURL('image/png');
		link.click();
	};
}

/* ===== create zip with mask and json ===== */
export async function createZipBlob(
	drawingCanvas,
	originalMaskDataURI,
	toothData,
	baseFilename = 'data'
) {
// Only require originalMaskDataURI and toothData. drawingCanvas is optional.
if (!originalMaskDataURI || !toothData) {
	throw new Error('Missing mask image URI or tooth data for zip creation.');
}

	const zip = new JSZip();

	// 1. Generate Mask Blob (async operation)
	const maskBlob = await new Promise((resolve, reject) => {
		const maskImg = new Image();
		maskImg.src = originalMaskDataURI;
		maskImg.onload = () => {
			const { naturalWidth: w, naturalHeight: h } = maskImg;
			const tmp = Object.assign(document.createElement('canvas'), { width: w, height: h });
			const ctx = tmp.getContext('2d');
		ctx.drawImage(maskImg, 0, 0, w, h); // Draw original mask

		// Draw user's drawing only if drawingCanvas exists
		if (drawingCanvas) {
			ctx.globalCompositeOperation = 'lighten';
			ctx.drawImage(drawingCanvas, 0, 0, w, h); // auto-scale
		}

		tmp.toBlob(resolve, 'image/png');
	};
		maskImg.onerror = reject;
	});

	if (maskBlob) {
		zip.file(`${baseFilename}_mask.png`, maskBlob);
	} else {
		console.error('Failed to generate mask blob.');
		// Optionally throw an error or handle it differently
	}

	// 2. Generate JSON Blob
	const jsonBlob = new Blob([JSON.stringify(toothData, null, 2)], { type: 'application/json' });
	zip.file(`${baseFilename}_teeth.json`, jsonBlob);

	// 3. Generate Zip Blob
	return zip.generateAsync({ type: 'blob' });
}
