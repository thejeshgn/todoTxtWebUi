/**********************************************************************
 * This javascript was created according to the specifications at
 * http://todotxt.com/ and is intended to allow users to access their
 * todo.txt files in a user-friendly and easy to visualize manner.
 *
 * Once initially uploaded, the todo.txt file will
 * be loaded into an HTML5 localStorage and managed from there.
 * The web page then allows downloading changes back to the user
 * in a txt format compliant with the todo.txt specifications, but
 * having re-sorted the tasks.
 *
 * @Created: 08/14/2012
 * @Author: Jason Holt Smith (bicarbon8@gmail.com)
 * @Version: 0.0.1
 * Copyright (c) 2012 Jason Holt Smith. todoTxtWebUi is distributed under
 * the terms of the GNU General Public License.
 *
 * This file is part of todoTxtWebUi.
 *
 * todoTxtWebUi is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * todoTxtWebUi is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with todoTxtWebUi.  If not, see <http://www.gnu.org/licenses/>.
 **********************************************************************/
var TodoTxt = TodoTxt || {};
TodoTxt.View = {
    /** @ignore */
    namespace: TodoTxt.namespace + "View.",

    /**
     * function generates the DOM element for the passed in task
     */
    generateTaskElement: function (task) {
        var icon = "glyphicon-ok";
        var status = "btn-default";
        var htmlText = TodoTxt.View.taskToMarkupString(task);
        if (!task.isActive) {
            icon = "glyphicon-remove";
            status = "btn-danger";
        }

        var element = document.createElement("div");
        element.className = "btn-group btn-block";
        element.id = task.id;

        /*jshint multistr: true */
        var elementTxt = ' \
<span class="col-xs-2 btn btn-lg ' + status + '" onclick="TodoTxt.View.toggleTaskStatus(\'' + task.id + '\');"> \
    <span class="glyphicon ' + icon + '"></span> \
</span> \
<button class="col-xs-10 ellipsis btn btn-lg ' + status + '" onclick="TodoTxt.View.displayModalForTask(\'' + task.id + '\');">' + htmlText + '</button>';

        element.innerHTML = elementTxt;
        return element;
    },

    generateListElement: function (text) {
        var element = document.createElement("li");
        element.id = TodoTxt.View.namespace + text;
        element.className = "list-group-item";
        element.onclick = function (e) {
            TodoTxt.View.setFilters(text);
        };
        element.onmouseover = function (e) {
            element.className += " active";
        };
        element.onmouseout = function (e) {
            element.className = element.className.replace(/(( |^)active)/, "");
        };
        element.innerHTML = '<h4 class="ellipsis">' + text + '</h4>';

        return element;
    },

    /**
     * function will attempt to get all localStorage tasks and display them
     * in the DOM if any exist.  This will add to any existing tasks so you
     * will need to clear the DOM first if you want to update the entire list
     * instead of just appending to the list.
     */
    displayTasks: function () {
        // get the list of selected priorities from the filter
        var filterStr = document.querySelector("#filter-input").value;
        // filter list by those matching selected filters
        var filterTasksPromise = TodoTxt.getFilteredTaskArray(filterStr);
        //console.log(filterTasksPromise);
        
        filterTasksPromise.then(
            function (filteredTasks) {

                    //console.log("filteredTasks="+filteredTasks);
                    if (!TodoTxt.View.getShowClosedStatus()) {
                        // filter out closed tasks
                        var tasks = filteredTasks.filter(function (t) {
                            return t.isActive;
                        });
                        filteredTasks = tasks;
                    }

                    if (filteredTasks && filteredTasks.length > 0) {
                        // add tasks to DOM
                        filteredTasks.forEach(function (t) {
                            TodoTxt.View.displayTask(t);
                        });
                    }

            }//sucess function
        );//getFilteredTaskArray

    },

    displayTask: function (task) {
        // add task to DOM
        document.querySelector("#listContainer-div").appendChild(TodoTxt.View.generateTaskElement(task));
    },

    removeTask: function (taskId) {
        // delete the task from the DOM
        document.querySelector("#listContainer-div").removeChild(document.querySelector("#" + taskId));
    },

    /**
     * function opens the specified task in an editing window
     */
    displayModalForTask: function (taskId) {
        // populate the modal textarea with this task string
        var task = TodoTxt.getTask(taskId) || new TodoTxt.Task();

        TodoTxt.View.unbindControlEvents(TodoTxt.View.mainEventHandlers);

        var htmlText = TodoTxt.View.taskToMarkupString(task).replace(/hidden-xs/,"");

        /*jshint multistr: true */
        var modal = ' \
<div class="modal" id="modalEdit-div" tabindex="-1" role="dialog" aria-labelledby="modalEdit-label" aria-hidden="true"> \
    <div class="modal-dialog"> \
        <div class="modal-content"> \
            <div class="modal-header"> \
                <button type="button" id="modalEditClose-button" class="close" data-dismiss="modal" aria-label="' + TodoTxt.Resources.get("CLOSE") + '"><span aria-hidden="true"> &times;</span></button> \
                <h4 class="modal-title" id="modalEdit-label"> ' + TodoTxt.Resources.get("EDIT_TASK_HEADER") + '</h4> \
            </div> \
            <div class="modal-body"> \
                <div id="modalEdit-textarea" class="textarea" contenteditable>' + htmlText + '</div> \
                <input type="text" id="modalEditTaskId-input" hidden value="' + task.id + '" /> \
            </div> \
            <div class="modal-footer"> \
                <div class="btn-group btn-group-justified"> \
                    <a type="button" id="modalEditSave-button" class="btn btn-lg btn-success" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("UPDATE") + '"><span class="glyphicon glyphicon-ok"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("UPDATE") + '</span></a> \
                    <a type="button" id="modalEditPreview-button" class="btn btn-lg btn-primary" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("PREVIEW") + '"><span class="glyphicon glyphicon-eye-open"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("PREVIEW") + '</span</a> \
                    <a type="button" id="modalEditDelete-button" class="btn btn-lg btn-danger" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("DELETE") + '"><span class="glyphicon glyphicon-floppy-remove"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("DELETE") + '</span></a> \
                </div> \
            </div> \
        </div> \
    </div> \
</div>';

        document.body.innerHTML += modal;

        $('#modalEdit-div').modal("show");

        TodoTxt.View.bindControlEvents(TodoTxt.View.modalEventHandlers);

        // place focus on the textarea
        document.querySelector("#modalEdit-textarea").focus();
    },

    updateModalPreview: function () {
        var el = document.querySelector('#modalEdit-textarea');
        if (el) {
            var text = el.textContent;
            var task = new TodoTxt.Task(text);
            el.innerHTML = TodoTxt.View.taskToMarkupString(task);
        }
    },

    modalEventHandlers: [
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleAltEnter(e); } },
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleEsc(e); } },
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleAltP(e); } },
        { el: function () { return document.querySelector('#modalEditSave-button'); }, ev: "click", fn: function (e) { TodoTxt.View.handleAltEnter(e); } },
        { el: function () { return document.querySelector('#modalEditClose-button'); }, ev: "click", fn: function (e) { TodoTxt.View.handleEsc(e); }, uc: true },
        { el: function () { return document.querySelector('#modalEditDelete-button'); }, ev: "click", fn: function (e) { TodoTxt.View.handleDeleteClick(e); } },
        { el: function () { return document.querySelector('#modalEditPreview-button'); }, ev: "click", fn: function (e) { TodoTxt.View.handleAltP(e); } },
    ],

    removeModal: function () {
        $('#modalEdit-div').modal("hide");
        TodoTxt.View.unbindControlEvents(TodoTxt.View.modalEventHandlers);
        var modal = document.querySelector("#modalEdit-div");
        document.body.removeChild(modal);
        TodoTxt.View.bindControlEvents(TodoTxt.View.mainEventHandlers);
    },

    displayPriorities: function () {
        var priList = document.querySelector('#priorities-ul');
        for (var i in TodoTxt.Attributes.priorities) {
            var attr = i;
            // only display active
            if (TodoTxt.Attributes.priorities[i] || TodoTxt.View.getShowClosedStatus()) {
                var element = TodoTxt.View.generateListElement(attr);
                priList.appendChild(element);
            }
        }
    },

    clearPriorities: function () {
        document.querySelector('#priorities-ul').innerHTML = "";
    },

    displayProjects: function () {
        var projList = document.querySelector('#projects-ul');
        for (var i in TodoTxt.Attributes.projects) {
            var attr = i;
            // only display active
            if (TodoTxt.Attributes.projects[i] || TodoTxt.View.getShowClosedStatus()) {
                var element = TodoTxt.View.generateListElement(attr);
                projList.appendChild(element);
            }
        }
    },

    clearProjects: function () {
        document.querySelector('#projects-ul').innerHTML = "";
    },

    displayContexts: function () {
        var ctxList = document.querySelector('#contexts-ul');
        for (var i in TodoTxt.Attributes.contexts) {
            var attr = i;
            // only display active
            if (TodoTxt.Attributes.contexts[i] || TodoTxt.View.getShowClosedStatus()) {
                var element = TodoTxt.View.generateListElement(attr);
                ctxList.appendChild(element);
            }
        }
    },

    clearContexts: function () {
        document.querySelector('#contexts-ul').innerHTML = "";
    },

    mainEventHandlers: [
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleAltS(e); } },
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleAltC(e); } },
        { el: function () { return document; }, ev: "keydown", fn: function (e) { TodoTxt.View.handleAltT(e); } },
        { el: function () { return document.querySelector("#fileDrop-div"); }, ev: "dragover", fn: function (e) { TodoTxt.View.handleDragOver(e); } },
        { el: function () { return document.querySelector("#fileDrop-div"); }, ev: "drop", fn: function (e) { TodoTxt.View.handleDrop(e); } },
        { el: function () { return document.querySelector("#fileUpload-input"); }, ev: "change", fn: function (e) { TodoTxt.View.handleDrop(e); } },
        { el: function () { return document.querySelector("#showClosed-label"); }, ev: "click", fn: function (e) { TodoTxt.View.toggleShowClosedStatus(); } },
        { el: function () { return document.querySelector("#addTaskButton-button"); }, ev: "click", fn: function (e) { TodoTxt.View.displayModalForTask(); } },
        { el: function () { return document.querySelector("#saveFileButton-button"); }, ev: "click", fn: function (e) { TodoTxt.View.exportTodoTxtFile(); } },
        { el: function () { return document.querySelector("#filter-input"); }, ev: "keyup", fn: function (e) { TodoTxt.View.handleFilter(); } },
        { el: function () { return document.querySelector("#clearFilter-button"); }, ev: "click", fn: function (e) { TodoTxt.View.refreshUi(); } },
        { el: function () { return document.querySelector("#priorities-div .panel-heading"); }, ev: "click", fn: function (e) { TodoTxt.View.togglePanel('priorities-div'); } },
        { el: function () { return document.querySelector("#projects-div .panel-heading"); }, ev: "click", fn: function (e) { TodoTxt.View.togglePanel('projects-div'); } },
        { el: function () { return document.querySelector("#contexts-div .panel-heading"); }, ev: "click", fn: function (e) { TodoTxt.View.togglePanel('contexts-div'); } },
    ],

    bindControlEvents: function (handlers) {
        handlers.forEach(function (handler) {
            var useCapture = false;
            if (handler.uc) {
                useCapture = handler.uc;
            }
            try {
              handler.el().addEventListener(handler.ev, handler.fn, useCapture);
            } catch (e) {
              // TODO: log this
            }
        });
    },

    unbindControlEvents: function (handlers) {
        handlers.forEach(function (handler) {
            var useCapture = false;
            if (handler.uc) {
                useCapture = handler.uc;
            }
            try {
              handler.el().removeEventListener(handler.ev, handler.fn, useCapture);
            } catch (e) {
              // TODO: Log this
            }
        });
    },

    handleAltS: function(e) {
        if (e.keyCode == 83 && e.altKey) { // Alt + s
            TodoTxt.View.exportTodoTxtFile();
        }
    },

    handleAltC: function(e) {
        if (e.keyCode == 67 && e.altKey) { // Alt + c
            TodoTxt.View.refreshUi();
        }
    },

    handleAltT: function(e) {
        if (e.keyCode == 84 && e.altKey) { // Alt + t
            TodoTxt.View.displayModalForTask();
        }
    },

    handleDrop: function (e) {
        TodoTxt.View.handleFileSelect(e);
    },

    handleAltEnter: function (e) {
        if ((e.keyCode && (e.keyCode === 13 && e.altKey)) || (e.type && e.type == "click")) { // Alt + Enter
            var taskId = document.querySelector("#modalEditTaskId-input").value;
            var text = document.querySelector("#modalEdit-textarea").textContent;
            text = TodoTxt.Utils.htmlUnencode(text);
            if (TodoTxt.updateTask(taskId, text)) {
                TodoTxt.View.refreshUi();
                try {
                    TodoTxt.View.removeModal();
                } catch (ex) {
                    // TODO: log this
                }
            } else {
                // TODO: display error toast
            }
        }
    },

    handleEsc: function (e) {
        if (e.keyCode === 27 || e.keyCode === 0) { // Esc
            TodoTxt.View.removeModal();
            TodoTxt.View.refreshUi();
        }
    },

    handleDeleteClick: function () {
        var taskId = document.querySelector("#modalEditTaskId-input").value;
        if (confirm(TodoTxt.Resources.get("DELETE_CONFIRM") + "\n\t\"" + TodoTxt.getTask(taskId).toString() + "\"")) {
            if (TodoTxt.deleteTask(taskId)) {
                TodoTxt.View.refreshUi();
                try {
                    TodoTxt.View.removeModal();
                } catch (e) {
                    // TODO: log this
                }
            } else {
                // TODO: display error toast
            }
        }
    },

    filterTimeoutId: null,
    handleFilter: function () {
        if (TodoTxt.View.filterTimoutId) {
            window.clearTimeout(TodoTxt.View.filterTimeoutId);
        }
        TodoTxt.View.filterTimeoutId = setTimeout(function () {
            // get the list of selected priorities from the filter
            TodoTxt.View.filterDisplayedTasks();
        }, 500);
    },

    handleAltP: function (e) {
        if ((e.keyCode && (e.keyCode === 80 && e.altKey)) || (e.type && e.type == "click")) { // Alt + p
            // update the markup of the displayed task in the Modal
            TodoTxt.View.updateModalPreview();
        }
    },

    /**
     * function will reload the list of tasks from localStorage to ensure it
     * is sorted and displaying properly
     */
    refreshUi: function () {
        if (TodoTxt.View.getShowClosedStatus()) {
            TodoTxt.View.setShowClosedActive();
        } else {
            TodoTxt.View.setShowClosedInactive();
        }

        // unbind any event handling
        TodoTxt.View.unbindControlEvents(TodoTxt.View.mainEventHandlers);

        // clear the list
        TodoTxt.View.clearTasks();

        // clear the attributes
        TodoTxt.View.clearPriorities();
        TodoTxt.View.clearProjects();
        TodoTxt.View.clearContexts();

        // clear filter input
        TodoTxt.View.clearFilters();

        // now rebuild from localStorage
        TodoTxt.View.displayTasks();

        // update the DOM with task attributes
        TodoTxt.View.displayPriorities();
        TodoTxt.View.displayProjects();
        TodoTxt.View.displayContexts();

        // enable keyboard shortcuts and click events for the controls area
        TodoTxt.View.bindControlEvents(TodoTxt.View.mainEventHandlers);
    },

    setFilters: function (filterStr) {
        if (filterStr) {
            // set filter text input
            var input = document.querySelector("#filter-input");
            input.value = filterStr;
            TodoTxt.View.handleFilter();
        }
    },

    clearFilters: function () {
        // update filter input
        document.querySelector("#filter-input").value = "";
    },

    clearTasks: function () {
        document.querySelector("#listContainer-div").innerHTML = "";
    },

    filterDisplayedTasks: function () {
        TodoTxt.View.clearTasks();

        // honors any specified filters
        TodoTxt.View.displayTasks();
    },

    toggleShowClosedStatus: function () {
        var el = document.querySelector('#showClosed-label');
        var active = el.className.match(/(( |^)btn-success)/) ? true : false;
        // if active toggle to inactive
        if (active) {
            TodoTxt.View.setShowClosedInactive();
        } else {
            TodoTxt.View.setShowClosedActive();
        }
        TodoTxt.View.refreshUi();
    },

    setShowClosedActive: function () {
        var el = document.querySelector('#showClosed-label');
        el.className = el.className.replace(/(( |^)btn-danger)/, " btn-success");
        localStorage.setItem(TodoTxt.View.namespace + "showClosed", true);
    },

    setShowClosedInactive: function () {
        var el = document.querySelector('#showClosed-label');
        el.className = el.className.replace(/(( |^)btn-success)/, " btn-danger");
        localStorage.setItem(TodoTxt.View.namespace + "showClosed", false);
    },

    getShowClosedStatus: function () {
        var showClosed = localStorage.getItem(TodoTxt.View.namespace + "showClosed");
        if (showClosed) {
            if (showClosed === "true") {
                return true;
            }
        }
        return false;
    },

    togglePanel: function (name) {
        var heading = document.querySelector('#' + name + ' .panel-heading');
        var body = document.querySelector('#' + name + ' .panel-body');
        var hidden = body.className.match(/(( |^)collapse)/) ? true : false;
        if (hidden) {
            TodoTxt.View.showPanel(heading, body);
        } else {
            TodoTxt.View.hidePanel(heading, body);
        }
    },

    showPanel: function (heading, body) {
        var indicator = heading.querySelector(".glyphicon");
        body.className = body.className.replace(/(( |^)collapse)/g, "");
        indicator.className = indicator.className.replace(/(( |^)glyphicon-chevron-down)/, " glyphicon-chevron-up");
    },

    hidePanel: function (heading, body) {
        var indicator = heading.querySelector(".glyphicon");
        body.className += " collapse";
        indicator.className = indicator.className.replace(/(( |^)glyphicon-chevron-up)/, " glyphicon-chevron-down");
    },

    toggleTaskStatus: function (taskId) {
        var task = TodoTxt.getTask(taskId);
        if (task) {
            if (task.isActive) {
                TodoTxt.closeTask(taskId);
            } else {
                TodoTxt.activateTask(taskId);
            }
            TodoTxt.View.refreshUi();
        }
    },

    /**
     * function will retrieve the todo.txt file from the passed in
     * fileName.
     *
     * @param fileName the String name of the todo.txt file to be opened
     * file.
     * EX: "todo.txt"
     */
    getTodoTxtFile: function (fileName) {
        // load via AJAX call to local file system
        $.ajax({
            url: fileName,
            cache: false,
            //crossDomain: true,
            error: function(jqXHR, textStatus) {
                // TODO: display a proper error message
                alert(textStatus);
            },
            success: function(data) {
                // pass the response on to the next call
                (function () {
                    TodoTxt.parseTodoTxtFile(data);
                    TodoTxt.View.refreshUi();
                })();
            }
        });
    },

    handleFileSelect: function (e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.target.files || e.dataTransfer.files; // FileList object.

        // files is a FileList of File objects.
        if (files.length > 0) {
            var f = files[0];

            // process using a FileReader
            var reader = new FileReader();

            // get the content as a String
            reader.onloadend = function (e) {
                if (confirm(TodoTxt.Resources.get("OVERWRITE_CONFIRM"))) {
                    TodoTxt.parseTodoTxtFile(e.target.result);
                    TodoTxt.View.refreshUi();
                }
            };
            reader.readAsText(f, "UTF-8");
        }
    },

    handleDragOver: function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
    },

    /**
     * function will allow the user to download a copy of the todo.txt file
     */
    exportTodoTxtFile: function () {
        var taskArray = TodoTxt.getSortedTaskArray();

        // create the output string to be written
        var content = taskArray.join("\n");

        // set datatype to text/csv to initiate download prompt
        var data = encodeURI("data:text/csv;charset=utf-8," + content);

        window.open(data);
    },

    /**
     * function will generate a html-markup version of the task
     * @param {TodoTxt.Task} task - the task to generate for
     * @returns {string} the HTML marked up task text
     */
    taskToMarkupString: function (task) {
        var text = task.toString();

        // make html compatible
        text = TodoTxt.Utils.htmlEncode(text);

        // markup priority
        var priCls = TodoTxt.View.getDisplayClassForTask(task);
        text = text.replace(task.priority, "<span class=\"" + priCls + "\"><b>" + task.priority + "</b></span>");

        // markup projects
        var projects = task.projects;
        for (var i=0; i<projects.length; i++) {
            var project = projects[i];
            var regex = new RegExp(project.replace(/\+/g, "\\+") + "(?![0-9A-Za-z])", "g");
            text = text.replace(regex, "<span class=\"text-muted\"><b><i>" + project + "</i></b></span>");
        }

        // markup contexts
        var contexts = task.contexts;
        for (var j=0; j<contexts.length; j++) {
            var context = contexts[j];
            var regex = new RegExp(context + "(?![0-9A-Za-z])", "g");
            text = text.replace(regex, "<span class=\"text-muted\"><b><i>" + context + "</i></b></span>");
        }

        // markup created date
        var date = task.createdDate;
        if (date) {
            text = text.replace(date, "<span class=\"text-muted hidden-xs\"><b><i>" + date + "</i></b></span>");
        }

        return text;
    },

    /**
     * function returns the appropriate display classes for this task
     */
    getDisplayClassForTask: function (task) {
        // get a list of the current tasks and iterate through
        var cls = "";
        if (task.priority !== null && task.isActive) {
            if (task.priority === "(A)") {
                cls += " text-danger";
            }
            if (task.priority === "(B)") {
                cls += " text-warning";
            }
            if (task.priority === "(C)") {
                cls += " text-primary";
            }
        }

        return cls;
    },

    /** @ignore */
    initializeElements: function () {
        /*jshint multistr: true */
        var baseElements = ' \
<div class="container-fluid" id="fileDrop-div"> \
    <div class="col-md-9"> \
        <div class="row"> \
            <div class="btn-group btn-group-justified"> \
                <a id="addTaskButton-button" class="btn btn-lg btn-primary ellipsis" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("ADD_TASK") + '"> \
                    <span class="glyphicon glyphicon-plus"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("ADD_TASK") + '</span> \
                </a> \
                <a id="showClosed-label" class="btn btn-lg btn-danger ellipsis" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("SHOW_CLOSED") + '"> \
                    <span class="glyphicon glyphicon-ok-circle"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("SHOW_CLOSED") + '</span> \
                </a> \
                <a class="btn btn-block btn-primary btn-lg btn-file ellipsis" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("IMPORT") + '"> \
                    <span class="glyphicon glyphicon-open"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("IMPORT") + '</span> <input id="fileUpload-input" type="file" placeholder="Select todo.txt File"> \
                </a> \
                <a id="saveFileButton-button" class="btn btn-lg btn-primary ellipsis" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("EXPORT") + '"> \
                    <span class="glyphicon glyphicon-save"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("EXPORT") + '</span> \
                </a> \
                <a id="saveFileButton-button" class="btn btn-lg btn-primary ellipsis" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("SYNC") + '"> \
                    <span class="glyphicon glyphicon-save"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("SYNC") + '</span> \
                </a> \
            </div> \
        </div> \
        <div class="row"> \
            <div class="input-group input-group-lg"> \
                <input id="filter-input" type="text" class="form-control" placeholder="' + TodoTxt.Resources.get("FILTER_PLACEHOLDER_TEXT") + '"> \
                <span class="input-group-btn"> \
                    <button id="clearFilter-button" class="btn btn-primary" type="button" data-toggle="tooltip" data-placement="top" text="' + TodoTxt.Resources.get("CLEAR_FILTER") + '"><span class="glyphicon glyphicon-remove-circle"></span> <span class="hidden-xs">' + TodoTxt.Resources.get("CLEAR_FILTER") + '</span></button> \
                </span> \
            </div> \
        </div> \
        <div class="row"> \
            <div id="listContainer-div"></div> \
        </div> \
    </div> \
    <div class="col-md-3"> \
        <div id="priorities-div" class="panel panel-primary"> \
            <div class="panel-heading"> \
                <h3 class="panel-title"><span class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span> ' + TodoTxt.Resources.get("PRIORITIES") + '</h3> \
            </div> \
            <div class="panel-body"> \
                <ul id="priorities-ul" class="list-group"></ul> \
            </div> \
        </div> \
        <div id="projects-div" class="panel panel-primary"> \
            <div class="panel-heading"> \
                <h3 class="panel-title"><span class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span> ' + TodoTxt.Resources.get("PROJECTS") + '</h3> \
            </div> \
            <div class="panel-body"> \
                <ul id="projects-ul" class="list-group"></ul> \
            </div> \
        </div> \
        <div id="contexts-div" class="panel panel-primary"> \
            <div class="panel-heading"> \
                <h3 class="panel-title"><span class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span> ' + TodoTxt.Resources.get("CONTEXTS") + '</h3> \
            </div> \
            <div class="panel-body"> \
                <ul id="contexts-ul" class="list-group"></ul> \
            </div> \
        </div> \
    </div> \
</div>';

        var container = document.getElementById('todotxt');
        if (container) {
            container.innerHTML = baseElements;
        }
    },
};
