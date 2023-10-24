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
        var allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(function (button, index) {
            var recipeName = button.textContent;
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
                                                    updateColorSetField(clientSelect.value, selectedDate); // Trigger color set update
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
                        updateColorSetField(clientSelect.value, selectedDate); // Trigger color set update
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

    function updateColorSetField(client, selectedDate, tabIdx) {
        var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        var colorSets = {
            GFS: ["WHITE", "TAN", "ORANGE", "YELLOW", "BLUE", "DARK GREEN", "RED"],
            GBKL: ["TAN", "BLUE", "YELLOW", "ORANGE", "GREEN", "RED", "WHITE"]
        };

        var openCalendarInstanceDate = new Date(selectedDate);
        var selectedDayOfWeek = dayOfWeek[openCalendarInstanceDate.getDay()];
        var colorSet = colorSets[client];
        var colorIndex = dayOfWeek.indexOf(selectedDayOfWeek) + tabIdx; // Updated the color index based on the tab index
        var selectedColor = colorSet[colorIndex % colorSet.length];

        var colorSetField = document.getElementById('colorSet');
        if (colorSetField) {
            colorSetField.value = selectedColor;
        }
    }


    // Event listener for the client select element
    var clientSelect = document.getElementById('client'); // Assuming 'client' is the ID of the client select element
    if (clientSelect) {
        clientSelect.addEventListener("change", function () {
            var selectedClient = this.value;
            updateColorSetField(selectedClient, selectedDate);
        });
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

    // Event listener for the product form submission
    if (productForm) {
        var productIndexToEdit = -1; // Initialize the product index to edit
        productForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var productName = document.getElementById('productName').value;
            var productQuantity = document.getElementById('productQuantity').value;
            var client = document.getElementById('client').value;
            var colorSet = document.getElementById('colorSet').value;

            var activeRecipe = document.querySelector('.tablinks-recipes.opened');
            if (activeRecipe) {
                var activeRecipeName = activeRecipe.textContent;
                var activeTabIndex = Array.from(document.querySelectorAll('.tablinks-recipes')).indexOf(activeRecipe);
                if (productIndexToEdit !== -1) {
                    // Update the existing product with the edited information
                    productsByRecipeTab[activeTabIndex][activeRecipeName][productIndexToEdit] = {
                        name: productName,
                        quantity: productQuantity,
                        client: client,
                        color: colorSet
                    };
                    productIndexToEdit = -1; // Reset the product index to edit
                    console.log(`Product updated: Recipe - ${activeRecipeName}, Index - ${productIndexToEdit}`);
                } else {
                    // Add the new product to the array
                    if (!productsByRecipeTab[activeTabIndex]) {
                        productsByRecipeTab[activeTabIndex] = {};
                    }
                    if (!productsByRecipeTab[activeTabIndex][activeRecipeName]) {
                        productsByRecipeTab[activeTabIndex][activeRecipeName] = [];
                    }
                    productsByRecipeTab[activeTabIndex][activeRecipeName].push({
                        name: productName,
                        quantity: productQuantity,
                        client: client,
                        color: colorSet
                    });
                    console.log(`Product created: Recipe - ${activeRecipeName}`);
                }

                printProductsByRecipe(activeRecipeName, activeTabIndex); // Display the updated products for the current recipe and tab
                updateColorSetField(client, selectedDate, activeTabIndex); // Update the color set field based on the client, selected date, and activeTabIndex

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

    // Function to open the modal with existing product information
    function openEditModal(recipeName, index) {
        var productNameField = document.getElementById('productName');
        var productQuantityField = document.getElementById('productQuantity');
        var clientField = document.getElementById('client');
        var colorSetField = document.getElementById('colorSet');

        var activeRecipe = document.querySelector('.tablinks-recipes.opened');
        if (activeRecipe) {
            var activeTabIndex = Array.from(document.querySelectorAll('.tablinks-recipes')).indexOf(activeRecipe);
            if (productsByRecipeTab[activeTabIndex] && productsByRecipeTab[activeTabIndex][recipeName]) {
                var product = productsByRecipeTab[activeTabIndex][recipeName][index];
                if (product) {
                    productNameField.value = product.name;
                    productQuantityField.value = product.quantity;
                    clientField.value = product.client;
                    colorSetField.value = product.color;
                    // Store the index of the product being edited
                    productIndexToEdit = index;
                }
            }
        }

        var productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.style.display = 'block';
        }
    }

    // Function to delete a product
    function deleteProduct(recipeName, index) {
        var activeRecipe = document.querySelector('.tablinks-recipes.opened');
        if (activeRecipe) {
            var activeTabIndex = Array.from(document.querySelectorAll('.tablinks-recipes')).indexOf(activeRecipe);
            if (productsByRecipeTab[activeTabIndex] && productsByRecipeTab[activeTabIndex][recipeName]) {
                productsByRecipeTab[activeTabIndex][recipeName].splice(index, 1); // Remove the product from the array
                printProductsByRecipe(recipeName, activeTabIndex); // Update the displayed products for the recipe and tab
                console.log(`Product deleted: Recipe - ${recipeName}, Index - ${index}`);
            }
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
                printProductsByRecipe(recipeName, this.tabIndex); // Call the function to print the products for the current recipe
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