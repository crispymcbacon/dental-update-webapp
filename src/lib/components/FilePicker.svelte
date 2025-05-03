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
			teethStore.setToothData(JSON.parse(await jsonFile.text()));
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

<div class="space-y-3">
	<input type="file" accept="image/*"         on:change={(e)=>originalFile = (e.target as HTMLInputElement).files[0]} />
	<input type="file" accept="image/png"       on:change={(e)=>maskFile     = (e.target as HTMLInputElement).files[0]} />
	<input type="file" accept="application/json"on:change={(e)=>jsonFile     = (e.target as HTMLInputElement).files[0]} />

	{#if error}<p class="text-red-500 text-sm">{error}</p>{/if}

	<button class="btn-primary w-full" on:click={loadAll}>Carica</button>
	<button class="text-sm text-gray-400 mt-2" on:click={() => dispatch('back')}>← torna indietro</button>
</div>

<style>
	.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white py-2 rounded; }
</style>