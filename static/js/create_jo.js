var calendarInstance; // Define the calendarInstance outside the function
var selectedDate;
var activeDay = null;
const spongeMixing = 6 * 60;
const fermentation = 3 * 3600;
const doughMixing = 6 * 60; // 6 minutes
const floorTime = 6 * 60; // 6 minutes
const makeUpTime = 15 * 60; // 15 minutes
const finalProof = 1 * 3600 + 5 * 60; // 1 hour and 5 minutes
const baking = 22 * 60; // 22 minutes
const cooling = 1 * 3600 + 15 * 60; // 1 hour and 15 minutes
const packing = 5 * 60; // 5 minutes

document.addEventListener('DOMContentLoaded', function () {

    checkFormsAndToggleSaveButton()

    let activeRecipe = {
        name: null,
        tabIndex: null,
        dateTimePicker: null
    };
    localStorage.setItem('activeRecipe', JSON.stringify(activeRecipe));

    // Function to format the date to yyyy-mm-dd format
    function formatDateToYYYYMMDD(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function refreshRecipeForms() {
        var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(function (button, index) {
            var recipeName = button.innerText.replace('Delete', '').trim();

            displayRecipeDetails(recipeName, index);
        });
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
                                                    updateColorSetField(clientSelect.value, selectedDate); // Move this line here
                                                    refreshRecipeForms();
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
                        refreshRecipeForms();
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

    var changeDateButton = document.getElementById('change-date');
    if (changeDateButton) {
        changeDateButton.addEventListener('click', function () {
            openCalendarInstance();
        });
    }
    // Get the container for recipe tabs
    var recipeTabsContainer = document.querySelectorAll(".tabcontent");
    var recipeFormObjects = {}; // Store recipe form objects
    var savedDateTimeValues = {}; // Stores

    // Function to reset data
    function resetData() {
        recipeFormObjects = {};
        savedDateTimeValues = {};
    }

    // Call the function to reset data on page load
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

        if (button) {
            button.remove();
        } else {
            console.error('The button is not defined or is null.');
        }

        const recipeFormID = `recipeForm-${recipeName}-${index}`;
        const associatedRecipeForm = document.getElementById(recipeFormID);
        if (associatedRecipeForm) {
            associatedRecipeForm.remove();
            console.log(document.getElementById(recipeFormID));
            console.log(`Recipe form "${recipeName}" with ID "${recipeFormID}" deleted.`);
        }

        const addProductButtonId = `add-product-for-${recipeName}-${index}`;
        const addProductButton = document.getElementById(addProductButtonId);
        if (addProductButton) {
            addProductButton.remove(); // Remove the 'Add Product' button for the deleted recipe
            console.log(`Add Product button with ID "${addProductButtonId}" deleted.`);
        } else {
            console.error('The Add Product button is not defined or is null.');
        }

        // Delete associated data.
        if (recipeFormObjects[recipeName]) {
            delete recipeFormObjects[recipeName][index];
            if (Object.keys(recipeFormObjects[recipeName]).length === 0) {
                delete recipeFormObjects[recipeName];
            }
        }

        console.log(`Recipe "${recipeName}" deleted.`);
        alertModal.style.display = 'none'; // Close the modal

        checkFormsAndToggleSaveButton()

        updateAddProductButtonDisplay();

        // Delete associated products of the recipe
        if (productsByRecipe[deleteParams.index] && productsByRecipe[deleteParams.index][deleteParams.recipeName]) {
            delete productsByRecipe[deleteParams.index][deleteParams.recipeName];
            console.log(`Deleted products associated with recipe: ${deleteParams.recipeName}`);

            // Refresh or update the UI after deletion
            printProductsByRecipe(deleteParams.recipeName, deleteParams.index);
        }

        if (activeDay) {
            activateFirstRecipeInMainTab(activeDay);
        } else {
            console.error("Current day is not set");
        }
    }

    function updateAddProductButtonDisplay() {
        var activeTab = document.querySelector('.tabcontent[style*="display: block"]');
        if (activeTab) {
            var recipeButtons = activeTab.querySelectorAll('.tablinks-recipes');
            var addProductButtonId = `add-product-for-${activeRecipe.name}-${activeRecipe.tabIndex}`;
            var addProductButton = document.getElementById(addProductButtonId);

            // Check the number of recipe buttons
            if (recipeButtons.length === 0 && addProductButton) {
                addProductButton.style.display = 'none';
            } else if (addProductButton) {
                addProductButton.style.display = 'block';
            }
        }
    }


    function cancelDeletion() {
        const alertModal = document.getElementById('alertModal');
        alertModal.style.display = 'none'; // Just close the modal
    }

    // Attach event listeners
    document.getElementById('confirmDelete').addEventListener('click', confirmDeletion);
    document.getElementById('cancelDelete').addEventListener('click', cancelDeletion);
    document.getElementById('closeAlertModal').addEventListener('click', cancelDeletion);

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
        // Create a new Date object for the current date/time
        let minDate = new Date();

        // Subtract tabIdx - 1 days from the date
        minDate.setDate(minDate.getDate() - (tabIdx + 1));

        // Reset the time to midnight for the start of the day
        minDate.setHours(0, 0, 0, 0);

        return minDate;
    }


    function createRecipeForm(recipeName, tabIdx, timeVariable) {

        console.log(`Recipe Cycle Time ${timeVariable}`)

        if (!recipeFormObjects[recipeName]) {
            recipeFormObjects[recipeName] = {};
        }
        if (!recipeFormObjects[recipeName][tabIdx]) {
            recipeFormObjects[recipeName][tabIdx] = 1;
        }

        var formId = `recipeForm-${recipeName}-${tabIdx}`;
        var uniqueFormId = `${formId}`;

        var existingForm = document.getElementById(uniqueFormId);
        if (existingForm) {
            console.log(`Found existing form with id: ${existingForm.id}`);
            return existingForm;
        }

        var form = document.createElement("form");
        form.id = uniqueFormId;
        form.classList.add("recipe-form");

        var leftDiv = document.createElement("div");
        leftDiv.classList.add("left-div");
        var rightDiv = document.createElement("div");
        rightDiv.classList.add("right-div");

        var nameLabel = document.createElement("label");
        nameLabel.htmlFor = `recipeName-${uniqueFormId}`;
        nameLabel.textContent = "Recipe Name";

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = `recipeName-${uniqueFormId}`;
        nameInput.name = "recipeName";
        nameInput.value = recipeName;
        nameInput.required = true;
        nameInput.disabled = true;

        var br = document.createElement("br");

        var datetimeLabel = document.createElement("label");
        datetimeLabel.htmlFor = `dateTimePicker-${uniqueFormId}`;
        datetimeLabel.textContent = "Production Date";

        // Add a date-time picker
        var dateTimePicker = document.createElement("input");
        dateTimePicker.type = "text";
        dateTimePicker.id = `dateTimePicker-${uniqueFormId}`;
        dateTimePicker.name = "dateTimePicker";
        dateTimePicker.disabled = true;

        var defaultDateTime = addDaysToDate(tabIdx);

        // Initialize Flatpickr for the text input
        flatpickr(dateTimePicker, {
            enableTime: false,
            dateFormat: "d/m/Y",
            defaultDate: savedDateTimeValues[uniqueFormId] || defaultDateTime,
            onChange: function (selectedDates) {
                var selectedDate = selectedDates[0];
                var formattedDate = formatDate(selectedDate);
                dateTimePicker.value = formattedDate;
                savedDateTimeValues[uniqueFormId] = selectedDate;
                activeRecipe.dateTimePicker = selectedDate; // Updating the activeRecipe object with the new dateTimePicker value
                updateColorSetField(clientSelect.value, dateTimePicker.selectedDates[0], tabIdx);
            }
        });

        dateTimePicker.value = defaultDateTime;
        activeRecipe.dateTimePicker = dateTimePicker.value;

        leftDiv.appendChild(nameLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(nameInput);
        leftDiv.appendChild(br.cloneNode());

        rightDiv.appendChild(datetimeLabel);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(dateTimePicker);
        rightDiv.appendChild(br.cloneNode());

        // Production Rate
        var productionRateLabel = document.createElement("label");
        productionRateLabel.htmlFor = `productionRate-${uniqueFormId}`;
        productionRateLabel.textContent = "Production Rate";

        var productionRateInput = document.createElement("input");
        productionRateInput.type = "number";
        productionRateInput.id = `productionRate-${uniqueFormId}`;
        productionRateInput.name = "productionRate";

        // Total Sales Order
        var salesOrderLabel = document.createElement("label");
        salesOrderLabel.htmlFor = `salesOrder-${uniqueFormId}`;
        salesOrderLabel.textContent = "Total Sales Order";

        var salesOrderInput = document.createElement("input");
        salesOrderInput.type = "number";
        salesOrderInput.id = `salesOrder-${uniqueFormId}`;
        salesOrderInput.name = "salesOrder";
        salesOrderInput.disabled = true;

        // Budgeted Waste
        var wasteLabel = document.createElement("label");
        wasteLabel.htmlFor = `waste-${uniqueFormId}`;
        wasteLabel.textContent = "Budgeted Waste (%)";

        var wasteInput = document.createElement("input");
        wasteInput.type = "number";
        wasteInput.id = `waste-${uniqueFormId}`;
        wasteInput.name = "waste";
        wasteInput.value = 2;

        // Required Std. Time
        var stdTimeLabel = document.createElement("label");
        stdTimeLabel.htmlFor = `stdTime-${uniqueFormId}`;
        stdTimeLabel.textContent = "Required Std. Time";

        var stdTimeInput = document.createElement("input");
        stdTimeInput.type = "text"; // Use a plugin or parsing logic to handle this input format.
        stdTimeInput.id = `stdTime-${uniqueFormId}`;
        stdTimeInput.name = "stdTime";
        stdTimeInput.pattern = "[0-9]{2}:[0-9]{2}:[0-9]{2}"; // Added this line for the pattern
        stdTimeInput.placeholder = "00:00:00"; // Default value
        stdTimeInput.disabled = true;

        // total Tray
        var totalTrayLabel = document.createElement("label");
        totalTrayLabel.htmlFor = `totalTray-${uniqueFormId}`;
        totalTrayLabel.textContent = "Total Tray";

        var totalTrayInput = document.createElement("input");
        totalTrayInput.type = "number";
        totalTrayInput.id = `totalTray-${uniqueFormId}`;
        totalTrayInput.name = "totalTray";
        totalTrayInput.disabled = true;

        // suction cup belt
        var beltNoLabel = document.createElement("label");
        beltNoLabel.htmlFor = `beltNo-${uniqueFormId}`;
        beltNoLabel.textContent = "Suction Cup Belt No.";

        var beltNoInput = document.createElement("input");
        beltNoInput.type = "number";
        beltNoInput.id = `beltNo-${uniqueFormId}`;
        beltNoInput.name = "beltNo";

        leftDiv.appendChild(productionRateLabel);
        leftDiv.appendChild(productionRateInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(salesOrderLabel);
        leftDiv.appendChild(salesOrderInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(stdTimeLabel);
        leftDiv.appendChild(stdTimeInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(wasteLabel);
        leftDiv.appendChild(wasteInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(totalTrayLabel);
        leftDiv.appendChild(totalTrayInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(beltNoLabel);
        leftDiv.appendChild(beltNoInput);

        // Std. Batch Size
        var batchSizeLabel = document.createElement("label");
        batchSizeLabel.htmlFor = `batchSize-${uniqueFormId}`;
        batchSizeLabel.textContent = "Std. Batch Size";

        var batchSizeInput = document.createElement("input");
        batchSizeInput.type = "number";
        batchSizeInput.id = `batchSize-${uniqueFormId}`;
        batchSizeInput.name = "batchSize";

        // Batches To Produce
        var batchesLabel = document.createElement("label");
        batchesLabel.htmlFor = `batches-${uniqueFormId}`;
        batchesLabel.textContent = "Batches To Produce";

        var batchesInput = document.createElement("input");
        batchesInput.type = "number";
        batchesInput.id = `batches-${uniqueFormId}`;
        batchesInput.name = "batches";
        batchesInput.disabled = true;

        // Std. Cycle Time
        var cycleTimeLabel = document.createElement("label");
        cycleTimeLabel.htmlFor = `cycleTime-${uniqueFormId}`;
        cycleTimeLabel.textContent = "Std. Cycle Time";

        var cycleTimeInput = document.createElement("input");
        cycleTimeInput.type = "text"; // Again, consider a plugin or custom parsing.
        cycleTimeInput.id = `cycleTime-${uniqueFormId}`;
        cycleTimeInput.name = "cycleTime";
        cycleTimeInput.pattern = "[0-9]{2}:[0-9]{2}:[0-9]{2}"; // Added this line for the pattern
        cycleTimeInput.placeholder = "00:00:00";  // Default value
        cycleTimeInput.disabled = true;

        var yesterdayDefaultDateTime = subtractDaysFromDateTime(tabIdx);

        // Sponge Start Time
        var spongeStartTimeLabel = document.createElement("label");
        spongeStartTimeLabel.htmlFor = `spongeStartTime-${uniqueFormId}`;
        spongeStartTimeLabel.textContent = "Sponge Start Time";

        var spongeStartTimePicker = document.createElement("input");
        spongeStartTimePicker.type = "text";
        spongeStartTimePicker.id = `spongeStartTime-${uniqueFormId}`;
        spongeStartTimePicker.name = "spongeStartTime";

        flatpickr(spongeStartTimePicker, {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            defaultDate: yesterdayDefaultDateTime,
            minDate: yesterdayMinDate(tabIdx),
            onValueUpdate: function (selectedDates) {
                if (selectedDates.length > 0) {
                    // Format the selected date/time using your custom formatDateTime function
                    let formattedDate = formatDateTime(selectedDates[0]);

                    // Set the input field to the formatted date immediately, before the user sees it
                    spongeStartTimePicker.value = formattedDate;
                }
            },
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    let formattedDate = formatDateTime(selectedDates[0]);

                    // Assuming stdTimeInput holds a value in seconds
                    let stdTimeElement = document.getElementById(`stdTime-${uniqueFormId}`);
                    let spongeEndTimeElement = document.getElementById(`spongeEndTime-${uniqueFormId}`);

                    // Call calculateSpongeEndTime with the formatted start time
                    calculateSpongeEndTime(formattedDate, stdTimeElement.value, spongeEndTimeElement);
                }
            }
        });

        spongeStartTimePicker.value = yesterdayDefaultDateTime;

        //Sponge End Time
        var spongeEndTime = document.createElement("input");
        spongeEndTime.type = "hidden";
        spongeEndTime.id = `spongeEndTime-${uniqueFormId}`;
        spongeEndTime.name = "spongeEndTime";
        form.appendChild(spongeEndTime);

        // total trolley
        var totalTrolleyLabel = document.createElement("label");
        totalTrolleyLabel.htmlFor = `totalTrolley-${uniqueFormId}`;
        totalTrolleyLabel.textContent = "Total Trolley";

        var totalTrolleyInput = document.createElement("input");
        totalTrolleyInput.type = "number";
        totalTrolleyInput.id = `totalTrolley-${uniqueFormId}`;
        totalTrolleyInput.name = "totalTrolley";
        totalTrolleyInput.disabled = true;

        // Std. Cycle Time
        var gapLabel = document.createElement("label");
        gapLabel.htmlFor = `gap-${uniqueFormId}`;
        gapLabel.textContent = "Gap";

        var gapInput = document.createElement("input");
        gapInput.type = "text"; // Again, consider a plugin or custom parsing.
        gapInput.id = `gap-${uniqueFormId}`;
        gapInput.name = "gap";
        gapInput.pattern = "[0-9]{2}:[0-9]{2}:[0-9]{2}"; // Added this line for the pattern
        gapInput.placeholder = "00:00:00";  // Default value

        rightDiv.appendChild(batchSizeLabel);
        rightDiv.appendChild(batchSizeInput);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(batchesLabel);
        rightDiv.appendChild(batchesInput);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(cycleTimeLabel);
        rightDiv.appendChild(cycleTimeInput);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(spongeStartTimeLabel);
        rightDiv.appendChild(spongeStartTimePicker);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(totalTrolleyLabel);
        rightDiv.appendChild(totalTrolleyInput);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(gapLabel);
        rightDiv.appendChild(gapInput);

        // Create a hidden input field for the timeVariable
        var timeVariableInput = document.createElement("input");
        timeVariableInput.type = "hidden";
        timeVariableInput.id = `timeVariable-${uniqueFormId}`;
        timeVariableInput.name = "timeVariable";
        timeVariableInput.value = timeVariable;
        form.appendChild(timeVariableInput);

        console.log(`Time Variable: ${timeVariableInput.value}`);

        form.appendChild(leftDiv);
        form.appendChild(rightDiv);
        // Append the new form to the existing recipes list
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.form-container');
        currentRecipeDetailsContainer.appendChild(form);

        var addProductButton = document.createElement("button");
        addProductButton.type = "button";
        addProductButton.textContent = `+ Add Product for ${recipeName}`;
        addProductButton.classList.add("add-product-button");
        addProductButton.id = `add-product-for-${recipeName}-${tabIdx}`;

        var productContainer = document.querySelector('.product-container');
        productContainer.insertAdjacentElement('afterend', addProductButton);

        // Add input event listeners to the necessary fields
        salesOrderInput.addEventListener('change', () => calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable));

        wasteInput.addEventListener('input', () => calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable));

        batchSizeInput.addEventListener('input', () => {
            calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput, timeVariable);
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
        });

        productionRateInput.addEventListener('input', () => {
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
        });

        batchesInput.addEventListener('input', () => {
            calculateCycleTime(batchSizeInput, productionRateInput, timeVariableInput, cycleTimeInput);
            calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput);
        });

        stdTimeInput.addEventListener('input', () => {
            calculateSpongeEndTime(spongeStartTimePicker.value, stdTimeInput.value, spongeEndTime)
        });

        console.log(`Created new form with id: ${form.id}`);

        let formCreated = false;

        if (!formCreated) {
            formCreated = true;
            showSaveButton();
        }

        return form;
    }

    function calculateSpongeEndTime(startTime, stdTimeInput, spongeEndTimeElement) {

        console.log(`StdTimeInput: ${stdTimeInput}`)

        let durationSeconds = convertToSeconds(stdTimeInput) + spongeMixing;
        console.log(`Calculate Sponge End Time - Duration Seconds: ${durationSeconds}`)

        let startTimeWithoutDay = startTime.substring(startTime.indexOf(',') + 2);
        console.log(`Calculate Sponge End Time - StartTimeWODay: ${startTimeWithoutDay}`)

        let startDate = new Date(startTimeWithoutDay);
        console.log(`Calculate Sponge End Time - Start Date: ${startDate}`)

        if (isNaN(startDate)) {
            console.error('Invalid start time. Please check the input.');
            return;
        }

        startDate.setSeconds(startDate.getSeconds() + durationSeconds);

        let finalEndTime = formatDateTime(startDate);
        spongeEndTimeElement.value = finalEndTime;
        console.log(`Sponge End Time: ${finalEndTime}`);
    }


    function showSaveButton() {
        var saveButton = document.querySelector('.save-all-button');
        if (saveButton) {
            saveButton.style.display = 'block';
        }
    }

    function checkFormsAndToggleSaveButton() {
        var forms = document.querySelectorAll('.recipe-form');
        if (forms.length === 0) {
            hideSaveButton();
            formCreated = false;
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

    function updateColorSetField(client, selectedDate, tabIdx) {
        console.log('Updating color set with:');
        console.log('Client:', client);
        console.log('Selected Date:', selectedDate);
        console.log('Tab Index:', tabIdx);

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
        event.stopPropagation();

        // Hide all "Add Product" buttons:
        var allAddProductButtons = document.querySelectorAll('.add-product-button');
        allAddProductButtons.forEach(function (btn) {
            btn.style.display = 'none';
        });

        // Close all tab contents
        var allTabContents = document.querySelectorAll('.tabcontent');
        allTabContents.forEach(function (content) {
            content.style.display = "none";
        });

        // Deactivate all main tablinks
        var allTabLinks = document.querySelectorAll('.tablinks');
        allTabLinks.forEach(function (link) {
            link.classList.remove("active");
        });

        // Display the tab content for the clicked main tab
        document.getElementById(day).style.display = "block";
        event.currentTarget.classList.add("active");

        activeDay = day;

        // Hide all products:
        var allProducts = document.querySelectorAll('.product-item');
        allProducts.forEach(function (product) {
            product.style.display = 'none';
        });

        // Check if the current tab index has any tablinks-recipes
        var currentTabContent = document.getElementById(day);
        var recipeButtonsInCurrentTab = currentTabContent.querySelectorAll('.tablinks-recipes');
        if (recipeButtonsInCurrentTab.length > 0) {
            printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);
        }

        // Display the button for the active tab
        checkAndToggleProductModalButton();

        // Now, automatically activate the first recipe within the opened main tab
        activateFirstRecipeInMainTab(day);
    }

    function activateFirstRecipeInMainTab(day) {
        var tabContent = document.getElementById(day);
        if (tabContent) {
            var firstRecipeButton = tabContent.querySelector('.tablinks-recipes');
            if (firstRecipeButton) {
                setActiveTab(firstRecipeButton);
            }
        }
    }

    function initializeFlatpickr(inputElement, defaultDate, minDate) {
        if (inputElement) {
            flatpickr(inputElement, {
                enableTime: false,
                dateFormat: "l, d M Y",
                defaultDate: defaultDate,
                minDate: minDate
            });
        }
    }


    function setActiveTab(clickedButton) {
        // Get the parent tab container
        var tabContainer = clickedButton.closest('.tabcontent');

        // Get all main tab containers in the document
        var allMainTabs = document.querySelectorAll('.tabcontent');

        // Get the index of the current tab container among all main tab containers
        var mainTabIndex = Array.from(allMainTabs).indexOf(tabContainer);

        // Get all tab buttons within the same tab container
        var allRecipeButtons = tabContainer.querySelectorAll('.tablinks-recipes');

        // Remove 'opened' class from all buttons within the same tab container
        allRecipeButtons.forEach(function (button) {
            button.classList.remove('opened');
        });

        // Add 'opened' class to the clicked button
        clickedButton.classList.add('opened');

        var recipeName = clickedButton.innerText.replace('Delete', '').trim();

        activeRecipe.name = recipeName;
        activeRecipe.tabIndex = mainTabIndex;  // Use the mainTabIndex instead of recipeButtonIndex

        var selectedDate = addDaysToDate(mainTabIndex);

        activeRecipe.dateTimePicker = selectedDate;

        console.log(`Currently active recipe: ${recipeName}, Tab Index: ${mainTabIndex}, Date: ${selectedDate}`);

        updateColorSetField(clientSelect.value, activeRecipe.dateTimePicker, activeRecipe.tabIndex);

        // Hide all "Add Product" buttons:
        var allAddProductButtons = document.querySelectorAll('.add-product-button');
        allAddProductButtons.forEach(function (btn) {
            btn.style.display = 'none';
        });

        // Display only the button related to the currently active recipe:
        var activeButtonId = `add-product-for-${recipeName}-${mainTabIndex}`;
        var activeButton = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.style.display = 'block';
        }

        printProductsByRecipe(recipeName, mainTabIndex);
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

    // Initialize product array for each tab
    var productsByRecipe = {};

    // Event listener for the product form submission
    if (productForm) {
        var productIndexToEdit = -1; // Initialize the product index to edit
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();

            var productName = document.getElementById('productName').value;
            var client = document.getElementById('client').value;
            var colorSet = document.getElementById('colorSet').value;
            var expiryDate = document.getElementById('expiryDate').value;
            var saleDate = document.getElementById('saleDate').value;
            saleDate = saleDate ? saleDate : null;
            var salesOrder = document.getElementById('salesOrder').value;
            var currency = document.getElementById('currency').value;
            var noOfSlices = parseInt(document.getElementById('noOfSlices').value, 10);
            var productPrice = parseFloat(document.getElementById('productPrice').value);
            var thickness = document.getElementById('thickness').value;
            var remarks = document.getElementById('remarks').value;
            var weight = document.getElementById('weight').value;
            var tray = document.getElementById('tray').value;
            var trolley = document.getElementById('trolley').value;

            calculateTrayAndTrolley()

            if (activeRecipe.name) {
                if (!productsByRecipe[activeRecipe.tabIndex]) {
                    productsByRecipe[activeRecipe.tabIndex] = {};
                }

                if (!productsByRecipe[activeRecipe.tabIndex][activeRecipe.name]) {
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name] = [];
                }

                if (productIndexToEdit !== -1) {
                    // Update the existing product with the edited information
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name][productIndexToEdit] = {
                        name: productName,
                        client: client,
                        color: colorSet,
                        expiryDate: expiryDate,
                        saleDate: saleDate,
                        salesOrder: salesOrder,
                        productPrice: productPrice,
                        currency: currency,
                        noOfSlices: noOfSlices,
                        trolley: trolley,
                        tray: tray,
                        thickness: thickness,
                        weight: weight,
                        remarks: remarks
                    };
                    console.log(`Product updated: Recipe - ${activeRecipe.name}, Index - ${productIndexToEdit}`);
                    productIndexToEdit = -1; // Reset the product index to edit
                } else {
                    // Add the new product to the array
                    var newProduct = {
                        name: productName,
                        client: client,
                        color: colorSet,
                        expiryDate: expiryDate,
                        saleDate: saleDate,
                        salesOrder: salesOrder,
                        productPrice: productPrice,
                        currency: currency,
                        noOfSlices: noOfSlices,
                        thickness: thickness,
                        trolley: trolley,
                        tray: tray,
                        weight: weight,
                        remarks: remarks
                    };
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name].push(newProduct);

                    // Log the created product object
                    console.log(newProduct);

                    console.log(`Product created: Recipe - ${activeRecipe.name} ${activeRecipe.tabIndex}`);
                }

                printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);

                // Update the total sales order in the recipe form
                let totalSalesOrderValue = calculateTotalSalesOrderForRecipe(activeRecipe.name, activeRecipe.tabIndex);

                let totalTrays = calculateTotalTraysForRecipe(activeRecipe.name, activeRecipe.tabIndex);

                let totalTrolleys = calculateTotalTrolleysForRecipe(activeRecipe.name, activeRecipe.tabIndex);

                // Get the total sales order input field using the dynamic ID
                let totalSalesOrderInputFieldId = `salesOrder-recipeForm-${activeRecipe.name}-${activeRecipe.tabIndex}`;
                let totalSalesOrderInputField = document.getElementById(totalSalesOrderInputFieldId);

                let totalTrayInputFieldId = `totalTray-recipeForm-${activeRecipe.name}-${activeRecipe.tabIndex}`;
                let totalTrayField = document.getElementById(totalTrayInputFieldId); // Assuming you have a field with this id

                let totalTrolleyInputFieldId = `totalTrolley-recipeForm-${activeRecipe.name}-${activeRecipe.tabIndex}`;
                let totalTrolleyField = document.getElementById(totalTrolleyInputFieldId); // Assuming you have a field with this id

                if (totalSalesOrderInputField) {
                    totalSalesOrderInputField.value = totalSalesOrderValue;
                }

                if (totalTrayField) {
                    totalTrayField.value = totalTrays; // JavaScript converts the number to a string automatically
                }

                if (totalTrolleyField) {
                    totalTrolleyField.value = totalTrolleys; // JavaScript converts the number to a string automatically
                }

                // Call the calculateBatchesToProduce function for the current recipe
                let currentRecipeFormId = `recipeForm-${activeRecipe.name}-${activeRecipe.tabIndex}`;
                let currentRecipeForm = document.getElementById(currentRecipeFormId);
                if (currentRecipeForm) {
                    let salesOrderInputForBatchCalc = currentRecipeForm.querySelector('[name="salesOrder"]');
                    let wasteInputForBatchCalc = currentRecipeForm.querySelector('[name="waste"]');
                    let batchSizeInputForBatchCalc = currentRecipeForm.querySelector('[name="batchSize"]');
                    let batchesInputForBatchCalc = currentRecipeForm.querySelector('[name="batches"]');
                    let timeVariable = currentRecipeForm.querySelector('[name="timeVariable"]');

                    calculateBatchesToProduce(salesOrderInputForBatchCalc, wasteInputForBatchCalc, batchSizeInputForBatchCalc, batchesInputForBatchCalc, timeVariable);
                }

                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'none'; // Close the modal
                }

                productForm.reset(); // Reset the form fields
            } else {
                console.error('Please select a recipe before adding products.');
            }
        });
    }

    // Event listener for when the weight selection changes
    document.getElementById('weight').addEventListener('change', calculateTrayAndTrolley);

    // Event listener for when the sales order changes
    document.getElementById('salesOrder').addEventListener('input', calculateTrayAndTrolley);

    // Event listener for when the client selection changes
    document.getElementById('client').addEventListener('change', calculateTrayAndTrolley);

    function calculateTrayAndTrolley() {
        var weightValue = parseInt(document.getElementById('weight').value, 10);
        var salesOrderValue = parseFloat(document.getElementById('salesOrder').value);
        var clientValue = document.getElementById('client').value;
        var divisor;

        // Check the client value to determine the divisor
        if (clientValue === 'GFS') {
            divisor = 12;
        } else if (clientValue === 'GBKL') {
            divisor = 15;
        } else {
            // Set a default divisor or handle error for unknown client
            divisor = 12; // Default value or you can set an error state
        }

        if (!isNaN(weightValue) && !isNaN(salesOrderValue) && weightValue > 0) {
            var trays = salesOrderValue / weightValue;
            document.getElementById('tray').value = Math.ceil(trays); // Rounds to two decimal places

            var trolleys = trays / divisor;
            document.getElementById('trolley').value = Math.ceil(trolleys); // Use Math.ceil to round up to the nearest whole trolley
        } else {
            console.error('Invalid weight or sales order value');
            // Optionally reset the tray and trolley values
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

    function printProductsByRecipe() {
        var productContainer = document.querySelector('.product-container');

        if (!productContainer) {
            productContainer = document.createElement('div');
            productContainer.classList.add('product-container');
            var smallCard = document.querySelector('.small-card');
            if (smallCard) {
                smallCard.appendChild(productContainer);
            }
        }

        productContainer.innerHTML = '';


        if (activeRecipe.name) {
            var recipeName = activeRecipe.name;
            var tabIndex = activeRecipe.tabIndex;

            if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
                productsByRecipe[tabIndex][recipeName].forEach(function (product, index) {
                    var productItem = document.createElement('div');  // Create the main product container here
                    productItem.classList.add('product-item');

                    var productInfoContainer = document.createElement('div');
                    productInfoContainer.classList.add('product-info-container');

                    var productInfo = document.createElement('p');
                    productInfo.textContent = `${product.name}`;
                    productInfoContainer.appendChild(productInfo);

                    // Create a paragraph element for the client
                    var clientInfo = document.createElement('p');
                    clientInfo.textContent = `${product.client}`;
                    clientInfo.style.color = "gray";
                    clientInfo.style.fontSize = "14px";
                    productInfoContainer.appendChild(clientInfo);

                    productItem.appendChild(productInfoContainer);  // Append to productItem

                    var iconContainer = document.createElement('div');
                    iconContainer.classList.add('icon-container');

                    var editIcon = document.createElement('i');
                    editIcon.classList.add('fa', 'fa-edit', 'product-icon');
                    editIcon.setAttribute('aria-hidden', 'true');
                    editIcon.addEventListener('click', function () {
                        openEditModal(tabIndex, recipeName, index);
                    });
                    iconContainer.appendChild(editIcon);

                    var deleteIcon = document.createElement('i');
                    deleteIcon.classList.add('fa', 'fa-trash', 'product-icon');
                    deleteIcon.setAttribute('aria-hidden', 'true');
                    deleteIcon.addEventListener('click', function () {
                        deleteProduct(tabIndex, recipeName, index);
                    });
                    iconContainer.appendChild(deleteIcon);

                    productItem.appendChild(iconContainer);  // Append to productItem

                    productContainer.appendChild(productItem);  // Finally, add to the main container
                });
            }
        }
    }

    function openEditModal(tabIndex, recipeName, index) {
        var productNameField = document.getElementById('productName');
        var clientField = document.getElementById('client');
        var colorSetField = document.getElementById('colorSet');
        var expiryDate = document.getElementById('expiryDate');
        var saleDate = document.getElementById('saleDate');
        saleDate = saleDate ? saleDate : null;
        var salesOrder = document.getElementById('salesOrder');
        var productPrice = document.getElementById('productPrice');
        var currency = document.getElementById('currency');
        var noOfSlices = document.getElementById('noOfSlices');
        var thickness = document.getElementById('thickness');
        var remarks = document.getElementById('remarks');
        var tray = document.getElementById('tray');
        var trolley = document.getElementById('trolley');
        var weight = document.getElementById('weight');

        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            var product = productsByRecipe[tabIndex][recipeName][index];
            if (product) {
                productNameField.value = product.name;
                clientField.value = product.client;
                colorSetField.value = product.color;
                expiryDate.value = product.expiryDate;
                saleDate.value = product.saleDate;
                salesOrder.value = product.salesOrder;
                productPrice.value = product.productPrice;
                currency.value = product.currency;
                noOfSlices.value = product.noOfSlices;
                thickness.value = product.thickness;
                remarks.value = product.remarks;
                tray.value = product.tray;
                trolley.value = product.trolley;
                weight.value = product.weight;
                productIndexToEdit = index;  // Store the index of the product being edited
            }
        }

        var flatpickrInstance = flatpickr("#saleDate");

        if (product.saleDate) {
            flatpickrInstance.setDate(product.saleDate);
        } else {
            flatpickrInstance.clear();  // This will make it show the "N/A" placeholder
        }

        var productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.style.display = 'block';
        }
    }


    function deleteProduct(tabIndex, recipeName, index) {
        if (productsByRecipe[tabIndex] && productsByRecipe[tabIndex][recipeName]) {
            productsByRecipe[tabIndex][recipeName].splice(index, 1);  // Remove the product from the array
            printProductsByRecipe(recipeName, tabIndex);
            console.log(`Product deleted: Recipe - ${recipeName}, Tab Index - ${tabIndex}, Index - ${index}`);
        }
    }


    function checkAndToggleProductModalButton() {
        // Find the active tab
        var activeTab = document.querySelector('.tabcontent[style*="display: block"]');
        if (activeTab) {
            // Check if there are any recipe buttons within the active tab
            var recipeButtons = activeTab.querySelectorAll('.tablinks-recipes');
            // Find the add-product-button within the active tab
            var addProductButton = activeTab.querySelector('.add-product-button');

            if (recipeButtons.length > 0) {
                // If there are recipe buttons in the active tab, show the add-product-button
                if (addProductButton) {
                    addProductButton.style.display = 'block';
                }
            }
        }
    }

    // Initially check and set visibility of the button
    checkAndToggleProductModalButton();

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

});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
});