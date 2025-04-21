
const isTraceEnabled = (response: any): boolean => {
  // TRACE is only considered enabled if it returns exactly 200 status code
  return response.status === 200;
};

// Create the HeaderScanner component
const HeaderScanner = () => {
  // This is a placeholder for the actual implementation
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">HTTP Security Scanner</h2>
      <p>Enter a URL to scan for security headers and HTTP methods</p>
      {/* Actual implementation will be added here */}
    </div>
  );
};

export { isTraceEnabled, HeaderScanner };
