function spliceString(
	input: string,
	offset: number,
	length = 0,
	replacement = '',
) {
	// We cannot pass negative indexes directly to the 2nd slicing operation.
	if (offset < 0) {
		offset = input.length + offset;
		if (offset < 0) {
			offset = 0;
		}
	}

	return (
		input.slice(0, offset) +
		(replacement || '') +
		input.slice(offset + length)
	);
}

export default spliceString;
