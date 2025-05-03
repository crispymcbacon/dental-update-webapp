import { writable } from 'svelte/store';
import { pushHistory, undoHistory } from '$lib/logic/history';

/*  shape:
    {
	 originalImageSrc  : string | null,
	 originalFilename  : string,
	 maskImageSrc      : string | null,
	 toothData         : object | null,
	 history           : any[],
	 index             : number
    }
*/
function createStore() {
	const { subscribe, update, set } = writable({
		originalImageSrc : null,
		originalFilename : '',
		maskImageSrc     : null,
		toothData        : null,
		history          : [],
		index            : -1
	});

	return {
		subscribe,

		/* ------------------------------------------------------- */
		setOriginal(src, filename = '') {
			update(s => ({ ...s, originalImageSrc: src, originalFilename: filename }));
		},

		setMask(src) {
			update(s => ({ ...s, maskImageSrc: src }));
		},

		setToothData(data) {
			update(s => {
				const { history, index } = pushHistory(s.history, s.index, data);
				return { ...s, toothData: data, history, index };
			});
		},

		undo() {
			update(s => {
				const { state, index } = undoHistory(s.history, s.index);
				return { ...s, toothData: state, index };
			});
		}
	};
}

export const teethStore = createStore();