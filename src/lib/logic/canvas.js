/**
 *  Minimal helpers for the free-hand segmentation layer
 *  All functions receive a <canvas> element & its 2d ctx.
 *  ------------------------------------------------------*/
import JSZip from 'jszip';


/* ===== create zip with mask and json ===== */
export async function createZipBlob(
	drawingCanvas, // Note: This is now optional and expected to be null if not provided
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
