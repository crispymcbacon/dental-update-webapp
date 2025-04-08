<script>
	import '../app.css';
	import { authenticated } from '$lib/stores/auth';
	import PasswordProtection from '$lib/components/PasswordProtection.svelte';
	let { children } = $props();
</script>

{#if $authenticated}
	{@render children()}
{:else}
	<PasswordProtection />
{/if}
