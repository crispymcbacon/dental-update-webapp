<script lang="ts">
	/* A two-step UI:
	   – Loader       → user chooses “predict” or “load files”
	   – Editor       → appears as soon as we have a JSON in the store
	*/
	import { teethStore } from '$lib/stores/teethStore';
	import Loader  from '$lib/components/Loader.svelte';
	import Editor  from '$lib/components/Editor.svelte';

	// reactive destructuring
	$: ({ toothData } = $teethStore);
</script>

{#if toothData === null}
	<Loader />
{:else}
	<Editor />
{/if}