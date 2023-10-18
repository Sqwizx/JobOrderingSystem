document.addEventListener('DOMContentLoaded', function () {
    // Get the container for recipe tabs
    var recipeTabsContainer = document.querySelectorAll(".tabcontent");
    var recipeFormObjects = {}; // Store recipe form objects
    var formCounter = {};
    var savedDateTimeValues = {}; // Stores

    // Function to reset data
    function resetData() {
        recipeFormObjects = {};
        formCounter = {};
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

    // Event listener for all recipe forms
    var recipeForms = document.querySelectorAll('form#recipeForm');
    recipeForms.forEach(function (recipeForm, index) {
        recipeForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent the form from submitting

            var enteredRecipeName = document.getElementById(`recipeName-${index}`);
            if (enteredRecipeName && enteredRecipeName.value.trim() !== '') {
                var recipeName = enteredRecipeName.value.trim();

                if (recipeFormObjects[recipeName] && recipeFormObjects[recipeName][index]) {
                    displayRecipeDetails(recipeName, index); // Display the existing form
                    var modal = document.getElementById(`myModal-${index}`);
                    if (modal) {
                        modal.style.display = 'none'; // Close the modal
                    }
                    // Set the active tab to the existing tab only if it's not already active
                    var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
                    allRecipeButtons.forEach(function (button) {
                        if (button.textContent === recipeName && !button.classList.contains('opened')) {
                            setActiveTab(button);
                        }
                    });
                    return; // Return if the form already exists
                }

                var newRecipeButton = document.createElement('button');
                newRecipeButton.classList.add('tablinks-recipes');
                newRecipeButton.textContent = recipeName;

                newRecipeButton.addEventListener('click', function () {
                    displayRecipeDetails(recipeName, index);
                    setActiveTab(newRecipeButton);
                });

                if (recipeTabsContainer[index]) {
                    var tabRecipes = recipeTabsContainer[index].querySelector('.tab-recipes');
                    if (tabRecipes) {
                        tabRecipes.appendChild(newRecipeButton);
                    }
                }

                var modal = document.getElementById(`myModal-${index}`);
                if (modal) {
                    modal.style.display = 'none'; // Close the modal
                }

                displayRecipeDetails(recipeName, index); // Call the function to display recipe details

                var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
                allRecipeButtons.forEach(function (button) {
                    if (button.textContent === recipeName && !button.classList.contains('opened')) {
                        setActiveTab(button); // Set the active tab
                    }
                });
                recipeForm.reset();
            }
        });
    });

    function addDaysToDate(tabIdx) {
        var today = new Date();
        var result = new Date(today);
        result.setDate(today.getDate() + tabIdx);
        return formatDateTime(result);
    }

    function createRecipeForm(recipeName, tabIdx) {
        if (!recipeFormObjects[recipeName]) {
            recipeFormObjects[recipeName] = {};
        }
        if (!recipeFormObjects[recipeName][tabIdx]) {
            recipeFormObjects[recipeName][tabIdx] = 1;
        }
        formCounter++;
        var formId = `recipeForm-${recipeName}-${tabIdx}-${formCounter}`;
        var uniqueFormId = `${formId}`;

        var existingForm = document.getElementById(uniqueFormId);
        if (existingForm) {
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
        nameLabel.textContent = "Recipe Name:";

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
        datetimeLabel.textContent = "Production Date:";

        // Add a date-time picker
        var dateTimePicker = document.createElement("input");
        dateTimePicker.type = "text";
        dateTimePicker.id = `dateTimePicker-${uniqueFormId}`;
        dateTimePicker.name = "dateTimePicker";
        dateTimePicker.disabled = false;

        var defaultDateTime = addDaysToDate(tabIdx);

        // Initialize Flatpickr for the text input
        flatpickr(dateTimePicker, {
            enableTime: false,
            dateFormat: "d/m/Y",
            defaultDate: savedDateTimeValues[uniqueFormId] || defaultDateTime,
            onChange: function (selectedDates) {
                var selectedDate = selectedDates[0];
                var formattedDate = formatDateTime(selectedDate);
                dateTimePicker.value = formattedDate;
                savedDateTimeValues[uniqueFormId] = selectedDate;
            }
        });

        dateTimePicker.value = defaultDateTime;

        leftDiv.appendChild(nameLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(nameInput);
        leftDiv.appendChild(br.cloneNode());

        rightDiv.appendChild(datetimeLabel);
        rightDiv.appendChild(br.cloneNode());
        rightDiv.appendChild(dateTimePicker);
        rightDiv.appendChild(br.cloneNode());

        form.appendChild(leftDiv);
        form.appendChild(rightDiv);
        // Append the new form to the existing recipes list
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.second-column');
        currentRecipeDetailsContainer.appendChild(form);

        return form;
    }
    // Function to handle the creation and displaying of the recipe form
    function displayRecipeDetails(recipeName, tabIdx) {
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.second-column');
        if (recipeFormObjects[recipeName] && recipeFormObjects[recipeName][tabIdx]) {
            var existingForm = recipeFormObjects[recipeName][tabIdx];
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(existingForm);
        } else {
            var newRecipeForm = createRecipeForm(recipeName, tabIdx);
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(newRecipeForm);
            recipeFormObjects[recipeName][tabIdx] = newRecipeForm; // Store the form in the dictionary
        }
    }


    function setActiveTab(clickedButton) {
        var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(function (button) {
            if (button !== clickedButton) {
                button.classList.remove('opened');
            }
        });
        clickedButton.classList.toggle('opened');
    }

    function formatDateTime(date) {
        var monthNames = ["Jan", "Feb", "March", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        var selectedYear = date.getFullYear();
        var selectedMonth = monthNames[date.getMonth()];
        var selectedDay = date.getDate().toString().padStart(2, '0');
        var selectedDayName = dayOfWeek[date.getDay()];

        return `${selectedDayName}, ${selectedDay} ${selectedMonth} ${selectedYear}`;
    }

    const changeDateButton = document.getElementById('change-date-button');

    if (changeDateButton) {
        changeDateButton.addEventListener('click', function () {
            const newDate = prompt('Enter a new date (YYYY-MM-DD):');

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
        });
    }
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
});
