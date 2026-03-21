interface FetchError extends Error {
  status: number;
}

export const fetcher = async (...args: Parameters<typeof fetch>) => {
  const res = await fetch(...args);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as FetchError;
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};
