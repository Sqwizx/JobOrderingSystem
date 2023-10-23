var calendarInstance; // Define the calendarInstance outside the function
var selectedDate;



document.addEventListener('DOMContentLoaded', function () {
    var calendarInstance; // Initialize the calendar instance variable

    // Function to format the date to yyyy-mm-dd format
    function formatDateToYYYYMMDD(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function refreshRecipeForms() {
        // Event listener for all recipe buttons
        var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var recipeName = button.textContent;
                var tabIndex = Array.from(allRecipeButtons).indexOf(button);
                printProductsByRecipe(recipeName, tabIndex);
            });
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
                                                    refreshRecipeForms();
                                                    // Update the client and color fields
                                                    var currentRecipeForm = document.querySelector('.recipe-form');
                                                    if (currentRecipeForm) {
                                                        var clientSelect = currentRecipeForm.querySelector('select[name="client"]');
                                                        var dateTimePicker = currentRecipeForm.querySelector('input[name="dateTimePicker"]');
                                                        if (clientSelect && dateTimePicker) {
                                                            updateColorSetField(clientSelect.value, dateTimePicker.value, index, currentRecipeForm.id);
                                                            // Trigger the change event for the client select element
                                                            var event = new Event('change');
                                                            clientSelect.dispatchEvent(event);
                                                        }
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

    var changeDateButton = document.getElementById('change-date');
    if (changeDateButton) {
        changeDateButton.addEventListener('click', function () {
            openCalendarInstance();
        });
    }
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

                // var deleteIcon = document.createElement('i');
                // deleteIcon.classList.add('fa', 'fa-trash');
                // deleteIcon.setAttribute('aria-hidden', 'true');
                // deleteIcon.style.fontSize = '12px';

                // Creating the delete text
                var deleteText = document.createElement("span");
                deleteText.textContent = "Delete";
                deleteText.classList.add("delete-recipe");

                newRecipeButton.appendChild(document.createElement('br'));
                // newRecipeButton.appendChild(deleteIcon);
                // newRecipeButton.appendChild(deleteText);

                newRecipeButton.addEventListener('click', function () {
                    displayRecipeDetails(recipeName, index);
                    setActiveTab(newRecipeButton);
                });

                if (recipeTabsContainer[index]) {
                    var tabRecipes = recipeTabsContainer[index].querySelector('.tab-recipes');
                    if (tabRecipes) {
                        tabRecipes.appendChild(newRecipeButton);
                    }
                    setActiveTab(newRecipeButton); // Set the newly created button as active
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
        if (selectedDate) {
            var result = new Date(selectedDate);
            result.setDate(selectedDate.getDate() + tabIdx);
            return formatDateTime(result);
        } else {
            return formatDateTime(new Date());
        }
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
        nameLabel.textContent = "Recipe Name";

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = `recipeName-${uniqueFormId}`;
        nameInput.name = "recipeName";
        nameInput.value = recipeName;
        nameInput.required = true;
        nameInput.disabled = true;

        var br = document.createElement("br");

        var clientLabel = document.createElement("label");
        clientLabel.htmlFor = `client-${uniqueFormId}`;
        clientLabel.textContent = "Client";

        var clientSelect = document.createElement("select");
        clientSelect.id = `client-${uniqueFormId}`;
        clientSelect.name = "client";

        var clientOptions = ["GFS", "GBKL"];
        clientOptions.forEach(function (option) {
            var clientOption = document.createElement("option");
            clientOption.value = option;
            clientOption.textContent = option;
            clientSelect.appendChild(clientOption);
        });

        var colorSetLabel = document.createElement("label");
        colorSetLabel.htmlFor = `colorSet-${uniqueFormId}`;
        colorSetLabel.textContent = "Color Set";

        var colorSetField = document.createElement("input");
        colorSetField.type = "text";
        colorSetField.id = `colorSet-${uniqueFormId}`;
        colorSetField.name = "colorSet";
        colorSetField.disabled = true;

        var datetimeLabel = document.createElement("label");
        datetimeLabel.htmlFor = `dateTimePicker-${uniqueFormId}`;
        datetimeLabel.textContent = "Production Date";

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
                updateColorSetField(clientSelect.value, selectedDate, tabIdx, uniqueFormId);
            }
        });

        dateTimePicker.value = defaultDateTime;

        leftDiv.appendChild(nameLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(nameInput);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(clientLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(clientSelect);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(colorSetLabel);
        leftDiv.appendChild(br.cloneNode());
        leftDiv.appendChild(colorSetField);
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

        var defaultClient = "GFS";
        // Trigger update for default client
        updateColorSetField(defaultClient, addDaysToDate(tabIdx), tabIdx, uniqueFormId);

        clientSelect.addEventListener("change", function () {
            updateColorSetField(this.value, dateTimePicker.value, tabIdx, uniqueFormId);
        });

        return form;
    }

    function updateColorSetField(client, selectedDate, tabIdx, uniqueFormId) {
        var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        var colorSets = {
            GFS: ["WHITE", "TAN", "ORANGE", "YELLOW", "BLUE", "DARK GREEN", "RED"],
            GBKL: ["TAN", "BLUE", "YELLOW", "ORANGE", "GREEN", "RED", "WHITE"]
        };
        var openCalendarInstance = new Date(selectedDate);
        var selectedDayOfWeek = dayOfWeek[(openCalendarInstance.getDay() + tabIdx) % 7];
        var colorSet = colorSets[client];
        var colorIndex = dayOfWeek.indexOf(selectedDayOfWeek);
        var selectedColor = colorSet[colorIndex % colorSet.length];
        var colorSetField = document.getElementById(`colorSet-${uniqueFormId}`);
        colorSetField.value = selectedColor;
    }

    // Function to handle the creation and displaying of the recipe form
    function displayRecipeDetails(recipeName, tabIdx) {
        var currentRecipeDetailsContainer = recipeTabsContainer[tabIdx].querySelector('.second-column');
        if (recipeFormObjects[recipeName] && recipeFormObjects[recipeName][tabIdx]) {
            var existingForm = recipeFormObjects[recipeName][tabIdx];
            updateFormWithDate(existingForm, tabIdx); // Update the date field in the form
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(existingForm);
        } else {
            var newRecipeForm = createRecipeForm(recipeName, tabIdx);
            currentRecipeDetailsContainer.innerHTML = "";
            currentRecipeDetailsContainer.appendChild(newRecipeForm);
            recipeFormObjects[recipeName][tabIdx] = newRecipeForm; // Store the form in the dictionary
        }
        printProductsByRecipe(recipeName, tabIdx); // Display the products for the current recipe
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
                    var formattedDate = formatDateTime(selectedDate);
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
                dateTimePicker.value = formatDateTime(savedDateTimeValues[uniqueFormId]);
            });
        }
    }



    // Function to switch active tab
    function setActiveTab(clickedButton) {
        var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(function (button) {
            if (button !== clickedButton) {
                button.classList.remove('opened');
            }
        });
        clickedButton.classList.toggle('opened');

        var recipeName = clickedButton.textContent;
        var tabIndex = Array.from(allRecipeButtons).indexOf(clickedButton);
        printProductsByRecipe(recipeName, tabIndex); // Update the product list when the tab is switched
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

    // Initialize the product array
    var productsByRecipe = {};

    // Initialize product array for each tab
    var productsByRecipeTab = {};

    // Event listener for the product form
    var productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var productName = document.getElementById('productName').value;
            var productQuantity = document.getElementById('productQuantity').value;

            var activeRecipe = document.querySelector('.tablinks-recipes.opened');
            if (activeRecipe) {
                var activeRecipeName = activeRecipe.textContent;
                var activeTabIndex = Array.from(document.querySelectorAll('.tablinks-recipes')).indexOf(activeRecipe);

                if (!productsByRecipeTab[activeTabIndex]) {
                    productsByRecipeTab[activeTabIndex] = {};
                }

                if (!productsByRecipeTab[activeTabIndex][activeRecipeName]) {
                    productsByRecipeTab[activeTabIndex][activeRecipeName] = [];
                }

                var productDetails = {
                    name: productName,
                    quantity: productQuantity
                };

                productsByRecipeTab[activeTabIndex][activeRecipeName].push(productDetails);
                printProductsByRecipe(activeRecipeName, activeTabIndex); // Display the updated products for the current recipe and tab

                // Close the modal after submission
                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'none';
                }
                // Reset the form fields
                productForm.reset();
            } else {
                console.error('Please select a recipe before adding products.');
            }
        });
    }

    function printProductsByRecipe(recipeName, tabIdx) {
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

        if (productsByRecipeTab[tabIdx] && productsByRecipeTab[tabIdx][recipeName]) {
            productsByRecipeTab[tabIdx][recipeName].forEach(function (product, index) {
                var productItem = document.createElement('div');
                productItem.classList.add('product-item');

                var productInfo = document.createElement('p');
                productInfo.textContent = `${product.name} - Quantity: ${product.quantity}`;
                productItem.appendChild(productInfo);

                var editIcon = document.createElement('i');
                editIcon.classList.add('fa', 'fa-edit', 'product-icon');
                editIcon.setAttribute('aria-hidden', 'true');
                editIcon.addEventListener('click', function () {
                    openEditModal(recipeName, index);
                });
                productItem.appendChild(editIcon);

                var deleteIcon = document.createElement('i');
                deleteIcon.classList.add('fa', 'fa-trash', 'product-icon');
                deleteIcon.setAttribute('aria-hidden', 'true');
                deleteIcon.addEventListener('click', function () {
                    deleteProduct(recipeName, index, tabIdx);
                });
                productItem.appendChild(deleteIcon);

                productContainer.appendChild(productItem);
            });
        }
    }

    // Function to open the edit modal for a product
    function openEditModal(recipeName, index) {
        var product = productsByRecipe[recipeName][index]; // Retrieve the product based on the recipe name and index
        var editModal = document.getElementById('editModal'); // Assuming the modal has the ID 'editModal'

        // Assuming the modal has input fields with IDs 'editProductName' and 'editProductQuantity'
        var productNameInput = document.getElementById('editProductName');
        var productQuantityInput = document.getElementById('editProductQuantity');

        if (editModal && productNameInput && productQuantityInput) {
            productNameInput.value = product.name; // Set the initial value for the product name
            productQuantityInput.value = product.quantity; // Set the initial value for the product quantity
            // Code to display the edit modal
            editModal.style.display = 'block';
        }
    }

    // Function to delete a product
    function deleteProduct(recipeName, index, tabIndex) {
        if (productsByRecipeTab[tabIndex] && productsByRecipeTab[tabIndex][recipeName]) {
            productsByRecipeTab[tabIndex][recipeName].splice(index, 1); // Remove the product from the array
            printProductsByRecipe(recipeName, tabIndex); // Update the displayed products for the recipe and tab
        }
    }

    // Event listener for opening the product modal
    var openProductModalButton = document.getElementById('open-product-modal');
    if (openProductModalButton) {
        openProductModalButton.addEventListener('click', function () {
            var activeRecipe = document.querySelector('.tablinks-recipes.opened');
            if (activeRecipe) {
                var recipeName = activeRecipe.textContent;
                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'block';
                }
                printProductsByRecipe(recipeName); // Call the function to print the products for the current recipe
            } else {
                console.error('Please select a recipe before adding products.');
            }
        });
    }
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
});