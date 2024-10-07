export const handleErrorResponse = (err, res) => {
  console.log("Stack trace", err.stack);
  res.status(500).json({ error: err.message });
};
