import Table from "./table.js";
import localStorage from "./local-storage.js";

export const database = localStorage;
export const optionsTable = new Table("options", database);
export const utilsTable = new Table("utils", database);
export const controlsTable = new Table("controls", database);
