export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: err.message || "Server Error",
  });
};
