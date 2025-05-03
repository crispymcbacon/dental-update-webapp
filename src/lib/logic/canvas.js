/**
 *  Minimal helpers for the free-hand segmentation layer
 *  All functions receive a <canvas> element & its 2d ctx.
 *  ------------------------------------------------------*/

/* ===== colors & line style ===== */
export function randomColor() {
	return '#' + Array.from({ length: 6 }, () =>
		Math.floor(Math.random() * 16).toString(16)
	).join('');
}

export function setupCanvas(canvas, imgSize, color = '#ff0000') {
	canvas.width  = imgSize[1];          // [h,w]  in your JSON
	canvas.height = imgSize[0];
	const ctx = canvas.getContext('2d');

	ctx.lineWidth   = 10;
	ctx.lineCap     = 'round';
	ctx.lineJoin    = 'round';
	ctx.strokeStyle = color;

	return ctx;
}

/* ===== drawing utilities ===== */
export function beginStroke(e, ctx, canvas) {
	const [x, y] = canvasCoords(e, canvas);
	ctx.beginPath();
	ctx.moveTo(x, y);
	return true;               // flag "isDrawing"
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
	const x = (e.clientX - rect.left) * (canvas.width  / rect.width);
	const y = (e.clientY - rect.top)  * (canvas.height / rect.height);
	return [x, y];
}

/* ===== merge drawn layer with original mask and download ===== */
export function downloadMergedMask(drawingCanvas, originalMaskDataURI, baseFilename='mask') {
	if (!drawingCanvas || !originalMaskDataURI) return;

	const maskImg = new Image();
	maskImg.src = originalMaskDataURI;

	maskImg.onload = () => {
		const { naturalWidth:w, naturalHeight:h } = maskImg;
		const tmp = Object.assign(document.createElement('canvas'), { width: w, height: h });
		const ctx = tmp.getContext('2d');

		// paint original mask first
		ctx.drawImage(maskImg, 0, 0, w, h);

		// composite new drawing (scaled)
		ctx.globalCompositeOperation = 'lighten';
		ctx.drawImage(drawingCanvas, 0, 0, w, h);   // auto-scale

		const link = document.createElement('a');
		link.download = `${baseFilename}_mask.png`;
		link.href      = tmp.toDataURL('image/png');
		link.click();
	};
}