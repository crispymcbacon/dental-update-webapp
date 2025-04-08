export async function predictImage(file) {
	const formData = new FormData();
	formData.append('image', file);

	const response = await fetch('http://localhost:8000/predict_image/', {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

	const data = await response.json();
	return {
		mask: `data:image/png;base64,${data.mask}`,
		toothData: data.json_data
	};
}
