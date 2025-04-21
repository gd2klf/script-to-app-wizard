
const isTraceEnabled = (response: any): boolean => {
  // TRACE is only considered enabled if it returns exactly 200 status code
  return response.status === 200;
};
