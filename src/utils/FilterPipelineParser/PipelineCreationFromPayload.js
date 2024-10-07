import { ObjectId } from "mongodb";

import { MonetaryFieldParser } from "./MonetaryFieldParser";
import { NumberFieldParser } from "./NumberFieldParser";

const operators = {
  And: "$and",
  Or: "$or",
  Equal: "$eq",
  NotEqual: "$ne",
  Empty: "$exists",
  NotEmpty: "NotEmpty",
  GreaterThan: "$gt",
  LessThan: "$lt",
  GreaterThanOrEqual: "$gte",
  LessThanOrEqual: "$lte",
  Between: "Between",
  In: "$in",
  Contains: "Contains",
  NotContain: "NotContain",
};

const userTypeFields = [
  "initiator",
  "members",
  "participants",
  "searchTags",
  "participantGroups",
  "memberGroups",
];

const staticDate = ["createdAt", "updatedAt"];

export const parsePayloadToMongoDBPipeline = (payload) => {
  const projectionIds = new Set();
  let typeOfValue = "string";

  const parseExpression = (expr) => {
    try {
      expr = expr.trim();
      if (expr.startsWith("And(") || expr.startsWith("Or(")) {
        const op = expr.slice(0, expr.indexOf("("));
        const content = expr.slice(op.length + 1, -1);
        const subExpressions = splitExpressions(content);
        const parsedSubExpressions = subExpressions
          .map(parseExpression)
          .filter(Boolean);

        if (parsedSubExpressions.length === 0) return null;
        if (parsedSubExpressions.length === 1) return parsedSubExpressions[0];

        return {
          [operators[op]]: parsedSubExpressions,
        };
      } else {
        const match = expr.match(/(\w+)\((\[[\w.]+(?:_[\w.]+)?\]),\s*(.+)\)/);
        if (!match) {
          throw new Error(`Invalid expression: ${expr}`);
        }

        const [, op, field, value] = match;
        if (!(op in operators)) {
          throw new Error(`Unknown operator: ${op}`);
        }

        const { cleanField, projectionId } = parseField(field);
        console.log("Parsed field:", cleanField, projectionId);
        const values = parseValues(cleanField, value);

        console.log("Parsed values:", values);
        if (projectionId) {
          projectionIds.add(projectionId);
        }

        return buildQuery(op, cleanField, values, projectionId, typeOfValue);
      }
    } catch (error) {
      console.error(`Error in parseExpression: ${error.message}`);
      return null;
    }
  };

  const splitExpressions = (content) => {
    const expressions = [];
    let parenthesesCount = 0;
    let currentExpr = "";

    for (const char of content) {
      if (char === "(") parenthesesCount++;
      if (char === ")") parenthesesCount--;
      if (char === "," && parenthesesCount === 0) {
        expressions.push(currentExpr.trim());
        currentExpr = "";
      } else {
        currentExpr += char;
      }
    }

    if (currentExpr) expressions.push(currentExpr.trim());
    return expressions;
  };

  const parseField = (field) => {
    const cleanField = field.replace(/[\[\]]/g, "");
    const parts = cleanField.split("_");
    return {
      cleanField: parts[0],
      projectionId: parts[1] || null,
    };
  };

  const parseValues = (field, valuesString) => {
    console.log(
      "Parsing values for field:",
      field,
      "valuesString:",
      valuesString
    );
    const values = valuesString
      .split(",")
      .map((v) => v.trim().replace(/^["']|["']$/g, ""));

    typeOfValue = values.pop();
    if (userTypeFields.includes(field)) {
      return values
        .map((v) => {
          try {
            return new ObjectId(v);
          } catch (error) {
            console.error(`Invalid ObjectId: ${v}`);
            return null;
          }
        })
        .filter(Boolean);
    }

    if (staticDate.includes(field)) {
      return values
        .map((v) => {
          const date = new Date(v);
          return isNaN(date.getTime()) ? null : date;
        })
        .filter(Boolean);
    }

    if (typeOfValue === "date" || typeOfValue === "number") {
      return values
        .map((v) => {
          const num = parseInt(v, 10);
          return isNaN(num) ? null : num;
        })
        .filter(Boolean);
    }
    return values;
  };

  const buildQuery = (op, field, values, projectionId, typeOfValue) => {
    let condition;
    if (values.length === 0) {
      console.warn(`No values provided for operator ${op} on field ${field}`);
      return null;
    }
    if (typeOfValue === "monetary") {
      return MonetaryFieldParser(field, projectionId, values);
    }

    switch (op) {
      case "Equal":
        condition = values.length === 1 ? { $eq: values[0] } : { $in: values };
        break;
      case "NotEqual":
        condition = values.length === 1 ? { $ne: values[0] } : { $nin: values };
        break;
      case "Contains":
        condition =
          values.length === 1
            ? { $regex: values[0], $options: "i" }
            : { $or: values?.map((val) => ({ $regex: val, $options: "i" })) };
        break;
      case "NotContain":
        condition =
          values.length === 1
            ? { $not: { $regex: values[0], $options: "i" } }
            : {
                $and: values.map((val) => ({
                  $not: { $regex: val, $options: "i" },
                })),
              };
        break;
      case "GreaterThan":
        condition = { $gt: values[0] };
        break;
      case "LessThan":
        condition = { $lt: values[0] };
        break;
      case "GreaterThanOrEqual":
        condition = { $gte: values[0] };
        break;
      case "LessThanOrEqual":
        condition = { $lte: values[0] };
        break;
      case "Empty":
        condition = { $exists: false };
        break;
      case "NotEmpty":
        condition = { $exists: true, $ne: "", $ne: null };
        break;
      case "In":
        condition = { $in: values };
        break;
      case "Between":
        if (values.length !== 2) {
          throw new Error("Between operator requires exactly two values");
        }
        condition = { $gte: values[0], $lt: values[1] };
        break;
      default:
        throw new Error(`Unsupported operator: ${op}`);
    }

    if (typeOfValue === "number") {
      return NumberFieldParser(condition, field, projectionId, values);
    }
    if (field.startsWith("contractFields.") && projectionId) {
      const nestedField = field
        .split(".")
        .slice(1)
        .join(".");

      if (field.startsWith("contractFields.multiSelect")) {
        return {
          contractFields: {
            $elemMatch: {
              id: projectionId,
              "multiSelect.selectedValues": {
                $elemMatch: {
                  value: condition,
                },
              },
            },
          },
        };
      }

      return {
        contractFields: {
          $elemMatch: {
            id: projectionId,
            [nestedField]: condition,
          },
        },
      };
    } else {
      return { [field]: condition };
    }
  };

  try {
    const parsedQuery = parseExpression(payload);
    const pipeline = [];
    console.log("Parsed query:", JSON.stringify(parsedQuery, null, 2));
    if (parsedQuery && Object.keys(parsedQuery).length > 0) {
      pipeline.push({ $match: parsedQuery });
    } else {
      console.warn("Empty or invalid query, no pipeline stage added.");
    }
    return pipeline;
  } catch (error) {
    console.error("Error parsing payload:", error.message);
    return null;
  }
};
