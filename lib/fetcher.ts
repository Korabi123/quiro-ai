// @ts-expect-error Simple fetch polyfill

export const fetcher = (...args) => fetch(...args).then(res => res.json());
