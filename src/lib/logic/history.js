/*  Pure push / undo helpers
    ---------------------------------------------------------- */

/** push a new immutable snapshot into history */
export function pushHistory(history, index, newState) {
	const safeCopy = structuredClone(newState);

	//  drop “future” if the user had undone something
	const trimmed = index < history.length - 1 ? history.slice(0, index + 1) : history;

	return {
		history : [...trimmed, safeCopy],
		index   : trimmed.length          // last element
	};
}

/** one-step undo – if nothing to undo returns the same state */
export function undoHistory(history, index) {
	if (index <= 0) {
		return { state: history[0] ?? null, index: 0 };
	}
	return {
		state : structuredClone(history[index - 1]),
		index : index - 1
	};
}