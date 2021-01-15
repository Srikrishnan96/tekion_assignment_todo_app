// CONSTANTS IN APPLICATION
const REMOVE_TASK = "removeTask";
const ADD_TASK = "addTask";
const MARK_TASK_COMPLETED = "markTaskCompleted";
const MARK_TASK_INCOMPLETE = "markTaskInComplete";
const COMPLETED_TASK_STATUS = "completed";
const INCOMPLETE_TASK_STATE = "incomplete";
const INDEX_NOT_A_NUMBER_ERROR = new Error("Position of task should be a number");


// PUBSUB HELPER FOR UPDATING UI ON STATE CHANGE
const subscriptions = {};
const publish = function(event, data) {
    if(subscriptions.hasOwnProperty(event) === false) return;
    subscriptions[event].forEach(function(eventHandler) {
        eventHandler(event, data);
    });
}
const subscribe = function(event, eventHandler) {
    if(subscriptions.hasOwnProperty(event) === false) subscriptions[event] = [];
    const index = subscriptions[event].push(eventHandler) - 1;

    return {
        unsubscribe: function() {
            subscriptions[event].splice(index, 1);
        }};
}


// INITIAL APPLICATION STATE AND STATE CONTROLLER FUNCTIONS
const state = {
    completed: ["code", "sleep", "eat"],
    incomplete: ["waste time", "trouble neighbour", "blow up house"],
}
const markTaskCompleted = function(index) {
    if(typeof index !== 'number') throw INDEX_NOT_A_NUMBER_ERROR;

    const completedTasks = state.completed, incompleteTasks = state.incomplete,
        newCompletedTask = incompleteTasks[index];

    incompleteTasks.splice(index, 1);
    completedTasks.push(newCompletedTask);
    publish(MARK_TASK_COMPLETED);
}
const markTaskIncomplete = function(index) {
    if(typeof index !== 'number') throw INDEX_NOT_A_NUMBER_ERROR;

    const completedTasks = state.completed, incompleteTasks = state.incomplete,
        newIncompleteTask = completedTasks[index];

    completedTasks.splice(index, 1);
    incompleteTasks.push(newIncompleteTask);
    publish(MARK_TASK_INCOMPLETE);
}
const removeTask = function(index, taskStatus) {
    if(typeof index !== 'number') throw INDEX_NOT_A_NUMBER_ERROR;

    if(taskStatus === 'completed') state.completed.splice(index, 1);
    if(taskStatus === 'incomplete') state.incomplete.splice(index, 1);
    publish(REMOVE_TASK);
}
const addTask = function(taskName) {
    if(!taskName) return;

    state.incomplete.push(taskName);
    publish(ADD_TASK);
}
const getCompletedTasks = function() {
    return state.completed.concat();
}
const getIncompleteTasks = function() {
    return state.incomplete.concat();
}


// TASK CONSTRUCTOR
function Task(taskName, taskStatus, index) {
    this.state = {
        taskName: taskName,
        taskStatus: taskStatus,
        index: index,
    }
}
Task.prototype.render = function() {
    const taskName = this.state.taskName;
    const taskStatusSwitchLabel = this.state.taskStatus === "completed" ? "Mark incomplete" : "Mark completed";

    return `
        <div>
            <span>${taskName}</span>
            <span><button class=${"remove-task-btn-" + this.state.taskStatus}>Remove</button></span>
            <span>
                <button class=${"task-status-switch-btn-" + this.state.taskStatus}>
                    ${taskStatusSwitchLabel}
                </button>
            </span>
        </div>
    `;
}


// TASK LIST CONSTRUCTOR
function TaskList(taskList, taskListType) {
    this.taskListType = taskListType;
    this.componentId = `${taskListType}-task-container`;
    this.innerTaskListId = `task-list-${taskListType}`;
}
TaskList.prototype.getTaskComponentsFromList = function() {
    const taskListType = this.taskListType;
    const tasks = state[taskListType].reduce(function(acc, taskName, index) {
        const taskObject = new Task(taskName, taskListType, index);
        return acc + taskObject.render();
    }, "");

    return tasks;
}
TaskList.prototype.render = function() {
    return `
        <div id=${this.componentId}>
            <h3>${this.taskListType.toUpperCase()} TASKS</h3>
            <div id=${this.innerTaskListId}>
                ${this.getTaskComponentsFromList()}
            </div>
        </div>
    `;
}
TaskList.prototype.addButtonClickActions = function() {
    const taskListType = this.taskListType;
    const removeButtons  = Array.from(document.getElementsByClassName(`remove-task-btn-${taskListType}`));
    const switchButtons =
        Array.from(document.getElementsByClassName(`task-status-switch-btn-${taskListType}`));
    const switchCallBack = taskListType === "completed" ? markTaskIncomplete : markTaskCompleted;

    state[taskListType].forEach(function(task, index) {
        removeButtons[index].addEventListener("click", function(e) {
            removeTask(index, taskListType);
        });

        switchButtons[index].addEventListener("click", function(e) {
            switchCallBack(index);
        });
    });
}
TaskList.prototype.initSubscriptions = function() {
    const eventHandler = (function() {
        const tasks = this.getTaskComponentsFromList();
        const taskListDiv = document.getElementById(this.innerTaskListId);

        taskListDiv.innerHTML = tasks;
        this.addButtonClickActions();
    }).bind(this);

    subscribe(MARK_TASK_COMPLETED, eventHandler);
    subscribe(MARK_TASK_INCOMPLETE, eventHandler);
    subscribe(REMOVE_TASK, eventHandler);
    subscribe(ADD_TASK, function() {
        if(this.taskListType === "completed") return;
        eventHandler();
    });
}


// ADDTASK CONSTRUCTOR
function AddTask() {
}
AddTask.prototype.setState = function(newState) {
}
AddTask.prototype.render = function() {
    return `
        <div id=${"add-task-container"}>
            <input id=${"add-task-input"} type=${"text"} value="">
            <button id=${"add-task-button"}>Add task</button>
        </div>
    `;
}
AddTask.prototype.addDOMPropertiesAndEventListeners = function() {
    const button = document.getElementById("add-task-button");
    const input = document.getElementById("add-task-input");

    button.addEventListener("click", function(e) {
        addTask(input.value);
        input.value = "";
    });
}
AddTask.prototype.intiSubscriptions = function() {
    subscribe(ADD_TASK, (function() {
        const input = document.getElementById("add-task-input");
        input.setAttribute("value", "");
    }).bind(this));
}


// INITIATE UI VIEW
const completedTaskList = new TaskList(getCompletedTasks(), COMPLETED_TASK_STATUS);
const incompleteTaskList = new TaskList(getIncompleteTasks(), INCOMPLETE_TASK_STATE);
const addTaskComponent = new AddTask();

document.getElementById("app").innerHTML =
    addTaskComponent.render() + incompleteTaskList.render() + completedTaskList.render();

completedTaskList.initSubscriptions();
incompleteTaskList.initSubscriptions();
addTaskComponent.intiSubscriptions();

completedTaskList.addButtonClickActions();
incompleteTaskList.addButtonClickActions();
addTaskComponent.addDOMPropertiesAndEventListeners();