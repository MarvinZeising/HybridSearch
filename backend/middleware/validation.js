export const validateBranchId = (req, res, next) => {
  const { branchId } = req.body;

  if (!branchId) {
    return res.status(400).json({ error: 'branchId is required' });
  }

  next();
};

export const validateRequiredFields = (fields) => (req, res, next) => {
  const missingFields = fields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  next();
};
