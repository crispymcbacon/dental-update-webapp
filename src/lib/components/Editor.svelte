<script lang="ts">
	/* ---------- imports ---------- */
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { teethStore } from '$lib/stores/teethStore';

	import {
		addTooth, moveTooth, deleteTooth,
		addPoint, movePoint, deletePoint,
		zoomIn  as zIn,
		zoomOut as zOut
	} from '$lib/logic/teeth';

	import {
		randomColor,
		setupCanvas,
		beginStroke,
		continueStroke,
		downloadMergedMask
	} from '$lib/logic/canvas';

	import ToothLabel from '$lib/components/ToothLabel.svelte';
	import PointLabel from '$lib/components/PointLabel.svelte';

	import { ZoomIn, ZoomOut, Move } from 'lucide-svelte';

	/* ---------- reactive copy of the store ---------- */
	$: ({
		originalImageSrc,
		maskImageSrc,
		toothData,
		originalFilename
	} = $teethStore);

	/* ---------- local UI flags ---------- */
	let scale       = 1;
	let panMode     = false;

	let addMode     : 'tooth' | 'apex' | 'base' | null = null;
	let deleteMode  : 'tooth' | 'apex' | 'base' | null = null;

	/* ---------- segmentation canvas ---------- */
	let segMode   = false;
	let drawingCanvas: HTMLCanvasElement;
	let ctx : CanvasRenderingContext2D;
	let isDrawing = false;
	let drawColor = randomColor();

	function toggleSegMode() {
		segMode = !segMode;

		if (segMode) {
			// wait DOM, then initialise canvas
			tick().then(() => {
				drawingCanvas = document.getElementById('drawCanvas') as HTMLCanvasElement;
				ctx           = setupCanvas(drawingCanvas, toothData.image_size, drawColor);

				drawingCanvas.addEventListener('mousedown',  handleStartDraw);
				drawingCanvas.addEventListener('mousemove',  handleDraw);
				drawingCanvas.addEventListener('mouseup',    stopDraw);
				drawingCanvas.addEventListener('mouseleave', stopDraw);
			});
		}
	}

	function handleStartDraw(e) { isDrawing = beginStroke(e, ctx, drawingCanvas); }
	function handleDraw     (e) { continueStroke(e, ctx, drawingCanvas, isDrawing); }
	function stopDraw()          { isDrawing = false; }

	function newFreeArea() {
		drawColor = randomColor();
		if (ctx) ctx.strokeStyle = drawColor;
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
	const zoomIn  = () => (scale = zIn(scale));
	const zoomOut = () => (scale = zOut(scale));
	const togglePan = () => (panMode = !panMode);

	/* ---------- add / delete modes ---------- */
	function enableAdd(mode: 'tooth' | 'apex' | 'base') {
		addMode    = addMode === mode ? null : mode;
		deleteMode = null;
	}

	function enableDelete(mode: 'tooth' | 'apex' | 'base') {
		deleteMode = deleteMode === mode ? null : mode;
		addMode    = null;
		if (deleteMode) alert('Seleziona un elemento da eliminare');
	}

	/* ---------- CLICK on SVG (adds items) ---------- */
	function handleSvgClick(e) {
		if (!addMode) return;

		const svg = e.currentTarget as SVGSVGElement;
		const { x, y } = svgCoords(e, svg);

		if (addMode === 'tooth') {
			const n = prompt('Numero del dente?');
			if (!n) return;
			teethStore.setToothData(addTooth(toothData, { x, y }, +n));
		} else {
			const toothStr = prompt('Associa a quale dente?');
			if (!toothStr) return;
			const type = addMode === 'apex' ? 'apex' : 'base';
			try {
				teethStore.setToothData(
					addPoint(toothData, type, +toothStr, { x, y })
				);
			} catch (err) {
				alert(err.message);
			}
		}
		addMode = null;
	}

	/* ---------- DRAG tooth ---------- */
	function startToothDrag(e, tooth) {
		if (panMode || deleteMode) return;
		const svg = document.querySelector('svg');

		function move(ev) {
			const { x, y } = svgCoords(ev, svg);
			teethStore.setToothData(
				moveTooth(get(teethStore).toothData, tooth.tooth_number, { x, y })
			);
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', stop);
			window.removeEventListener('touchmove', move);
			window.removeEventListener('touchend', stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup',   stop);
		window.addEventListener('touchmove', move);
		window.addEventListener('touchend',  stop);
	}

	/* ---------- DRAG apex / base ---------- */
	function startPointDrag(e, point, key) {
		if (panMode || deleteMode) return;
		const svg = document.querySelector('svg');
		const type = key === 'apex_points' ? 'apex' : 'base';

		function move(ev) {
			const { x, y } = svgCoords(ev, svg);
			teethStore.setToothData(
				movePoint(get(teethStore).toothData, type, point.point_id, { x, y })
			);
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', stop);
			window.removeEventListener('touchmove', move);
			window.removeEventListener('touchend', stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup',   stop);
		window.addEventListener('touchmove', move);
		window.addEventListener('touchend',  stop);
	}

	/* ---------- DELETE single element ---------- */
	const delTooth  = (t)                     => { if (deleteMode==='tooth') delOk(deleteTooth(toothData, t.tooth_number)); };
	const delPoint  = (p, key)                => {
		const type = key==='apex_points' ? 'apex' : 'base';
		if (deleteMode===type) delOk(deletePoint(toothData, type, p.point_id));
	};
	function delOk(newData){ teethStore.setToothData(newData); deleteMode=null; }

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

	function saveMask() {
		downloadMergedMask(
			drawingCanvas,
			maskImageSrc,
			originalFilename?.replace(/\.[^.]+$/, '') || 'image'
		);
	}

	/* ---------- PAN scroll of wrapper ---------- */
	function handlePanStart(e) {
		if (!panMode) return;
		const wrap = e.currentTarget;
		const sx = e.clientX, sy = e.clientY;
		const startL = wrap.scrollLeft, startT = wrap.scrollTop;

		function move(ev) {
			wrap.scrollLeft = startL - (ev.clientX - sx);
			wrap.scrollTop  = startT - (ev.clientY - sy);
		}
		function stop() {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup',   stop);
		}
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup',   stop);
	}
</script>

<!-- ========== LAYOUT ================================================= -->
<div class="flex min-h-screen">
	<!-- ---------- LEFT toolbar ---------- -->
	<aside class="w-64 shrink-0 bg-gray-50 p-4 space-y-2">
		<button class="btn" on:click={undo} disabled={$teethStore.index <= 0}>Annulla</button>

		<button class="btn" class:active={addMode==='tooth'} on:click={()=>enableAdd('tooth')}>+ Dente</button>
		<button class="btn" class:active={addMode==='apex'}  on:click={()=>enableAdd('apex')}>+ Apice</button>
		<button class="btn" class:active={addMode==='base'}  on:click={()=>enableAdd('base')}>+ Base</button>

		<button class="btn red" class:active={deleteMode==='tooth'} on:click={()=>enableDelete('tooth')}>Elimina Dente</button>
		<button class="btn red" class:active={deleteMode==='apex'}  on:click={()=>enableDelete('apex')}>Elimina Apice</button>
		<button class="btn red" class:active={deleteMode==='base'}  on:click={()=>enableDelete('base')}>Elimina Base</button>

		<hr class="my-2">

		<button class="btn" on:click={toggleSegMode}>
			{segMode ? 'Esci Segmentazione' : 'Modalità Segmentazione'}
		</button>
		{#if segMode}
			<button class="btn" on:click={newFreeArea}>Nuova Area</button>
			<button class="btn" on:click={saveMask}>Scarica Maschera</button>
		{/if}

		<hr class="my-2">
		<button class="btn" on:click={saveJson}>Salva JSON</button>
	</aside>

	<!-- ---------- MAIN canvas ---------- -->
	<main class="flex-1 p-4">
		<div class="relative">
			<!-- scroll wrapper -->
			<div class="overflow-auto border rounded"
			     style="cursor:{panMode?'grab':'default'}"
			     on:mousedown={handlePanStart}>

				<!-- scaled container -->
				<div class="origin-top-left" style="transform:scale({scale});">
					<div class="relative inline-block">
						<img src={originalImageSrc} />
						<img src={maskImageSrc}
							 class="absolute inset-0 opacity-50 mix-blend-multiply"/>

						<!-- SVG overlay -->
						<svg	class="absolute inset-0 w-full h-full"
							 viewBox="0 0 {toothData.image_size[1]} {toothData.image_size[0]}"
							 on:click={handleSvgClick}>

							{#each toothData.teeth || [] as t (t.tooth_number)}
								<ToothLabel tooth={t} {toothData} {panMode} {deleteMode}
									onDrag={(e) => startToothDrag(e, t)}
									onDelete={() => delTooth(t)}/>
							{/each}

							{#if toothData.apex_points}
								{#each (toothData.apex_points || []).filter(p => p && p.point_id != null) as p (p.point_id)}
									<PointLabel point={p} pointKey="apex_points" {toothData} {panMode} {deleteMode}
										onDrag={(e) => startPointDrag(e, p, 'apex_points')}
										onDelete={() => delPoint(p, 'apex_points')}/>
								{/each}
							{/if}
							{#if toothData.base_points}
								{#each (toothData.base_points || []).filter(p => p && p.point_id != null) as p (p.point_id)}
									<PointLabel point={p} pointKey="base_points" {toothData} {panMode} {deleteMode}
										onDrag={(e) => startPointDrag(e, p, 'base_points')}
										onDelete={() => delPoint(p, 'base_points')}/>
								{/each}
							{/if}
						</svg>

						{#if segMode}
							<canvas id="drawCanvas"
									class="absolute inset-0 pointer-events-auto"></canvas>
						{/if}
					</div>
				</div>
			</div>

			<!-- zoom controls -->
			<div class="absolute bottom-4 right-4 flex gap-2 bg-white rounded shadow p-2">
				<button class="btn-ico" on:click={zoomOut}><ZoomOut class="w-5 h-5"/></button>
				<button class="btn-ico" class:active={panMode} on:click={togglePan}><Move class="w-5 h-5"/></button>
				<button class="btn-ico" on:click={zoomIn}><ZoomIn class="w-5 h-5"/></button>
			</div>
		</div>
	</main>
</div>

<style>
	.btn          { @apply w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded disabled:opacity-40; }
	.btn.red      { @apply bg-red-500 hover:bg-red-600; }
	.btn-ico      { @apply bg-blue-500 hover:bg-blue-600 text-white p-1 rounded; }
	.active       { @apply ring-2 ring-offset-1 ring-green-500; }
</style>