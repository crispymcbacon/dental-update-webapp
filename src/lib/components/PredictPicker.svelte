<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { teethStore } from '$lib/stores/teethStore';
	import { callSegmentationApi } from '$lib/api.js';

	const dispatch     = createEventDispatcher();
	let viewType       = 'frontal';
	let file : File | null = null;
	let loading        = false;
	let error          = '';

	async function start() {
		if (!file) return;
		loading = true; error = '';

		try {
			// 1) call backend
			const { maskImageSrc, toothData } = await callSegmentationApi(file, viewType);

			// 2) save everything inside the store
			teethStore.setOriginal(await toDataURI(file), file.name);
			teethStore.setMask(maskImageSrc);
			teethStore.setToothData(toothData);
		} catch (e) {
			error = String(e);
		} finally {
			loading = false;
		}
	}

	const toDataURI = (f:File) =>
		new Promise<string>((resolve)=>{
			const r=new FileReader();
			r.onload=()=>resolve(r.result as string);
			r.readAsDataURL(f);
		});
</script>

<h2 class="text-lg font-medium mb-4 text-center">Carica immagine da inviare all’API</h2>

<div class="space-y-3">
	<select class="w-full border rounded p-2" bind:value={viewType}>
		<option value="frontal">Vista frontale</option>
		<option value="left">Lato sinistro</option>
		<option value="right">Lato destro</option>
		<option value="upper">Mascella superiore</option>
		<option value="lower">Mascella inferiore</option>
	</select>

	<input type="file" accept="image/*" on:change={(e)=>file=(e.target as HTMLInputElement).files[0]} />

	{#if error}<p class="text-red-500 text-sm">{error}</p>{/if}

	<button class="btn-primary w-full" on:click={start} disabled={!file || loading}>
		{loading ? 'Elaborazione…' : 'Invia'}
	</button>

	<button class="text-sm text-gray-400 mt-2" on:click={() => dispatch('back')}>← torna indietro</button>
</div>

<style>
	.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white py-2 rounded; }
</style>