export const errorHandler = (err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    message: err.message || "Server Error",
  });
};
