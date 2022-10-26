import Table from "./table.js";
import localStorage from "./local-storage.js";

export const database = localStorage;
export const websitesTable = new Table("websites", database);
