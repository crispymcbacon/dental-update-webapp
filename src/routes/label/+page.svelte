<script>
	import InputFields from '$lib/components/InputFields.svelte';
	import ToothLabel from '$lib/components/ToothLabel.svelte';
	import PointLabel from '$lib/components/PointLabel.svelte';
	import { ZoomIn, ZoomOut, Move } from 'lucide-svelte';
	import {
		saveToHistory,
		undo,
		handleDragStart,
		handleTouchStart,
		handleLabelDragStart,
		recalculateProperties,
		handleDelete,
		enableAddMode,
		handleImageClick,
		zoomIn,
		zoomOut,
		downloadJson,
		togglePanMode,
		enableAddApexMode,
		enableAddBaseMode,
		handleAddApexPoint,
		handleAddBasePoint,
		handlePointDragStart,
		handlePointDelete
	} from '$lib/toothLogic';
	import { browser } from '$app/environment';
	import { getRandomColor, initializeCanvas, startDrawing as startDraw, draw as drawOnCanvas, downloadMask } from '$lib/drawing';

	// Data Loaders
	let originalImageSrc;
	let maskImageSrc;
	let toothData;
	let originalImageFilename = '';

	// State Management
	let history = [];
	let currentIndex = -1;
	let isDragging = false;
	let currentTooth = null;
	let currentPoint = null;
	let scale = 1;
	let panMode = false;
	let addMode = false;
	let addApexMode = false;
	let addBaseMode = false;
	let deleteMode = false;
	let pointTypeToDelete = null; // 'apex_points', 'base_points', or 'teeth'

	// Segmentation Mode
	let segmentationMode = false;
	let isDrawing = false;
	let waitingForDraw = false;
	let drawColor = getRandomColor();
	let drawingCanvas;
	let ctx;

	function toggleSegmentationMode() {
		// If we're currently in segmentation mode and about to exit
		if (segmentationMode && drawingCanvas) {
			// Check if there's any drawing on the canvas
			const imageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
			const hasDrawing = imageData.data.some(pixel => pixel !== 0);
			
			if (hasDrawing) {
				// Ask user if they want to save the mask before exiting
				if (confirm('Vuoi salvare la maschera prima di uscire dalla modalità segmentazione?')) {
					downloadMask(drawingCanvas, maskImageSrc);
				}
			}
		}
		
		segmentationMode = !segmentationMode;
		if (segmentationMode && browser) {
			initializeDrawingCanvas();
		} else {
			isDrawing = false;
			waitingForDraw = false;
			if (drawingCanvas) {
				ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
			}
		}
	}

	function initializeDrawingCanvas() {
		if (browser) {
			setTimeout(() => {
				drawingCanvas = document.getElementById('drawingCanvas');
				if (drawingCanvas) {
					ctx = initializeCanvas(drawingCanvas, toothData.image_size, drawColor);

					// Add event listeners for drawing
					drawingCanvas.addEventListener('mousedown', handleStartDrawing);
					drawingCanvas.addEventListener('mousemove', handleDraw);
					drawingCanvas.addEventListener('mouseup', stopDrawing);
					drawingCanvas.addEventListener('mouseout', stopDrawing);
					drawingCanvas.addEventListener('mouseleave', stopDrawing);
				}
			}, 0);
		}
	}

	function handleStartDrawing(e) {
		if (!waitingForDraw) return;
		isDrawing = startDraw(e, ctx, drawingCanvas, isDrawing);
		waitingForDraw = false;
	}

	function handleDraw(e) {
		drawOnCanvas(e, ctx, drawingCanvas, isDrawing);
	}

	function stopDrawing() {
		isDrawing = false;
	}

	function addNewArea() {
		if (!isDrawing) {
			drawColor = getRandomColor();
			if (ctx) {
				ctx.strokeStyle = drawColor;
			}
			waitingForDraw = true;
		} else {
			isDrawing = false;
			waitingForDraw = false;
		}
	}

	function handleDownloadMask() {
		downloadMask(drawingCanvas, maskImageSrc, originalImageFilename);
	}
	// Loaders
	function onOriginalImageLoad(dataUrl, filename) {
		console.log('Original image loaded');
		originalImageSrc = dataUrl;
		originalImageFilename = filename;
	}

	function onMaskImageLoad(dataUrl) {
		console.log('Mask image loaded');
		maskImageSrc = dataUrl;
	}

	// Store the JSON filename for later use when saving
	let jsonFilename = 'updated_teeth.json';

	function onJsonLoad(json, filename) {
		console.log('JSON loaded', json);
		
		// Store the original filename if provided
		if (filename) {
			jsonFilename = filename;
		}
		
		// Process the JSON to convert apex and base points from individual tooth properties to arrays
		const processedJson = { ...json };
		
		// Initialize apex_points and base_points arrays if they don't exist
		if (!processedJson.apex_points) processedJson.apex_points = [];
		if (!processedJson.base_points) processedJson.base_points = [];
		
		// Extract apex and base points from teeth and add to respective arrays
		if (processedJson.teeth && processedJson.teeth.length > 0) {
			processedJson.teeth.forEach(tooth => {
				// Check if tooth has apex property
				if (tooth.apex && Array.isArray(tooth.apex) && tooth.apex.length === 2) {
					// Create a new apex point and add to apex_points array
					const newApexPoint = {
						point_id: processedJson.apex_points.length > 0 ? 
							Math.max(...processedJson.apex_points.map(p => p.point_id)) + 1 : 1,
						tooth_number: tooth.tooth_number,
						position: tooth.apex,
						type: 'apex'
					};
					processedJson.apex_points.push(newApexPoint);
				}
				
				// Check if tooth has base property
				if (tooth.base && Array.isArray(tooth.base) && tooth.base.length === 2) {
					// Create a new base point and add to base_points array
					const newBasePoint = {
						point_id: processedJson.base_points.length > 0 ? 
							Math.max(...processedJson.base_points.map(p => p.point_id)) + 1 : 1,
						tooth_number: tooth.tooth_number,
						position: tooth.base,
						type: 'base'
					};
					processedJson.base_points.push(newBasePoint);
				}
			});
		}
		
		toothData = processedJson;
		// Initialize history with the first state
		history = [JSON.parse(JSON.stringify(processedJson))];
		currentIndex = 0;
		console.log('Processed JSON data:', processedJson);
	}

	// Function to update toothData from child components or logic functions
	function setToothData(newToothData) {
		toothData = newToothData;
	}
