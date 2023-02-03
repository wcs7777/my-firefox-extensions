import localStorage from "./localStorage.js";
import Table from "./table.js";

export const database = localStorage;
export const optionsTable = new Table("options", database);
export const utilsTable = new Table("utils", database);
export const controlsTable = new Table("controls", database);
