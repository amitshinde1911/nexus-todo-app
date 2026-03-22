type ClassValue = string | number | boolean | null | undefined | Record<string, boolean> | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
    return inputs
        .flat()
        .filter(Boolean)
        .map((input) => {
            if (typeof input === 'string' || typeof input === 'number') return input;
            if (typeof input === 'object' && input !== null) {
                return Object.entries(input)
                    .filter(([_, value]) => Boolean(value))
                    .map(([key]) => key)
                    .join(' ');
            }
            return '';
        })
        .filter(Boolean)
        .join(' ');
}

export function cn(...inputs: ClassValue[]): string {
    return clsx(...inputs);
}
