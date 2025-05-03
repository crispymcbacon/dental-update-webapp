<script lang="ts">
	import { writable } from 'svelte/store';
	import FilePicker     from './FilePicker.svelte';
	import PredictPicker  from './PredictPicker.svelte';

	const step = writable<'menu'|'predict'|'load'>('menu');
</script>

<section class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-6">

		{#if $step === 'menu'}
			<h1 class="text-xl font-semibold text-center">Come vuoi iniziare?</h1>

			<button class="btn-primary w-full" on:click={() => step.set('predict')}>
				Carica immagine (usa API)
			</button>

			<button class="btn-primary w-full" on:click={() => step.set('load')}>
				Ho già immagine + maschera + json
			</button>
		{:else if $step === 'predict'}
			<PredictPicker on:back={() => step.set('menu')} />
		{:else if $step === 'load'}
			<FilePicker    on:back={() => step.set('menu')} />
		{/if}
	</div>
</section>

<style>
	.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white py-2 rounded; }
</style>