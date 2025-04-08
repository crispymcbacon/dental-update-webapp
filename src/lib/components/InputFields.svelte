<script>
    let originalImageFile;
    let maskImageFile;
    let jsonFile;
    export let onOriginalImageLoad;
    export let onMaskImageLoad;
    export let onJsonLoad;
  
    function handleOriginalImageUpload(event) {
      originalImageFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onOriginalImageLoad(reader.result, originalImageFile.name);
      };
      reader.readAsDataURL(originalImageFile);
    }

    function handleMaskImageUpload(event) {
      maskImageFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        onMaskImageLoad(reader.result);
      };
      reader.readAsDataURL(maskImageFile);
    }
  
    function handleJsonUpload(event) {
      jsonFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        // Pass both the JSON data and the filename to the parent component
        onJsonLoad(JSON.parse(reader.result), jsonFile.name);
      };
      reader.readAsText(jsonFile);
    }
</script>
  
<div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-gray-600">Immagine Originale (JPG/JPEG):</span>
        <label class="cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 text-center">
            Scegli File
            <input type="file" class="hidden" accept="image/jpeg,image/jpg" on:change={handleOriginalImageUpload} />
        </label>
    </div>
    <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-gray-600">Immagine Maschera (PNG):</span>
        <label class="cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 text-center">
            Scegli File
            <input type="file" class="hidden" accept="image/png" on:change={handleMaskImageUpload} />
        </label>
    </div>
    <div class="flex flex-col gap-2">
        <span class="text-sm font-medium text-gray-600">Dati JSON:</span>
        <label class="cursor-pointer rounded border-none bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 text-center">
            Scegli File
            <input type="file" class="hidden" accept="application/json" on:change={handleJsonUpload} />
        </label>
    </div>
</div>

<style>
    .flex {
        display: flex;
    }

    .flex-col {
        flex-direction: column;
    }

    .gap-4 {
        gap: 1rem;
    }

    .gap-2 {
        gap: 0.5rem;
    }

    .text-sm {
        font-size: 0.875rem;
    }

    .font-medium {
        font-weight: 500;
    }

    .text-gray-600 {
        color: #4a5568;
    }

    .cursor-pointer {
        cursor: pointer;
    }

    .rounded {
        border-radius: 0.25rem;
    }

    .border-none {
        border: none;
    }

    .bg-blue-500 {
        background-color: #2196f3;
    }

    .px-4 {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .py-2 {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }

    .text-white {
        color: #ffffff;
    }

    .transition-colors {
        transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .hover\:bg-blue-600:hover {
        background-color: #1a76d2;
    }

    .text-center {
        text-align: center;
    }

    .hidden {
        display: none;
    }
</style>