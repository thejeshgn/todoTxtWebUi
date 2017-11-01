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

/** @namespace */
var TodoTxt = {
    /** @ignore */
    namespace: "TodoTxt.",

    /**
     * this function represents a Filters tracking object used to
     * limit the list of Tasks displayed at any one time.
     */
    Attributes: {
        /** hash containing all referenced priorities */
        priorities: {},
        /** hash containing all referenced projects */
        projects: {},
        /** hash containing all referenced contexts */
        contexts: {},
    },

    /**
     * function will return a sorted array of tasks as pulled from
     * localStorage.
     * @returns {array} a sorted list of tasks from localStorage
     */
    getSortedTaskArray: function () {
        // sort the list and then add it
        //couchDB, get all


    },

    /**
     * function will return a filtered array of tasks based on the passed in
     * filter string.  Matching uses an ordered fuzzy match so for the following:
     * "(A) 2014-03-02 don't forget to file @report with +John" a passed in filter
     * string of "for John" will match, but "John report" will not match
     * @param {string} filterStr - a string containing characters to match against the existing tasks
     * @returns {array} a sorted list of tasks matching the passed in <b><i>filterStr</i></b>
     */
    getFilteredTaskArray: function (filterStr) {
        //console.log("--------------------------- getFilteredTaskArray");
        var myFirstPromise = new Promise( /* executor */ function(resolve, reject) {

            
                var taskArray = [];
                var taskMatcher = new RegExp("^(" + new TodoTxt.Task().namespace + ")");
                TodoTxt._clearAttributes();

                TodoTxt.Database.db.allDocs({
                   include_docs: true,
                   attachments: true
                 }).then(function (result) {
                     //console.log("get All Docs");
                     //console.log(result);
                     var rows = result['rows'];
                     for(i=0; i< rows.length; i++){
                         TodoTxt.updateTask(rows[i]['doc']._id, rows[i]['doc'].text);
                            if (rows[i]['doc']._id.match(taskMatcher)) {
                                var t = new TodoTxt.Task(rows[i]['doc'].text);
                                if (t) {
                                    t.id = rows[i]['doc']._id;
                                    taskArray.push(t);
                                    TodoTxt._updateAttributes(t);
                                }
                            }

                     }
                    taskArray.sort(TodoTxt._compareTasks);

                    if (filterStr && filterStr !== "") {
                        // create the regex matcher
                        var filters = filterStr.split(" ");
                        var rStr = ".*";
                        for (var i=0; i<filters.length; i++) {
                            var filter = filters[i].replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
                            rStr += "(" + filter + ").*";
                        }
                        var regex = new RegExp(rStr, "i");
                        var tasks = taskArray.filter(function (t) {
                            return t.toString().match(regex);
                        });
                        taskArray = tasks;
                        //console.log("Inside filtering before resolve");
                        //console.log(taskArray);
                        resolve(taskArray);
                    }else{
                        resolve(taskArray);
                    }

                 }).catch(function (err) {
                     console.log(err);
                 });






         } );

        return myFirstPromise;
    },

    /**
     * function will process each line of the todo.txt, sort by priority,
     * creationDate, and state (active or closed).
     *
     * @param {string} todoTxt - the "\n" delimited lines from a todo.txt file
     * @param {boolean} append - a boolean indicating if existing tasks should be cleared
     * first or just appended to with the new file
     */
    parseTodoTxtFile: function (todoTxt, append) {
        if (!append) {
            // clear the localStorage
            TodoTxt.deleteAllTasks();
        }
        var lines = todoTxt.split("\n");
        for (var i in lines) {
            if (typeof lines[i] === "string") {
                var line = lines[i];
                // ignore empty lines
                if (line && line !== "") {
                    // parse the individual line and return a Task
                    var task = new TodoTxt.Task(line);

                    // add this taskObj to our global list in it's proper location
                    TodoTxt.addTask(task);
                }
            }
        }
    },

    /**
     * function creates a new task and saves to localStorage
     * @param {string} textStr - a string representing a raw task
     */
    createTask: function (textStr) {
        var text = textStr || "";
        var t = new TodoTxt.Task(textStr);
        TodoTxt.addTask(t);
    },

    /**
     * function will get a specified task from localstorage by id
     * @param {string} taskId - the unique id of the task to be returned
     * @returns {TodoTxt.Task} a task or null if task not found
     */
    getTask: function (taskId) {
        //couchdb getItem
        var task,
            text = localStorage.getItem(taskId);
        if (text !== null && text !== undefined) {
            task = new TodoTxt.Task(text);
            task.id = taskId;
        }
        return task;
    },

    /**
     * function updates the task and saves it to the local storage cache
     * @param {string} taskId - unique ID used to retrieve the task from localStorage
     * @param {string} newText - a string representing the updated, raw task text
     * @returns {boolean} true if task could be updated otherwise false
     */
    updateTask: function (taskId, newText) {
        // re-parse task
        var task = new TodoTxt.Task(newText);
        task.id = taskId;

        TodoTxt.Database.db.get(task.id).then(function (doc) {
            doc.completedDate = task.completedDate;
            doc.contexts = task.contexts;
            doc.createdDate = task.createdDate;
            doc.id = task.id;
            doc.isActive = task.isActive;
            doc.metadatas = task.metadatas;
            doc.namespace = task.namespace;
            doc.priority = task.priority;
            doc.projects = task.projects;
            doc.text = task.text;
            doc._rev = doc._rev;
          return TodoTxt.Database.db.put(doc);
        }).catch(function (err) {
            console.log(err);
            if(err.status == 404){
                TodoTxt.addTask(task); 
            }
        });

        return true;
    },

    /**
     * function adds this task to the browser's local cache allowing for
     * retained data on subsequent reloads of the page
     * @param {TodoTxt.Task} task - a task to be added to localStorage
     */
    addTask: function (task) {        
        //add to couchdb        
        TodoTxt.Database.db.put({
            completedDate : task.completedDate,
            contexts : task.contexts,
            createdDate : task.createdDate,
            _id : task.id,
            isActive : task.isActive,
            metadatas : task.metadatas,
            namespace : task.namespace,
            priority : task.priority,
            projects : task.projects,
            text : task.text
        }).then(function (response) {
          // handle response
          
        }).catch(function (err) {
          //console.log(err);
        });
        TodoTxt._updateAttributes(task);
    },

    /**
     * function will append an "x YYYY-MM-DD " to a stored
     * task if not already closed
     * @param {string} taskId - unique ID used to retrieve the task from localStorage
     * @returns {boolean} true if task could be closed, otherwise false
     */
    closeTask: function (taskId) {
        var task = TodoTxt.getTask(taskId);
        if (task && task.isActive) {
            var text = task.toString();
            if (task.priority) {
                text = text.replace(task.priority, "");
            }
            text = "x " + TodoTxt.Utils.formatDate(new Date()) + " " + text;
            TodoTxt.updateTask(task.id, text);
            return true;
        }
        
        return false;
    },

    /**
     * function will remove "x YYYY-MM-DD " from a stored
     * task if not already active
     * @param {string} taskId - unique ID used to retrieve the task from localStorage
     * @returns {boolean} true if task could be activated, otherwise false
     */
    activateTask: function (taskId) {
        var task = TodoTxt.getTask(taskId);
        if (task && !task.isActive) {
            var text = task.toString();
            text = text.replace(/^(x )/, "").replace(task.completedDate + " ", "");
            TodoTxt.updateTask(task.id, text);
            return true;
        }
        
        return false;
    },

    /**
     * function will remove an existing task from localStorage
     * @param {string} taskId - the id of the task to remove from localStorage
     * @returns {boolean} true if task could be deleted otherwise false
     */
    deleteTask: function (taskId) {
        //couchdb
        localStorage.removeItem(taskId);
        return true;
    },

    /**
     * function will remove all existing tasks from localStorage
     */
    deleteAllTasks: function () {
        var taskMatcher = new RegExp("^(" + new TodoTxt.Task().namespace + ")");
        for (var key in localStorage) {
            if (key.match(taskMatcher)) {
                TodoTxt.deleteTask(key);
            }
        }
    },

    /** @ignore */
    _updateAttributes: function (task) {
        // get the priority and add to global filter hashset
        if (task.priority) {
            TodoTxt.Attributes.priorities[task.priority] = task.isActive;
        }

        // get each project and add to the global filter hashset
        for (var i in task.projects) {
            if (typeof task.projects[i] === "string") {
                TodoTxt.Attributes.projects[task.projects[i]] = task.isActive;
            }
        }

        // get each context and add to the global filter hashset
        for (var j in task.contexts) {
            if (typeof task.contexts[j] === "string") {
                TodoTxt.Attributes.contexts[task.contexts[j]] = task.isActive;
            }
        }
    },

    /** @ignore */
    _clearAttributes: function () {
        TodoTxt.Attributes.priorities = {};
        TodoTxt.Attributes.projects = {};
        TodoTxt.Attributes.contexts = {};
    },

    /** @ignore */
    _compareTasks: function (taskA, taskB) {
        // function will allow sorting of tasks by the following
        // criteria: (1) active vs. closed (2) priority (3) created date
        // (4) completed date
        var aActive = taskA.isActive;
        var bActive = taskB.isActive;
        var aPri = taskA.priority;
        var bPri = taskB.priority;
        var aCreated = taskA.createdDate;
        var bCreated = taskB.createdDate;
        var aCompleted = taskA.completedDate;
        var bCompleted = taskB.completedDate;

        // (1) compare active vs. closed
        if (aActive !== bActive) {
            // prioritize active over closed
            if (aActive) {
                return -1;
            } else {
                return 1;
            }
        } else { // (2) compare priority
            if (aPri !== bPri) {
                // order by priority, but favor having priority over not
                if (!bPri || aPri < bPri) {
                    return -1;
                } else if (!aPri || aPri > bPri) {
                    return 1;
                }
            } else { // (3) compare created date
                if (aCreated !== bCreated) {
                    // order by created date ascending (oldest ones first)
                    if (aCreated < bCreated) {
                        return -1;
                    } else {
                        return 1;
                    }
                } else { // (4) compare completed date
                    if (aCompleted !== bCompleted) {
                        // order by completed date descending (latest ones first)
                        if (aCompleted > bCompleted) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }
                }
            }
        }

        // objects are equivalent
        return 0;
    },
};