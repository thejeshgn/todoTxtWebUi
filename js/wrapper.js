function syncWithCouchDB(){
	TodoTxt.Database.init();
}

$(document).ready(function (e) {
	syncWithCouchDB();
	TodoTxt.View.initializeElements();
	TodoTxt.View.refreshUi();
});