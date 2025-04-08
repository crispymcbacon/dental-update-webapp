<script>
  import { authenticated, checkPassword } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  
  let password = '';
  let error = '';
  let isLoading = false;
  
  function handleSubmit() {
    isLoading = true;
    error = '';
    
    // Small delay to simulate processing
    setTimeout(() => {
      if (checkPassword(password)) {
        // Password is correct
        error = '';
      } else {
        // Password is incorrect
        error = 'Password non valida. Riprova.';
      }
      isLoading = false;
    }, 300);
  }
</script>

<div class="fixed inset-0 bg-blue-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Accesso Riservato</h2>
      <p class="text-gray-600 mt-2">Inserisci la password per accedere alla piattaforma.</p>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Inserisci la password"
          required
        />
        {#if error}
          <p class="mt-2 text-sm text-red-600">{error}</p>
        {/if}
      </div>
      
      <button
        type="submit"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
        disabled={isLoading}
      >
        {#if isLoading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verifica in corso...
        {:else}
          Accedi
        {/if}
      </button>
    </form>
  </div>
</div>
