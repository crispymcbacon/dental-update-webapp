// toothLogic.js

// Global state to track if any point is being dragged
export let isAnyPointDragging = false;

// Function to check proximity between two points
export function arePointsNear(point1, point2, threshold = 30) {
	if (!point1 || !point2) return false;
	
	// Extract coordinates based on point type
	const coords1 = point1.centroid || point1.position;
	const coords2 = point2.centroid || point2.position;
	
	if (!coords1 || !coords2) return false;
	
	const dx = coords1[0] - coords2[0];
	const dy = coords1[1] - coords2[1];
	return Math.sqrt(dx * dx + dy * dy) < threshold;
}
export function saveToHistory(history, currentIndex, toothData) {
	let newHistory = [...history];
	let newIndex = currentIndex;
	// Remove any future states if we're in the middle of the history
	if (newIndex < newHistory.length - 1) {
		newHistory = newHistory.slice(0, newIndex + 1);
	}

	// Save a deep copy of the current state
	newHistory = [...newHistory, JSON.parse(JSON.stringify(toothData))];
	newIndex = newHistory.length - 1;

	return { history: newHistory, currentIndex: newIndex };
}

export function undo(history, currentIndex, toothData) {
	let newHistory = [...history];
	let newIndex = currentIndex;
	let newToothData = toothData;

	if (newIndex > 0) {
		newIndex--;
		newToothData = JSON.parse(JSON.stringify(newHistory[newIndex]));
	}
	return { history: newHistory, currentIndex: newIndex, toothData: newToothData };
}

export function handleDragStart(event, panMode) {
	let dragging = false;
	if (!panMode) return { isDragging: dragging };

	dragging = true;
	const container = event.currentTarget;
	const startX = event.clientX || event.touches?.[0]?.clientX;
	const startY = event.clientY || event.touches?.[0]?.clientY;
	const scrollLeft = container.scrollLeft;
	const scrollTop = container.scrollTop;

	function handlePan(event) {
		if (!dragging) return;
		const x = (event.clientX || event.touches?.[0]?.clientX) - startX;
		const y = (event.clientY || event.touches?.[0]?.clientY) - startY;
		container.scrollLeft = scrollLeft - x;
		container.scrollTop = scrollTop - y;
	}

	function endPan() {
		dragging = false;
		window.removeEventListener('mousemove', handlePan);
		window.removeEventListener('mouseup', endPan);
		window.removeEventListener('touchmove', handlePan);
		window.removeEventListener('touchend', endPan);
	}

	window.addEventListener('mousemove', handlePan);
	window.addEventListener('mouseup', endPan);
	window.addEventListener('touchmove', handlePan);
	window.addEventListener('touchend', endPan);

	return { isDragging: dragging };
}

export function handleTouchStart(event, panMode) {
	return handleDragStart(event, panMode);
}

