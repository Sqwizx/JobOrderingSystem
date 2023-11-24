const SPONGE_MIXING = 6 * 60;
const FERMENTATION = 3 * 3600;
const DOUGH_MIXING = 6 * 60; // 6 minutes
const FLOOR_TIME = 6 * 60; // 6 minutes
const MAKEUP_TIME = 15 * 60; // 15 minutes
const FINAL_PROOF = 1 * 3600 + 5 * 60; // 1 hour and 5 minutes
const BAKING = 22 * 60; // 22 minutes
const COOLING = 1 * 3600 + 15 * 60; // 1 hour and 15 minutes
const PACKING = 5 * 60; // 5 minutes

var firstFormTracker = {};
var endTimes = {};
var spongeStartTimePickersByTab = {};
var recipeFormObjects = {}; // Store recipe form objects
var savedDateTimeValues = {}; // Stores
var calendarInstance; // Define the calendarInstance outside the function
var selectedDate;
var activeDay = null;
var formTracker = [];

let allFormsData = {};
let isSaving = false;

document.addEventListener('DOMContentLoaded', function () {

    checkFormsAndToggleSaveButton()

    let activeRecipe = {
        name: null,
        tabIndex: null,
        dateTimePicker: null
    };
    localStorage.setItem('activeRecipe', JSON.stringify(activeRecipe));

    function formatDateToYYYYMMDD(dateStr) {
        const DATE = new Date(dateStr);
        const YEAR = DATE.getFullYear();
        const MONTH = (DATE.getMonth() + 1).toString().padStart(2, '0');
        const DAY = DATE.getDate().toString().padStart(2, '0');
        return `${YEAR}-${MONTH}-${DAY}`;
    }

    function openCalendarInstance() {
        if (!calendarInstance) {
            calendarInstance = flatpickr("#change-date", {
                minDate: "today",
                defaultDate: "today",
                onChange: function (selectedDates, dateStr) {
                    selectedDate = selectedDates[0];
                    const newDate = formatDateToYYYYMMDD(dateStr);
                    if (newDate) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `?selected_date=${newDate}`, true);
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === XMLHttpRequest.DONE) {
                                if (xhr.status === 200) {
                                    const response = JSON.parse(xhr.responseText);
                                    if (response && response.date_info) {
                                        const dateButtons = document.querySelectorAll('.tab button');
                                        response.date_info.forEach(function (info, index) {
                                            if (dateButtons[index]) {
                                                const dateText = dateButtons[index].querySelector('.date-text');
                                                if (dateText) {
                                                    dateText.innerHTML = info.date;
                                                    dateButtons[index].innerHTML = `<span class="date-text">${info.date}</span><br>${info.day}`;
                                                    if (activeRecipe && activeRecipe.name) {
                                                        updateActiveRecipeInfo(activeRecipe.tabIndex, activeRecipe.name, selectedDates[0]);
                                                    }
                                                }
                                            }
                                        });
                                    } else {
                                        console.error('Invalid response received.');
                                    }
                                } else {
                                    console.error('Error occurred while updating the date.');
                                }
                            }
                        };
                        xhr.send();
                    }
                }
            });
            calendarInstance.open();
            document.querySelector(".flatpickr-input").classList.add("active");
        } else {
            if (calendarInstance.isOpen) {
                calendarInstance.close();
                document.querySelector(".flatpickr-input").classList.remove("active");
            } else {
                calendarInstance.open();
                document.querySelector(".flatpickr-input").classList.add("active");
            }
        }
    }

    function updateActiveRecipeInfo(mainTabIndex, recipeName, selectedDate) {
        activeRecipe.name = recipeName;
        activeRecipe.tabIndex = mainTabIndex;
        activeRecipe.dateTimePicker = selectedDate;

        console.log(`Updating active recipe: ${recipeName}, Tab Index: ${mainTabIndex}, Date: ${selectedDate}`);

        updateColorSetField(clientSelect.value, activeRecipe.dateTimePicker, activeRecipe.tabIndex);
        displayRecipeDetails(recipeName, mainTabIndex);
    }

    var changeDateButton = document.getElementById('change-date');
    if (changeDateButton) {
        changeDateButton.addEventListener('click', function () {
            openCalendarInstance();
        });
    }

    // Function to reset data
    function resetData() {
        recipeFormObjects = {};
        savedDateTimeValues = {};
    }

    resetData();

    // Event listener for all "Add Recipe" buttons
    var addRecipeButtons = document.querySelectorAll(".add-recipe-tab");
    addRecipeButtons.forEach(function (addRecipeButton, index) {
        addRecipeButton.addEventListener("click", function () {
            var modal = document.getElementById(`myModal-${index}`);
            if (modal) {
                modal.style.display = 'block';
                console.log(`Recipe created: ${modal.id}`);
            }
        });
    });

    // Event listener for all close buttons
    var closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(function (closeButton) {
        closeButton.addEventListener('click', function () {
            var index = this.getAttribute('data-index');
            var modal = document.getElementById(`myModal-${index}`);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Initialize event listeners
    const recipeForms = document.querySelectorAll('form#recipeForm');
    recipeForms.forEach(form => form.addEventListener('submit', handleRecipeFormSubmit));

    // Event Handlers
    function handleRecipeFormSubmit(event) {
        event.preventDefault();

        const formIndex = Array.from(recipeForms).indexOf(this);
        const enteredRecipeNameElem = document.getElementById(`recipeName-${formIndex}`);
        const timeVariable = document.getElementById(`timeVariable-${formIndex}`).value;

        const enteredRecipeName = enteredRecipeNameElem?.value.trim();

        if (!enteredRecipeName) return;

        if (isExistingRecipeForm(enteredRecipeName, formIndex)) {
            handleExistingRecipe(enteredRecipeName, formIndex);
        } else {
            handleNewRecipe(enteredRecipeName, formIndex, timeVariable);
        }

        closeModal(formIndex);
        this.reset();
    }

    function isExistingRecipeForm(recipeName, index) {
        return recipeFormObjects[recipeName] && recipeFormObjects[recipeName][index];
    }

    function handleExistingRecipe(recipeName, index) {
        displayRecipeDetails(recipeName, index);
        setActiveTabByName(recipeName);
    }

    function handleNewRecipe(recipeName, index, timeVariable) {
        const newRecipeButton = createRecipeTabButton(recipeName, index);
        addTabButtonToContainer(newRecipeButton, index);
        setActiveTab(newRecipeButton);
        displayRecipeDetails(recipeName, index, timeVariable);
        setActiveTabByName(recipeName);
        checkAndToggleProductModalButton();
        checkAndToggleTrackerVisibility();
    }

    function createRecipeTabButton(recipeName, index) {
        const button = document.createElement('button');
        button.classList.add('tablinks-recipes');
        button.textContent = recipeName;

        // Create the delete icon
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('delete-icon', 'fa', 'fa-trash');  // 'fa' and 'fa-trash' are Font Awesome classes. Replace them if using a different icon set.

        // Create the delete text in a <p> element
        const deleteTextElem = document.createElement('p');
        deleteTextElem.textContent = 'Delete';
        deleteTextElem.classList.add('delete-text');  // Optional: for styling purposes

        // Append both deleteIcon and deleteTextElem to a container
        const deleteContainer = document.createElement('span');
        deleteContainer.classList.add('delete-container');  // Optional: for styling purposes
        deleteContainer.appendChild(deleteIcon);
        deleteContainer.appendChild(deleteTextElem);

        deleteContainer.addEventListener('click', function (event) {
            event.stopPropagation();  // Prevent the tab button's click event from triggering
            deleteRecipe(recipeName, index, button);
        });

        button.appendChild(document.createElement('br'));
        button.appendChild(deleteContainer);  // Append the delete container to the button
        button.addEventListener('click', function () {
            displayRecipeDetails(recipeName, index);
            setActiveTab(button);
        });

        return button;
    }

    // Get the container for recipe tabs
    var recipeTabsContainer = document.querySelectorAll(".tabcontent");

    function addTabButtonToContainer(button, index) {
        const tabRecipes = recipeTabsContainer[index]?.querySelector('.tab-recipes');
        tabRecipes?.appendChild(button);
    }

    function closeModal(index) {
        const modal = document.getElementById(`myModal-${index}`);
        if (modal) modal.style.display = 'none';
    }

    function setActiveTabByName(recipeName) {
        let buttons = document.querySelectorAll('.tablinks-recipes');
        for (let button of buttons) {
            let buttonName = button.textContent.split('Delete')[0].trim(); // This will give you the recipeName
            if (buttonName === recipeName && !button.classList.contains('opened')) {
                setActiveTab(button);
                break;
            }
        }
    }

    let deleteParams = {};  // Object to store parameters for deletion.

    function deleteRecipe(recipeName, index, button) {
        const alertModal = document.getElementById('alertModal');
        if (alertModal) {
            document.getElementById('recipeNamePlaceholder').textContent = recipeName;
            alertModal.style.display = 'block';

            // Store parameters for later use.
            deleteParams = {
                recipeName: recipeName,
                index: index,
                button: button
            };
        }
    }

    function confirmDeletion() {
        const { recipeName, index, button } = deleteParams;
        const recipeFormID = `recipeForm-${recipeName}-${index}`;
        const associatedRecipeForm = document.getElementById(recipeFormID);
        const addProductButtonId = `add-product-for-${recipeName}-${index}`;
        const addProductButton = document.getElementById(addProductButtonId);

        if (button) {
            button.remove();
        } else {
            console.error('The button is not defined or is null.');
        }

        if (associatedRecipeForm) {
            associatedRecipeForm.remove();
            console.log(document.getElementById(recipeFormID));
            console.log(`Recipe form "${recipeName}" with ID "${recipeFormID}" deleted.`);
        }

        if (addProductButton) {
            addProductButton.remove(); // Remove the 'Add Product' button for the deleted recipe
            console.log(`Add Product button with ID "${addProductButtonId}" deleted.`);
        } else {
            console.error('The Add Product button is not defined or is null.');
        }

        const recipeFormIdentifier = `${recipeName}-${index}`;
        if (allFormsData[recipeFormIdentifier]) {
            delete allFormsData[recipeFormIdentifier];
            console.log(`Data for deleted form "${recipeFormIdentifier}" removed from allFormsData.`);
        }

        if (recipeFormObjects[recipeName]) {
            delete recipeFormObjects[recipeName][index];
            if (Object.keys(recipeFormObjects[recipeName]).length === 0) {
                delete recipeFormObjects[recipeName];
            }
        }

        // Delete the end time and start time picker associated with this form
        if (endTimes[index]) {
            delete endTimes[index];
        }

        // Similarly, remove the sponge start time picker reference
        if (spongeStartTimePickersByTab[index]) {
            // Filter out the picker that belongs to the deleted form
            spongeStartTimePickersByTab[index] = spongeStartTimePickersByTab[index].filter(picker => picker.id !== `spongeStartTime-${recipeFormID}`);
            // If there are no more pickers in this tab, delete the tab entry as well
            if (spongeStartTimePickersByTab[index].length === 0) {
                delete spongeStartTimePickersByTab[index];
            }
        }

        // Remove the form from the tracker
        formTracker = formTracker.filter(f => f.id !== recipeFormID);

        alertModal.style.display = 'none'; // Close the modal

        checkFormsAndToggleSaveButton()

        checkAndToggleTrackerVisibility();

        updateAddProductButtonDisplay();

        // Delete associated products of the recipe
        if (productsByRecipe[deleteParams.index] && productsByRecipe[deleteParams.index][deleteParams.recipeName]) {
            delete productsByRecipe[deleteParams.index][deleteParams.recipeName];
            console.log(`Deleted products associated with recipe: ${deleteParams.recipeName}`);

            printProductsByRecipe(deleteParams.recipeName, deleteParams.index);
        }

        if (activeDay) {
            activateFirstRecipeInMainTab(activeDay);
        } else {
            console.error("Current day is not set");
        }

        // Remove the form from the tracker
        formTracker = formTracker.filter(f => f.id !== recipeFormID);

        // Recalculate times and update the first form tracker
        recalculateSpongeTimes();
        findAndEnableFirstForm();


        console.log(`Recipe "${recipeName}" deleted.`);
    }

    function updateAddProductButtonDisplay() {
        var activeTab = document.querySelector('.tabcontent[style*="display: block"]');
        if (activeTab) {
            var recipeButtons = activeTab.querySelectorAll('.tablinks-recipes');
            var addProductButtonId = `add-product-for-${activeRecipe.name}-${activeRecipe.tabIndex}`;
            var addProductButton = document.getElementById(addProductButtonId);

            if (recipeButtons.length === 0 && addProductButton) {
                addProductButton.style.display = 'none';
            } else if (addProductButton) {
                addProductButton.style.display = 'block';
            }
        }
    }


    function cancelDeletion() {
        const alertModal = document.getElementById('alertModal');
        alertModal.style.display = 'none';
    }

    // Attach event listeners
    document.getElementById('confirmDelete').addEventListener('click', confirmDeletion);
    document.getElementById('cancelDelete').addEventListener('click', cancelDeletion);
    document.getElementById('closeAlertModal').addEventListener('click', cancelDeletion);

    function recalculateSpongeTimes() {
        formTracker.forEach((form, index) => {
            const tabIdx = form.tabIdx;
            const uniqueFormId = form.id.split('-').pop();

            // Find the sponge start time and end time inputs
            const spongeStartTimePicker = form.domElement.querySelector('[name="spongeStartTime"]');
            const spongeEndTimeElement = form.domElement.querySelector('[name="spongeEndTime"]');
            const stdTimeInputValue = form.domElement.querySelector('[name="stdTime"]').value;

            // If the form is the first one, enable its sponge start time picker
            if (index === 0) {
                spongeStartTimePicker.disabled = false;
                firstFormTracker[tabIdx] = true;
                spongeStartTimePicker.value = subtractDaysFromDateTime(tabIdx);
            }

            // After updating the spongeEndTime, call updateSpongeStartTimes for subsequent forms
            if (index === 0) {
                // Only call this if there's more than one form, to update subsequent times
                if (formTracker.length > 1) {
                    updateSpongeStartTimes(tabIdx, spongeEndTimeElement.value);
                }
            }

            calculateSpongeEndTime(tabIdx, spongeStartTimePicker.value, stdTimeInputValue, spongeEndTimeElement, uniqueFormId);

            endTimes[tabIdx] = spongeEndTimeElement.value;
        });
    }


    function findAndEnableFirstForm() {
        for (const tabIdx in spongeStartTimePickersByTab) {
            if (spongeStartTimePickersByTab[tabIdx].length > 0) {
                // Enable the sponge start time picker for the first form in this tab
                const firstPicker = spongeStartTimePickersByTab[tabIdx][0];
                firstPicker.disabled = false;
                // Set this form as the first form for this tab
                firstFormTracker[tabIdx] = true;
                break; // Assuming you only need to enable the first form's picker across all tabs
            }
        }
    }

    // Utility and helper functions
    function addDaysToDate(tabIdx) {
        const result = selectedDate ? new Date(selectedDate) : new Date();
        result.setDate(result.getDate() + tabIdx);
        return formatDate(result);
    }

    function subtractDaysFromDateTime(tabIdx) {
        const result = selectedDate ? new Date(selectedDate) : new Date();
        result.setDate(result.getDate() + tabIdx - 1); // Add tabIdx days and subtract one for 'yesterday'
        return formatDateTime(result);
    }

    function yesterdayMinDate(tabIdx) {
        let minDate = new Date();

        minDate.setDate(minDate.getDate() - (tabIdx + 1));
        minDate.setHours(0, 0, 0, 0);

        return minDate;
    }

    function createInputElement(type, id, name, value, disabled, required, placeholder, pattern) {
        var input = document.createElement("input");
        input.type = type;
        input.id = id;
        input.name = name;
        if (value !== undefined) input.value = value;
        if (disabled) input.disabled = true;
        if (required) input.required = true;
        if (placeholder) input.placeholder = placeholder;
        if (pattern) input.pattern = pattern;
        return input;
    }

    function createLabelElement(htmlFor, text) {
        var label = document.createElement("label");
        label.htmlFor = htmlFor;
        label.textContent = text;
        return label;
    }

    function appendElements(parent, children) {
        children.forEach(child => {
            if (child instanceof HTMLElement) {
                parent.appendChild(child);
            } else {
                parent.appendChild(document.createElement("br"));
            }
        });
    }

    function checkForExistingForm(recipeName, tabIdx) {
        if (!recipeFormObjects[recipeName]) {
            recipeFormObjects[recipeName] = {};
        }

        if (!recipeFormObjects[recipeName][tabIdx]) {
            recipeFormObjects[recipeName][tabIdx] = 1;
        }

        var uniqueFormId = `recipeForm-${recipeName}-${tabIdx}`;
        var existingForm = document.getElementById(uniqueFormId);
        if (existingForm) {
            return existingForm;
        }

        return null;
    }

    function addInputEventListener(inputElement, eventType, callback) {
        if (inputElement && typeof callback === 'function') {
            inputElement.addEventListener(eventType, callback);
        } else {
            console.error('Invalid element or callback function');
        }
    }

    function addProductButton(form, recipeName, tabIdx) {
        // Append the new form to the existing recipes list
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.form-container');
        if (currentRecipeDetailsContainer) {
            currentRecipeDetailsContainer.appendChild(form);
        } else {
            console.error('Form container not found.');
        }

        // Create and append the 'Add Product' button
        var addProductButton = document.createElement("button");
        addProductButton.type = "button";
        addProductButton.textContent = `+ Add Product for ${recipeName}`;
        addProductButton.classList.add("add-product-button");
        addProductButton.id = `add-product-for-${recipeName}-${tabIdx}`;

        // Append the 'Add Product' button after the product container
        var productContainer = document.querySelector('.product-container');
        if (productContainer) {
            productContainer.insertAdjacentElement('afterend', addProductButton);
        } else {
            console.error('Product container not found.');
        }
    }


    function createRecipeForm(recipeName, tabIdx, timeVariable) {
        var formId = `recipeForm-${recipeName}-${tabIdx}`;
        var uniqueFormId = `${formId}`;
        var yesterdayDefaultDateTime = subtractDaysFromDateTime(tabIdx);
        var defaultDateTime = addDaysToDate(tabIdx);
        var isFirstForm = !firstFormTracker[tabIdx];

        var form = checkForExistingForm(recipeName, tabIdx);
        if (form) {
            return form;
        }

        var form = document.createElement("form");
        form.id = uniqueFormId;
        form.classList.add("recipe-form");

        var leftDiv = document.createElement("div");
        leftDiv.classList.add("left-div");

        var rightDiv = document.createElement("div");
        rightDiv.classList.add("right-div");

        var nameInput = createInputElement("text", `recipeName-${uniqueFormId}`, "recipeName", recipeName, true, true);
        var nameLabel = createLabelElement(nameInput.id, "Recipe Name");

        var dateTimePicker = createInputElement("text", `dateTimePicker-${uniqueFormId}`, "dateTimePicker", null, true);

        flatpickr(dateTimePicker, {
            enableTime: false,
            dateFormat: "d/m/Y",
            defaultDate: savedDateTimeValues[uniqueFormId] || defaultDateTime,
        });

        dateTimePicker.value = defaultDateTime;
        activeRecipe.dateTimePicker = dateTimePicker.value;

        var datetimeLabel = createLabelElement(dateTimePicker.id, "Production Date");
        var productionRateInput = createInputElement("number", `productionRate-${uniqueFormId}`, "productionRate");
        var productionRateLabel = createLabelElement(productionRateInput.id, "Production Rate");

        var salesOrderInput = createInputElement("number", `salesOrder-${uniqueFormId}`, "salesOrder", null, true);
        var salesOrderLabel = createLabelElement(salesOrderInput.id, "Total Sales Order");

        var wasteInput = createInputElement("number", `waste-${uniqueFormId}`, "waste", 2);
        var wasteLabel = createLabelElement(wasteInput.id, "Budgeted Waste (%)");

        var stdTimeInput = createInputElement("text", `stdTime-${uniqueFormId}`, "stdTime", null, true, false, "00:00:00", "[0-9]{2}:[0-9]{2}:[0-9]{2}");
        var stdTimeLabel = createLabelElement(stdTimeInput.id, "Required Std. Time");

        var totalTrayInput = createInputElement("number", `totalTray-${uniqueFormId}`, "totalTray", null, true);
        var totalTrayLabel = createLabelElement(totalTrayInput.id, "Total Tray");

        var beltNoInput = createInputElement("number", `beltNo-${uniqueFormId}`, "beltNo");
        var beltNoLabel = createLabelElement(beltNoInput.id, "Suction Cup Belt No.");

        var batchSizeInput = createInputElement("number", `batchSize-${uniqueFormId}`, "batchSize");
        var batchSizeLabel = createLabelElement(batchSizeInput.id, "Batch Size");

        var batchesInput = createInputElement("number", `batches-${uniqueFormId}`, "batches", null, true);
        var batchesLabel = createLabelElement(batchesInput.id, "Batches To Produce");

        var cycleTimeInput = createInputElement("text", `cycleTime-${uniqueFormId}`, "cycleTime", null, true, false, "00:00:00", "[0-9]{2}:[0-9]{2}:[0-9]{2}");
        var cycleTimeLabel = createLabelElement(cycleTimeInput.id, "Cycle Time");

        var spongeStartTimePicker = createInputElement("text", `spongeStartTime-${uniqueFormId}`, "spongeStartTime");
        flatpickr(spongeStartTimePicker, {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            defaultDate: yesterdayDefaultDateTime,
            minDate: yesterdayMinDate(tabIdx),
            onValueUpdate: function (selectedDates) {
                if (selectedDates.length > 0) {

                    let formattedDate = formatDateTime(selectedDates[0]);

                    spongeStartTimePicker.value = formattedDate;
                }
            },
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    let formattedDate = formatDateTime(selectedDates[0]);

                    // Assuming stdTimeInput holds a value in seconds
                    let stdTimeElement = document.getElementById(`stdTime-${uniqueFormId}`);
                    let spongeEndTimeElement = document.getElementById(`spongeEndTime-${uniqueFormId}`);

                    endTimes[tabIdx] = spongeEndTimeElement.value;

                    // Call calculateSpongeEndTime with the formatted start time
                    calculateSpongeEndTime(tabIdx, formattedDate, stdTimeElement.value, spongeEndTimeElement, uniqueFormId);

                    // If this is the first form, update the subsequent sponge start times
                    if (!firstFormTracker[tabIdx] || firstFormTracker[tabIdx] === true) {
                        updateSpongeStartTimes(tabIdx, new Date(spongeEndTimeElement.value));
                    }
                    calculateDoughStartTime(spongeStartTimePicker.value, doughStartTime);
                    calculateDoughEndTime(doughStartTime.value, stdTimeInput.value, doughEndTime);
                    calculateFirstLoafPacked(doughStartTime.value, firstLoafPacked);
                    calculateCutOffTime(firstLoafPacked.value, stdTimeInput.value, cutOffTime);
                    updateTrackerDisplay(uniqueFormId);
                }
            }
        });

        var spongeStartTimeLabel = createLabelElement(spongeStartTimePicker.id, "Sponge Start Time");

        var totalTrolleyInput = createInputElement("number", `totalTrolley-${uniqueFormId}`, "totalTrolley", null, true);
        var totalTrolleyLabel = createLabelElement(totalTrolleyInput.id, "Total Trolley");

        // var gapInput = createInputElement("text", `gap-${uniqueFormId}`, "gap", null, false, false, "00:00:00", "[0-9]{2}:[0-9]{2}:[0-9]{2}");
        // var gapLabel = createLabelElement(gapInput.id, "Gap");

        var timeVariableInput = createInputElement("hidden", `timeVariable-${uniqueFormId}`, "timeVariable", timeVariable);
        var spongeEndTime = createInputElement("hidden", `spongeEndTime-${uniqueFormId}`, "spongeEndTime");
        var doughStartTime = createInputElement("hidden", `doughStartTime-${uniqueFormId}`, "doughStartTime");
        var doughEndTime = createInputElement("hidden", `doughEndTime-${uniqueFormId}`, "doughEndTime");
        var firstLoafPacked = createInputElement("hidden", `firstLoafPacked-${uniqueFormId}`, "firstLoafPacked");
        var cutOffTime = createInputElement("hidden", `cutOffTime-${uniqueFormId}`, "cutOffTime");

        appendElements(leftDiv, [nameLabel, nameInput, productionRateLabel, productionRateInput, salesOrderLabel, salesOrderInput, stdTimeLabel, stdTimeInput, wasteLabel, wasteInput, totalTrayLabel, totalTrayInput, beltNoLabel, beltNoInput]);
        appendElements(rightDiv, [datetimeLabel, dateTimePicker, batchSizeLabel, batchSizeInput, batchesLabel, batchesInput, cycleTimeLabel, cycleTimeInput, spongeStartTimeLabel, spongeStartTimePicker, totalTrolleyLabel, totalTrolleyInput]);

        form.appendChild(leftDiv);
        form.appendChild(rightDiv);
        form.appendChild(timeVariableInput);
        form.appendChild(spongeEndTime);
        form.appendChild(doughStartTime);
        form.appendChild(doughEndTime);
        form.appendChild(firstLoafPacked);
        form.appendChild(cutOffTime);

        // Set up input event listeners
        addInputEventListener(salesOrderInput, 'change', () => calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable));
        addInputEventListener(wasteInput, 'input', () => calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable));
        addInputEventListener(batchSizeInput, 'input', () => {
            calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable);
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
        });
        addInputEventListener(productionRateInput, 'input', () => {
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
        });
        addInputEventListener(batchesInput, 'input', () => {
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
            updateTrackerDisplay(uniqueFormId);
        });
        addInputEventListener(stdTimeInput, 'input', () => {
            calculateSpongeEndTime(tabIdx, spongeStartTimePicker.value, stdTimeInput.value, spongeEndTime, uniqueFormId);
            calculateSpongeStartTime(tabIdx);
            calculateDoughEndTime(doughStartTime.value, stdTimeInput.value, doughEndTime);
            calculateCutOffTime(firstLoafPacked.value, stdTimeInput.value, cutOffTime);
            updateTrackerDisplay(uniqueFormId);
        });

        addProductButton(form, recipeName, tabIdx);

        // Add the spongeStartTimePicker to the global tracker
        if (!spongeStartTimePickersByTab[tabIdx]) {
            spongeStartTimePickersByTab[tabIdx] = [];
        }
        spongeStartTimePickersByTab[tabIdx].push(spongeStartTimePicker);

        // CHECKING IF THE CREATED FORM IS THE FIRST FORM
        if (isFirstForm) {
            spongeStartTimePicker.disabled = false;
            spongeStartTimePicker.value = yesterdayDefaultDateTime;
            firstFormTracker[tabIdx] = true;
        } else {
            spongeStartTimePicker.disabled = true;
            spongeStartTimePicker.value = calculateSpongeStartTime(tabIdx);
        }

        calculateDoughStartTime(spongeStartTimePicker.value, doughStartTime);
        calculateFirstLoafPacked(doughStartTime.value, firstLoafPacked);
        updateTrackerDisplay(uniqueFormId);

        // Set the unique identifier for the form
        form.dataset.recipeName = recipeName;
        form.dataset.tabIdx = tabIdx;

        // Attach change listeners to inputs
        attachInputChangeListeners(form);

        formTracker.push({ id: form.id, tabIdx: tabIdx, domElement: form });

        collectFormData(form)
        console.log(`[ALL FORMS DATA]`, allFormsData); // Log the entire allFormsData object

        checkFormsAndToggleSaveButton();

        console.log(`Created new form with id: ${form.id}`);
        return form;
    }

    function updateTrackerDisplay(uniqueFormId) {

        // Define a helper function to get the value or a placeholder if it's not set or invalid
        function getValueOrPlaceholder(inputElement) {
            // Check if the inputElement exists and has a value that is not empty
            if (inputElement && inputElement.value) {
                // Ensure the value is not a string 'undefined', 'NaN', or an empty string
                let value = inputElement.value;
                if (value.trim() !== '' && value !== 'undefined' && value !== 'NaN') {
                    return value;
                }
            }
            return 'Not set';
        }

        // Get the input elements by using the unique form ID
        var spongeStartTimeInput = document.getElementById(`spongeStartTime-${uniqueFormId}`);
        var spongeEndTimeInput = document.getElementById(`spongeEndTime-${uniqueFormId}`);
        var doughStartTimeInput = document.getElementById(`doughStartTime-${uniqueFormId}`);
        var doughEndTimeInput = document.getElementById(`doughEndTime-${uniqueFormId}`);
        var firstLoafPackedInput = document.getElementById(`firstLoafPacked-${uniqueFormId}`);
        var cutOffTimeInput = document.getElementById(`cutOffTime-${uniqueFormId}`);

        // Check if the input elements exist and log their values for debugging
        if (spongeStartTimeInput) console.log(`Value of spongeStartTime: ${spongeStartTimeInput.value}`);
        if (spongeEndTimeInput) console.log(`Value of spongeEndTime: ${spongeEndTimeInput.value}`);
        if (doughStartTimeInput) console.log(`Value of doughStartTime: ${doughStartTimeInput.value}`);
        if (doughEndTimeInput) console.log(`Value of doughEndTime: ${doughEndTimeInput.value}`);
        if (firstLoafPackedInput) console.log(`Value of firstLoafPacked: ${firstLoafPackedInput.value}`);
        if (cutOffTimeInput) console.log(`Value of cutOffTime: ${cutOffTimeInput.value}`)

        // Get the display elements by their static IDs
        var spongeStartTimeDisplay = document.getElementById('spongeStartTimeTracker');
        var spongeEndTimeDisplay = document.getElementById('spongeEndTimeTracker');
        var doughStartTimeDisplay = document.getElementById('doughStartTimeTracker');
        var doughEndTimeDisplay = document.getElementById('doughEndTimeTracker');
        var firstLoafPackedDisplay = document.getElementById('firstLoafPackedTracker');
        var cutOffTimeDisplay = document.getElementById('cutOffTimeTracker');

        // Add a check to ensure the display elements were found
        if (!spongeEndTimeDisplay || !doughStartTimeDisplay || !doughEndTimeDisplay || !firstLoafPackedDisplay || !cutOffTimeDisplay) {
            console.error('One of the display elements was not found in the DOM.');
            return; // Exit the function if elements are not found
        }

        // Update the text content of the display elements with the values from the input elements
        spongeStartTimeDisplay.textContent = getValueOrPlaceholder(spongeStartTimeInput);
        spongeEndTimeDisplay.textContent = getValueOrPlaceholder(spongeEndTimeInput);
        doughStartTimeDisplay.textContent = getValueOrPlaceholder(doughStartTimeInput);
        doughEndTimeDisplay.textContent = getValueOrPlaceholder(doughEndTimeInput);
        firstLoafPackedDisplay.textContent = getValueOrPlaceholder(firstLoafPackedInput);
        cutOffTimeDisplay.textContent = getValueOrPlaceholder(cutOffTimeInput);
    }

    // Helper function to calculate the dough end time
    function calculateCutOffTime(firstLoafPackedValue, stdTime, cutOffTimeElement) {
        console.log(`First Loaf Time Value: ${firstLoafPackedValue}`); // Log the dough start time

        console.log(`stdTime Value: ${stdTime}`); // Log the dough start time

        let firstLoafPacked = new Date(firstLoafPackedValue);
        console.log(`First Loaf new Date Time: ${firstLoafPacked}`); // Log the dough start time

        let cutOffTime = new Date(firstLoafPacked.getTime() + convertToSeconds(stdTime) * 1000);
        console.log(`Dough End Time (calculated): ${cutOffTime}`); // Log the calculated dough end time

        cutOffTimeElement.value = formatDateTime(cutOffTime);
        console.log(`Dough End Time (formatted): ${cutOffTimeElement.value}`); // Log the formatted dough end time
    }

    // Helper function to calculate the end time for the 1st loaf
    function calculateFirstLoafPacked(doughStartTimeValue, firstLoafPackedElement) {
        let doughStartTime = new Date(doughStartTimeValue);

        console.log(`Dough Start Time: ${doughStartTime}`); // Log the dough start time

        // Calculate the end time by adding all the durations to the dough start time
        let firstLoafPacked = new Date(doughStartTime.getTime() +
            SPONGE_MIXING * 1000 +
            FERMENTATION * 1000 +
            DOUGH_MIXING * 1000 +
            FLOOR_TIME * 1000 +
            MAKEUP_TIME * 1000 +
            FINAL_PROOF * 1000 +
            BAKING * 1000 +
            COOLING * 1000 +
            PACKING * 1000
        );

        console.log(`Loaf End Time (calculated): ${firstLoafPacked}`); // Log the calculated loaf end time

        firstLoafPackedElement.value = formatDateTime(firstLoafPacked);
        console.log(`Loaf End Time (formatted): ${firstLoafPackedElement.value}`); // Log the formatted loaf end time
    }

    // Helper function to calculate the dough end time
    function calculateDoughEndTime(doughStartTimeValue, stdTime, doughEndTimeElement) {
        console.log(`Dough Start Time Value: ${doughStartTimeValue}`); // Log the dough start time

        console.log(`stdTime Value: ${stdTime}`); // Log the dough start time

        let doughStartTime = new Date(doughStartTimeValue);
        console.log(`Dough Start Time: ${doughStartTime}`); // Log the dough start time

        let doughEndTime = new Date(doughStartTime.getTime() + convertToSeconds(stdTime) * 1000);
        console.log(`Dough End Time (calculated): ${doughEndTime}`); // Log the calculated dough end time

        doughEndTimeElement.value = formatDateTime(doughEndTime);
        console.log(`Dough End Time (formatted): ${doughEndTimeElement.value}`); // Log the formatted dough end time
    }

    // Helper function to calculate the dough start time
    function calculateDoughStartTime(spongeStartTimeValue, doughStartTimeElement) {

        let spongeStartTime = new Date(spongeStartTimeValue);
        console.log(`Sponge Start Time: ${spongeStartTime}`); // Log the sponge start time

        let doughStartTime = new Date(spongeStartTime.getTime() + SPONGE_MIXING * 1000 + FERMENTATION * 1000);
        console.log(`Dough Start Time (calculated): ${doughStartTime}`); // Log the calculated dough start time

        doughStartTimeElement.value = formatDateTime(doughStartTime);
        console.log(`Dough Start Time (formatted): ${doughStartTimeElement.value}`); // Log the formatted dough start time
    }

    function updateSpongeStartTimes(tabIdx, newEndTime) {
        const subsequentTimePickers = spongeStartTimePickersByTab[tabIdx] || [];
        let subsequentStartTime = new Date(newEndTime);

        console.log(`Updating sponge start times for tab index: ${tabIdx}`);

        subsequentTimePickers.forEach(function (picker, index) {
            if (index === 0) return; // Skip the first picker, it's already set.

            subsequentStartTime = new Date(subsequentStartTime.getTime() + 45 * 60000);
            picker.value = formatDateTime(subsequentStartTime);
            updateSpongeEndTimes(picker.value);
            updateDoughStartTimes(picker.value);
            updateDoughEndTimes();
            updateFirstLoafPacked();
            updateCutOffTimes();
        });
    }

    function updateSpongeEndTimes(spongeStartTimePicker) {
        formTracker.forEach((form, index) => {
            const tabIdx = form.tabIdx;
            const uniqueFormId = form.id.split('-').pop();
            if (index === 0) return;

            const spongeEndTimeElement = form.domElement.querySelector('[name="spongeEndTime"]');
            const stdTimeInputValue = form.domElement.querySelector('[name="stdTime"]').value;

            calculateSpongeEndTime(tabIdx, spongeStartTimePicker, stdTimeInputValue, spongeEndTimeElement, uniqueFormId);

            endTimes[tabIdx] = spongeEndTimeElement.value;
        });
    }

    function updateDoughStartTimes(spongeStartTimePicker) {
        formTracker.forEach((form, index) => {
            if (index === 0) return;

            const doughStartTimeElement = form.domElement.querySelector('[name="doughStartTime"]');

            calculateDoughStartTime(spongeStartTimePicker, doughStartTimeElement);
        });
    }

    function updateDoughEndTimes() {
        formTracker.forEach((form, index) => {
            if (index === 0) return;

            const doughStartTimeElement = form.domElement.querySelector('[name="doughStartTime"]').value;
            const stdTimeInputValue = form.domElement.querySelector('[name="stdTime"]').value;
            const doughEndTimeElement = form.domElement.querySelector('[name="doughEndTime"]');

            calculateDoughEndTime(doughStartTimeElement, stdTimeInputValue, doughEndTimeElement);
        });
    }

    function updateCutOffTimes() {
        formTracker.forEach((form, index) => {
            if (index === 0) return;

            const firstLoafPackedElement = form.domElement.querySelector('[name="firstLoafPacked"]').value;
            const stdTimeInputValue = form.domElement.querySelector('[name="stdTime"]').value;
            const cutOffTimeElement = form.domElement.querySelector('[name="cutOffTime"]');

            calculateDoughEndTime(firstLoafPackedElement, stdTimeInputValue, cutOffTimeElement);
        });
    }

    function updateFirstLoafPacked() {
        formTracker.forEach((form, index) => {
            if (index === 0) return;

            const doughStartTimeElement = form.domElement.querySelector('[name="doughStartTime"]').value;
            const firstLoafPackedElement = form.domElement.querySelector('[name="firstLoafPacked"]');

            calculateFirstLoafPacked(doughStartTimeElement, firstLoafPackedElement);
        });
    }

    function calculateSpongeStartTime(tabIdx) {

        var previousEndTimeString = endTimes[tabIdx];
        // Parse the previous end time string to a Date object
        var previousEndTime = new Date(previousEndTimeString);

        console.log(`Value of previous End Time String is: ${previousEndTimeString}`)

        console.log(`Value of previous End Time is: ${previousEndTime}`)

        // Check if previousEndTime is valid Date object
        if (isNaN(previousEndTime.getTime())) {
            console.error('Invalid date provided for previousEndTime:', previousEndTimeString);
            return null;
        }

        // Create a new Date object for the new start time
        var newStartTime = new Date(previousEndTime.getTime());
        newStartTime.setMinutes(newStartTime.getMinutes() + 45); // Add 45 minutes to the previous end time

        return formatDateTime(newStartTime);
    }

    function calculateSpongeEndTime(tabIdx, startTime, stdTimeInput, spongeEndTimeElement, uniqueFormId) {

        console.log(`StdTimeInput: ${stdTimeInput}`)

        let durationSeconds = convertToSeconds(stdTimeInput) + SPONGE_MIXING;

        let startTimeWithoutDay = startTime.substring(startTime.indexOf(',') + 2);

        let startDate = new Date(startTimeWithoutDay);
        console.log(`Calculate Sponge End Time - Start Date: ${startDate}`)

        if (isNaN(startDate)) {
            console.error('Invalid start time. Please check the input.');
            return;
        }

        startDate.setSeconds(startDate.getSeconds() + durationSeconds);

        let finalEndTime = formatDateTime(startDate);
        spongeEndTimeElement.value = finalEndTime;
        endTimes[tabIdx] = spongeEndTimeElement.value;
        console.log(`Sponge End Time: ${finalEndTime}`);
    }

    function getCsrfToken() {
        // Get all cookies from the document and split into individual items
        let cookies = document.cookie.split(';');

        // Look for the "csrftoken" cookie and return its value
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            let cookieParts = cookie.split('=');
            if (cookieParts[0] === 'csrftoken') {
                return cookieParts[1];
            }
        }
        return ''; // Return an empty string if not found
    }

    function collectProductData(recipeName, tabIndex) {
        // Assuming productsByRecipe is accessible in this scope and structured as you've described
        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            return productsByRecipe[tabIndex][recipeName];  // This will be an array of product objects
        }
        return [];  // Return an empty array if no products are found for the recipe
    }

    function collectFormData(form) {
        let formData = {};
        let inputElements = form.querySelectorAll('input, select, textarea');

        inputElements.forEach(element => {
            let fieldName = element.name || element.id.split('-')[0];
            formData[fieldName] = element.value;
        });

        let recipeName = form.dataset.recipeName;
        let tabIndex = form.dataset.tabIdx;
        let formIdentifier = recipeName + '-' + tabIndex;
        formData['formId'] = formIdentifier;

        // Collect product data for the recipe
        formData['products'] = collectProductData(recipeName, tabIndex);

        // Include the product data within the allFormsData object
        allFormsData[formIdentifier] = formData;

        console.log(`Updated data for ${formIdentifier}:`, formData);
    }



    function attachInputChangeListeners(form) {
        const inputElements = form.querySelectorAll('input, select, textarea');
        inputElements.forEach(input => {
            input.addEventListener('change', () => {
                collectFormData(form);
                console.log(`Data for ${form.dataset.recipeName}-${form.dataset.tabIdx} has been updated.`);
                console.log(`[ALL FORMS DATA]`, allFormsData); // Log the entire allFormsData object
            });
        });
    }

    function showSaveButton() {
        var saveButton = document.querySelector('.save-all-button');
        if (saveButton) {
            saveButton.style.display = 'block';

            attachSaveButtonListener(saveButton);
        }
    }

    function attachSaveButtonListener(saveButton) {
        if (!saveButton.dataset.listenerAttached) {
            saveButton.addEventListener('click', function () {
                // Disable the button to prevent multiple submissions
                saveButton.disabled = true;
                saveButton.textContent = 'Saving...'; // Optional: provide user feedback

                // Collect data from all forms again to ensure we have the most current data
                let allForms = document.querySelectorAll('.recipe-form');
                allForms.forEach(form => {
                    collectFormData(form); // This populates allFormsData
                });

                // Convert allFormsData object to an array of recipe data objects
                let recipesArray = Object.values(allFormsData);

                // Create the data payload to send to the server
                let payload = {
                    recipes: recipesArray  // This is the expected format on the backend
                };

                fetch('/save_recipes/', {
                    method: 'POST',
                    body: JSON.stringify(payload), // Send the payload with recipes array
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken()
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.status === 'success') {
                            // After saving, redirect to the homepage
                            allFormsData = {};
                            isSaving = false;
                            window.location.href = '/';
                        } else {
                            isSaving = false;
                            // If the save wasn't successful, show an error message
                            alert('Failed to save the recipe: ' + data.message);
                        }
                    })
                    .catch(error => {
                        isSaving = false;
                        console.error('Error:', error);
                        alert('Error saving recipe: ' + error.message);
                        // Re-enable the button in case of error so the user can try again
                        saveButton.disabled = false;
                        saveButton.textContent = 'Save'; // Reset button text
                    });
            });
            saveButton.dataset.listenerAttached = 'true';
        }
    }

    // This function checks if any forms exist and shows/hides the save button accordingly
    function checkFormsAndToggleSaveButton() {
        var forms = document.querySelectorAll('.recipe-form');
        if (forms.length > 0) {
            showSaveButton();
        } else {
            hideSaveButton();
        }
    }

    function hideSaveButton() {
        var saveButton = document.querySelector('.save-all-button');
        if (saveButton) {
            saveButton.style.display = 'none';
        }
    }

    function convertToSeconds(hhmmss) {
        const [hours, minutes, seconds] = hhmmss.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function convertToHHMMSS(totalSeconds) {
        let seconds = Math.round(totalSeconds % 60);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        const hours = Math.floor(totalSeconds / 3600);

        if (seconds === 60) {
            minutes += 1;
            seconds = 0;
        }

        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
        ].join(':');
    }

    function calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput) {
        const batches = parseInt(batchesInput.value, 10) || 0;
        const cycleTimeSeconds = convertToSeconds(cycleTimeInput.value);
        const additionalTime = Math.round(batches / 16) * 720;

        const totalStdTimeSeconds = batches * cycleTimeSeconds + additionalTime;
        stdTimeInput.value = convertToHHMMSS(totalStdTimeSeconds);

        stdTimeInput.dispatchEvent(new Event('input'));
    }

    function calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput) {
        console.log(`Time Variable: ${timeVariableInput.value} for calculateCycleTime`);
        const batchSizeValue = parseFloat(batchSizeInput.value) || 0;
        const productionRateValue = parseFloat(productionRateInput.value) || 0;

        if (batchSizeValue > 0 && productionRateValue > 0) {
            const timeVariableInSeconds = convertToSeconds(timeVariableInput.value);
            const cycleTimeInSeconds = (batchSizeValue / productionRateValue) * timeVariableInSeconds;
            cycleTimeInput.value = convertToHHMMSS(cycleTimeInSeconds);
        } else {
            cycleTimeInput.value = "00:00:00";
        }
    }

    function calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariableInput) {
        console.log(`Time Variable: ${timeVariableInput.value}`);
        var salesOrderValue = parseFloat(salesOrderInput.value) || 0;
        var wastePercentage = parseFloat(wasteInput.value) / 100 || 0.02;
        var batchSizeValue = parseFloat(batchSizeInput.value) || 1;

        var totalOrderWithWaste = salesOrderValue + (salesOrderValue * wastePercentage);
        var batches = totalOrderWithWaste / batchSizeValue;

        batchesInput.value = Math.ceil(batches);

        batchesInput.dispatchEvent(new Event('input'));
    }

    function formatDurationInput(inputElem) {
        let val = inputElem.value.replace(/[^0-9]/g, '');
        while (val.length < 6) {
            val = val + '0';
        }

        const hours = val.slice(-6, -4);
        const minutes = val.slice(-4, -2);
        const seconds = val.slice(-2);

        inputElem.value = `${hours}:${minutes}:${seconds}`;
    }

    function formatDurationInput(inputElem) {
        let val = inputElem.value.replace(/[^0-9]/g, '');

        while (val.length < 6) {
            val = val + '0';
        }

        const hours = val.slice(-6, -4);
        const minutes = val.slice(-4, -2);
        const seconds = val.slice(-2);

        inputElem.value = `${hours}:${minutes}:${seconds}`;
    }

    document.addEventListener('input', function (e) {
        if (e.target.matches('[name="stdTime"], [name="cycleTime"], [name="timeVariable"], [name="gap"]')) {
            formatDurationInput(e.target);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.target.matches('[name="stdTime"], [name="cycleTime"], [name="timeVariable"], [name="gap"]') && e.key == 'Backspace' || e.key == 'Delete') {
            e.preventDefault(); // Prevent default backspace behavior
            e.target.value = '00:00:00'; // Clear the input field
        }
    });

    document.querySelector('.right-column').addEventListener('click', function (event) {
        updateColorSetField(clientSelect.value, activeRecipe.dateTimePicker, activeRecipe.tabIndex);

        // Check if the clicked element has the class 'add-product-button'
        if (event.target.classList.contains('add-product-button')) {
            // Your logic when the button is clicked:
            if (activeRecipe.name && activeRecipe.tabIndex !== null) {
                var currentRecipeName = activeRecipe.name;
                var currentTabIndex = activeRecipe.tabIndex;
                console.log(`Opened product modal for recipe name ${currentRecipeName} at tab index ${currentTabIndex}`);

                // Display the modal
                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'block';
                }

                // Initialize the flatpickr instances every time the modal is opened:
                var saleDateInput = document.getElementById('saleDate');
                var expiryDateInput = document.getElementById('expiryDate');

                var defaultSaleDate = addDaysToDate(currentTabIndex); // Logic to get default sale date
                var minDateValue = addDaysToDate(currentTabIndex);
                var defaultExpiryDate = addDaysToDate(currentTabIndex); // Logic to get default expiry date

                initializeFlatpickr(saleDateInput, defaultSaleDate, minDateValue);
                initializeFlatpickr(expiryDateInput, defaultExpiryDate, minDateValue);
                updateAddProductButtonDisplay();

            } else {
                console.log(`Not found`);
                return;
            }
        }
    });

    function updateColorSetField(client, selectedDate) {

        var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        var colorSets = {
            GFS: ["WHITE", "TAN", "ORANGE", "YELLOW", "BLUE", "DARK GREEN", "RED"],
            GBKL: ["TAN", "BLUE", "YELLOW", "ORANGE", "GREEN", "RED", "WHITE"]
        };

        var openCalendarInstanceDate = new Date(selectedDate);
        var selectedDayOfWeek = dayOfWeek[openCalendarInstanceDate.getDay()];

        // Directly set the colorIndex based on the dayOfWeek
        var colorIndex = openCalendarInstanceDate.getDay();

        var selectedColor = colorSets[client][colorIndex];

        console.log('Selected Day of Week:', selectedDayOfWeek);
        console.log('Calculated Color Index:', colorIndex);
        console.log('Selected Color:', selectedColor);

        var colorSetField = document.getElementById('colorSet');
        if (colorSetField) {
            colorSetField.value = selectedColor;
        }
    }

    // Event listener for the client select element
    var clientSelect = document.getElementById('client');
    if (clientSelect) {
        clientSelect.addEventListener("change", function () {
            var selectedClient = this.value;

            if (activeRecipe.dateTimePicker && activeRecipe.tabIndex !== null) {
                updateColorSetField(selectedClient, activeRecipe.dateTimePicker, activeRecipe.tabIndex);
            } else {
                // Handle cases where the active recipe details are not set
                console.error("Active recipe details are not set. Cannot update the ColorSetField.");
            }
        });
    }


    // Function to handle the creation and displaying of the recipe form
    function displayRecipeDetails(recipeName, tabIdx, timeVariable) {
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.form-container');
        if (recipeFormObjects[recipeName] && recipeFormObjects[recipeName][tabIdx]) {
            var existingForm = recipeFormObjects[recipeName][tabIdx];
            updateFormWithDate(existingForm, tabIdx); // Update the date field in the form
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(existingForm);
        } else {
            var newRecipeForm = createRecipeForm(recipeName, tabIdx, timeVariable);
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(newRecipeForm);
            recipeFormObjects[recipeName][tabIdx] = newRecipeForm; // Store the form in the dictionary
        }
        printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);
    }

    function updateFormWithDate(form, tabIdx) {
        var formId = form.id;
        var uniqueFormId = formId;

        var dateTimePicker = form.querySelector(`#dateTimePicker-${uniqueFormId}`);
        if (dateTimePicker) {
            var defaultDateTime = addDaysToDate(tabIdx);
            flatpickr(dateTimePicker, {
                enableTime: false,
                dateFormat: "d/m/Y",
                defaultDate: savedDateTimeValues[uniqueFormId] || defaultDateTime,
                onChange: function (selectedDates) {
                    var selectedDate = selectedDates[0];
                    var formattedDate = formatDate(selectedDate);
                    dateTimePicker.value = formattedDate;
                    savedDateTimeValues[uniqueFormId] = selectedDate;

                    // Trigger a 'change' event to ensure the field updates in real time
                    var event = new Event('change', {
                        bubbles: true,
                        cancelable: true,
                    });
                    dateTimePicker.dispatchEvent(event);
                }
            });
            dateTimePicker.value = defaultDateTime;
            dateTimePicker.addEventListener('change', function () {
                var dateValue = dateTimePicker.value;
                savedDateTimeValues[uniqueFormId] = new Date(dateValue);
                // Manually update the value of the input field
                dateTimePicker.value = formatDate(savedDateTimeValues[uniqueFormId]);
            });
        }
    }

    var tabButtons = document.querySelectorAll('.tablinks');
    tabButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            console.log('Tablink clicked!')
            openTab(event, button.getAttribute('data-day'));
        });
    });

    function openTab(event, day) {
        activeDay = day;

        event.stopPropagation();

        var allAddProductButtons = document.querySelectorAll('.add-product-button');
        allAddProductButtons.forEach(function (btn) {
            btn.style.display = 'none';
        });

        var allTabContents = document.querySelectorAll('.tabcontent');
        allTabContents.forEach(function (content) {
            content.style.display = "none";
        });

        var allTabLinks = document.querySelectorAll('.tablinks');
        allTabLinks.forEach(function (link) {
            link.classList.remove("active");
        });

        document.getElementById(day).style.display = "block";
        event.currentTarget.classList.add("active");

        var allProducts = document.querySelectorAll('.product-item');
        allProducts.forEach(function (product) {
            product.style.display = 'none';
        });

        var currentTabContent = document.getElementById(day);
        var recipeButtonsInCurrentTab = currentTabContent.querySelectorAll('.tablinks-recipes');
        if (recipeButtonsInCurrentTab.length > 0) {
            printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);
        }

        checkAndToggleProductModalButton();

        checkAndToggleTrackerVisibility();

        activateFirstRecipeInMainTab(day);
    }

    function activateFirstRecipeInMainTab(day) {
        var tabContent = document.getElementById(day);
        if (tabContent) {
            var firstRecipeButton = tabContent.querySelector('.tablinks-recipes');
            if (firstRecipeButton) {
                setActiveTab(firstRecipeButton);
                displayRecipeDetails(activeRecipe.name, activeRecipe.tabIndex);
            }
        }
    }

    function setActiveTab(clickedButton) {
        var tabContainer = clickedButton.closest('.tabcontent');
        var allMainTabs = document.querySelectorAll('.tabcontent');
        var mainTabIndex = Array.from(allMainTabs).indexOf(tabContainer);
        var allRecipeButtons = tabContainer.querySelectorAll('.tablinks-recipes');
        var recipeName = clickedButton.innerText.replace('Delete', '').trim();
        var selectedDate = addDaysToDate(mainTabIndex);
        var activeButtonId = `add-product-for-${recipeName}-${mainTabIndex}`;
        var activeButton = document.getElementById(activeButtonId);
        var allAddProductButtons = document.querySelectorAll('.add-product-button');

        activeRecipe.name = recipeName;
        activeRecipe.tabIndex = mainTabIndex;
        activeRecipe.dateTimePicker = selectedDate;

        var uniqueFormId = `recipeForm-${recipeName}-${mainTabIndex}`;

        allRecipeButtons.forEach(function (button) {
            button.classList.remove('opened');
        });

        clickedButton.classList.add('opened');

        console.log(`Currently active recipe: ${recipeName}, Tab Index: ${mainTabIndex}, Date: ${selectedDate}`);

        updateColorSetField(clientSelect.value, activeRecipe.dateTimePicker, activeRecipe.tabIndex);

        allAddProductButtons.forEach(function (btn) {
            btn.style.display = 'none';
        });

        if (activeButton) {
            activeButton.style.display = 'block';
        }

        printProductsByRecipe(recipeName, mainTabIndex);
        updateTrackerDisplay(uniqueFormId)
    }

    function formatDate(date) {
        var monthNames = ["Jan", "Feb", "March", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var selectedYear = date.getFullYear();
        var selectedMonth = monthNames[date.getMonth()];
        var selectedDay = date.getDate().toString().padStart(2, '0');
        var selectedDayName = dayOfWeek[date.getDay()];

        return `${selectedDayName}, ${selectedDay} ${selectedMonth} ${selectedYear}`;
    }

    function formatDateTime(date) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayOfWeek = dayNames[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}`;
    }


    // PRODUCTS HERE
    var productsByRecipe = {};

    function initializeFlatpickr(inputElement, minDate) {
        if (inputElement) {
            flatpickr(inputElement, {
                enableTime: false,
                dateFormat: "l, d M Y",
                defaultDate: null,
                minDate: minDate
            });
        }
    }

    function calculateTotalSalesOrderForRecipe(recipeName, tabIndex) {
        let totalSalesOrder = 0;

        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            productsByRecipe[tabIndex][recipeName].forEach(product => {
                if (product.salesOrder) {
                    totalSalesOrder += parseFloat(product.salesOrder);
                }
            });
        }

        return totalSalesOrder;
    }

    function calculateTotalTraysForRecipe(recipeName, tabIndex) {
        let totalTrays = 0;
        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            productsByRecipe[tabIndex][recipeName].forEach(product => {
                if (product.tray) {
                    totalTrays += parseInt(product.tray, 10);
                }
            });
        }
        return totalTrays;
    }

    function calculateTotalTrolleysForRecipe(recipeName, tabIndex) {
        let totalTrolleys = 0;
        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            productsByRecipe[tabIndex][recipeName].forEach(product => {
                if (product.trolley) {
                    totalTrolleys += parseInt(product.trolley, 10);
                }
            });
        }
        return totalTrolleys;
    }

    function getProductFormData() {
        return {
            productName: document.getElementById('productName').value,
            client: document.getElementById('client').value,
            colorSet: document.getElementById('colorSet').value,
            expiryDate: document.getElementById('expiryDate').value ? document.getElementById('saleDate').value : null,
            saleDate: document.getElementById('saleDate').value ? document.getElementById('saleDate').value : null,
            salesOrder: document.getElementById('salesOrder').value,
            currency: document.getElementById('currency').value,
            noOfSlices: parseInt(document.getElementById('noOfSlices').value, 10),
            productPrice: parseFloat(document.getElementById('productPrice').value),
            thickness: document.getElementById('thickness').value,
            remarks: document.getElementById('remarks').value,
            weight: document.getElementById('weight').value,
            tray: document.getElementById('tray').value,
            trolley: document.getElementById('trolley').value
        };
    }

    if (productForm) {
        var productIndexToEdit = -1;
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();

            let currentForm = document.querySelector('.recipe-form');
            var formData = getProductFormData();
            calculateTrayAndTrolley()

            if (activeRecipe.name) {
                if (!productsByRecipe[activeRecipe.tabIndex]) {
                    productsByRecipe[activeRecipe.tabIndex] = {};
                }

                if (!productsByRecipe[activeRecipe.tabIndex][activeRecipe.name]) {
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name] = [];
                }

                var productData = {
                    name: formData.productName,
                    client: formData.client,
                    color: formData.colorSet,
                    expiryDate: formData.expiryDate,
                    saleDate: formData.saleDate,
                    salesOrder: formData.salesOrder,
                    productPrice: formData.productPrice,
                    currency: formData.currency,
                    noOfSlices: formData.noOfSlices,
                    trolley: formData.trolley,
                    tray: formData.tray,
                    thickness: formData.thickness,
                    weight: formData.weight,
                    remarks: formData.remarks
                };

                if (productIndexToEdit !== -1) {
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name][productIndexToEdit] = productData;
                    console.log(`Product updated: Recipe - ${activeRecipe.name}, Index - ${productIndexToEdit}`);
                    productIndexToEdit = -1;
                } else {
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name].push(productData);
                    console.log(`Product added: ${productData.name} to Recipe - ${activeRecipe.name}. Object:`, productsByRecipe);
                }

                printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);
                updateTotalValues(activeRecipe.name, activeRecipe.tabIndex);
                handleBatchCalculations(activeRecipe.name, activeRecipe.tabIndex);
                if (currentForm) {
                    collectFormData(currentForm);
                }

                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'none';
                }

                productForm.reset();
            } else {
                console.error('Please select a recipe before adding products.');
            }
        });
    }

    function setFormFieldValue(fieldId, value) {
        var field = document.getElementById(fieldId);
        if (field) {
            field.value = value || ''; // Sets the field value or empty string if null/undefined
        }
    }

    function toggleModalVisibility(modalId, isVisible) {
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = isVisible ? 'block' : 'none';
        }
    }

    function populateEditFormFields(product) {
        setFormFieldValue('productName', product.name);
        setFormFieldValue('client', product.client);
        setFormFieldValue('colorSet', product.color);
        setFormFieldValue('expiryDate', product.expiryDate);
        setFormFieldValue('saleDate', product.saleDate);
        setFormFieldValue('salesOrder', product.salesOrder);
        setFormFieldValue('productPrice', product.productPrice);
        setFormFieldValue('currency', product.currency);
        setFormFieldValue('noOfSlices', product.noOfSlices);
        setFormFieldValue('thickness', product.thickness);
        setFormFieldValue('remarks', product.remarks);
        setFormFieldValue('tray', product.tray);
        setFormFieldValue('trolley', product.trolley);
        setFormFieldValue('weight', product.weight);
    }

    function openEditModal(tabIndex, recipeName, index) {
        var productData = productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName] ? productsByRecipe[tabIndex][recipeName][index] : null;

        if (productData) {
            populateEditFormFields(productData);
            productIndexToEdit = index; // Store the index of the product being edited
            toggleModalVisibility('productModal', true);
        } else {
            console.error('Product data not found for editing.');
        }
    }

    function createProductContainer(smallCardSelector) {
        let productContainer = document.querySelector('.product-container');
        if (!productContainer) {
            productContainer = document.createElement('div');
            productContainer.classList.add('product-container');
            let smallCard = document.querySelector(smallCardSelector);
            if (smallCard) {
                smallCard.appendChild(productContainer);
            }
        }
        return productContainer;
    }

    function createProductItem(product, tabIndex, recipeName, index) {
        let productItem = document.createElement('div');
        productItem.classList.add('product-item');

        let productInfoContainer = createProductInfoContainer(product);
        productItem.appendChild(productInfoContainer);

        let iconContainer = createIconContainer(tabIndex, recipeName, index);
        productItem.appendChild(iconContainer);

        return productItem;
    }

    function createProductInfoContainer(product) {
        let productInfoContainer = document.createElement('div');
        productInfoContainer.classList.add('product-info-container');

        let productInfo = document.createElement('p');
        productInfo.textContent = product.name;
        productInfoContainer.appendChild(productInfo);

        let clientInfo = document.createElement('p');
        clientInfo.textContent = product.client;
        clientInfo.style.color = "gray";
        clientInfo.style.fontSize = "14px";
        productInfoContainer.appendChild(clientInfo);

        return productInfoContainer;
    }

    function createIconContainer(tabIndex, recipeName, index) {
        let iconContainer = document.createElement('div');
        iconContainer.classList.add('icon-container');

        let editIcon = document.createElement('i');
        editIcon.classList.add('fa', 'fa-edit', 'product-icon');
        editIcon.setAttribute('aria-hidden', 'true');
        editIcon.addEventListener('click', function () {
            openEditModal(tabIndex, recipeName, index);
        });
        iconContainer.appendChild(editIcon);

        let deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fa', 'fa-trash', 'product-icon');
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteIcon.addEventListener('click', function () {
            deleteProduct(tabIndex, recipeName, index);
        });
        iconContainer.appendChild(deleteIcon);

        return iconContainer;
    }

    function printProductsByRecipe() {
        let productContainer = createProductContainer('.small-card');
        productContainer.innerHTML = '';

        if (activeRecipe.name) {
            let recipeName = activeRecipe.name;
            let tabIndex = activeRecipe.tabIndex;

            if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
                productsByRecipe[tabIndex][recipeName].forEach(function (product, index) {
                    let productItem = createProductItem(product, tabIndex, recipeName, index);
                    productContainer.appendChild(productItem);
                });
            }
        }
    }

    function handleBatchCalculations(recipeName, tabIndex) {
        let currentRecipeFormId = `recipeForm-${recipeName}-${tabIndex}`;
        let currentRecipeForm = document.getElementById(currentRecipeFormId);
        if (currentRecipeForm) {
            let salesOrderInputForBatchCalc = currentRecipeForm.querySelector('[name="salesOrder"]');
            let wasteInputForBatchCalc = currentRecipeForm.querySelector('[name="waste"]');
            let batchSizeInputForBatchCalc = currentRecipeForm.querySelector('[name="batchSize"]');
            let batchesInputForBatchCalc = currentRecipeForm.querySelector('[name="batches"]');
            let timeVariable = currentRecipeForm.querySelector('[name="timeVariable"]');

            calculateBatchesToProduce(salesOrderInputForBatchCalc, wasteInputForBatchCalc, batchSizeInputForBatchCalc, batchesInputForBatchCalc, timeVariable);
        }
    }

    function updateTotalValues(recipeName, tabIndex) {
        let totalSalesOrderValue = calculateTotalSalesOrderForRecipe(recipeName, tabIndex);
        let totalTrays = calculateTotalTraysForRecipe(recipeName, tabIndex);
        let totalTrolleys = calculateTotalTrolleysForRecipe(recipeName, tabIndex);

        updateFieldValue(`salesOrder-recipeForm-${recipeName}-${tabIndex}`, totalSalesOrderValue);
        updateFieldValue(`totalTray-recipeForm-${recipeName}-${tabIndex}`, totalTrays);
        updateFieldValue(`totalTrolley-recipeForm-${recipeName}-${tabIndex}`, totalTrolleys);
    }

    function updateFieldValue(fieldId, value) {
        let field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    function calculateTrayAndTrolley() {
        var weightValue = parseInt(document.getElementById('weight').value, 10);
        var salesOrderValue = parseFloat(document.getElementById('salesOrder').value);
        var clientValue = document.getElementById('client').value;
        var divisor;

        if (clientValue === 'GFS') {
            divisor = 12;
        } else if (clientValue === 'GBKL') {
            divisor = 15;
        } else {
            divisor = 12;
        }

        if (!isNaN(weightValue) && !isNaN(salesOrderValue) && weightValue > 0) {
            var trays = salesOrderValue / weightValue;
            document.getElementById('tray').value = Math.ceil(trays);

            var trolleys = trays / divisor;
            document.getElementById('trolley').value = Math.ceil(trolleys);
        } else {
            console.error('Invalid weight or sales order value');
            document.getElementById('tray').value = '';
            document.getElementById('trolley').value = '';
        }
    }

    // Event listener for closing the product modal
    var closeProductModalButton = document.getElementById('closeProductModal');
    if (closeProductModalButton) {
        closeProductModalButton.addEventListener('click', function () {
            var productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.style.display = 'none';
            }
            productForm.reset(); // Reset the form fields
        });
    }

    function deleteProduct(tabIndex, recipeName, index) {
        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            productsByRecipe[tabIndex][recipeName].splice(index, 1);  // Remove the product from the array
            printProductsByRecipe(recipeName, tabIndex);
            console.log(`Product deleted: Recipe - ${recipeName}, Tab Index - ${tabIndex}, Index - ${index}`);
        }
    }


    function checkAndToggleProductModalButton() {
        var activeTab = document.querySelector('.tabcontent[style*="display: block"]');
        if (activeTab) {
            var recipeButtons = activeTab.querySelectorAll('.tablinks-recipes');
            var addProductButton = activeTab.querySelector('.add-product-button');
            if (recipeButtons.length > 0) {
                if (addProductButton) {
                    addProductButton.style.display = 'block';
                }
            }
        }
    }

    function checkAndToggleTrackerVisibility() {
        var activeTab = document.querySelector('.tabcontent[style*="display: block"]');
        var tracker = document.getElementById('progressContainer');

        if (activeTab) {
            var recipeButtons = activeTab.querySelectorAll('.tablinks-recipes');
            if (recipeButtons.length === 0) {
                // If there are no recipe buttons, hide the tracker and reset the values
                if (tracker) {
                    var timeValues = tracker.querySelectorAll('.timeValue');
                    timeValues.forEach(function (timeValue) {
                        timeValue.textContent = '--:--'; // Reset to placeholder value
                    });
                }
            } else {
                // If there are recipe buttons, make sure the tracker is visible
                if (tracker) {
                    tracker.style.display = 'block';
                }
            }
        }
    }

    // Initially check and set visibility of the button
    checkAndToggleProductModalButton();
    checkAndToggleTrackerVisibility();

    // Product Event Listeners
    document.getElementById('weight').addEventListener('change', calculateTrayAndTrolley);
    document.getElementById('salesOrder').addEventListener('input', calculateTrayAndTrolley);
    document.getElementById('client').addEventListener('change', calculateTrayAndTrolley);

    //Formatting
    document.getElementById("productPrice").addEventListener("input", function () {
        let val = this.value.replace(/[^0-9]/g, '');

        // Ensure there are exactly 4 digits
        while (val.length < 4) {
            val = '0' + val;
        }

        // Reconstruct the value so that the entered digits replace the zeros from right to left
        let formattedValue = (parseInt(val.substring(0, 2)) + '.' + parseInt(val.substring(2, 4))).toString();

        this.value = formattedValue;
    });

    // Add event listener for Recipe Name input
    document.querySelectorAll("[id^=recipeName-]").forEach(function (input) {
        // Convert to uppercase and restrict non-alphanumeric on input event
        input.addEventListener("input", function (e) {
            this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
        });
    });

    // Add event listener for Product Name input
    document.getElementById("productName").addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    });

    const steps = [
        'spongeStartProgress',
        'spongeEndProgress',
        'doughStartProgress',
        'doughEndProgress',
        'firstLoafPackedProgress',
        'cutOffProgress'
    ];

    function setProgress(percentage) {
        // Ensure the percentage is within bounds
        const clampedPercentage = Math.max(0, Math.min(100, percentage));

        // Update the overlay to cover the inactive part of the progress line
        const progressLineOverlay = document.getElementById('progressLineOverlay');
        progressLineOverlay.style.top = `${clampedPercentage}%`;
        progressLineOverlay.style.height = `${100 - clampedPercentage}%`;

        // Activate steps and labels up to the percentage
        steps.forEach(step => {
            const element = document.getElementById(step);
            const label = element.querySelector('.progressLabel'); // Get the label within the step
            const stepPosition = element.offsetTop / progressLineOverlay.parentElement.offsetHeight * 100;

            if (stepPosition < clampedPercentage) {
                element.classList.add('active');
                if (label) {
                    label.classList.add('active');
                    label.style.color = '#3498db'; // Blue color for active steps
                }
            } else {
                element.classList.remove('active');
                if (label) {
                    label.classList.remove('active');
                    label.style.color = '#ccc'; // Gray color for inactive steps
                }
            }
        });
    }

    // Example usage:
    setProgress(70); // Set progress to 10%   
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
});