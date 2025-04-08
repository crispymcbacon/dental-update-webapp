<script>
	import { isAnyPointDragging, arePointsNear } from '$lib/toothLogic.js';
	export let tooth;
	export let onDrag;
	export let onDelete;
	export let toothData;
	export let panMode;

	// Calculate scale factor based on image dimensions
	$: scaleFactor = Math.max(toothData.image_size[0] / 1000, toothData.image_size[1] / 1000);
	// Make dots and labels even smaller by reducing the scaling factors further
	$: baseCircleSize = 1.5 * scaleFactor;
	$: baseFontSize = 5 * scaleFactor;
	$: inputWidth = 20 * scaleFactor;
	
	// Check if any other tooth or point is near this tooth
	$: isNearOtherPoint = () => {
		// Check proximity to other teeth
		const otherTeeth = toothData?.teeth?.filter(t => t !== tooth) || [];
		for (const otherTooth of otherTeeth) {
			if (arePointsNear(tooth, otherTooth, 40 * scaleFactor)) {
				return true;
			}
		}
		
		// Check proximity to apex points
		const apexPoints = toothData?.apex_points || [];
		for (const point of apexPoints) {
			if (arePointsNear(tooth, point, 40 * scaleFactor)) {
				return true;
			}
		}
		
		// Check proximity to base points
		const basePoints = toothData?.base_points || [];
		for (const point of basePoints) {
			if (arePointsNear(tooth, point, 40 * scaleFactor)) {
				return true;
			}
		}
		
		return false;
	};
	
	// Calculate label opacity based on proximity and dragging state
	$: labelOpacity = isAnyPointDragging ? 0 : (isNearOtherPoint() ? 0.4 : 0.9);

	let showEditForm = false;
	let inputValue;
	let lastTap = 0;
	let touchTimeout;

	function handleDoubleTap(event) {
		if (panMode) return;
		const currentTime = new Date().getTime();
		const tapLength = currentTime - lastTap;

		clearTimeout(touchTimeout);

		if (tapLength < 500 && tapLength > 0) {
			event.preventDefault();
			toggleEditForm();
		} else {
			touchTimeout = setTimeout(() => {
				lastTap = 0;
			}, 500);
		}
		lastTap = currentTime;
	}

	function toggleEditForm() {
		if (panMode) return;
		showEditForm = !showEditForm;
		if (showEditForm) {
			inputValue = tooth.tooth_number;
			// Focus the input after a small delay to ensure it's rendered
			setTimeout(() => {
				const input = document.querySelector('.tooth-number-input');
				if (input) input.focus();
			}, 50);
		}
	}

	function updateToothNumber(event) {
		const newNumber = parseInt(event.target.value);
		if (validateToothNumber(newNumber)) {
			tooth.tooth_number = newNumber;
			showEditForm = false;
		} else {
			alert('Il numero del dente deve essere unico.');
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			updateToothNumber(event);
		} else if (event.key === 'Escape') {
			showEditForm = false;
		}
	}

	function validateToothNumber(number) {
		return !toothData.teeth.some((t) => t.tooth_number === number && t !== tooth);
	}

	function handleInteraction(event) {
		if (panMode) return;
		onDrag(event, tooth);
	}
</script>

<!-- The main group doesn't have a transform to ensure the dot is at the exact position -->
<g
	style="cursor: {panMode ? 'inherit' : 'move'}; pointer-events: all; touch-action: none;"
	on:mousedown|stopPropagation={handleInteraction}
	on:touchstart|stopPropagation|preventDefault={handleInteraction}
	on:contextmenu={(e) => {
		if (panMode) return;
		e.preventDefault();
		onDelete(tooth);
	}}
>
	<!-- The dot is placed exactly at the centroid coordinates -->
	<circle cx={tooth.centroid[0]} cy={tooth.centroid[1]} r={baseCircleSize} fill="red" />
	
	<!-- The label is in a separate group with its own positioning -->
	<g 
		transform={`translate(${tooth.centroid[0] + baseCircleSize * 1.5}, ${tooth.centroid[1]})`}
		class:hidden={isAnyPointDragging}
	>
		<rect
			x="0"
			y={-baseFontSize * 0.7}
			width={baseFontSize * 1.5}
			height={baseFontSize * 1.1}
			fill="white"
			rx="1.5"
			opacity={labelOpacity}
		/>
		<text
			x={baseFontSize * 0.5}
			y="0"
			font-size={baseFontSize}
			fill="black"
			dominant-baseline="middle"
			text-anchor="middle"
			opacity={labelOpacity}
			on:dblclick|stopPropagation={toggleEditForm}
			on:touchstart|stopPropagation={handleDoubleTap}>{tooth.tooth_number}</text
		>
	</g>
	
	{#if showEditForm}
		<foreignObject
			x={tooth.centroid[0] + baseCircleSize * 2}
			y={tooth.centroid[1] - baseFontSize}
			width={inputWidth + 20}
			height={baseFontSize * 2.5}
		>
			<input
				class="tooth-number-input"
				type="number"
				bind:value={inputValue}
				on:change={updateToothNumber}
				on:keydown={handleKeydown}
				on:blur={() => (showEditForm = false)}
				style={`width: ${inputWidth}px; font-size: ${baseFontSize}px; padding: 2px; border: 1px solid #ccc; border-radius: 3px;`}
			/>
		</foreignObject>
	{/if}
</g>
