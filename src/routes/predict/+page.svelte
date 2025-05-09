<script>
	import { onMount } from 'svelte';
	import ToothLabel from '$lib/components/ToothLabel.svelte';
	import { ZoomIn, ZoomOut, Move } from 'lucide-svelte';
	import { callSegmentationApi } from '$lib/api.js';

	// Data and state variables
	let originalImageSrc = null;
	let maskImageSrc = null;
	let toothData = null;
	let isLoading = false;
	let errorMessage = null;
	let originalFileName = '';
	let selectedViewType = 'frontal';

	// History management
	let history = [];
	let currentIndex = -1;

	async function uploadImage(event) {
		const file = event.target.files[0];
		if (!file) return;

		// Store the original filename without extension
		originalFileName = file.name.replace(/\.[^/.]+$/, '');

		const reader = new FileReader();
		reader.onload = (e) => {
			originalImageSrc = reader.result;
		};
		reader.readAsDataURL(file);

		isLoading = true;
		errorMessage = null;
		maskImageSrc = null; // Reset visuals
		toothData = null;

		try {
			const { maskImageSrc: newMaskImageSrc, toothData: newToothData } = await callSegmentationApi(file, selectedViewType);
			maskImageSrc = newMaskImageSrc;
			toothData = newToothData;

			console.log('toothData', toothData);

			// Assuming history stores objects similar to toothData
			history = [JSON.parse(JSON.stringify(toothData))];
			currentIndex = 0;
		} catch (error) {
			errorMessage = error.message;
		} finally {
			isLoading = false;
		}
	}

	function saveToHistory() {
		// Remove any future states if we're in the middle of the history
		if (currentIndex < history.length - 1) {
			history = history.slice(0, currentIndex + 1);
		}

		// Save a deep copy of the current state
		history = [...history, JSON.parse(JSON.stringify(toothData))];
		currentIndex = history.length - 1;
	}

	function undo() {
		if (currentIndex > 0) {
			currentIndex--;
			toothData = JSON.parse(JSON.stringify(history[currentIndex]));
		}
	}

	// Mouse dragging
	let isDragging = false;
	let currentTooth = null;

	// zoom
	let scale = 1;

	// Pan mode
	let panMode = false;

	function togglePanMode() {
		panMode = !panMode;
	}

	// Add mode
	let addMode = false;

	// Mouse dragging
	function handleDragStart(event) {
		if (!panMode) return;

		isDragging = true;
		const container = event.currentTarget;
		const startX = event.clientX || event.touches?.[0]?.clientX;
		const startY = event.clientY || event.touches?.[0]?.clientY;
		const scrollLeft = container.scrollLeft;
		const scrollTop = container.scrollTop;

		function handlePan(event) {
			if (!isDragging) return;
			const x = (event.clientX || event.touches?.[0]?.clientX) - startX;
			const y = (event.clientY || event.touches?.[0]?.clientY) - startY;
			container.scrollLeft = scrollLeft - x;
			container.scrollTop = scrollTop - y;
		}

		function endPan() {
			isDragging = false;
			window.removeEventListener('mousemove', handlePan);
			window.removeEventListener('mouseup', endPan);
			window.removeEventListener('touchmove', handlePan);
			window.removeEventListener('touchend', endPan);
		}

		window.addEventListener('mousemove', handlePan);
		window.addEventListener('mouseup', endPan);
		window.addEventListener('touchmove', handlePan);
		window.addEventListener('touchend', endPan);
	}

	function handleTouchStart(event) {
		handleDragStart(event);
	}

	function handleLabelDragStart(event, tooth) {
		if (panMode) return;

		isDragging = true;
		currentTooth = tooth;

		const startX = event.clientX || event.touches?.[0]?.clientX;
		const startY = event.clientY || event.touches?.[0]?.clientY;

		function handleMove(event) {
			if (!isDragging) return;

			const svg = document.querySelector('svg');
			const pt = svg.createSVGPoint();
			const CTM = svg.getScreenCTM();

			// Get current touch/mouse position
			pt.x = event.clientX || event.touches?.[0]?.clientX;
			pt.y = event.clientY || event.touches?.[0]?.clientY;

			// Transform point from screen coordinates to SVG coordinates
			const svgPoint = pt.matrixTransform(CTM.inverse());

			// Update tooth position
			currentTooth.centroid = [svgPoint.x, svgPoint.y];
			recalculateProperties(currentTooth);
			// Force Svelte to update
			toothData = toothData;
		}

		function endDrag() {
			if (isDragging) {
				saveToHistory();
			}
			isDragging = false;
			currentTooth = null;
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', endDrag);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', endDrag);
		}

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', endDrag);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', endDrag);
	}

	// Helper functions

	function recalculateProperties(tooth) {
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

	function handleDelete(tooth) {
		toothData.teeth = toothData.teeth.filter((t) => t !== tooth);
		saveToHistory();
	}

	// Add mode
	function enableAddMode() {
		addMode = true;
	}

	function handleImageClick(event) {
		if (addMode) {
			const svg = event.currentTarget;
			const rect = svg.getBoundingClientRect();
			const pt = svg.createSVGPoint();

			// Get the SVG's CTM (Current Transform Matrix)
			const CTM = svg.getScreenCTM();

			// Set point to mouse position
			pt.x = event.clientX;
			pt.y = event.clientY;

			// Transform point from screen coordinates to SVG coordinates
			const svgPoint = pt.matrixTransform(CTM.inverse());

			const newToothId =
				toothData.teeth.length > 0 ? Math.max(...toothData.teeth.map((t) => t.tooth_id)) + 1 : 1;

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
			recalculateProperties(newTooth);

			let toothNumber = prompt('Enter tooth number:');
			while (toothData.teeth.some((t) => t.tooth_number == toothNumber)) {
				toothNumber = prompt('Tooth number already exists. Enter a unique tooth number:');
			}
			newTooth.tooth_number = parseInt(toothNumber);

			toothData.teeth = [...toothData.teeth, newTooth];
			saveToHistory();
			addMode = false;
		}
	}

	// zoom
	function zoomIn() {
		scale += 0.1;
	}

	function zoomOut() {
		if (scale > 0.1) scale -= 0.1;
	}

	// save functions
	function downloadJson() {
		const fileName = originalFileName ? `${originalFileName}_teeth.json` : 'teeth.json';
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toothData));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute('href', dataStr);
		downloadAnchorNode.setAttribute('download', fileName);
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	function downloadMask() {
		// Create an anchor element and set the href to the mask image source
		const fileName = originalFileName ? `${originalFileName}_mask.png` : 'mask.png';
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute('href', maskImageSrc);
		downloadAnchorNode.setAttribute('download', fileName);
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}
</script>

