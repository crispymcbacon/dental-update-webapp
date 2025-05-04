<script>
	import { isAnyPointDragging, arePointsNear } from '$lib/toothLogic.js';
	export let point;
	export let onDrag;
	export let onDelete;
	export let toothData;
	export let panMode;
	export let pointKey; // 'apex_points' or 'base_points'
	export let deleteMode = null;

	// Calculate scale factor based on image dimensions
	$: scaleFactor = Math.max(toothData.image_size[0] / 1000, toothData.image_size[1] / 1000);
	// Make dots and labels even smaller by reducing the scaling factors further
	$: baseCircleSize = 1.5 * scaleFactor;
	$: baseFontSize = 5 * scaleFactor;

	// Set color based on point type
	$: pointColor = point.type === 'apex' ? '#3b82f6' : '#10b981'; // Blue for apex, green for base

	// Create label text (A-tooth_number or B-tooth_number)
	$: labelText = `${point.type === 'apex' ? 'A' : 'B'}-${point.tooth_number}`;
	
	// Check if any other tooth or point is near this point
	$: isNearOtherPoint = () => {
		// Check proximity to teeth
		const teeth = toothData?.teeth || [];
		for (const tooth of teeth) {
			if (arePointsNear(point, tooth, 40 * scaleFactor)) {
				return true;
			}
		}
		
		// Check proximity to apex points
		const apexPoints = toothData?.apex_points?.filter(p => p !== point) || [];
		for (const otherPoint of apexPoints) {
			if (arePointsNear(point, otherPoint, 40 * scaleFactor)) {
				return true;
			}
		}
		
		// Check proximity to base points
		const basePoints = toothData?.base_points?.filter(p => p !== point) || [];
		for (const otherPoint of basePoints) {
			if (arePointsNear(point, otherPoint, 40 * scaleFactor)) {
				return true;
			}
		}
		
		return false;
	};
	
	// Calculate label opacity based on proximity and dragging state
	$: labelOpacity = isAnyPointDragging ? 0 : (isNearOtherPoint() ? 0.4 : 0.9);

	function handleInteraction(event) {
		if (panMode) return;
		const currentPointType = point.type;
		if (deleteMode === currentPointType) {
			onDelete(point, pointKey);
		} else {
			onDrag(event, point, pointKey);
		}
	}
</script>

<!-- The main group doesn't have a transform to ensure the dot is at the exact position -->
<g
	role="button"
	tabindex="0"
	aria-label={`punto ${point.type === 'apex' ? 'apicale' : 'base'} per dente ${point.tooth_number}`}
	style="cursor: {panMode ? 'inherit' : 'move'}; pointer-events: all; touch-action: none;"
	on:mousedown|stopPropagation={handleInteraction}
	on:touchstart|stopPropagation|preventDefault={handleInteraction}
	on:contextmenu={(e) => {
		if (panMode) return;
		e.preventDefault();
		onDelete(point, pointKey);
	}}
>
	<!-- The dot is placed exactly at the position coordinates -->
	<circle cx={point.position[0]} cy={point.position[1]} r={baseCircleSize} fill={pointColor} />
	
	<!-- The label is in a separate group with its own positioning -->
	<g 
		transform={`translate(${point.position[0] + baseCircleSize * 1.5}, ${point.position[1]})`}
		class:hidden={isAnyPointDragging}
	>
		<rect
			x="0"
			y={-baseFontSize * 0.7}
			width={baseFontSize * 2.0}
			height={baseFontSize * 1.1}
			fill="white"
			rx="1.5"
			opacity={labelOpacity}
		/>
		<text
			x={baseFontSize}
			y="0"
			font-size={baseFontSize}
			fill="black"
			dominant-baseline="middle"
			text-anchor="middle"
			opacity={labelOpacity}
		>{labelText}</text>
	</g>
</g>
