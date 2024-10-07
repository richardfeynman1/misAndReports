export const NumberFieldParser = (op, field, projectionId) => {
  console.log(op, projectionId, "Operator and Value details");

  const nestedField = field.split(".");
  const fieldPath =
    nestedField.length > 1 ? nestedField.slice(1).join(".") : field;

  const [operator, values] = Object.entries(op)[0];
  console.log(operator, values, "Operator and values");

  const valueArray = Array.isArray(values) ? values : [values];

  const convertedValues = valueArray.map((value) =>
    typeof value === "number" ? value : parseFloat(value)
  );

  return {
    $expr: {
      $anyElementTrue: {
        $map: {
          input: "$contractFields",
          as: "field",
          in: {
            $and: [
              { $eq: ["$$field.id", projectionId] },
              {
                $cond: {
                  if: { $ne: [{ $type: `$$field.${fieldPath}` }, "missing"] },
                  then: {
                    [operator]: [
                      {
                        $convert: {
                          input: `$$field.${fieldPath}`,
                          to: "double",
                          onError: { $literal: null },
                          onNull: { $literal: null },
                        },
                      },
                      ...convertedValues,
                    ],
                  },
                  else: false,
                },
              },
            ],
          },
        },
      },
    },
  };
};
