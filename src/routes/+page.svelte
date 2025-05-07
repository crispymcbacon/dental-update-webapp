<script>
	import { goto } from '$app/navigation';
	import { logout } from '$lib/stores/auth';

	function navigateTo(path) {
		goto(path);
	}

	function handleLogout() {
		logout();
	}
</script>

<div class="min-h-screen bg-blue-50 flex flex-col">
	<!-- Header -->
	<header class="bg-white shadow-sm p-4">
		<div class="container mx-auto flex justify-between items-center">
			<h1 class="text-2xl font-semibold text-gray-800">Piattaforma di Test</h1>
			<div class="flex items-center space-x-4">
				<button class="text-gray-600 hover:text-gray-800" aria-label="Notifiche">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
				</button>
				<button class="text-gray-600 hover:text-gray-800" aria-label="Impostazioni">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
				<button 
					on:click={handleLogout}
					class="text-gray-600 hover:text-gray-800 flex items-center"
					title="Disconnetti"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-grow container mx-auto p-6">
		<div class="max-w-4xl mx-auto">
			<!-- Welcome Section -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-8">
				<h2 class="text-2xl font-semibold text-gray-800 mb-4">Benvenuto</h2>
				<p class="text-gray-600 mb-4">
					Utilizza gli strumenti di seguito per segmentare e annotare i dati dentali.
				</p>
			</div>

			<!-- Tools Section -->
			<div class="grid grid-cols-1 md:grid-cols-1 gap-6">
				<!-- New Merged Tool Card -->
				<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
					<div class="p-6">
						<div class="flex items-center justify-center h-32 mb-4 bg-blue-50 rounded-lg">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-blue-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-gray-800 mb-2">Segmentazione e Annotazione</h3>
						<p class="text-gray-600 mb-4">
							Accedi alla nuova interfaccia per segmentare e annotare immagini dentali.
						</p>
						<button
							on:click={() => navigateTo('/teeth/')}
							class="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
						>
							<span>Vai alla Pagina</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Ricostruzione 3D Section -->
			<div class="mt-8">
				<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
					<div class="p-6">
						<div class="flex items-center justify-center h-32 mb-4 bg-blue-50 rounded-lg">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-gray-800 mb-2">Ricostruzione 3D</h3>
						<p class="text-gray-600 mb-4">
							Carica immagini per ricostruire un modello 3D dei denti.
						</p>
						<button
							on:click={() => navigateTo('/reconstruction')}
							class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
							disabled
						>
							<span>Inizia Ricostruzione</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Legacy Tools Section -->
		<div class="max-w-4xl mx-auto mt-12 mb-8">
			<div class="bg-gray-100 rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold text-gray-700 mb-3">Strumenti Legacy</h2>
				<p class="text-gray-600 mb-6">
					Le seguenti sezioni di segmentazione e annotazione sono deprecate e verranno rimosse in futuro. Si consiglia di utilizzare la nuova pagina unificata.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Legacy Segmentation Card -->
					<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
						<div class="p-6">
							<div class="flex items-center justify-center h-32 mb-4 bg-blue-50 rounded-lg">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 class="text-xl font-semibold text-gray-800 mb-2">Segmentazione (Legacy)</h3>
							<p class="text-gray-600 mb-4">
								Identifica i denti da un'immagine utilizzando strumenti di intelligenza artificiale.
							</p>
							<button
								on:click={() => navigateTo('/predict')}
								class="w-full py-2 px-4 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
							>
								<span>Inizia Segmentazione (Legacy)</span>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
						</div>
					</div>

					<!-- Legacy Annotation Card -->
					<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
						<div class="p-6">
							<div class="flex items-center justify-center h-32 mb-4 bg-blue-50 rounded-lg">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
								</svg>
							</div>
							<h3 class="text-xl font-semibold text-gray-800 mb-2">Annotazione (Legacy)</h3>
							<p class="text-gray-600 mb-4">
								Accedi agli strumenti per etichettare e modificare i dati manualmente.
							</p>
							<button
								on:click={() => navigateTo('/label')}
								class="w-full py-2 px-4 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
							>
								<span>Inizia Annotazione (Legacy)</span>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="bg-white shadow-inner py-4">
		<div class="container mx-auto px-6">
			<p class="text-center text-gray-300 text-sm">
				2025
			</p>
		</div>
	</footer>
</div>

<style>
	/* Additional custom styles can be added here */
</style>