/** Cache defined results by key; failed computations remain retryable. */
export function memoize<K, V>(compute: (key: K) => V): (key: K) => V {
    const values = new Map<K, V>();
    return key => {
        let value = values.get(key);
        if (value === undefined) values.set(key, value = compute(key));
        return value;
    };
}
