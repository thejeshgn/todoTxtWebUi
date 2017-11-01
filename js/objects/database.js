var TodoTxt = TodoTxt || {};

/**
 * Utility methods used by the project library
 * @namespace
 */
TodoTxt.Database = {
	/** @ignore */
    namespace: TodoTxt.namespace + "Database.",

    name: "todotxt_db",
    db:'',
	/**
	 * function will format a Date object to a string of YYYY-MM-DD
	 * @returns {string} formatted date
	 */
	init: function () {
		console.log("DB creation");
		todotxt_db = new PouchDB('todotxt_db');
		this.db = todotxt_db;
	},
}