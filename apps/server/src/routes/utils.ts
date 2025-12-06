const toDateString = (value: string) => {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error("Invalid date format");
	}
	return parsed.toISOString().slice(0, 10);
};

export const parseDateRequired = (value: string): string => toDateString(value);

export const parseDateOptional = (value?: string | null): string | null => {
	if (value === undefined || value === null) return null;
	return toDateString(value);
};
