function validate(schema, source = "body") {
  return (req, res, next) => {
    if (typeof schema.safeParse === "function") {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        return res.status(400).json({
          error: "Validation error",
          details: result.error.issues.map((issue) => issue.message),
        });
      }

      req[source] = result.data;
      return next();
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // retourne toutes les erreurs, pas juste la première
      stripUnknown: true, // supprime les champs non déclarés dans le schéma
    });

    if (error) {
      return res.status(400).json({
        error: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }

    req[source] = value; // remplace par la version validée/nettoyée
    next();
  };
}

module.exports = { validate };
