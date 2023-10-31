var calendarInstance; // Define the calendarInstance outside the function
var selectedDate;

document.addEventListener('DOMContentLoaded', function () {
    let activeRecipe = {
        name: null,
        tabIndex: null,
        dateTimePicker: null
    };

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
    var formCounters = {};

    // Function to reset data
    function resetData() {
        recipeFormObjects = {};
        savedDateTimeValues = {};
        formCounters = {};
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
        const enteredRecipeName = enteredRecipeNameElem?.value.trim();

        if (!enteredRecipeName) return;

        if (isExistingRecipeForm(enteredRecipeName, formIndex)) {
            handleExistingRecipe(enteredRecipeName, formIndex);
        } else {
            handleNewRecipe(enteredRecipeName, formIndex);
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

    function handleNewRecipe(recipeName, index) {
        const newRecipeButton = createRecipeTabButton(recipeName, index);
        addTabButtonToContainer(newRecipeButton, index);
        setActiveTab(newRecipeButton);
        displayRecipeDetails(recipeName, index);
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
        const allRecipeButtons = document.querySelectorAll('.tablinks-recipes');
        allRecipeButtons.forEach(button => {
            if (button.textContent === recipeName && !button.classList.contains('opened')) {
                setActiveTab(button);
            }
        });
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

        const recipeFormID = `recipeForm-${recipeName}-${index}-${formCounters[index]}`;
        const associatedRecipeForm = document.getElementById(recipeFormID);
        if (associatedRecipeForm) {
            associatedRecipeForm.remove();
            console.log(`Recipe form "${recipeName}" with ID "${recipeFormID}" deleted.`);
        }

        // Delete associated data.
        if (recipeFormObjects[recipeName]) {
            delete recipeFormObjects[recipeName][index];
            if (Object.keys(recipeFormObjects[recipeName]).length === 0) {
                delete recipeFormObjects[recipeName];
            }
        }

        checkAndToggleProductModalButton();
        console.log(`Recipe "${recipeName}" deleted.`);
        alertModal.style.display = 'none'; // Close the modal

        // Delete associated products of the recipe
        if (productsByRecipe[deleteParams.index] && productsByRecipe[deleteParams.index][deleteParams.recipeName]) {
            delete productsByRecipe[deleteParams.index][deleteParams.recipeName];
            console.log(`Deleted products associated with recipe: ${deleteParams.recipeName}`);

            // Refresh or update the UI after deletion
            printProductsByRecipe(deleteParams.recipeName, deleteParams.index);
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
        return formatDateTime(result);
    }

    function createRecipeForm(recipeName, tabIdx) {

        if (!recipeFormObjects[recipeName]) {
            recipeFormObjects[recipeName] = {};
        }
        if (!recipeFormObjects[recipeName][tabIdx]) {
            recipeFormObjects[recipeName][tabIdx] = 1;
        }

        if (!formCounters[tabIdx]) {
            formCounters[tabIdx] = 0;
        }
        formCounters[tabIdx]++;

        var formId = `recipeForm-${recipeName}-${tabIdx}-${formCounters[tabIdx]}`;
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

        // Event listener for opening the product modal
        var openProductModalButton = document.getElementById('open-product-modal');
        if (openProductModalButton) {
            openProductModalButton.addEventListener('click', function () {
                updateColorSetField(clientSelect.value, dateTimePicker.value, tabIdx);
            });
        }
        console.log(`Created new form with id: ${form.id}`);

        activeRecipe.dateTimePicker = dateTimePicker;
        activeRecipe.tabIndex = tabIdx;

        return form;
    }

    function updateColorSetField(client, selectedDate, tabIdx) {
        var selectedDate = selectedDate;
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
        var colorSet = colorSets[client];
        var colorIndex = dayOfWeek.indexOf(selectedDayOfWeek) + tabIdx;
        var selectedColor = colorSet[colorIndex % colorSet.length];

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
                updateColorSetField(selectedClient, activeRecipe.dateTimePicker.value, activeRecipe.tabIndex);
            } else {
                // Handle cases where the active recipe details are not set
                console.error("Active recipe details are not set. Cannot update the ColorSetField.");
            }
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


    var tabButtons = document.querySelectorAll('.tablinks');
    tabButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            console.log('Tablink clicked!')
            openTab(event, button.getAttribute('data-day'));
        });
    });

    function openTab(event, day) {
        event.stopPropagation();
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

        console.log(`Currently active recipe: ${activeRecipe.name}, Tab Index: ${activeRecipe.tabIndex}`);

        printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);
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

    // PRODUCTS HERE

    // Initialize product array for each tab
    var productsByRecipe = {};

    function getProductionDateMinValue() {
        if (activeRecipe.dateTimePicker && activeRecipe.dateTimePicker.value) {
            var dateValue = new Date(activeRecipe.dateTimePicker.value);
            return formatDateTime(dateValue);
        }
        return new Date(); // default to current date
    }


    // Initialize Flatpickr for expiryDate
    flatpickr('#expiryDate', {
        enableTime: false,
        dateFormat: "l, d M Y",
        minDate: getProductionDateMinValue(),
        defaultDate: getProductionDateMinValue(),
        onChange: function (selectedDates) {
            // Additional logic for when expiryDate changes, if needed
        }
    });

    // Initialize Flatpickr for saleDate
    flatpickr('#saleDate', {
        enableTime: false,
        dateFormat: "l, d M Y",
        minDate: getProductionDateMinValue(),
        defaultDate: "N/A",
        onChange: function (selectedDates) {
            // Additional logic for when saleDate changes, if needed
        }
    });

    if (activeRecipe.dateTimePicker) {
        activeRecipe.dateTimePicker.addEventListener('change', function () {
            var newDateValue = getProductionDateMinValue();

            var expiryFlatpickr = document.getElementById('expiryDate')._flatpickr;
            if (expiryFlatpickr) {
                expiryFlatpickr.set('minDate', newDateValue);
                expiryFlatpickr.set('defaultDate', newDateValue);
            }

            var saleFlatpickr = document.getElementById('saleDate')._flatpickr;
            if (saleFlatpickr) {
                saleFlatpickr.set('minDate', newDateValue);
                saleFlatpickr.set('defaultDate', newDateValue);
            }
        });
    }

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
                        thickness: thickness,
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
                        remarks: remarks
                    };
                    productsByRecipe[activeRecipe.tabIndex][activeRecipe.name].push(newProduct);

                    // Log the created product object
                    console.log(newProduct);

                    console.log(`Product created: Recipe - ${activeRecipe.name} ${activeRecipe.tabIndex}`);
                }

                printProductsByRecipe(activeRecipe.name, activeRecipe.tabIndex);


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


    var openProductModalButton = document.getElementById('open-product-modal');

    function checkAndToggleProductModalButton() {
        var recipeButtons = document.querySelectorAll('.tablinks-recipes');
        if (recipeButtons.length == 0) {
            // If there are no recipe buttons, hide the open-product-modal button
            openProductModalButton.style.display = 'none';
            console.log("Button toggled off")
        } else {
            // Otherwise, show it
            openProductModalButton.style.display = 'block';
            console.log("Button toggled on")
        }
    }

    // Initially check and set visibility of the button
    checkAndToggleProductModalButton();

    if (openProductModalButton) {
        openProductModalButton.addEventListener('click', function () {
            var activeRecipe = document.querySelector('.tablinks-recipes.opened');
            if (activeRecipe) {
                var recipeName = activeRecipe.textContent;
                var tabIndex = activeRecipe.getAttribute('data-tab-index');

                // Update the default and min dates for the Flatpickr instances
                var newDateValue = getProductionDateMinValue();

                var expiryFlatpickr = document.getElementById('expiryDate')._flatpickr;
                if (expiryFlatpickr) {
                    expiryFlatpickr.set('minDate', newDateValue);
                    expiryFlatpickr.set('defaultDate', newDateValue);
                }

                var saleFlatpickr = document.getElementById('saleDate')._flatpickr;
                if (saleFlatpickr) {
                    saleFlatpickr.set('minDate', newDateValue);
                    saleFlatpickr.set('defaultDate', newDateValue);
                }

                // Display the modal
                var productModal = document.getElementById('productModal');
                if (productModal) {
                    productModal.style.display = 'block';
                }
                printProductsByRecipe(recipeName, tabIndex);
            } else {
                return;
            }
        });
    }

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



