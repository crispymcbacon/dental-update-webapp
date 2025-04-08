export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function initializeCanvas(canvas, imageSize, color) {
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match the original image size
    canvas.width = imageSize[1]; // Width of the image
    canvas.height = imageSize[0]; // Height of the image

    // Initialize drawing properties
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return ctx;
}

export function startDrawing(e, ctx, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    return true;
}

export function draw(e, ctx, canvas, isDrawing) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
}

export function downloadMask(drawingCanvas, maskImageSrc, originalFilename = '') {
    if (!drawingCanvas || !maskImageSrc) return;

    const maskImage = new Image();
    maskImage.src = maskImageSrc;
    
    maskImage.onload = () => {
        const maskWidth = maskImage.naturalWidth;
        const maskHeight = maskImage.naturalHeight;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = maskWidth;
        tempCanvas.height = maskHeight;

        tempCtx.drawImage(maskImage, 0, 0, maskWidth, maskHeight);

        tempCtx.globalCompositeOperation = 'lighten';
        tempCtx.drawImage(
            drawingCanvas,
            0,
            0,
            drawingCanvas.width,
            drawingCanvas.height,
            0,
            0,
            maskWidth,
            maskHeight
        );

        // Generate filename based on original image name
        let downloadFilename = 'merged_mask.png';
        
        if (originalFilename) {
            // Extract the base name without extension
            const baseName = originalFilename.replace(/\.[^\.]+$/, '');
            downloadFilename = `${baseName}_mask.png`;
        }

        const mergedImage = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = downloadFilename;
        link.href = mergedImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    maskImage.onerror = () => {
        console.error('Failed to load the mask image.');
    };
}