export function handleLabelDragStart(
	event,
	tooth,
	panMode,
	isDragging,
	currentTooth,
	toothData,
	history,
	currentIndex,
	setToothData // ADDED: Function to update toothData in Svelte component
) {
	if (panMode) return { isDragging, currentTooth, toothData, history, currentIndex };

	let dragging = true;
	let newCurrentTooth = tooth;
	let newToothData = toothData;
	
	// Set global dragging state to true
	isAnyPointDragging = true;

	const startX = event.clientX || event.touches?.[0]?.clientX;
	const startY = event.clientY || event.touches?.[0]?.clientY;

	function handleMove(event) {
		if (!dragging) return;

		const svg = document.querySelector('svg');
		const pt = svg.createSVGPoint();
		const CTM = svg.getScreenCTM();

		// Get current touch/mouse position
		pt.x = event.clientX || event.touches?.[0]?.clientX;
		pt.y = event.clientY || event.touches?.[0]?.clientY;

		// Transform point from screen coordinates to SVG coordinates
		const svgPoint = pt.matrixTransform(CTM.inverse());

		// Update tooth position
		newCurrentTooth.centroid = [svgPoint.x, svgPoint.y];
		recalculateProperties(newCurrentTooth, newToothData);

		// Directly update toothData in the Svelte component using the passed function
		// THIS IS THE CRITICAL CHANGE
		setToothData({ ...newToothData });
	}

	function endDrag() {
		if (dragging) {
			const result = saveToHistory(history, currentIndex, newToothData);
			history = result.history;
			currentIndex = result.currentIndex;
		}
		dragging = false;
		newCurrentTooth = null;
		
		// Reset global dragging state
		isAnyPointDragging = false;
		
		window.removeEventListener('mousemove', handleMove);
		window.removeEventListener('mouseup', endDrag);
		window.removeEventListener('touchmove', handleMove);
		window.removeEventListener('touchend', endDrag);
	}

	window.addEventListener('mousemove', handleMove);
	window.addEventListener('mouseup', endDrag);
	window.addEventListener('touchmove', handleMove);
	window.addEventListener('touchend', endDrag);

	return {
		isDragging: dragging,
		currentTooth: newCurrentTooth,
		toothData: newToothData,
		history,
		currentIndex
	};
}

// Helper functions

export function recalculateProperties(tooth, toothData) {
	// Calculate relative_position and quadrant
	const [imgHeight, imgWidth] = toothData.image_size;
	tooth.relative_position = {
		x: tooth.centroid[0] - imgWidth / 2,
		y: tooth.centroid[1] - imgHeight / 2
	};
	tooth.quadrant = calculateQuadrant(tooth.relative_position);
}

function calculateQuadrant(position) {
	if (position.x >= 0 && position.y < 0) return 1;
	if (position.x < 0 && position.y < 0) return 2;
	if (position.x < 0 && position.y >= 0) return 3;
	if (position.x >= 0 && position.y >= 0) return 4;
}

export function handleDelete(tooth, toothData, history, currentIndex) {
	let newToothData = { ...toothData };
	newToothData.teeth = newToothData.teeth.filter((t) => t !== tooth);
	const result = saveToHistory(history, currentIndex, newToothData);
	return { toothData: newToothData, history: result.history, currentIndex: result.currentIndex };
}

export function enableAddMode() {
	return true;
}

export function handleImageClick(event, addMode, toothData, history, currentIndex) {
	let newAddMode = addMode;
	let newToothData = toothData;
	let newHistory = history;
	let newCurrentIndex = currentIndex;
	if (newAddMode) {
		const svg = event.currentTarget;
		const pt = svg.createSVGPoint();

		// Get the SVG's CTM (Current Transform Matrix)
		const CTM = svg.getScreenCTM();

		// Set point to mouse position
		pt.x = event.clientX;
		pt.y = event.clientY;

		// Transform point from screen coordinates to SVG coordinates
		const svgPoint = pt.matrixTransform(CTM.inverse());

		const newToothId =
			newToothData.teeth.length > 0
				? Math.max(...newToothData.teeth.map((t) => t.tooth_id)) + 1
				: 1;

		const newTooth = {
			tooth_id: newToothId,
			centroid: [svgPoint.x, svgPoint.y],
			area: 0,
			width: 0,
			height: 0,
			bbox: [0, 0, 0, 0],
			confidence: 1.0,
			relative_position: {},
			quadrant: 0,
			tooth_number: null
		};
		recalculateProperties(newTooth, newToothData);

		let toothNumber = prompt('Enter tooth number:');
		while (newToothData.teeth.some((t) => t.tooth_number == toothNumber)) {
			toothNumber = prompt('Tooth number already exists. Enter a unique tooth number:');
		}
		newTooth.tooth_number = parseInt(toothNumber);

		newToothData = { ...newToothData, teeth: [...newToothData.teeth, newTooth] };
		const result = saveToHistory(newHistory, newCurrentIndex, newToothData);
		newHistory = result.history;
		newCurrentIndex = result.currentIndex;
		newAddMode = false;
	}

	return {
		addMode: newAddMode,
		toothData: newToothData,
		history: newHistory,
		currentIndex: newCurrentIndex
	};
}