{#if originalImageSrc && maskImageSrc && toothData}
	<div class="flex">
		<div class="flex min-h-screen w-64 flex-col gap-4 bg-gray-50 p-4">
			<select bind:value={selectedViewType} class="mb-4 p-2 border rounded w-full">
				<option value="frontal">Vista frontale</option>
				<option value="left">Lato sinistro</option>
				<option value="right">Lato destro</option>
				<option value="upper">Mascella superiore</option>
				<option value="lower">Mascella inferiore</option>
			</select>

			<input
				type="file"
				accept="image/*"
				on:change={uploadImage}
				class="cursor-pointer text-blue-500"
			/>

			<div class="flex flex-col gap-2.5">
				<div class="flex items-center gap-2.5">
					<span class="min-w-[80px] font-medium text-gray-600">Originale:</span>
					<span>✓ Caricato</span>
				</div>
				<div class="flex items-center gap-2.5">
					<span class="min-w-[80px] font-medium text-gray-600">Maschera:</span>
					<span>✓ Caricato</span>
				</div>
				<div class="flex items-center gap-2.5">
					<span class="min-w-[80px] font-medium text-gray-600">JSON:</span>
					<span>✓ Caricato ({toothData.teeth?.length || 0})</span>
				</div>
			</div>

			<div class="mt-auto flex flex-col gap-2.5">
				<button
					class="w-full cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
					on:click={undo}
					disabled={currentIndex <= 0}>Annulla</button
				>
				<button
					class="w-full cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
					on:click={enableAddMode}>Aggiungi dente</button
				>
				<button
					class="w-full cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
					on:click={downloadJson}>Salva JSON</button
				>
				<button
					class="w-full cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
					on:click={downloadMask}>Scarica maschera</button
				>
			</div>
		</div>

		<div class="flex-1 p-5">
			<div class="relative">
				<!-- Wrapper with fixed size and overflow handling -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative overflow-auto rounded-lg border border-gray-200"
					on:mousedown={handleDragStart}
					on:touchstart|preventDefault={handleTouchStart}
					on:wheel|preventDefault={(e) => {
						if (!panMode) return;
						e.currentTarget.scrollLeft += e.deltaX;
						e.currentTarget.scrollTop += e.deltaY;
					}}
					style="cursor: {panMode ? 'grab' : 'default'}; overflow: {panMode ? 'auto' : 'hidden'}"
				>
					<!-- Content container with transform -->
					<div class="origin-top-left" style="transform: scale({scale});">
						<div class="relative inline-block">
							<img src={originalImageSrc} alt="Radiografia dentale originale" class="block h-auto w-auto" />
							<img
								src={maskImageSrc}
								alt="Maschera di sovrapposizione"
								class="absolute left-0 top-0 opacity-50 mix-blend-multiply"
							/>
							<svg
								class="pointer-events-auto absolute left-0 top-0 h-full w-full"
								on:click={handleImageClick}
								on:mousedown={(e) => !panMode && handleImageClick(e)}
								on:touchstart|preventDefault={(e) => !panMode && handleImageClick(e)}
								on:keydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										handleImageClick(event);
									}
								}}
								tabindex="0"
								role="button"
								aria-label="Immagine radiografica dentale interattiva"
								viewBox="0 0 {toothData.image_size[1]} {toothData.image_size[0]}"
							>
								{#each toothData?.teeth || [] as tooth}
									<ToothLabel
										{tooth}
										{toothData}
										{panMode}
										onDrag={handleLabelDragStart}
										onDelete={(tooth) => {
											toothData.teeth = toothData.teeth.filter((t) => t !== tooth);
										}}
									/>
								{/each}
							</svg>
						</div>
					</div>
				</div>

				<!-- Zoom controls - now outside the transform -->
				<div class="absolute bottom-4 right-4 z-10 flex gap-2 rounded-lg bg-white p-2 shadow-lg">
					<button
						class="cursor-pointer rounded border-none bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={zoomOut}
						title="Zoom Out"
					>
						<ZoomOut class="h-5 w-5" />
					</button>
					<button
						class="cursor-pointer rounded border-none {panMode
							? 'bg-blue-700'
							: 'bg-blue-500'} px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={togglePanMode}
						title="Attiva/disattiva modalità panning"
					>
						<Move class="h-5 w-5" />
					</button>
					<button
						class="cursor-pointer rounded border-none bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={zoomIn}
						title="Zoom In"
					>
						<ZoomIn class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex">
		<div class="min-h-screen w-64 bg-gray-50 p-4">
			<select bind:value={selectedViewType} class="mb-4 p-2 border rounded w-full">
				<option value="frontal">Vista frontale</option>
				<option value="left">Lato sinistro</option>
				<option value="right">Lato destro</option>
				<option value="upper">Mascella superiore</option>
				<option value="lower">Mascella inferiore</option>
			</select>

			<input
				type="file"
				accept="image/*"
				on:change={uploadImage}
				class="cursor-pointer text-blue-500"
			/>

			{#if isLoading}
				<p class="mt-4 text-gray-500">Caricamento dati da API...</p>
			{:else if errorMessage}
				<p class="mt-4 text-red-500">{errorMessage}</p>
			{:else}
				<p class="mt-4 text-gray-500">Per favore, carica un'immagine per iniziare</p>
			{/if}
		</div>

		<div class="flex-1 p-5">
			{#if isLoading}
				<p class="text-gray-500">Per favore, attendi, elaborazione dell'immagine...</p>
			{:else if errorMessage}
				<p class="text-red-500">Errore: {errorMessage}</p>
			{:else}
				<p class="text-gray-500">Nessun dato disponibile, per favore carica un'immagine</p>
			{/if}
		</div>
	</div>
{/if}
