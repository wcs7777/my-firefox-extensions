import Table from "./table.js";
import localStorage from "./local-storage.js";

export const database = localStorage;
export const optionsTable = new Table("options", database);
export const marksTable = new Table("marks", database);
export const utilsTable = new Table("utils", database);

