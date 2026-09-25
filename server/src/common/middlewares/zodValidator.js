function validateZod(schema, source = "body") {
  return (req, res, next) => {
    const input = req[source] === undefined ? {} : req[source];
    const result = schema.safeParse(input);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation error",
        details: result.error.issues.map((issue) => issue.message),
      });
    }

    req[source] = result.data;
    next();
  };
}

module.exports = { validateZod };
