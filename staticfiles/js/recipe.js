document.addEventListener('DOMContentLoaded', function () {
    // Get the container for recipe tabs
    var recipeTabsContainer = document.querySelectorAll(".tabcontent");
    var recipeFormIds = {};
    // var savedDateTimeValues = {};

    // Event listener for all "Add Recipe" buttons
    var addRecipeButtons = document.querySelectorAll(".add-recipe-tab");
    addRecipeButtons.forEach(function (addRecipeButton, index) {
        addRecipeButton.addEventListener("click", function () {
            var modal = document.getElementById(`myModal-${index}`);
            modal.style.display = 'block';
        });
    });

    // Event listener for all close buttons
    var closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(function (closeButton, index) {
        closeButton.addEventListener('click', function () {
            var modal = document.getElementById(`myModal-${index}`);
            modal.style.display = 'none';
        });
    });

    // Event listener for all recipe forms
    var recipeForms = document.querySelectorAll('#recipeForm');
    recipeForms.forEach(function (recipeForm, index) {
        recipeForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var enteredRecipeName = document.getElementById(`recipeName-${index}`).value;
            if (enteredRecipeName) {
                var newRecipeButton = document.createElement('button');
                newRecipeButton.classList.add('tablinks-recipes');
                newRecipeButton.textContent = enteredRecipeName;

                newRecipeButton.addEventListener('click', function () {
                    displayRecipeDetails(enteredRecipeName, index);
                    setActiveTab(newRecipeButton);
                });

                recipeTabsContainer[index].querySelector('.tab-recipes').appendChild(newRecipeButton);

                var modal = document.getElementById(`myModal-${index}`);
                modal.style.display = 'none';
            }
        });
    });

    function createRecipeForm(recipeName, formId) {
        var form = document.createElement("form");
        form.id = formId;
        form.classList.add("recipe-form");

        var leftDiv = document.createElement("div");
        leftDiv.classList.add("left-div");
        var rightDiv = document.createElement("div");
        rightDiv.classList.add("right-div");

        var nameLabel = document.createElement("label");
        nameLabel.htmlFor = `recipeName${formId}`;
        nameLabel.textContent = "Recipe Name:";

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = `recipeName${formId}`;
        nameInput.name = "recipeName";
        nameInput.value = recipeName;
        nameInput.required = true;
        nameInput.disabled = true;

        var br = document.createElement("br");

        // var datetimeLabel = document.createElement("label");
        // datetimeLabel.htmlFor = `dateTimePicker${formId}`;
        // datetimeLabel.textContent = "Production Date:";

        // Add a date-time picker
        // var dateTimePicker = document.createElement("input");
        // dateTimePicker.type = "text";
        // dateTimePicker.id = `dateTimePicker${formId}`;
        // dateTimePicker.name = "dateTimePicker";

        // var defaultDateTime = savedDateTimeValues[`recipeForm${formId}`];

        // Initialize Flatpickr for the text input
        flatpickr(dateTimePicker, {
            enableTime: false,
            dateFormat: "d/m/Y H:i",
            defaultDate: defaultDateTime || "today",
            onChange: function (selectedDates) {
                var selectedDate = selectedDates[0];
                var formattedDate = formatDateTime(selectedDate);
                dateTimePicker.value = formattedDate;
                savedDateTimeValues[`recipeForm${formId}`] = selectedDate;
            }
        });


        // var now = new Date();
        // var defaultValue = formatDateTime(now);
        // dateTimePicker.value = defaultDateTime || defaultValue;

        leftDiv.appendChild(nameLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(nameInput);

        // rightDiv.appendChild(datetimeLabel);
        // rightDiv.appendChild(br.cloneNode());
        // rightDiv.appendChild(dateTimePicker);

        form.appendChild(leftDiv);
        // form.appendChild(rightDiv);

        return form;
    }

    function displayRecipeDetails(recipeName, tabIdx) {
        if (!recipeFormIds[recipeName]) {
            var formCount = 0;
            recipeFormIds[recipeName] = `recipeForm-${recipeName}-${tabIdx}-${formCount}`;
        }
        var formId = recipeFormIds[recipeName];
        var newRecipeForm = createRecipeForm(recipeName, formId);
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.second-column');
        currentRecipeDetailsContainer.innerHTML = "";
        currentRecipeDetailsContainer.appendChild(newRecipeForm);
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

    // function formatDateTime(date) {
    //     var monthNames = ["Jan", "Feb", "March", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    //     var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    //     var selectedYear = date.getFullYear();
    //     var selectedMonth = monthNames[date.getMonth()];
    //     var selectedDay = date.getDate().toString().padStart(2, '0');
    //     var selectedDayName = dayOfWeek[date.getDay()];

    //     return `${selectedDayName}, ${selectedDay} ${selectedMonth} ${selectedYear}`;
    // }
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
});
