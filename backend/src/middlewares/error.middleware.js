export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const propertyConflict = err.code === 11000 && err.keyPattern?.propertyNumber;
  const positionConflict = err.code === 11000 && err.keyPattern?.association && err.keyPattern?.position;
  const locationConflict = err.code === 11000 && err.keyPattern?.municipality && err.keyPattern?.barangay;
  const conflictMessage = propertyConflict ? "Property number is already in use"
    : positionConflict ? "This position is already taken in this association"
    : locationConflict ? "This municipality and barangay is already assigned to another association" : null;
  const statusCode = conflictMessage ? 409 : err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: conflictMessage || err.message || "Server Error",
    ...(err.field ? { field: err.field } : {}),
  });
};
