// server/src/middleware/validateRequest.js
// Zod-based request body validation middleware factory.
// Usage: router.post("/path", validate(myZodSchema), handler)

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Replace req.body with the parsed (and coerced/trimmed) data
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
