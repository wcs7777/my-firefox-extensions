import Table from "./table.js";
import localStorage from "./local-storage.js";

export const database = localStorage;
export const suggestionsTable = new Table("suggestions", database);
export const utilsTable = new Table("utils", database);