export function zoomIn(scale) {
	return scale + 0.1;
}

export function zoomOut(scale) {
	return scale > 0.1 ? scale - 0.1 : scale;
}

export function downloadJson(toothData, filename = 'updated_teeth.json') {
	// Create a deep copy of the data to avoid modifying the original
	const exportData = JSON.parse(JSON.stringify(toothData));
	
	// Process the data to move apex and base points into the tooth objects
	if (exportData.teeth && exportData.teeth.length > 0) {
		exportData.teeth.forEach(tooth => {
			// Find apex point for this tooth
			if (exportData.apex_points && exportData.apex_points.length > 0) {
				const apexPoint = exportData.apex_points.find(p => p.tooth_number === tooth.tooth_number);
				if (apexPoint) {
					tooth.apex = apexPoint.position;
				}
			}
			
			// Find base point for this tooth
			if (exportData.base_points && exportData.base_points.length > 0) {
				const basePoint = exportData.base_points.find(p => p.tooth_number === tooth.tooth_number);
				if (basePoint) {
					tooth.base = basePoint.position;
				}
			}
		});
	}
	
	// Remove the apex_points and base_points arrays from the exported data
	delete exportData.apex_points;
	delete exportData.base_points;
	
	// Create the download link
	const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
	const downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute('href', dataStr);
	downloadAnchorNode.setAttribute('download', filename);
	document.body.appendChild(downloadAnchorNode);
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
	
	console.log('Exported data in the required format:', exportData);
	console.log('Saved with filename:', filename);
}

export function togglePanMode(panMode) {
	return !panMode;
}

export function enableAddApexMode() {
	return true;
}

export function enableAddBaseMode() {
	return true;
}

export function handleAddApexPoint(toothNumber, toothData, history, currentIndex) {
	let newToothData = { ...toothData };
	let newHistory = history;
	let newCurrentIndex = currentIndex;
	
	// Validate that the specified tooth exists
	const targetTooth = newToothData.teeth.find(t => t.tooth_number == toothNumber);
	if (!targetTooth) {
		alert('Tooth number does not exist. Please enter a valid tooth number.');
		return { toothData: newToothData, history: newHistory, currentIndex: newCurrentIndex };
	}
	
	// Check if apex point already exists for this tooth
	if (newToothData.apex_points && newToothData.apex_points.some(p => p.tooth_number == toothNumber)) {
		alert(`Apex point for tooth ${toothNumber} already exists.`);
		return { toothData: newToothData, history: newHistory, currentIndex: newCurrentIndex };
	}
	
	// Initialize apex_points array if it doesn't exist
	if (!newToothData.apex_points) {
		newToothData.apex_points = [];
	}
	
	// Create a new apex point near the tooth
	const newApexPoint = {
		point_id: newToothData.apex_points.length > 0 ? Math.max(...newToothData.apex_points.map(p => p.point_id)) + 1 : 1,
		tooth_number: parseInt(toothNumber),
		position: [targetTooth.centroid[0], targetTooth.centroid[1] - 30], // Position it above the tooth
		type: 'apex'
	};
	
	newToothData = { ...newToothData, apex_points: [...newToothData.apex_points, newApexPoint] };
	const result = saveToHistory(newHistory, newCurrentIndex, newToothData);
	
	return {
		toothData: newToothData,
		history: result.history,
		currentIndex: result.currentIndex
	};
}

