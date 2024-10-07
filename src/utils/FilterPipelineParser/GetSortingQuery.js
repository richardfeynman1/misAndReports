export const getSortingKeyPipeline = (sortingKey, sortingOrder) => {
  const sortDirection = sortingOrder === "desc" ? -1 : 1;

  if (sortingKey.includes(".")) {
    const [baseKey, ...nestedKeys] = sortingKey.split(".");

    if (baseKey === "contractFields") {
      const nestedKey = nestedKeys.join(".");

      return [
        {
          $addFields: {
            sortingField: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $filter: {
                        input: "$contractFields",
                        as: "field",
                        cond: {
                          $eq: [
                            nestedKeys[0],
                            {
                              $cond: {
                                if: {
                                  $in: [
                                    nestedKeys[0],
                                    [
                                      "counterpartyOrg",
                                      "counterpartyIndividual",
                                      "counterpartyOrgPerson",
                                      "entity",
                                      "entitySignatoryPerson",
                                    ],
                                  ],
                                },
                                then: "$$field.type",
                                else: "$$field.id",
                              },
                            },
                          ],
                        },
                      },
                    },
                    as: "field",
                    in: {
                      $cond: {
                        if: {
                          $regexMatch: {
                            input: `$$field.${nestedKey
                              .split(".")
                              .slice(1)
                              .join(".")}`,
                            regex: /^[+-]?\d+(\.\d+)?$/,
                          },
                        },
                        then: {
                          $toDouble: `$$field.${nestedKey
                            .split(".")
                            .slice(1)
                            .join(".")}`,
                        },
                        else: {
                          $cond: {
                            if: {
                              $regexMatch: {
                                input: `$$field.${nestedKey
                                  .split(".")
                                  .slice(1)
                                  .join(".")}`,
                                regex: /^(true|false)$/i,
                              },
                            },
                            then: {
                              $toBool: `$$field.${nestedKey
                                .split(".")
                                .slice(1)
                                .join(".")}`,
                            },
                            else: `$$field.${nestedKey
                              .split(".")
                              .slice(1)
                              .join(".")}`,
                          },
                        },
                      },
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        { $sort: { sortingField: sortDirection } },
        { $unset: "sortingField" },
      ];
    }
  } else {
    return [{ $sort: { [sortingKey]: sortingOrder === "desc" ? -1 : 1 } }];
  }
};
