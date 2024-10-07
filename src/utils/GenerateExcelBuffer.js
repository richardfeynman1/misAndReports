import XLSX from "xlsx";
import { getCurrencyIcon } from "./GetContractFieldPathToGetValue";

const getNestedProperty = (obj, path) => {
  return path.reduce(
    (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
    obj
  );
};

const formatValue = (contractField, type) => {
  if (!contractField) return "";

  switch (type) {
    case "monetary":
      const amount =
        getNestedProperty(contractField, ["monetary", "amount"]) || "";
      const currencyType =
        getNestedProperty(contractField, ["monetary", "currencyType"]) || "";
      const currencyIcon = getCurrencyIcon(currencyType);
      return `${currencyIcon} ${amount}`;

    case "duration":
      const durationValue =
        getNestedProperty(contractField, ["duration", "durationValue"]) || "";
      const durationLabel =
        getNestedProperty(contractField, ["duration", "durationLabel"]) || "";
      return `${durationValue} ${durationLabel}`;

    case "date":
      const day = getNestedProperty(contractField, ["date", "day"]) || "";
      const month = getNestedProperty(contractField, ["date", "month"]) || "";
      const year = getNestedProperty(contractField, ["date", "year"]) || "";
      const timeZone =
        getNestedProperty(contractField, ["date", "timezone"]) || "";
      return `${day}/${month}/${year} ${timeZone}`;

    case "phone":
      const number =
        getNestedProperty(contractField, ["phone", "number"]) || "";
      const countryCode =
        getNestedProperty(contractField, ["phone", "countryCode"]) || "";
      return `${countryCode} ${number}`;

    case "counterpartyOrg":
      const partyName = getNestedProperty(contractField, [
        "counterpartyOrg",
        "registeredName",
      ]);
      return partyName;

    case "counterpartyIndividual":
    case "counterpartyOrgPerson":
      const indiviudalName = getNestedProperty(contractField, [
        "counterpartyIndividual",
        "fullName",
      ]);
      return indiviudalName;

    case "entity":
      const entity = getNestedProperty(contractField, [
        "entity",
        "registeredName",
      ]);
      return entity;

    case "entitySignatoryPerson":
      const entitySignatory = getNestedProperty(contractField, [
        "entitySignatory",
        "fullName",
      ]);
      return entitySignatory;

    //TODO;
    case "multiSelect":
      const selectedValues = getNestedProperty(contractField, [
        "multiSelect",
        "selectedValues",
      ]);
      const optionValues = Array.isArray(selectedValues)
        ? selectedValues.map((item) => item.value)
        : [];
      return optionValues;

    default:
      return getNestedProperty(contractField, ["value"]) || "";
  }
};

const processRow = (row, columnsWithPath) => {
  return columnsWithPath.reduce((filteredRow, { key, type }) => {
    let value;

    if (type === "static") {
      value = row[key];
    } else {
      const contractField =
        type === "counterpartyOrg" ||
        type === "entity" ||
        type === "counterpartyIndividual" ||
        type === "counterpartyOrgPerson" ||
        type === "entitySignatoryPerson"
          ? row.contractFields?.find((cf) => cf.type === key)
          : row.contractFields?.find((cf) => cf.id === key);
      console.log(
        contractField,
        " <contractFieldscontractFields> ",
        key,
        " <iiiiiii> ",
        type
      );
      value = formatValue(contractField, type);
      // console.log(value, "<---------", type);
    }

    filteredRow[key] = Array.isArray(value) ? value.join(", ") : value;
    return filteredRow;
  }, {});
};

const formatColumnName = (name) => {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const createWorksheet = (data, columnsWithPath) => {
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: columnsWithPath.map((col) => col.key),
  });

  const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);

  const headerStyle = {
    font: { bold: true, size: 16 },
    fill: { bgColor: { rgb: "#F5F5F5" } },
    alignment: { horizontal: "center", vertical: "center" },
  };

  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (worksheet[address]) {
      worksheet[address].v = formatColumnName(columnsWithPath[C].key);
      worksheet[address].s = headerStyle;
    }
  }

  worksheet["!rows"] = [{ hpt: 30 }];

  // Adjust column widths
  const maxWidth = 50;
  const wscols = columnsWithPath.map((col) => ({
    wch: Math.min(maxWidth, formatColumnName(col.key).length + 5),
  }));
  worksheet["!cols"] = wscols;

  return worksheet;
};

export const generateExcelBuffer = (
  data,
  columnsWithPath,
  allContractTypes,
  options = {}
) => {
  const { segregate = false } = options;
  const filteredData = data.map((row) => processRow(row, columnsWithPath));

  const workbook = XLSX.utils.book_new();

  if (segregate) {
    // Create a sheet for each contract type
    allContractTypes.forEach((type) => {
      const typeData = filteredData.filter((row) => row.type === type);
      const worksheet = createWorksheet(typeData, columnsWithPath);
      XLSX.utils.book_append_sheet(workbook, worksheet, type.slice(0, 31)); // Excel has a 31 character limit for sheet names
    });

    // Handle contracts that don't match any predefined type
    const otherData = filteredData.filter(
      (row) => !allContractTypes.includes(row.type)
    );
    if (otherData.length > 0) {
      const worksheet = createWorksheet(otherData, columnsWithPath);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Other");
    }
  } else {
    // Create a single worksheet as before
    const worksheet = createWorksheet(filteredData, columnsWithPath);
    XLSX.utils.book_append_sheet(workbook, worksheet, "FilteredData");
  }

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};
