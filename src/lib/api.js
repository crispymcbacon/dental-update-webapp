export async function callSegmentationApi(imageFile, viewType) {
	const formData = new FormData();
	formData.append('image', imageFile);
	formData.append('view_type', viewType);

	try {
		const response = await fetch(`${import.meta.env.VITE_API_URL}/predict_image/`, {
			method: 'POST',
			body: formData
		});

		const responseText = await response.text();

		if (!response.ok) {
			console.error('API Error Status:', response.status);
			console.error('API Error Response Text:', responseText);
			// Try to parse as JSON if possible, otherwise use text
			let detail = responseText;
			try {
				const errorJson = JSON.parse(responseText);
				detail = errorJson.detail || responseText;
			} catch (parseError) {}
			throw new Error(`HTTP error! Status: ${response.status}. Detail: ${detail}`);
		}

		// Now parse the text as JSON
		const data = JSON.parse(responseText);

		// Check if the expected keys exist
		if (!data || !data.mask || !data.json_data?.teeth) {
			console.error('API response missing expected keys or invalid format:', data);
			throw new Error('Invalid API response format.');
		}

		return {
			maskImageSrc: `data:image/png;base64,${data.mask}`,
			toothData: {
				image_size: data.json_data.image_size,
				teeth: data.json_data.teeth,
				view: data.json_data.view,
				message: data.message
			}
		};
	} catch (error) {
		console.error('Error calling API:', error);
		if (error instanceof SyntaxError) {
			throw new Error('Failed to parse API response. Please check server logs.');
		} else if (error.message.includes('HTTP error')) {
			throw new Error(`API request failed: ${error.message}`);
		} else {
			throw new Error('An unexpected error occurred. Please try again.');
		}
	}
}
