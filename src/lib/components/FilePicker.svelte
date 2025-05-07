<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { teethStore } from '$lib/stores/teethStore';
	const dispatch = createEventDispatcher();

	let originalFile, maskFile, jsonFile;
	let error = '';

	async function loadAll() {
		try {
			if (!originalFile || !maskFile || !jsonFile) throw 'Carica tutti i file.';

			const [origSrc, maskSrc] = await Promise.all([
				toDataURI(originalFile),
				toDataURI(maskFile)
			]);

			teethStore.setOriginal(origSrc, originalFile.name);
			teethStore.setMask(maskSrc);
			const loadedData = JSON.parse(await jsonFile.text());

			// --- Data Transformation ---
			const transformedData = { ...loadedData, apex_points: [], base_points: [] };
			let pointIdCounter = 1; // Simple counter for unique IDs

			if (transformedData.teeth && Array.isArray(transformedData.teeth)) {
				transformedData.teeth.forEach(tooth => {
					if (tooth.apex && Array.isArray(tooth.apex)) {
						transformedData.apex_points.push({
							point_id: pointIdCounter++,
							tooth_number: tooth.tooth_number,
							position: tooth.apex,
							type: 'apex'
						});
					}
					if (tooth.base && Array.isArray(tooth.base)) {
						transformedData.base_points.push({
							point_id: pointIdCounter++,
							tooth_number: tooth.tooth_number,
							position: tooth.base,
							type: 'base'
						});
					}
					// Optional: Remove original apex/base from tooth object if desired
					// delete tooth.apex;
					// delete tooth.base;
				});
			}
			// --- End Transformation ---

			teethStore.setToothData(transformedData); // Use transformed data
		} catch (e) {
			error = e;
		}
	}

	const toDataURI = (f) =>
		new Promise<string>((resolve) => {
			const r = new FileReader();
			r.onload = () => resolve(r.result as string);
			r.readAsDataURL(f);
		});
</script>

<h2 class="text-lg font-medium mb-4 text-center">Carica i 3 file</h2>

<div class="space-y-4">
	<div>
		<label for="originalFile" class="flex items-center text-sm font-medium text-gray-700 mb-1">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			Immagine
		</label>
		<input id="originalFile" type="file" class="file-input" accept="image/*" on:change={(e)=>originalFile = (e.target as HTMLInputElement).files[0]} />
	</div>

	<div>
		<label for="maskFile" class="flex items-center text-sm font-medium text-gray-700 mb-1">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m6 4H9m2-8H9" />
			</svg>
			Maschera (PNG)
		</label>
		<input id="maskFile" type="file" class="file-input" accept="image/png" on:change={(e)=>maskFile = (e.target as HTMLInputElement).files[0]} />
	</div>

	<div>
		<label for="jsonFile" class="flex items-center text-sm font-medium text-gray-700 mb-1">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			JSON (Metadati)
		</label>
		<input id="jsonFile" type="file" class="file-input" accept="application/json" on:change={(e)=>jsonFile = (e.target as HTMLInputElement).files[0]} />
	</div>

	{#if error}<p class="text-red-500 text-sm mt-2">{error}</p>{/if}

	<button class="btn-primary w-full mt-4" on:click={loadAll}>Carica</button>
	<button class="text-sm text-gray-500 hover:text-gray-700 mt-2 w-full text-center" on:click={() => dispatch('back')}>← torna indietro</button>
</div>

<style>
	.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300; }
	.file-input { @apply block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100; }
</style>