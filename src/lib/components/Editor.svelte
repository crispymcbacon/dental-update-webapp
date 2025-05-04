<script lang="ts">
	/* ---------- imports ---------- */
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { teethStore } from '$lib/stores/teethStore';

	import {
		addTooth,
		moveTooth,
		deleteTooth,
		addPoint,
		movePoint,
		deletePoint,
		zoomIn as zIn,
		zoomOut as zOut
	} from '$lib/logic/teeth';

	import { createZipBlob } from '$lib/logic/canvas';

	import ToothLabel from '$lib/components/ToothLabel.svelte';
	import PointLabel from '$lib/components/PointLabel.svelte';

	import { ZoomIn, ZoomOut, Move } from 'lucide-svelte';

	/* ---------- reactive copy of the store ---------- */
	$: ({ originalImageSrc, maskImageSrc, toothData, originalFilename } = $teethStore);

	/* ---------- local UI flags ---------- */
	let scale = 1;
	let panMode = false;

	let addMode: 'tooth' | 'apex' | 'base' | null = null;
	let deleteMode: 'tooth' | 'apex' | 'base' | null = null;
	let pendingData: { type: 'tooth' | 'apex' | 'base'; number: number } | null = null;

	function newFreeArea() {
		console.warn('New Area functionality needs reimplementation.');
	}

	/* ---------- helpers ---------- */
	function svgCoords(evt: MouseEvent | TouchEvent, svg: SVGSVGElement) {
		const pt = svg.createSVGPoint();
		pt.x = (evt as any).clientX || (evt as TouchEvent).touches?.[0]?.clientX;
		pt.y = (evt as any).clientY || (evt as TouchEvent).touches?.[0]?.clientY;
		return pt.matrixTransform(svg.getScreenCTM().inverse());
	}

	/* ---------- UNDO ---------- */
	const undo = () => teethStore.undo();

	/* ---------- ZOOM & PAN ---------- */
	const zoomIn = () => (scale = zIn(scale));
	const zoomOut = () => (scale = zOut(scale));
	const togglePan = () => (panMode = !panMode);

	/* ---------- add / delete modes ---------- */
	function initiateAdd(mode: 'tooth' | 'apex' | 'base') {
		if (addMode === mode) {
			// Toggle off if same button clicked
			addMode = null;
			pendingData = null;
			return;
		}

		addMode = null; // Reset first
		pendingData = null;
		deleteMode = null;
		let numStr: string | null;
		let num: number;

		if (mode === 'tooth') {
			numStr = prompt('Numero del dente?');
			if (!numStr || isNaN((num = parseInt(numStr)))) return; // Cancelled or invalid
			if (toothData.teeth.some((t) => t.tooth_number === num)) {
				alert(`Il dente numero ${num} esiste già.`);
				return;
			}
			pendingData = { type: mode, number: num };
		} else {
			// apex or base
			numStr = prompt(`Associa ${mode} a quale dente?`);
			if (!numStr || isNaN((num = parseInt(numStr)))) return; // Cancelled or invalid
			if (!toothData.teeth.some((t) => t.tooth_number === num)) {
				alert(`Il dente numero ${num} non esiste.`);
				return;
			}
			const key = mode === 'apex' ? 'apex_points' : 'base_points';
			if (toothData[key]?.some((p) => p.tooth_number === num)) {
				alert(`${mode === 'apex' ? 'Apice' : 'Base'} già esistente per il dente ${num}.`);
				return;
			}
			pendingData = { type: mode, number: num };
		}

		addMode = mode; // Activate mode only if prompt was successful
		// Consider adding a visual cue that the app is waiting for a click
	}

	function enableDelete(mode: 'tooth' | 'apex' | 'base') {
		deleteMode = deleteMode === mode ? null : mode;
		addMode = null;
		// if (deleteMode) alert('Seleziona un elemento da eliminare');
	}

	/* ---------- CLICK on SVG (adds items) ---------- */
	function handleSvgClick(e) {
		if (!addMode || !pendingData) return; // Only act if in add mode with pending data

		const svg = e.currentTarget as SVGSVGElement;
		const { x, y } = svgCoords(e, svg);

		try {
			if (pendingData.type === 'tooth') {
				teethStore.setToothData(addTooth(toothData, { x, y }, pendingData.number));
			} else {
				// apex or base
				teethStore.setToothData(
					addPoint(toothData, pendingData.type, pendingData.number, { x, y })
				);
			}
		} catch (err) {
			alert(err.message); // Catch errors from addPoint
		}

		addMode = null; // Reset mode
		pendingData = null; // Clear pending data
	}

	/* ---------- DRAG tooth ---------- */
	function startToothDrag(e, tooth) {
		if (panMode || deleteMode) return;
		const svg = document.querySelector('svg');

		function move(ev) {
			const { x, y } = svgCoords(ev, svg);
			teethStore.setToothData(moveTooth(get(teethStore).toothData, tooth.tooth_number, { x, y }));
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', stop);
			window.removeEventListener('touchmove', move);
			window.removeEventListener('touchend', stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', stop);
		window.addEventListener('touchmove', move);
		window.addEventListener('touchend', stop);
	}

	/* ---------- DRAG apex / base ---------- */
	function startPointDrag(e, point, key) {
		if (panMode || deleteMode) return;
		const svg = document.querySelector('svg');
		const type = key === 'apex_points' ? 'apex' : 'base';

		function move(ev) {
			const { x, y } = svgCoords(ev, svg);
			teethStore.setToothData(movePoint(get(teethStore).toothData, type, point.point_id, { x, y }));
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', stop);
			window.removeEventListener('touchmove', move);
			window.removeEventListener('touchend', stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', stop);
		window.addEventListener('touchmove', move);
		window.addEventListener('touchend', stop);
	}

	/* ---------- DELETE single element ---------- */
	const delTooth = (t) => {
		if (deleteMode === 'tooth') delOk(deleteTooth(toothData, t.tooth_number));
	};
	const delPoint = (p, key) => {
		const type = key === 'apex_points' ? 'apex' : 'base';
		if (deleteMode === type) delOk(deletePoint(toothData, type, p.point_id));
	};
	function delOk(newData) {
		teethStore.setToothData(newData);
		deleteMode = null;
	}

	/* ---------- save / download ---------- */
	function saveJson() {
		const blob = new Blob([JSON.stringify(toothData, null, 2)], { type: 'application/json' });
		const a = Object.assign(document.createElement('a'), {
			href: URL.createObjectURL(blob),
			download: (originalFilename?.replace(/\.[^.]+$/, '') || 'file') + '_teeth.json'
		});
		a.click();
		URL.revokeObjectURL(a.href);
	}


	async function saveZip() {
		try {
			const baseFilename = originalFilename?.replace(/\.[^.]+$/, '') || 'data';
			const blob = await createZipBlob(null, maskImageSrc, toothData, baseFilename);
			const a = Object.assign(document.createElement('a'), {
				href: URL.createObjectURL(blob),
				download: `${baseFilename}_archive.zip`
			});
			a.click();
			URL.revokeObjectURL(a.href);
		} catch (error) {
			console.error('Error creating zip:', error);
			alert('Failed to create zip file. Check console for details.');
		}
	}

	/* ---------- PAN scroll of wrapper ---------- */
	function handlePanStart(e) {
		if (!panMode) return;
		const wrap = e.currentTarget;
		const sx = e.clientX,
			sy = e.clientY;
		const startL = wrap.scrollLeft,
			startT = wrap.scrollTop;

		function move(ev) {
			wrap.scrollLeft = startL - (ev.clientX - sx);
			wrap.scrollTop = startT - (ev.clientY - sy);
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', stop);
	}
</script>

<!-- ========== LAYOUT ================================================= -->
<div class="flex min-h-screen">
	<!-- ---------- LEFT toolbar ---------- -->
	<aside class="w-64 shrink-0 space-y-2 bg-gray-50 p-4">

		<button class="btn" class:active={addMode === 'apex'} on:click={() => initiateAdd('apex')}
			>+ 🔵 Apice</button
		>
		<button class="btn" class:active={addMode === 'tooth'} on:click={() => initiateAdd('tooth')}
			>+ 🔴 Dente</button
		>
		<button class="btn" class:active={addMode === 'base'} on:click={() => initiateAdd('base')}
			>+ 🟢 Base</button
		>

		<button
			class="btn red"
			class:active={deleteMode === 'apex'}
			on:click={() => enableDelete('apex')}>- 🔵 Elimina Apice</button
		>

		<button
			class="btn red"
			class:active={deleteMode === 'tooth'}
			on:click={() => enableDelete('tooth')}>- 🔴 Elimina Dente</button
		>
		<button
			class="btn red"
			class:active={deleteMode === 'base'}
			on:click={() => enableDelete('base')}>- 🟢 Elimina Base</button
		>

		<button class="btn white" on:click={undo} disabled={$teethStore.index <= 0}>Annulla Ultima Azione</button>

		<hr class="my-2" />

		<button class="btn" on:click={newFreeArea}>Nuova Area</button>
		<button class="btn" on:click={() => console.warn('Cancella Area functionality needs reimplementation.')}>Cancella Area</button>
		<hr class="my-2" />
		<button class="btn" on:click={saveJson}>Salva JSON</button>
		<!-- Disable if essential data for zip is missing -->
		<button class="btn" on:click={saveZip} disabled={!maskImageSrc || !toothData}
			>Scarica ZIP</button
		>
	</aside>

	<!-- ---------- MAIN canvas ---------- -->
	<main class="flex-1 p-4">
		<div class="relative">
			<!-- scroll wrapper -->
			<div
				class="overflow-auto rounded border"
				style="cursor:{panMode ? 'grab' : 'default'}"
				on:mousedown={handlePanStart}
			>
				<!-- scaled container -->
				<div class="origin-top-left" style="transform:scale({scale});">
					<div class="relative inline-block">
						<img src={originalImageSrc} />
						<img src={maskImageSrc} class="absolute inset-0 opacity-50 mix-blend-multiply" />

						<!-- SVG overlay -->
						<svg
							class="absolute inset-0 h-full w-full"
							viewBox="0 0 {toothData.image_size[1]} {toothData.image_size[0]}"
							on:click={handleSvgClick}
						>
							{#each toothData.teeth || [] as t (t.tooth_number)}
								<ToothLabel
									tooth={t}
									{toothData}
									{panMode}
									{deleteMode}
									onDrag={(e) => startToothDrag(e, t)}
									onDelete={() => delTooth(t)}
								/>
							{/each}

							{#if toothData.apex_points}
								{#each (toothData.apex_points || []).filter((p) => p && p.point_id != null) as p (p.point_id)}
									<PointLabel
										point={p}
										pointKey="apex_points"
										{toothData}
										{panMode}
										{deleteMode}
										onDrag={(e) => startPointDrag(e, p, 'apex_points')}
										onDelete={() => delPoint(p, 'apex_points')}
									/>
								{/each}
							{/if}
							{#if toothData.base_points}
								{#each (toothData.base_points || []).filter((p) => p && p.point_id != null) as p (p.point_id)}
									<PointLabel
										point={p}
										pointKey="base_points"
										{toothData}
										{panMode}
										{deleteMode}
										onDrag={(e) => startPointDrag(e, p, 'base_points')}
										onDelete={() => delPoint(p, 'base_points')}
									/>
								{/each}
							{/if}
						</svg>

					</div>
				</div>
			</div>

			<!-- zoom controls -->
			<div class="absolute bottom-4 right-4 flex gap-2 rounded bg-white p-2 shadow">
				<button class="btn-ico" on:click={zoomOut}><ZoomOut class="h-5 w-5" /></button>
				<button class="btn-ico" class:active={panMode} on:click={togglePan}
					><Move class="h-5 w-5" /></button
				>
				<button class="btn-ico" on:click={zoomIn}><ZoomIn class="h-5 w-5" /></button>
			</div>
		</div>
	</main>
</div>

<style>
	.btn {
		@apply w-full rounded bg-blue-500 py-1.5 text-white hover:bg-blue-600 disabled:opacity-40;
	}
	.btn.red {
		@apply bg-red-500 hover:bg-red-600;
	}
	.btn-ico {
		@apply rounded bg-blue-500 p-1 text-white hover:bg-blue-600;
	}
	.active {
		@apply bg-green-500 ring-2 ring-green-500 ring-offset-1;
	}
	.btn.red.active {
		@apply bg-green-500 hover:bg-green-600;
	}
	.btn.white {
		@apply border-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-100;
	}
</style>
