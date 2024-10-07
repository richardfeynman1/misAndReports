// Between([contractFields.monetary.amount_contractValue], 4000, 6000, monetary)

export const MonetaryFieldParser = (field, projectionKeyId, values) => {
  const minValue = parseFloat(values[0].replace(/,/g, ""));
  const maxValue = parseFloat(values[1].replace(/,/g, ""));

  return {
    $and: [
      {
        contractFields: {
          $elemMatch: {
            id: projectionKeyId,
          },
        },
      },
      {
        $expr: {
          $let: {
            vars: {
              matchedField: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$contractFields",
                      cond: { $eq: ["$$this.id", projectionKeyId] },
                    },
                  },
                  0,
                ],
              },
            },
            in: {
              $and: [
                {
                  $gte: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "EUR"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                1.1,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "GBP"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                1.3,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "INR"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                0.012,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "USD"],
                            },
                            then: {
                              $toDouble: {
                                $replaceAll: {
                                  input: "$$matchedField.monetary.amount",
                                  find: ",",
                                  replacement: "",
                                },
                              },
                            },
                          },
                        ],
                        default: {
                          $toDouble: {
                            $replaceAll: {
                              input: "$$matchedField.monetary.amount",
                              find: ",",
                              replacement: "",
                            },
                          },
                        },
                      },
                    },
                    minValue,
                  ],
                },
                {
                  $lte: [
                    {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "EUR"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                1.1,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "GBP"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                1.3,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "INR"],
                            },
                            then: {
                              $multiply: [
                                {
                                  $toDouble: {
                                    $replaceAll: {
                                      input: "$$matchedField.monetary.amount",
                                      find: ",",
                                      replacement: "",
                                    },
                                  },
                                },
                                0.012,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$$matchedField.monetary.currency", "USD"],
                            },
                            then: {
                              $toDouble: {
                                $replaceAll: {
                                  input: "$$matchedField.monetary.amount",
                                  find: ",",
                                  replacement: "",
                                },
                              },
                            },
                          },
                        ],
                        default: {
                          $toDouble: {
                            $replaceAll: {
                              input: "$$matchedField.monetary.amount",
                              find: ",",
                              replacement: "",
                            },
                          },
                        },
                      },
                    },
                    maxValue,
                  ],
                },
              ],
            },
          },
        },
      },
    ],
  };
};
