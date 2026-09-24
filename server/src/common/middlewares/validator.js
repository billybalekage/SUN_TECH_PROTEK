function validate(schema, source = "body") {
  return (req, res, next) => {
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