export function handleAddBasePoint(toothNumber, toothData, history, currentIndex) {
	let newToothData = { ...toothData };
	let newHistory = history;
	let newCurrentIndex = currentIndex;
	
	// Validate that the specified tooth exists
	const targetTooth = newToothData.teeth.find(t => t.tooth_number == toothNumber);
	if (!targetTooth) {
		alert('Tooth number does not exist. Please enter a valid tooth number.');
		return { toothData: newToothData, history: newHistory, currentIndex: newCurrentIndex };
	}
	
	// Check if base point already exists for this tooth
	if (newToothData.base_points && newToothData.base_points.some(p => p.tooth_number == toothNumber)) {
		alert(`Base point for tooth ${toothNumber} already exists.`);
		return { toothData: newToothData, history: newHistory, currentIndex: newCurrentIndex };
	}
	
	// Initialize base_points array if it doesn't exist
	if (!newToothData.base_points) {
		newToothData.base_points = [];
	}
	
	// Create a new base point near the tooth
	const newBasePoint = {
		point_id: newToothData.base_points.length > 0 ? Math.max(...newToothData.base_points.map(p => p.point_id)) + 1 : 1,
		tooth_number: parseInt(toothNumber),
		position: [targetTooth.centroid[0], targetTooth.centroid[1] + 30], // Position it below the tooth
		type: 'base'
	};
	
	newToothData = { ...newToothData, base_points: [...newToothData.base_points, newBasePoint] };
	const result = saveToHistory(newHistory, newCurrentIndex, newToothData);
	
	return {
		toothData: newToothData,
		history: result.history,
		currentIndex: result.currentIndex
	};
}

export function handlePointDragStart(
	event,
	point,
	pointKey, // 'apex_points' or 'base_points'
	panMode,
	isDragging,
	currentPoint,
	toothData,
	history,
	currentIndex,
	setToothData
) {
	if (panMode) return { isDragging, currentPoint, toothData, history, currentIndex };

	let dragging = true;
	let newCurrentPoint = point;
	let newToothData = toothData;
	
	// Set global dragging state to true
	isAnyPointDragging = true;
	
	// We don't need to track start positions for point dragging
	// as we're directly mapping to SVG coordinates based on current mouse position

	function handleMove(event) {
		if (!dragging) return;

		const svg = document.querySelector('svg');
		const pt = svg.createSVGPoint();
		const CTM = svg.getScreenCTM();

		// Get current touch/mouse position
		pt.x = event.clientX || event.touches?.[0]?.clientX;
		pt.y = event.clientY || event.touches?.[0]?.clientY;

		// Transform point from screen coordinates to SVG coordinates
		const svgPoint = pt.matrixTransform(CTM.inverse());

		// Update point position
		newCurrentPoint.position = [svgPoint.x, svgPoint.y];

		// Directly update toothData in the Svelte component using the passed function
		setToothData({ ...newToothData });
	}

	function endDrag() {
		if (dragging) {
			const result = saveToHistory(history, currentIndex, newToothData);
			history = result.history;
			currentIndex = result.currentIndex;
		}
		dragging = false;
		newCurrentPoint = null;
		
		// Reset global dragging state
		isAnyPointDragging = false;
		
		window.removeEventListener('mousemove', handleMove);
		window.removeEventListener('mouseup', endDrag);
		window.removeEventListener('touchmove', handleMove);
		window.removeEventListener('touchend', endDrag);
	}

	window.addEventListener('mousemove', handleMove);
	window.addEventListener('mouseup', endDrag);
	window.addEventListener('touchmove', handleMove);
	window.addEventListener('touchend', endDrag);

	return {
		isDragging: dragging,
		currentPoint: newCurrentPoint,
		toothData: newToothData,
		history,
		currentIndex
	};
}

export function handlePointDelete(point, pointKey, toothData, history, currentIndex) {
	let newToothData = { ...toothData };
	
	// Remove the point from the appropriate array
	newToothData[pointKey] = newToothData[pointKey].filter(p => p !== point);
	
	const result = saveToHistory(history, currentIndex, newToothData);
	return { 
		toothData: newToothData, 
		history: result.history, 
		currentIndex: result.currentIndex 
	};
}
