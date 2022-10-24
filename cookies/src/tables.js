import Table from "./table.js";
import localStorage from "./local-storage.js";

export const database = localStorage;
export const parentItemTable = new Table("parentItem", database);
export const itemsTable = new Table("items", database);
export const utilsTable = new Table("utils", database);