</script>

{#if originalImageSrc && maskImageSrc && toothData}
	<div class="flex">
		<div class="flex min-h-screen w-64 flex-col gap-3 bg-gray-50 p-4">
			<!-- Top controls with Reset and Save JSON buttons -->
			<div class="flex gap-2 mb-2">
				<button
					class="flex-1 cursor-pointer rounded border-none bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
					on:click={() => window.location.reload()}
				>
					Ripristina
				</button>
				<button
					class="flex-1 cursor-pointer rounded border-none bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
					on:click={() => downloadJson(toothData, jsonFilename)}
				>
					Salva JSON
				</button>
			</div>

			<!-- Compact loaded files section -->
			<div class="flex flex-col gap-1 text-xs bg-gray-100 p-2 rounded mb-1">
				<div class="flex items-center gap-1">
					<span class="min-w-[60px] font-medium text-gray-600">Originale:</span>
					<span>✓ Caricato</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="min-w-[60px] font-medium text-gray-600">Maschera:</span>
					<span>✓ Caricato</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="min-w-[60px] font-medium text-gray-600">JSON:</span>
					<span>✓ Caricato ({toothData.teeth?.length || 0})</span>
				</div>
			</div>

			<!-- Undo and Add Tooth buttons moved above segmentation mode -->
			<div class="flex flex-col gap-2">
				<button
					class="w-full cursor-pointer rounded border-none bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
					on:click={() => {
						const result = undo(history, currentIndex, toothData);
						history = result.history;
						currentIndex = result.currentIndex;
						toothData = result.toothData;
					}}
					disabled={currentIndex <= 0}
				>
					Annulla
				</button>
				<button
					class="w-full cursor-pointer rounded border-none {addMode ? 'bg-blue-800' : 'bg-blue-500'} px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
					on:click={() => {
						addMode = enableAddMode();
						addApexMode = false;
						addBaseMode = false;
					}}
				>
					Aggiungi Dente
				</button>
				<button
					class="w-full cursor-pointer rounded border-none {addApexMode ? 'bg-blue-800' : 'bg-blue-500'} px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600 mt-2"
					on:click={() => {
						addApexMode = enableAddApexMode();
						addMode = false;
						addBaseMode = false;
						const toothNumber = prompt('Inserisci il numero del dente per il punto apicale:');
						if (toothNumber) {
							const result = handleAddApexPoint(toothNumber, toothData, history, currentIndex);
							toothData = result.toothData;
							history = result.history;
							currentIndex = result.currentIndex;
							addApexMode = false;
						}
					}}
				>
					Aggiungi Apice
				</button>
				<button
					class="w-full cursor-pointer rounded border-none {addBaseMode ? 'bg-blue-800' : 'bg-blue-500'} px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600 mt-2"
					on:click={() => {
						addBaseMode = enableAddBaseMode();
						addMode = false;
						addApexMode = false;
						deleteMode = false;
						const toothNumber = prompt('Inserisci il numero del dente per il punto base:');
						if (toothNumber) {
							const result = handleAddBasePoint(toothNumber, toothData, history, currentIndex);
							toothData = result.toothData;
							history = result.history;
							currentIndex = result.currentIndex;
							addBaseMode = false;
						}
					}}
				>
					Aggiungi Base
				</button>
				
				<!-- Delete Point Button -->
				<button
					class="w-full cursor-pointer rounded border-none {deleteMode ? 'bg-red-800' : 'bg-red-500'} px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600 mt-4"
					on:click={() => {
						if (!deleteMode) {
							// Ask user which type of point to delete
							const typeChoice = prompt('Quale tipo di punto vuoi cancellare? (1: Apice, 2: Base, 3: Centrale)');
							if (typeChoice === '1') {
								pointTypeToDelete = 'apex_points';
								deleteMode = true;
								addMode = false;
								addApexMode = false;
								addBaseMode = false;
								alert('Seleziona un punto apicale da cancellare');
							} else if (typeChoice === '2') {
								pointTypeToDelete = 'base_points';
								deleteMode = true;
								addMode = false;
								addApexMode = false;
								addBaseMode = false;
								alert('Seleziona un punto base da cancellare');
							} else if (typeChoice === '3') {
								pointTypeToDelete = 'teeth';
								deleteMode = true;
								addMode = false;
								addApexMode = false;
								addBaseMode = false;
								alert('Seleziona un punto centrale (rosso) da cancellare');
							} else {
								// User canceled or entered invalid input
								deleteMode = false;
							}
						} else {
							// Exit delete mode
							deleteMode = false;
							pointTypeToDelete = null;
						}
					}}
				>
					{deleteMode ? 'Annulla Cancellazione' : 'Cancella Punto'}
				</button>
			</div>

			<!-- Segmentation Mode Controls -->
			<div class="mt-2">
				<button
					class="w-full cursor-pointer rounded border-none bg-green-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-600"
					on:click={toggleSegmentationMode}
				>
					{segmentationMode ? 'Esci dalla Modalità Segmentazione' : 'Entra in Modalità Segmentazione'}
				</button>
				{#if segmentationMode}
					<button
						class="mt-2 w-full cursor-pointer rounded border-none {isDrawing
							? 'bg-red-500 hover:bg-red-600'
							: waitingForDraw ? 'bg-blue-800' : 'bg-purple-500 hover:bg-purple-600'} px-3 py-1.5 text-sm text-white"
						on:click={addNewArea}
					>
						{isDrawing ? 'Ferma Disegno' : waitingForDraw ? 'Clicca per Disegnare' : 'Aggiungi Nuova Area'}
					</button>
					<button
						class="mt-2 w-full cursor-pointer rounded border-none bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={handleDownloadMask}
					>
						Scarica Maschera
					</button>
				{/if}
			</div>
		</div>

		<div class="flex-1 p-5">
			<div class="relative">
				<!-- Wrapper with fixed size and overflow handling -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative overflow-auto rounded-lg border border-gray-200"
					on:mousedown={(e) => {
						const result = handleDragStart(e, panMode);
						isDragging = result.isDragging;
					}}
					on:touchstart|preventDefault={(e) => {
						const result = handleTouchStart(e, panMode);
						isDragging = result.isDragging;
					}}
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
							<img src={originalImageSrc} alt="Radiografia Dentale Originale" class="block h-auto w-auto" />
							<img
								src={maskImageSrc}
								alt="Sovrapposizione Maschera"
								class="absolute left-0 top-0 opacity-50 mix-blend-multiply"
							/>
							<svg
								class="pointer-events-auto absolute left-0 top-0 h-full w-full"
								on:click={(e) => {
									const result = handleImageClick(e, addMode, toothData, history, currentIndex);
									toothData = result.toothData;
									history = result.history;
									currentIndex = result.currentIndex;
									addMode = result.addMode;
								}}
								on:mousedown={(e) => {
									if (!panMode) {
										const result = handleImageClick(e, addMode, toothData, history, currentIndex);
										toothData = result.toothData;
										history = result.history;
										currentIndex = result.currentIndex;
										addMode = result.addMode;
									}
								}}
								on:touchstart|preventDefault={(e) => {
									if (!panMode) {
										const result = handleImageClick(e, addMode, toothData, history, currentIndex);
										toothData = result.toothData;
										history = result.history;
										currentIndex = result.currentIndex;
										addMode = result.addMode;
									}
								}}
								on:keydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										const result = handleImageClick(
											event,
											addMode,
											toothData,
											history,
											currentIndex
										);
										toothData = result.toothData;
										history = result.history;
										currentIndex = result.currentIndex;
										addMode = result.addMode;
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
										onDrag={(e, tooth) => {
											if (deleteMode && pointTypeToDelete === 'teeth') {
												// In delete mode, clicking on a tooth deletes it
												const result = handleDelete(tooth, toothData, history, currentIndex);
												toothData = result.toothData;
												history = result.history;
												currentIndex = result.currentIndex;
												deleteMode = false;
												pointTypeToDelete = null;
												alert('Punto centrale cancellato con successo');
											} else {
												// Normal drag behavior
												const result = handleLabelDragStart(
													e,
													tooth,
													panMode,
													isDragging,
													currentTooth,
													toothData,
													history,
													currentIndex,
													setToothData // Pass the setToothData function
												);
												isDragging = result.isDragging;
												currentTooth = result.currentTooth;
												toothData = result.toothData;
												history = result.history;
												currentIndex = result.currentIndex;
											}
										}}
										onDelete={(tooth) => {
											const result = handleDelete(tooth, toothData, history, currentIndex);
											toothData = result.toothData;
											history = result.history;
											currentIndex = result.currentIndex;
										}}
									/>
								{/each}

								<!-- Apex points -->
								{#if toothData.apex_points}
									{#each toothData.apex_points as point}
										<PointLabel
											{point}
											{toothData}
											{panMode}
											pointKey="apex_points"
											onDrag={(e, point, pointKey) => {
												if (deleteMode && pointTypeToDelete === 'apex_points') {
													// In delete mode, clicking on a point deletes it
													const result = handlePointDelete(point, pointKey, toothData, history, currentIndex);
													toothData = result.toothData;
													history = result.history;
													currentIndex = result.currentIndex;
													deleteMode = false;
													pointTypeToDelete = null;
													alert('Punto cancellato con successo');
												} else {
													// Normal drag behavior
													const result = handlePointDragStart(
														e,
														point,
														pointKey,
														panMode,
														isDragging,
														currentPoint,
														toothData,
														history,
														currentIndex,
														setToothData
													);
													isDragging = result.isDragging;
													currentPoint = result.currentPoint;
													toothData = result.toothData;
													history = result.history;
													currentIndex = result.currentIndex;
												}
											}}
											onDelete={(point, pointKey) => {
												const result = handlePointDelete(point, pointKey, toothData, history, currentIndex);
												toothData = result.toothData;
												history = result.history;
												currentIndex = result.currentIndex;
											}}
										/>
									{/each}
								{/if}

								<!-- Base points -->
								{#if toothData.base_points}
									{#each toothData.base_points as point}
										<PointLabel
											{point}
											{toothData}
											{panMode}
											pointKey="base_points"
											onDrag={(e, point, pointKey) => {
												if (deleteMode && pointTypeToDelete === 'base_points') {
													// In delete mode, clicking on a point deletes it
													const result = handlePointDelete(point, pointKey, toothData, history, currentIndex);
													toothData = result.toothData;
													history = result.history;
													currentIndex = result.currentIndex;
													deleteMode = false;
													pointTypeToDelete = null;
													alert('Punto cancellato con successo');
												} else {
													// Normal drag behavior
													const result = handlePointDragStart(
														e,
														point,
														pointKey,
														panMode,
														isDragging,
														currentPoint,
														toothData,
														history,
														currentIndex,
														setToothData
													);
													isDragging = result.isDragging;
													currentPoint = result.currentPoint;
													toothData = result.toothData;
													history = result.history;
													currentIndex = result.currentIndex;
												}
											}}
											onDelete={(point, pointKey) => {
												const result = handlePointDelete(point, pointKey, toothData, history, currentIndex);
												toothData = result.toothData;
												history = result.history;
												currentIndex = result.currentIndex;
											}}
										/>
									{/each}
								{/if}
							</svg>
							{#if segmentationMode}
								<canvas
									id="drawingCanvas"
									class="pointer-events-auto absolute left-0 top-0"
									style="mix-blend-mode: normal; opacity: 1;"
								></canvas>
							{/if}
						</div>
					</div>
				</div>

				<!-- Zoom controls - now outside the transform -->
				<div class="absolute bottom-4 right-4 z-10 flex gap-2 rounded-lg bg-white p-2 shadow-lg">
					<button
						class="cursor-pointer rounded border-none bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={() => {
							scale = zoomOut(scale);
						}}
						title="Riduci Zoom"
					>
						<ZoomOut class="h-5 w-5" />
					</button>
					<button
						class="cursor-pointer rounded border-none {panMode
							? 'bg-green-500'
							: 'bg-blue-500'} px-3 py-1 text-sm text-white transition-colors hover:{panMode ? 'bg-green-600' : 'bg-blue-600'}"
						on:click={() => {
							panMode = togglePanMode(panMode);
						}}
						title="Attiva/Disattiva Modalità Panoramica"
					>
						<Move class="h-5 w-5" />
					</button>
					<button
						class="cursor-pointer rounded border-none bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						on:click={() => {
							scale = zoomIn(scale);
						}}
						title="Aumenta Zoom"
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
			<InputFields {onOriginalImageLoad} {onMaskImageLoad} {onJsonLoad} />

			<div class="mt-4">
				<p class="mb-2 text-sm">In attesa dei file...</p>
				<ul class="space-y-1 text-sm">
					<li>Immagine Originale: {originalImageSrc ? '✓' : '⨯'}</li>
					<li>Immagine Maschera: {maskImageSrc ? '✓' : '⨯'}</li>
					<li>Dati JSON: {toothData ? '✓' : '⨯'}</li>
				</ul>
			</div>
		</div>

		<div class="flex-1 p-5">
			<p class="text-gray-500">Carica tutti i file richiesti per iniziare</p>
		</div>
	</div>
{/if}
