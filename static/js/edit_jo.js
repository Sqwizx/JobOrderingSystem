const SPONGE_MIXING = 6 * 60;
const FERMENTATION = 3 * 3600;
const DOUGH_MIXING = 6 * 60; // 6 minutes
const FLOOR_TIME = 6 * 60; // 6 minutes
const MAKEUP_TIME = 15 * 60; // 15 minutes
const FINAL_PROOF = 1 * 3600 + 5 * 60; // 1 hour and 5 minutes
const BAKING = 22 * 60; // 22 minutes
const COOLING = 1 * 3600 + 15 * 60; // 1 hour and 15 minutes
const PACKING = 5 * 60; // 5 minutes

let isFormSubmission = false;

var temporaryProducts = [];

document.addEventListener('DOMContentLoaded', function () {

    initializeRecipeCalculations();

    // Attach event listeners for recipe form fields
    document.querySelectorAll('.recipe-form').forEach(recipeForm => {
        const recipeId = recipeForm.getAttribute('data-recipe-id');
        console.log('Attaching listeners to recipe form with ID:', recipeId); // Debugging
        attachEventListenersToRecipeForm(recipeId);
    });

    var tabButtons = document.querySelectorAll('.tablinks');
    tabButtons.forEach(function (button) {
        getActiveTabIndex(button);
        button.addEventListener('click', function (event) {
            var dataDayValue = button.getAttribute('data-day');
            if (!button.classList.contains('active')) {
                openTab(event, dataDayValue);
            }
        });
    });

    function openTab(event, day) {
        event.preventDefault();
        activeDay = day;

        var allProducts = document.querySelectorAll('.product-item');
        var allTabContents = document.querySelectorAll('.tabcontent');
        var allActivitySteps = document.querySelectorAll('.activity-steps');
        var allAddProductButtons = document.querySelectorAll('.add-product-button');

        // Hide all products, activity steps, and add product buttons by default
        allProducts.forEach(function (product) {
            product.style.display = 'none';
        });
        allActivitySteps.forEach(function (step) {
            step.style.display = 'none';
        });
        allAddProductButtons.forEach(function (button) {
            button.style.display = 'none';
        });

        // Hide all tab contents
        allTabContents.forEach(function (content) {
            content.style.display = 'none';
        });

        var allTabLinks = document.querySelectorAll('.tablinks');
        allTabLinks.forEach(function (link) {
            link.classList.remove('active');
        });

        var selectedTabContent = document.getElementById(day);
        selectedTabContent.style.display = 'block';
        event.currentTarget.classList.add('active');

        // Check if the selected tab content has any recipe tabs
        var firstTabLinksRecipe = selectedTabContent.querySelector('.tablinks-recipes');
        if (firstTabLinksRecipe) {
            selectedTabContent.querySelectorAll('.tablinks-recipes').forEach(function (recipeTab) {
                recipeTab.classList.remove('opened');
            });
            firstTabLinksRecipe.classList.add('opened');
            openRecipeTab(firstTabLinksRecipe.getAttribute('data-recipe-id'));
        } else {
            // No recipe tabs in this tab content, keep the products, activity steps, and add product buttons hidden
        }
    }


    var tabRecipesButtons = document.querySelectorAll('.tablinks-recipes');
    tabRecipesButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var recipeId = button.getAttribute('data-recipe-id');
            if (!button.classList.contains('opened')) {
                var currentTabContent = button.closest('.tabcontent');
                currentTabContent.querySelectorAll('.tablinks-recipes.opened').forEach(function (openedButton) {
                    openedButton.classList.remove('opened');
                });

                button.classList.add('opened');
                openRecipeTab(recipeId);
            }
        });
    });

    function openRecipeTab(recipeId) {
        var allProducts = document.querySelectorAll('.product-item');
        allProducts.forEach(function (product) {
            product.style.display = 'none';
        });

        var matchingProducts = document.querySelectorAll('.product-item[data-recipe-id="' + recipeId + '"]');
        matchingProducts.forEach(function (product) {
            product.style.display = 'block';
        });

        // Hide all activity steps first
        var allActivitySteps = document.querySelectorAll('.activity-steps');
        allActivitySteps.forEach(function (step) {
            step.style.display = 'none';
        });

        // Show activity steps for the selected recipe
        var recipeActivitySteps = document.querySelectorAll('.activity-steps[data-recipe-id="' + recipeId + '"]');
        recipeActivitySteps.forEach(function (step) {
            step.style.display = 'block';
        });

        // Hide all activity steps first
        var allAddProductButtons = document.querySelectorAll('.add-product-button');
        allAddProductButtons.forEach(function (button) {
            button.style.display = 'none';
        });

        // Show activity steps for the selected recipe
        var allAddProductButtons = document.querySelectorAll('.add-product-button[data-recipe-id="' + recipeId + '"]');
        allAddProductButtons.forEach(function (button) {
            var recipeId = button.getAttribute('data-recipe-id');

            // Print the data-recipe-id
            console.log('Recipe ID:', recipeId);

            button.style.display = 'block';
        });

        showRecipeForm(recipeId);
    }

    function showRecipeForm(recipeId) {
        var allRecipeForms = document.querySelectorAll('.recipe-form');
        allRecipeForms.forEach(function (form) {
            form.style.display = 'none';
        });

        var formToShow = document.querySelector('.recipe-form[data-recipe-id="' + recipeId + '"]');
        if (formToShow) {
            formToShow.style.display = 'block';
        }
    }

    var firstTab = document.querySelector('.tablinks.active');
    var firstRecipeTab = document.querySelector('.tablinks-recipes.opened');
    if (firstTab) {
        openTab({ preventDefault: function () { }, currentTarget: firstTab }, firstTab.getAttribute('data-day'));
    }
    if (firstRecipeTab) {
        openRecipeTab(firstRecipeTab.getAttribute('data-recipe-id'));
    }

    // Get references to the recipe modal
    var recipeModal = document.getElementById('recipeModal');
    var openModalButtons = document.querySelectorAll('.add-recipe-tab');

    var openProductModalButton = document.getElementById('add-product');

    var confirmationModal = document.getElementById('alertModal');
    var confirmDeleteButton = document.getElementById('confirmDelete');
    var deleteButtons = document.querySelectorAll('.delete-container');

    function openConfirmationModal(recipeId, recipeName) {
        // Set the recipeId as a data attribute in the confirmation modal
        confirmationModal.setAttribute('data-recipe-id', recipeId);
        confirmationModal.setAttribute('data-recipe-name', recipeName);
        console.log(recipeName);

        // Update the content of the <strong> element with the recipe name
        var alertModalNamePlaceholder = document.getElementById('alertModalNamePlaceholder');
        alertModalNamePlaceholder.textContent = recipeName;

        confirmationModal.style.display = 'block';
    }

    // Function to extract jobOrderId from the URL
    function getJobOrderIdFromUrl() {
        var urlParts = window.location.pathname.split('/');
        // Assuming the jobOrderId is always after the 'edit' segment in the URL
        var jobOrderId = urlParts[urlParts.indexOf('edit') + 1];
        return jobOrderId;
    }

    // Function to find the index of the active tab
    function getActiveTabIndex() {
        var allTabLinks = document.querySelectorAll('.tablinks');
        var activeIndex = Array.from(allTabLinks).findIndex(link => link.classList.contains('active'));
        return activeIndex >= 0 ? activeIndex : null;
    }

    openModalButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            var jobOrderId = getJobOrderIdFromUrl();
            var tabIndex = getActiveTabIndex();
            var currentTabContent = event.target.closest('.tabcontent');

            if (!currentTabContent) {
                console.error('Tab content not found');
                return;
            }

            var prodDate = currentTabContent.id; // The id of the tabcontent is the production date

            // Set the values in the modal's hidden inputs
            document.getElementById('jobOrderId').value = jobOrderId;
            document.getElementById('prodDate').value = prodDate;
            document.getElementById('tabIndex').value = tabIndex;

            console.log('jobOrderId:', jobOrderId);
            console.log('prodDate:', prodDate);
            console.log('tabIndex:', tabIndex);

            // Open the modal
            recipeModal.style.display = 'block';
        });
    });

    function formatDate(dateString) {
        var date = new Date(dateString);
        var year = date.getFullYear();
        var month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based
        var day = ('0' + date.getDate()).slice(-2);

        return `${year}-${month}-${day}`;
    }

    let recipeCreated = false;
    let recipeId = null;

    function submitRecipeForm() {
        var jobOrderId = document.getElementById('jobOrderId').value;
        var tabIndex = document.getElementById('tabIndex').value;
        var prodDate = formatDate(document.getElementById('prodDate').value);
        var recipeName = document.getElementById('recipeName').value;
        var timeVariable = document.getElementById('timeVariable').value;
        var prodRate = document.getElementById('prodRate').value;
        var batchSize = document.getElementById('batchSize').value;
        var cycleTime = document.getElementById('cycleTime').value;

        isFormSubmission = true;

        var data = {
            jobOrderId: jobOrderId,
            tabIndex: tabIndex,
            prodDate: prodDate,
            recipeName: recipeName,
            timeVariable: timeVariable,
            prodRate: prodRate,
            batchSize: batchSize,
            cycleTime: cycleTime,
        };

        // AJAX call to the server
        fetch('/add_recipe/' + jobOrderId + '/', { // Replace with your actual URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                recipeCreated = true;
                recipeId = data.recipe_id;
                console.log('Success:', data);
                window.location.reload();
                recipeModal.style.display = 'none';
                // You might want to refresh part of your page or show a success message
            })
            .catch((error) => {
                console.error('Error:', error);
                // Handle errors, such as showing an error message to the user
            });
    }

    window.addEventListener('beforeunload', function (e) {
        if (recipeCreated && recipeId) {
            fetch('/draft/' + recipeId + '/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                }
            });
        }
    });

    document.getElementById('recipeModalForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        submitRecipeForm();
    });

    document.querySelectorAll('.add-product-button').forEach(function (button) {
        button.addEventListener('click', function () {
            var recipeId = this.getAttribute('data-recipe-id');
            var recipeDateAttribute = this.getAttribute('data-recipe-date');
            var recipeNameAttribute = this.getAttribute('data-recipe-name');
            var selectedClient = document.getElementById('client').value;

            if (recipeDateAttribute && selectedClient !== null) {
                var recipeDate = new Date(recipeDateAttribute);
                var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                var dayName = dayOfWeek[recipeDate.getDay()]; // Get the day name
                var selectedColor = getColorForClient(selectedClient, dayName);
                updateColorSetField(selectedColor); // Update the colorSetField with the selected color

                // Fetch products related to the recipeName
                fetch('/get_products_by_recipe/' + encodeURIComponent(recipeNameAttribute) + '/')
                    .then(response => response.json())
                    .then(products => {
                        // Populate dropdown or other elements in modal with the products
                        // Example:
                        var productDropdown = document.getElementById('productDropdown');
                        productDropdown.innerHTML = '';

                        // Add a default option as placeholder
                        var defaultOption = document.createElement('option');
                        defaultOption.textContent = 'Select a product';
                        defaultOption.value = '';
                        defaultOption.disabled = true;
                        defaultOption.selected = true;
                        defaultOption.hidden = true; // Hide this option in the dropdown list
                        productDropdown.appendChild(defaultOption);

                        products.forEach(product => {
                            let option = document.createElement('option');
                            option.value = product.id;
                            option.textContent = product.productName;
                            productDropdown.appendChild(option);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching products:', error);
                    });
            } else {
                console.error("Recipe date or selected client is not set. Cannot update the ColorSetField.");
            }

            openAddProductModal(); // Open the modal without passing recipeId
            prepareAddProductForm(recipeId); // Prepare the form with recipeId
        });
    });

    document.getElementById('productDropdown').addEventListener('change', function () {
        var productId = this.value;

        // Only proceed if a valid product ID is selected
        if (productId) {
            fetch('/product_dropdown/' + productId + '/')
                .then(response => response.json())
                .then(product => {
                    // Populate the form with the product details
                    document.getElementById('newCurrency').value = product.currency;
                    document.getElementById('newProductPrice').value = product.productPrice;
                    document.getElementById('newClient').value = product.client;
                    var weightDropdown = document.getElementById('newWeight');
                    Array.from(weightDropdown.options).forEach(option => {
                        if (parseInt(option.getAttribute('data-weight')) === parseInt(product.weight)) {
                            option.selected = true;  // Select
                        }
                    });
                    document.getElementById('newNoOfSlices').value = product.noOfSlices;
                    document.getElementById('newThickness').value = product.thickness;
                    // Populate other fields as needed
                })
                .catch(error => console.error('Error fetching product details:', error));
        }
    });



    function getColorForClient(client, dayOfWeek) {
        switch (client) {
            case "GFS":
                switch (dayOfWeek) {
                    case "SUNDAY": return "WHITE";
                    case "MONDAY": return "TAN";
                    case "TUESDAY": return "ORANGE";
                    case "WEDNESDAY": return "YELLOW";
                    case "THURSDAY": return "BLUE";
                    case "FRIDAY": return "DARK GREEN";
                    case "SATURDAY": return "RED";
                    default: return "DEFAULT_COLOR";
                }
            case "GBKL":
                switch (dayOfWeek) {
                    case "SUNDAY": return "TAN";
                    case "MONDAY": return "BLUE";
                    case "TUESDAY": return "YELLOW";
                    case "WEDNESDAY": return "ORANGE";
                    case "THURSDAY": return "GREEN";
                    case "FRIDAY": return "RED";
                    case "SATURDAY": return "WHITE";
                    default: return "DEFAULT_COLOR";
                }
            default:
                return "DEFAULT_COLOR";
        }
    }

    // Function to update the ColorSetField
    function updateColorSetField(selectedColor) {
        var colorSetField = document.getElementById('newColorSet');
        console.log('colorSetField:', colorSetField); // Debug line to check if colorSetField is found
        if (colorSetField) {
            colorSetField.value = selectedColor;
            console.log('Updated colorSetField with:', selectedColor); // Debug line to check if value is set
        }
    }

    // Add a click event listener to the document for close buttons with the "modal-close" class
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('modal-close')) {
            // Find the parent modal container
            var modal = event.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });

    var deleteButtons = document.querySelectorAll('.delete-container');

    deleteButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var recipeId = this.getAttribute('data-recipe-id');
            var recipeName = this.getAttribute('data-recipe-name');
            var tabcontent = this.closest('.tabcontent');

            if (tabcontent) {
                // Check if it's the last .tablinks-recipes in the current tab content
                if (isLastRecipeTab(tabcontent)) {
                    // Display the warning modal instead of deleting
                    document.getElementById('warningModal').style.display = 'block';
                } else {
                    console.log('Recipe Name:', recipeName);
                    console.log('Recipe IDID:', recipeId);
                    openConfirmationModal(recipeId, recipeName);
                }
            }
        });
    });

    function isLastRecipeTab(tabcontent) {
        if (tabcontent) {
            var recipeTabs = tabcontent.querySelectorAll('.tablinks-recipes');
            return recipeTabs.length === 1; // Only one recipe tab left
        }
        return false; // Return false if tabcontent is not found
    }

    // Add event listener to confirm the deletion
    confirmDeleteButton.addEventListener('click', function () {
        var recipeId = confirmationModal.getAttribute('data-recipe-id');
        var tabcontent = this.closest('.tabcontent');

        // Check if it's the last .tablinks-recipes in the current tab content
        if (isLastRecipeTab(tabcontent)) {
            // Close the warning modal
            document.getElementById('warningModal').style.display = 'none';
        } else {
            deleteRecipe(recipeId);
            confirmationModal.style.display = 'none';
        }
    });

    // Add event listener to close the warning modal
    document.getElementById('okayButton').addEventListener('click', function () {
        document.getElementById('warningModal').style.display = 'none';
    });

    function deleteRecipe(recipeId) {
        isFormSubmission = true;
        fetch('/delete_recipe/' + recipeId + '/', {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);
                document.querySelectorAll(`.recipe-form[data-recipe-id='${recipeId}']`).forEach(element => element.remove());
                document.querySelectorAll(`.tablinks-recipes[data-recipe-id='${recipeId}']`).forEach(element => element.remove());
                document.querySelectorAll(`.product-item[data-recipe-id='${recipeId}']`).forEach(element => element.remove());
                document.querySelectorAll(`.activity-steps[data-recipe-id='${recipeId}']`).forEach(element => element.remove());

                openFirstRecipeTab();
            })
            .catch(error => console.error('Error:', error));
    }

    function openFirstRecipeTab() {
        // Find the currently active tab content
        var activeTabContent = document.querySelector('.tabcontent[style*="display: block"]');
        if (!activeTabContent) return;

        // Find the first recipe tab within the active tab content
        var firstRecipeTab = activeTabContent.querySelector('.tablinks-recipes');
        if (firstRecipeTab) {
            // Remove 'opened' class from any previously opened recipe tabs
            activeTabContent.querySelectorAll('.tablinks-recipes.opened').forEach(function (openedButton) {
                openedButton.classList.remove('opened');
            });

            // Add 'opened' class to the first recipe tab and open it
            firstRecipeTab.classList.add('opened');
            openRecipeTab(firstRecipeTab.getAttribute('data-recipe-id'));
        } else {
            // Handle case where there are no more recipe tabs
            console.log("No more recipe tabs available in the active tab.");
        }
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function updateAllRecipeTimes(recipeId, newStartTime) {
        const stdTime = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}'] [name="stdTime"]`).value;
        let previousSpongeEndTime = null;

        // Update the current recipe's times first
        const newSpongeEndTime = calculateSpongeEndTime(newStartTime, stdTime);
        const newDoughStartTime = calculateDoughStartTime(newSpongeEndTime);
        const newDoughEndTime = calculateDoughEndTime(newDoughStartTime, stdTime);
        const newFirstLoafPackedTime = calculateFirstLoafPacked(newDoughEndTime);
        const newCutOffTime = calculateCutOffTime(newFirstLoafPackedTime, stdTime);
        updateTracker(recipeId, newStartTime, newSpongeEndTime, newDoughStartTime, newDoughEndTime, newFirstLoafPackedTime, newCutOffTime);

        // Now update subsequent recipes
        const currentRecipeContainer = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}']`).closest('.tabcontent');
        if (currentRecipeContainer) {
            const allRecipeForms = currentRecipeContainer.querySelectorAll('.recipe-form');
            let updateNext = false;

            allRecipeForms.forEach(form => {
                const nextRecipeId = form.getAttribute('data-recipe-id');

                if (nextRecipeId === recipeId) {
                    updateNext = true; // Start updating from the next recipe
                    previousSpongeEndTime = newSpongeEndTime; // Set the end time for the next recipe calculation
                    return;
                }

                if (updateNext) {
                    // Calculate new start time for the next recipe
                    const newNextStartTime = new Date(previousSpongeEndTime);
                    newNextStartTime.setMinutes(newNextStartTime.getMinutes() + 45); // Add 45 minutes buffer
                    const formattedNextStartTime = formatDateTime(newNextStartTime);

                    // Recalculate times for the next recipe
                    const nextSpongeEndTime = calculateSpongeEndTime(formattedNextStartTime, stdTime);
                    const nextDoughStartTime = calculateDoughStartTime(nextSpongeEndTime);
                    const nextDoughEndTime = calculateDoughEndTime(nextDoughStartTime, stdTime);
                    const nextFirstLoafPackedTime = calculateFirstLoafPacked(nextDoughEndTime);
                    const nextCutOffTime = calculateCutOffTime(nextFirstLoafPackedTime, stdTime);
                    updateTracker(nextRecipeId, formattedNextStartTime, nextSpongeEndTime, nextDoughStartTime, nextDoughEndTime, nextFirstLoafPackedTime, nextCutOffTime);

                    // Set the end time for the next recipe calculation
                    previousSpongeEndTime = nextSpongeEndTime;
                }
            });
        }
    }

    var flatpickrInstances = {};

    document.querySelectorAll('.spongeStart-flatpickr').forEach(function (el) {
        var originalDate = el.value; // Get the original date string
        var formattedDate = moment(originalDate, "dddd, DD MMM YYYY HH:mm").format("YYYY-MM-DD HH:mm");
        var justDate = moment(originalDate, "dddd, DD MMM YYYY HH:mm").format("YYYY-MM-DD");

        console.log('Original date:', originalDate);
        console.log('Formatted date:', formattedDate);

        var recipeId = el.closest('.recipe-form').getAttribute('data-recipe-id');

        // Initialize Flatpickr
        flatpickrInstances[recipeId] = flatpickr(el, {
            enableTime: true,
            altInput: true,
            altFormat: "l, d M Y H:i",
            dateFormat: "Y-m-d H:i",
            defaultDate: formattedDate,
            minDate: justDate, // Set the minDate to the start of the specified day
            maxDate: justDate + " 23:59", // Set the maxDate to the end of the specified day
            onChange: function (selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    const recipeId = instance.element.getAttribute('data-recipe-id');
                    var formattedDate = moment(dateStr, "YYYY-MM-DD HH:mm").format("dddd, DD MMM YYYY HH:mm");
                    updateAllRecipeTimes(recipeId, formattedDate); // Use the new function here
                } else {
                    console.log('Invalid or empty date/time:', dateStr);
                }
            }
        });

        // Handle manual input changes in the alternative input
        flatpickrInstances[recipeId].altInput.addEventListener('input', function () {
            var manuallyEnteredDate = this.value;
            var parsedDate = moment(manuallyEnteredDate, "dddd, DD MMM YYYY HH:mm").toDate();

            if (parsedDate && !isNaN(parsedDate.getTime())) {
                flatpickrInstances[recipeId].setDate(parsedDate, false);
            }
        });
    });


    function initializeRecipeCalculations() {
        const recipeForms = document.querySelectorAll('.recipe-form');
        recipeForms.forEach(form => {
            const recipeId = form.getAttribute('data-recipe-id');
            updateTotalValues(recipeId);
        });
    }

    function attachEventListenersToRecipeForm(recipeId) {
        // Debug: Log the recipeId
        console.log("Recipe ID attachEventListenersToRecipeForm:", recipeId);

        // Correctly use recipeId in selectors
        const salesOrderInput = document.querySelector(`#salesOrder-${recipeId}`);
        const wasteInput = document.querySelector(`#waste-${recipeId}`);
        const batchSizeInput = document.querySelector(`#batchSize-${recipeId}`);
        const batchesInput = document.querySelector(`#batches-${recipeId}`);
        const productionRateInput = document.querySelector(`#productionRate-${recipeId}`);
        const cycleTimeInput = document.querySelector(`#cycleTime-${recipeId}`);
        const stdTimeInput = document.querySelector(`#stdTime-${recipeId}`);
        const timeVariableInput = document.querySelector(`#timeVariable-${recipeId}`);

        console.log('cycleTimeInput [FIRST]:', cycleTimeInput.value);
        // Attach event listeners to these elements
        salesOrderInput.addEventListener('input', () => {
            calculateBatchesToProduce(salesOrderInput.value, wasteInput.value, batchSizeInput.value, batchesInput.value, timeVariableInput);
            updateTotalValues(recipeId)
        });

        wasteInput.addEventListener('input', () => {
            calculateBatchesToProduce(salesOrderInput.value, wasteInput.value, batchSizeInput.value, batchesInput);
            updateTotalValues(recipeId)
        });

        batchSizeInput.addEventListener('input', () => {
            calculateBatchesToProduce(salesOrderInput.value, wasteInput.value, batchSizeInput.value, batchesInput);
            calculateCycleTime(batchSizeInput.value, productionRateInput.value, timeVariableInput.value, cycleTimeInput);
            calculateStdTime(batchesInput.value, cycleTimeInput.value, stdTimeInput, recipeId);
            updateTotalValues(recipeId)
        });

        productionRateInput.addEventListener('input', () => {
            calculateCycleTime(batchSizeInput.value, productionRateInput.value, timeVariableInput.value, cycleTimeInput);
            calculateStdTime(batchesInput.value, cycleTimeInput.value, stdTimeInput, recipeId);
            updateTotalValues(recipeId)
        });

        batchesInput.addEventListener('input', () => {
            calculateStdTime(batchesInput.value, cycleTimeInput.value, stdTimeInput, recipeId);
            updateTotalValues(recipeId)
        });

        stdTimeInput.addEventListener('input', () => {
            updateTotalValues(recipeId)
        });
    }

    document.querySelectorAll('.gap-field').forEach(function (field) {
        field.addEventListener('change', function () {
            var newValue = this.value;

            // Find the nearest parent container that represents a date group
            var dateGroupContainer = this.closest('.tabcontent');

            // Update all gap fields within this container
            dateGroupContainer.querySelectorAll('.gap-field').forEach(function (otherField) {
                otherField.value = newValue;
            });
        });
    });

    function updateTotalValues(recipeId) {
        const totalSalesOrder = calculateTotalSalesOrderForRecipe(recipeId);
        const totalTrays = calculateTotalTraysForRecipe(recipeId);
        const totalTrolleys = calculateTotalTrolleysForRecipe(recipeId);

        updateFieldValue(`salesOrder-${recipeId}`, totalSalesOrder);
        updateFieldValue(`totalTray-${recipeId}`, totalTrays);
        updateFieldValue(`totalTrolley-${recipeId}`, totalTrolleys);
    }

    function calculateTotalSalesOrderForRecipe(recipeId) {
        let totalSalesOrder = 0;
        document.querySelectorAll(`.recipe-form[data-recipe-id='${recipeId}'] input[name='salesOrder']`).forEach(input => {
            const salesOrder = input.value;
            if (salesOrder) {
                totalSalesOrder += parseFloat(salesOrder);
            }
        });
        return totalSalesOrder;
    }

    function calculateTotalTraysForRecipe(recipeId) {
        let totalTrays = 0;
        document.querySelectorAll(`.recipe-form[data-recipe-id='${recipeId}'] input[name='totalTray']`).forEach(input => {
            const tray = input.value;
            if (tray) {
                totalTrays += parseInt(tray, 10);
            }
        });
        return totalTrays;
    }

    function calculateTotalTrolleysForRecipe(recipeId) {
        let totalTrolleys = 0;
        document.querySelectorAll(`.recipe-form[data-recipe-id='${recipeId}'] input[name='totalTrolley']`).forEach(input => {
            const trolley = input.value;
            if (trolley) {
                totalTrolleys += parseInt(trolley, 10);
            }
        });
        return totalTrolleys;
    }


    function updateFieldValue(fieldId, value) {
        let field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    }

    function calculateStdTime(batchesInput, cycleTimeInput, stdTimeInput, recipeId) {
        console.log('calculating stdTime [ORI]', cycleTimeInput);
        if (batchesInput && cycleTimeInput && stdTimeInput) {
            const batches = parseInt(batchesInput);
            const cycleTimeSeconds = convertToSeconds(cycleTimeInput);
            const additionalTime = Math.floor(batches / 16) * 720; // Example calculation

            const totalStdTimeSeconds = batches * cycleTimeSeconds + additionalTime;
            console.log(`Batches: ${batches}`);
            console.log(`Cycle Time: ${cycleTimeSeconds}`);
            console.log('Additional Time WO 720:', Math.floor(batches / 16))
            console.log(`Additional Time: ${additionalTime}`);
            stdTimeInput.value = convertToHHMMSS(totalStdTimeSeconds);

            console.log('cycleTimeInput [HH:MM:SS]:', stdTimeInput.value);

            // Update the activity times based on the new stdTime
            updateActivityTimesBasedOnStdTime(stdTimeInput.value, recipeId);
        }
    }

    function calculateCycleTime(batchSize, productionRate, timeVariable, cycleTimeInput) {
        console.log('CALCULATING CYCLE TIME');
        console.log(`Time Variable: ${timeVariable} for calculateCycleTime`);
        console.log(`Production Rate: ${productionRate}`)
        console.log(`Batch Size: ${batchSize}`)

        let timeVariableInSeconds;

        // Check if timeVariable is a string and convert it to seconds
        if (typeof timeVariable === 'string') {
            timeVariableInSeconds = convertToSeconds(timeVariable);
        } else {
            // Assume timeVariable is already a number in seconds
            timeVariableInSeconds = timeVariable;
        }

        if (batchSize > 0 && productionRate > 0 && timeVariableInSeconds > 0) {
            const cycleTimeInSeconds = Math.round((batchSize / productionRate) * timeVariableInSeconds);
            console.log('cycleTimeInSeconds [SECOND]:', cycleTimeInSeconds);
            cycleTimeInput.value = convertToHHMMSS(cycleTimeInSeconds);
            console.log('cycleTimeInput [SECOND]:', cycleTimeInput.value);
        } else {
            cycleTimeInput.value = "00:00:00";
        }
    }

    function calculateCycleTimeSearch(batchSize, productionRate, timeVariable) {
        let timeVariableInSeconds;
        console.log('timeVariableInSeconds [SEARCH]:', timeVariable)

        if (typeof timeVariable === 'string') {
            timeVariableInSeconds = convertToSeconds(timeVariable);
        } else {
            timeVariableInSeconds = timeVariable;
        }

        if (batchSize > 0 && productionRate > 0 && timeVariableInSeconds > 0) {
            const cycleTimeInSeconds = Math.round((batchSize / productionRate) * timeVariableInSeconds);
            return convertToHHMMSS(cycleTimeInSeconds);
        } else {
            return "00:00:00";
        }
    }

    function calculateBatchesToProduce(salesOrderInput, wasteInput, batchSizeInput, batchesInput) {

        if (salesOrderInput && wasteInput && batchSizeInput && batchesInput) {
            console.log(batchSizeInput + " " + salesOrderInput + " " + wasteInput)
            const salesOrderValue = parseFloat(salesOrderInput) || 0;
            const wastePercentage = parseFloat(wasteInput) / 100 || 0.02;
            const batchSizeValue = parseFloat(batchSizeInput) || 1;

            const totalOrderWithWaste = salesOrderValue + (salesOrderValue * wastePercentage);
            const batches = totalOrderWithWaste / batchSizeValue;
            console.log(batches)
            batchesInput.value = Math.ceil(batches);
        }
    }

    function convertToSeconds(hhmmss) {
        const [hours, minutes, seconds] = hhmmss.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    function convertToHHMMSS(totalSeconds) {
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

        return [hours, minutes, seconds].map(val => String(val).padStart(2, '0')).join(':');
    }

    function addNewProduct(recipeId) {
        // Get the data from the form
        // Get the selected product option
        var selectedProductOption = document.querySelector('#productDropdown option:checked');
        var newProductName = selectedProductOption ? selectedProductOption.textContent : '';
        var newProductId = recipeId + '_' + newProductName; // Replace spaces in productName
        var newProductSalesOrder = document.getElementById("newProductSalesOrder").value;
        var newCurrency = document.getElementById("newCurrency").value;
        var newProductPrice = document.getElementById("newProductPrice").value;
        var newClient = document.getElementById("newClient").value;
        var newColorSet = document.getElementById("newColorSet").value;
        var newExpiryDate = document.getElementById("newExpiryDate").value;
        var newWeight = document.getElementById("newWeight").value;
        var newSaleDate = document.getElementById("newSaleDate").value;
        var newNoOfSlices = document.getElementById("newNoOfSlices").value;
        var newThickness = document.getElementById("newThickness").value;
        var newTray = document.getElementById("newTray").value;
        var newTrolley = document.getElementById("newTrolley").value;
        var newRemarks = document.getElementById("newRemarks").value;

        newExpiryDate = newExpiryDate ? newExpiryDate : null;
        newSaleDate = newSaleDate ? newSaleDate : null;

        // Create a JSON object with the data
        var data = {
            productId: newProductId,
            productName: newProductName,
            productSalesOrder: newProductSalesOrder,
            currency: newCurrency,
            productPrice: newProductPrice,
            client: newClient,
            colorSet: newColorSet,
            expiryDate: newExpiryDate,
            saleDate: newSaleDate,
            weight: newWeight,
            noOfSlices: newNoOfSlices,
            thickness: newThickness,
            tray: newTray,
            trolley: newTrolley,
            productRemarks: newRemarks,
            recipeId: recipeId,
            activity: getActivityData(recipeId)
        };

        temporaryProducts.push(data);
        displayNewProductInUI(data);
        updateRecipeDetailsOnFrontEnd(recipeId);
        updateRecipeCalculations(recipeId)

        console.log("New Product Data:", data);

        var modal = document.getElementById('newProductModal');
        modal.style.display = 'none';
    }

    function displayNewProductInUI(product) {
        // Find the specific product container for the recipe
        var specificProductListContainer = document.querySelector(".product-container");

        var matchingForm = document.querySelector(`form[data-recipe-id='${product.recipeId}']`);
        var recipeProdDate = matchingForm ? matchingForm.querySelector(`#dateTimePicker-${product.recipeId}`).value : '';

        // Create new product item element
        var productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.setAttribute('data-recipe-id', product.recipeId);
        productItem.setAttribute('data-product-id', product.productId);

        // Add product details (product name and client)
        var productContent = `
        <div class="product-content-container">
            <div class="product-info-container">
                <p>${product.productName}</p>
                <p style="color: gray; font-size: 14px;">${product.client}</p>
            </div>
            <div class="icon-container">
                <i class="fa fa-edit product-icon" aria-hidden="true"
                   data-product-id="${product.productId}"
                   data-product-name="${product.productName}"
                   data-sales-order="${product.productSalesOrder}"
                   data-product-price="${product.productPrice}"
                   data-currency="${product.currency}"
                   data-client="${product.client}"
                   data-color-set="${product.colorSet}"
                   data-expiry-date="${product.productExpDate}"
                   data-weight="${product.weight}"
                   data-sale-date="${product.productSaleDate}"
                   data-no-of-slices="${product.noOfSlices}"
                   data-thickness="${product.thickness}"
                   data-tray="${product.tray}"
                   data-trolley="${product.trolley}"
                   data-remarks="${product.productRemarks}"
                   data-recipe-id="${product.recipeId}"
                   data-recipe-date="${product.recipeProdDate}"
                   onclick="populateAndShowProductModal(this)">
                </i>
                <i class="fa fa-trash product-icon" aria-hidden="true"
                   data-product-id="${product.productId}"
                   onclick="openProductAlertModal(this)">
                </i>
            </div>
        </div>`;

        productItem.innerHTML = productContent;

        // Now you can use querySelector on productItem
        var editIcon = productItem.querySelector('i.fa-edit');
        if (editIcon) {
            editIcon.setAttribute('data-recipe-date', recipeProdDate);
        }

        // Find the "Add Product" button for the specific recipe
        var addProductButton = specificProductListContainer.querySelector(`button.add-product-button[data-recipe-id='${product.recipeId}']`);

        // Insert the new product item before the "Add Product" button
        specificProductListContainer.insertBefore(productItem, addProductButton);
    }

    function updateRecipeDetailsOnFrontEnd(recipeId) {
        // Find the specific recipe form using the provided recipeId
        var recipeForm = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}']`);

        if (!recipeForm) return; // Exit if the recipe form is not found

        // Initialize totals
        var totalSalesOrder = 0;
        var totalTray = 0;
        var totalTrolley = 0;

        // Find all products related to this recipe
        var productItems = document.querySelectorAll(`.product-item[data-recipe-id='${recipeId}']`);

        productItems.forEach(function (item) {
            var salesOrder = parseInt(item.querySelector('.fa-edit').getAttribute('data-sales-order'), 10) || 0;
            var tray = parseInt(item.querySelector('.fa-edit').getAttribute('data-tray'), 10) || 0;
            var trolley = parseInt(item.querySelector('.fa-edit').getAttribute('data-trolley'), 10) || 0;

            // Sum up the values
            totalSalesOrder += salesOrder;
            totalTray += tray;
            totalTrolley += trolley;
        });

        // Update the UI with the calculated totals
        var totalSalesOrderField = recipeForm.querySelector(`#salesOrder-${recipeId}`);
        var totalTrayField = recipeForm.querySelector(`#totalTray-${recipeId}`);
        var totalTrolleyField = recipeForm.querySelector(`#totalTrolley-${recipeId}`);

        if (totalSalesOrderField) totalSalesOrderField.value = totalSalesOrder;
        if (totalTrayField) totalTrayField.value = totalTray;
        if (totalTrolleyField) totalTrolleyField.value = totalTrolley;
    }

    function openAddProductModal() {
        var modal = document.getElementById('newProductModal');
        modal.style.display = 'block'; // Adjust as per your modal display logic
    }

    function prepareAddProductForm(recipeId) {
        var form = document.getElementById('newProductForm'); // Get the form by its ID
        form.onsubmit = function (event) {
            event.preventDefault(); // Prevent the default form submission
            addNewProduct(recipeId); // Call the function to add a new product
        };
    }

    // Select elements from the newProductForm
    var newSalesOrderElement = document.getElementById('newProductSalesOrder');
    var newWeightElement = document.getElementById('newWeight');
    var newTrayElement = document.getElementById('newTray');
    var newTrolleyElement = document.getElementById('newTrolley');
    var newClientElement = document.getElementById('newClient');

    // Add event listeners to newProductSalesOrder and newWeight
    newSalesOrderElement.addEventListener('input', function () {
        calculateTrayAndTrolley(newSalesOrderElement, newWeightElement, newClientElement, newTrayElement, newTrolleyElement);
    });

    newWeightElement.addEventListener('input', function () {
        calculateTrayAndTrolley(newSalesOrderElement, newWeightElement, newClientElement, newTrayElement, newTrolleyElement);
    });

    newClientElement.addEventListener('input', function () {
        // Get the selected client value
        var selectedClient = this.value;

        // Get the recipe date from the "Add Product" button's attribute (assuming it's already set)
        var recipeDateAttribute = openProductModalButton.getAttribute('data-recipe-date');

        if (recipeDateAttribute && selectedClient) {
            var recipeDate = new Date(recipeDateAttribute);
            var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
            var dayName = dayOfWeek[recipeDate.getDay()]; // Get the day name

            // Get the selected color based on client and day of the week
            var selectedColor = getColorForClient(selectedClient, dayName);

            // Update the colorSetField with the selected color
            updateColorSetField(selectedColor);
        } else {
            // Handle cases where the data or recipe details are not set
            console.error("Recipe date or selected client is not set. Cannot update the ColorSetField.");
        }
        calculateTrayAndTrolley(newSalesOrderElement, newWeightElement, newClientElement, newTrayElement, newTrolleyElement);
    });

    function updateProduct() {
        // Get the productId and recipeId from the modal
        var productId = document.getElementById("productId").value;
        var recipeId = document.getElementById("recipeId").value;

        // Get the edit button for the current product
        var editButton = document.querySelector(`i.fa-edit[data-product-id='${productId}']`);

        // Get old values from the edit button's data-attributes
        var oldProductSalesOrder = parseInt(editButton.getAttribute('data-sales-order'), 10) || 0;
        var oldTray = parseInt(editButton.getAttribute('data-tray'), 10) || 0;
        var oldTrolley = parseInt(editButton.getAttribute('data-trolley'), 10) || 0;

        // Get the updated values from the modal
        var updatedProductSalesOrder = parseInt(document.getElementById("productSalesOrder").value, 10) || 0;
        var updatedTray = parseInt(document.getElementById("tray").value, 10) || 0;
        var updatedTrolley = parseInt(document.getElementById("trolley").value, 10) || 0;

        // Find the specific recipe form using the provided recipeId
        var recipeForm = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}']`);
        if (!recipeForm) return; // Exit if the recipe form is not found

        // Get the current totals
        var totalSalesOrderField = recipeForm.querySelector(`#salesOrder-${recipeId}`);
        var totalTrayField = recipeForm.querySelector(`#totalTray-${recipeId}`);
        var totalTrolleyField = recipeForm.querySelector(`#totalTrolley-${recipeId}`);

        var totalSalesOrder = parseInt(totalSalesOrderField.value, 10) || 0;
        var totalTray = parseInt(totalTrayField.value, 10) || 0;
        var totalTrolley = parseInt(totalTrolleyField.value, 10) || 0;

        // Adjust the totals based on the old and new values
        totalSalesOrder = totalSalesOrder - oldProductSalesOrder + updatedProductSalesOrder;
        totalTray = totalTray - oldTray + updatedTray;
        totalTrolley = totalTrolley - oldTrolley + updatedTrolley;

        // Update the UI with the recalculated totals
        if (totalSalesOrderField) totalSalesOrderField.value = totalSalesOrder;
        if (totalTrayField) totalTrayField.value = totalTray;
        if (totalTrolleyField) totalTrolleyField.value = totalTrolley;

        var updatedSaleDate = document.getElementById("saleDate").value;
        var updatedExpiryDate = document.getElementById("expiryDate").value;
        var updatedRemarks = document.getElementById("remarks").value;

        // Update the edit button's data-attributes with the new values
        editButton.setAttribute('data-sales-order', updatedProductSalesOrder);
        editButton.setAttribute('data-tray', updatedTray);
        editButton.setAttribute('data-trolley', updatedTrolley);
        editButton.setAttribute('data-sale-date', updatedSaleDate);
        editButton.setAttribute('data-expiry-date', updatedExpiryDate);
        editButton.setAttribute('data-remarks', updatedRemarks);

        updateRecipeCalculations(recipeId)

        var modal = document.getElementById('productModal');
        modal.style.display = 'none';
    }

    function updateRecipeCalculations(recipeId) {
        const salesOrderInput = document.querySelector(`#salesOrder-${recipeId}`);
        const wasteInput = document.querySelector(`#waste-${recipeId}`);
        const batchSizeInput = document.querySelector(`#batchSize-${recipeId}`);
        const batchesInput = document.querySelector(`#batches-${recipeId}`);
        const productionRateInput = document.querySelector(`#productionRate-${recipeId}`);
        const cycleTimeInput = document.querySelector(`#cycleTime-${recipeId}`);
        const stdTimeInput = document.querySelector(`#stdTime-${recipeId}`);
        const timeVariableInput = document.querySelector(`#timeVariable-${recipeId}`);

        calculateBatchesToProduce(salesOrderInput.value, wasteInput.value, batchSizeInput.value, batchesInput);
        calculateCycleTime(batchSizeInput.value, productionRateInput.value, timeVariableInput.value, cycleTimeInput);
        calculateStdTime(batchesInput.value, cycleTimeInput.value, stdTimeInput, recipeId);
    }

    document.getElementById("productForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent the default form submission
        updateProduct();
    });

    // Attach event listeners to each stdTime input field in the recipe forms
    document.querySelectorAll('.recipe-form [name="stdTime"]').forEach(stdTimeInput => {
        stdTimeInput.addEventListener('change', function () {
            let recipeId = this.form.getAttribute('data-recipe-id');
            updateActivityTimesBasedOnStdTime(this.value, recipeId);
        });
    });

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

    function updateActivityTimesBasedOnStdTime(stdTime, recipeId) {
        let activityStepsDiv = document.querySelector(`.activity-steps[data-recipe-id='${recipeId}']`);

        if (activityStepsDiv) {
            let spongeStartTimeElement = activityStepsDiv.querySelector('#spongeStartTimeTracker');
            let spongeEndTimeElement = activityStepsDiv.querySelector('#spongeEndTimeTracker');
            let doughStartTimeElement = activityStepsDiv.querySelector('#doughStartTimeTracker');
            let doughEndTimeElement = activityStepsDiv.querySelector('#doughEndTimeTracker');
            let firstLoafPackedElement = activityStepsDiv.querySelector('#firstLoafPackedTracker');
            let cutOffTimeElement = activityStepsDiv.querySelector('#cutOffTimeTracker');

            if (!spongeStartTimeElement || !spongeEndTimeElement || !doughStartTimeElement ||
                !doughEndTimeElement || !firstLoafPackedElement || !cutOffTimeElement) {
                console.error('One or more elements not found for recipeId:', recipeId);
                return;
            }

            let spongeStartTime = spongeStartTimeElement.textContent;

            let spongeEndTime = calculateSpongeEndTime(spongeStartTime, stdTime);
            spongeEndTimeElement.textContent = spongeEndTime;

            let doughStartTime = calculateDoughStartTime(spongeEndTime);
            doughStartTimeElement.textContent = doughStartTime;

            let doughEndTime = calculateDoughEndTime(doughStartTime, stdTime);
            doughEndTimeElement.textContent = doughEndTime;

            let firstLoafPackedTime = calculateFirstLoafPacked(doughEndTime);
            firstLoafPackedElement.textContent = firstLoafPackedTime;

            let cutOffTime = calculateCutOffTime(firstLoafPackedTime, stdTime);
            cutOffTimeElement.textContent = cutOffTime;
        } else {
            console.error('Activity steps div not found for recipeId:', recipeId);
        }
        updateSubsequentRecipes(recipeId);
    }

    function updateSubsequentRecipes(recipeId) {
        let currentRecipeId = recipeId;
        let previousSpongeEndTime = null;

        // Find the container of the current recipe form
        const currentRecipeContainer = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}']`).closest('.tabcontent');

        if (currentRecipeContainer) {
            const allRecipeForms = currentRecipeContainer.querySelectorAll('.recipe-form');

            allRecipeForms.forEach(form => {
                const nextRecipeId = form.getAttribute('data-recipe-id');
                if (nextRecipeId === currentRecipeId) {
                    // Get the sponge end time for this recipe
                    const spongeEndTimeSpan = document.querySelector(`.activity-steps[data-recipe-id='${nextRecipeId}'] #spongeEndTimeTracker`);
                    if (spongeEndTimeSpan) {
                        previousSpongeEndTime = spongeEndTimeSpan.textContent;
                    }
                    currentRecipeId = null; // Reset to find the next recipe
                } else if (currentRecipeId === null && previousSpongeEndTime) {
                    // Update times for the next recipe
                    const newStartTime = new Date(previousSpongeEndTime);
                    newStartTime.setMinutes(newStartTime.getMinutes() + 45); // Add 45 minutes buffer
                    updateRecipeTimes(nextRecipeId, formatDateTime(newStartTime));

                    // Update previousSpongeEndTime for the next iteration
                    const spongeEndTimeSpan = document.querySelector(`.activity-steps[data-recipe-id='${nextRecipeId}'] #spongeEndTimeTracker`);
                    if (spongeEndTimeSpan) {
                        previousSpongeEndTime = spongeEndTimeSpan.textContent;
                    }
                }
            });
        }
    }

    function updateRecipeTimes(recipeId, newStartTime) {
        const spongeStartTimeInput = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}'] [name="spongeStartTime"]`);
        if (spongeStartTimeInput) {
            spongeStartTimeInput.value = newStartTime;

            // Calculate and update all dependent times
            const stdTime = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}'] [name="stdTime"]`).value;

            const newSpongeEndTime = calculateSpongeEndTime(newStartTime, stdTime);
            const newDoughStartTime = calculateDoughStartTime(newSpongeEndTime);
            const newDoughEndTime = calculateDoughEndTime(newDoughStartTime, stdTime);
            const newFirstLoafPackedTime = calculateFirstLoafPacked(newDoughEndTime);
            const newCutOffTime = calculateCutOffTime(newFirstLoafPackedTime, stdTime);

            updateTracker(recipeId, newStartTime, newSpongeEndTime, newDoughStartTime, newDoughEndTime, newFirstLoafPackedTime, newCutOffTime);
        }
    }

    function updateFlatpickrInstance(recipeId, newTime) {
        var originalDate = newTime; // Get the original date string
        var formattedDate = moment(originalDate, "dddd, DD MMM YYYY HH:mm").format("YYYY-MM-DD HH:mm");
        if (!flatpickrInstances[recipeId]) {
            console.error('Flatpickr instance not found for recipeId:', recipeId);
            return;
        }
        var flatpickrInstance = flatpickrInstances[recipeId];

        // Temporarily remove the onChange event
        var currentOnChange = flatpickrInstance.config.onChange;
        flatpickrInstance.set('onChange', null);

        // Set the new date
        flatpickrInstance.setDate(formattedDate, true);

        // Re-assign the onChange event
        flatpickrInstance.set('onChange', currentOnChange);
    }


    function updateTracker(recipeId, spongeStartTime, spongeEndTime, doughStartTime, doughEndTime, firstLoafPackedTime, cutOffTime) {
        const recipeTrackerDiv = document.querySelector(`.activity-steps[data-recipe-id='${recipeId}']`);

        if (recipeTrackerDiv) {
            const spongeStartTimeElement = recipeTrackerDiv.querySelector('#spongeStartTimeTracker');
            const spongeEndTimeElement = recipeTrackerDiv.querySelector('#spongeEndTimeTracker');
            const doughStartTimeElement = recipeTrackerDiv.querySelector('#doughStartTimeTracker');
            const doughEndTimeElement = recipeTrackerDiv.querySelector('#doughEndTimeTracker');
            const firstLoafPackedElement = recipeTrackerDiv.querySelector('#firstLoafPackedTracker');
            const cutOffTimeElement = recipeTrackerDiv.querySelector('#cutOffTimeTracker');

            if (spongeStartTimeElement) spongeStartTimeElement.textContent = spongeStartTime;
            if (spongeEndTimeElement) spongeEndTimeElement.textContent = spongeEndTime;
            if (doughStartTimeElement) doughStartTimeElement.textContent = doughStartTime;
            if (doughEndTimeElement) doughEndTimeElement.textContent = doughEndTime;
            if (firstLoafPackedElement) firstLoafPackedElement.textContent = firstLoafPackedTime;
            if (cutOffTimeElement) cutOffTimeElement.textContent = cutOffTime;

            // Update the form fields as well
            const recipeForm = document.querySelector(`.recipe-form[data-recipe-id='${recipeId}']`);
            if (recipeForm) {
                const spongeStartTimeInput = recipeForm.querySelector('[name="spongeStartTime"]');
                const spongeEndTimeInput = recipeForm.querySelector('[name="spongeEndTime"]');
                const doughStartTimeInput = recipeForm.querySelector('[name="doughStartTime"]');
                const doughEndTimeInput = recipeForm.querySelector('[name="doughEndTime"]');
                const firstLoafPackedInput = recipeForm.querySelector('[name="firstLoafPacked"]');
                const cutOffTimeInput = recipeForm.querySelector('[name="cutOffTime"]');

                if (spongeStartTimeInput) spongeStartTimeInput.value = spongeStartTime;
                if (spongeEndTimeInput) spongeEndTimeInput.value = spongeEndTime;
                if (doughStartTimeInput) doughStartTimeInput.value = doughStartTime;
                if (doughEndTimeInput) doughEndTimeInput.value = doughEndTime;
                if (firstLoafPackedInput) firstLoafPackedInput.value = firstLoafPackedTime;
                if (cutOffTimeInput) cutOffTimeInput.value = cutOffTime;
            }
        }
        updateFlatpickrInstance(recipeId, spongeStartTime);
    }

    function calculateSpongeEndTime(spongeStartTimeValue, stdTime) {
        let spongeStartTime = new Date(spongeStartTimeValue);
        let durationSeconds = convertToSeconds(stdTime) + SPONGE_MIXING;
        spongeStartTime.setSeconds(spongeStartTime.getSeconds() + durationSeconds);
        return formatDateTime(spongeStartTime);
    }

    function calculateDoughStartTime(spongeEndTime) {
        let spongeEndTimeDate = new Date(spongeEndTime);
        let doughStartTime = new Date(spongeEndTimeDate.getTime() + FERMENTATION * 1000);
        return formatDateTime(doughStartTime);
    }

    function calculateDoughEndTime(doughStartTime, stdTime) {
        let doughStartTimeDate = new Date(doughStartTime);
        let doughEndTime = new Date(doughStartTimeDate.getTime() + convertToSeconds(stdTime) * 1000);
        return formatDateTime(doughEndTime);
    }

    function calculateFirstLoafPacked(doughEndTime) {
        let doughEndTimeDate = new Date(doughEndTime);
        let firstLoafPackedTime = new Date(doughEndTimeDate.getTime() +
            DOUGH_MIXING * 1000 +
            FLOOR_TIME * 1000 +
            MAKEUP_TIME * 1000 +
            FINAL_PROOF * 1000 +
            BAKING * 1000 +
            COOLING * 1000 +
            PACKING * 1000
        );
        return formatDateTime(firstLoafPackedTime);
    }

    function calculateCutOffTime(firstLoafPackedTime, stdTime) {
        let firstLoafPackedTimeDate = new Date(firstLoafPackedTime);
        let cutOffTime = new Date(firstLoafPackedTimeDate.getTime() + convertToSeconds(stdTime) * 1000);
        return formatDateTime(cutOffTime);
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

    document.querySelectorAll('.modal').forEach(function (modal) {
        const searchField = modal.querySelector('#searchField');
        const resultsDiv = modal.querySelector('#searchResults');

        if (searchField) {
            searchField.addEventListener('input', function () {
                const query = this.value;

                if (query.length > 0) {
                    fetch('/search/?query=' + query)
                        .then(response => response.json())
                        .then(data => {
                            var results = data.recipes;
                            resultsDiv.innerHTML = '';
                            resultsDiv.style.display = 'block';

                            if (results.length === 0) {
                                resultsDiv.innerHTML = '<div>Nothing found.</div>';
                            } else {
                                results.forEach(function (recipe, index) {
                                    var div = document.createElement('div');
                                    var regex = new RegExp(query, 'gi');
                                    var highlightedName = recipe.recipeName.replace(regex, function (match) { return `<strong>${match}</strong>`; });
                                    div.innerHTML = highlightedName;
                                    div.onclick = function () {
                                        console.log("Recipe clicked:", recipe);

                                        var cycleTimeVarInSeconds = recipe.cycleTimeVariable;
                                        var formattedCycleTime = convertToHHMMSS(cycleTimeVarInSeconds);
                                        console.log("Formatted Cycle Time:", formattedCycleTime);

                                        // Call the function to set modal field values
                                        setModalFieldValues(recipe);

                                        resultsDiv.style.display = 'none';
                                    };
                                    resultsDiv.appendChild(div);
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching recipes:', error);
                        });
                } else {
                    resultsDiv.innerHTML = '';
                    resultsDiv.style.display = 'none';
                }
            });
        }
    });

    function setModalFieldValues(recipe) {
        // Set the recipe name
        document.getElementById('recipeName').value = recipe.recipeName;

        // Set the cycle time variable (convert seconds to HH:MM:SS format)
        var cycleTimeVarInSeconds = recipe.cycleTimeVariable;
        var formattedCycleTime = convertToHHMMSS(cycleTimeVarInSeconds);
        document.getElementById('timeVariable').value = formattedCycleTime;

        // Set the production rate and batch size
        document.getElementById('prodRate').value = recipe.productionRate;
        document.getElementById('batchSize').value = recipe.stdBatchSize;

        var cycleTimeValue = calculateCycleTimeSearch(recipe.stdBatchSize, recipe.productionRate, cycleTimeVarInSeconds);
        document.getElementById('cycleTime').value = cycleTimeValue;
        console.log('cycleTimeValue:', cycleTimeValue);
    }

    window.onclick = function (event) {
        // Get all elements with the class 'modal'
        var modals = document.getElementsByClassName('modal');

        // Iterate over each modal
        for (var i = 0; i < modals.length; i++) {
            var modal = modals[i];

            // Check if the click event target is the modal itself
            if (event.target == modal) {
                // Close the modal
                modal.style.display = "none";
            }
        }
    }

    document.getElementById('createJobOrderButton').addEventListener('click', function () {
        var dropdownContent = document.getElementById('dropdownContent');
        dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
    });

    // Optional: Close the dropdown if the user clicks outside of it
    window.onclick = function (event) {
        if (!event.target.matches('#createJobOrderButton')) {
            var dropdowns = document.getElementsByClassName('dropdown-content');
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.style.display === 'block') {
                    openDropdown.style.display = 'none';
                }
            }
        }
    }


    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
    }

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');


    searchInput.addEventListener('keyup', function () {
        const query = this.value;
        const escapedQuery = escapeRegExp(query);

        if (query.length > 0) {
            searchResults.style.display = 'block';

            fetch('/search/?q=' + encodeURIComponent(query))
                .then(response => response.json())
                .then(data => {
                    searchResults.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach(item => {
                            const regex = new RegExp(escapedQuery, 'gi');
                            const highlightedText = item.jobOrderId.replace(regex, match => `<strong>${match}</strong>`);
                            const div = document.createElement('div');
                            div.className = 'search-item';
                            div.innerHTML = highlightedText;
                            div.dataset.jobOrderId = item.jobOrderId;
                            div.dataset.jobOrderStatus = item.jobOrderStatus; // If you're using jobOrderStatus
                            searchResults.appendChild(div);
                        });
                    } else {
                        searchResults.innerHTML = '<div class="search-item">No Results Found</div>';
                    }
                });
        } else {
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
        }
    });

    searchResults.addEventListener('click', function (event) {
        const target = event.target;
        if (target.classList.contains('search-item')) {
            const jobOrderId = target.dataset.jobOrderId;
            const jobOrderStatus = target.dataset.jobOrderStatus; // Retrieve job order status

            // Store in localStorage
            localStorage.setItem('jobOrderId', jobOrderId);
            localStorage.setItem('jobOrderStatus', jobOrderStatus);

            // Redirect to the correct URL
            window.location.href = '/details/' + jobOrderId + '/';
        }
    });

    searchInput.addEventListener('focus', function () {
        if (this.value.length > 0) {
            searchResults.style.display = 'block';
        }
    });


    // Function to close modal
    function closeAllModal(modal) {
        modal.style.display = 'none';
    }

    // Function to initialize modals
    function initializeModals() {
        // Get all modals
        var modals = document.querySelectorAll('.modal');

        // Add click event listener to each modal
        modals.forEach(function (modal) {
            // When the user clicks anywhere outside of the modal content, close it
            window.addEventListener('click', function (event) {
                if (event.target == modal) {
                    closeAllModal(modal);
                }
            });
        });
    }

    // Get all close buttons
    var closeButtons = document.querySelectorAll('.modal-close');

    // Add click event listener to close buttons to close the modal
    closeButtons.forEach(function (btn) {
        btn.onclick = function () {
            var modal = btn.closest('.modal');
            closeAllModal(modal);
        }
    });

    // Call the function to initialize modals
    initializeModals();
});

function formatDate(dateString) {
    var date = new Date(dateString);
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based
    var day = ('0' + date.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
}


// Add event listener for Product Price inputs
document.querySelectorAll("[id=newProductPrice]").forEach(function (input) {
    input.addEventListener("input", function () {
        let val = this.value.replace(/[^0-9]/g, '');
        while (val.length < 4) {
            val = '0' + val;
        }
        let formattedValue = (parseInt(val.substring(0, 2)) + '.' + parseInt(val.substring(2, 4))).toString();
        this.value = formattedValue;
    });
});

// Add event listener for Product Name inputs
document.querySelectorAll("[id=productName]").forEach(function (input) {
    input.addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    });
});

// Add event listener for Product Price inputs
document.querySelectorAll("[id=productPrice]").forEach(function (input) {
    input.addEventListener("input", function () {
        let val = this.value.replace(/[^0-9]/g, '');
        while (val.length < 4) {
            val = '0' + val;
        }
        let formattedValue = (parseInt(val.substring(0, 2)) + '.' + parseInt(val.substring(2, 4))).toString();
        this.value = formattedValue;
    });
});

// Add event listener for Product Name inputs
document.querySelectorAll("[id=newProductName]").forEach(function (input) {
    input.addEventListener("input", function () {
        this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    });
});

// Add event listener for Recipe Name input
document.querySelectorAll("[id=searchField]").forEach(function (input) {
    // Convert to uppercase and restrict non-alphanumeric on input event
    input.addEventListener("input", function (e) {
        this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    });
});

// Add event listener for Recipe Name input
document.querySelectorAll("[id=recipeName]").forEach(function (input) {
    // Convert to uppercase and restrict non-alphanumeric on input event
    input.addEventListener("input", function (e) {
        this.value = this.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    });
});

function populateAndShowProductModal(editButton) {
    // Retrieve product data from "hidden"
    var recipeId = editButton.getAttribute('data-recipe-id');
    console.log('recipeId:', recipeId);
    var productId = editButton.getAttribute('data-product-id');
    console.log('productId:', productId);
    var productName = editButton.getAttribute('data-product-name');
    console.log('productName:', productName);
    var salesOrder = editButton.getAttribute('data-sales-order');
    console.log('salesOrder:', salesOrder);
    var productPrice = editButton.getAttribute('data-product-price');
    console.log('productPrice:', productPrice);
    var currency = editButton.getAttribute('data-currency');
    console.log('currency:', currency);
    var client = editButton.getAttribute('data-client');
    console.log('client:', client);
    var colorSet = editButton.getAttribute('data-color-set');
    console.log('colorSet:', colorSet);
    var expiryDate = editButton.getAttribute('data-expiry-date');
    console.log('expiryDate (before conversion):', expiryDate);
    var weight = editButton.getAttribute('data-weight');
    console.log('weight:', weight);
    var saleDate = editButton.getAttribute('data-sale-date');
    console.log('saleDate (before conversion):', saleDate);
    var noOfSlices = editButton.getAttribute('data-no-of-slices');
    console.log('noOfSlices:', noOfSlices);
    var thickness = editButton.getAttribute('data-thickness');
    console.log('thickness:', thickness);
    var tray = editButton.getAttribute('data-tray');
    console.log('tray:', tray);
    var trolley = editButton.getAttribute('data-trolley');
    console.log('trolley:', trolley);
    var remarks = editButton.getAttribute('data-remarks');
    console.log('remarks:', remarks);

    // Populate the modal fields with data
    document.getElementById('productName').value = productName;
    document.getElementById('productSalesOrder').value = salesOrder;
    document.getElementById('productPrice').value = productPrice;
    document.getElementById('currency').value = currency;
    document.getElementById('client').value = client;
    document.getElementById('colorSet').value = colorSet;
    document.getElementById('expiryDate').value = expiryDate;
    document.getElementById('saleDate').value = saleDate;
    document.getElementById('noOfSlices').value = noOfSlices;
    document.getElementById('thickness').value = thickness;
    document.getElementById('tray').value = tray;
    document.getElementById('trolley').value = trolley;
    document.getElementById('remarks').value = remarks;
    document.getElementById("productId").value = productId;
    document.getElementById("recipeId").value = recipeId;

    var weightSelect = document.getElementById('weight');
    var weightOptions = weightSelect.options;
    var iconWeight = parseInt(editButton.getAttribute('data-weight'), 10);

    for (var i = 0; i < weightOptions.length; i++) {
        var optionWeight = parseInt(weightOptions[i].getAttribute('data-weight'), 10);
        if (optionWeight === iconWeight) {
            weightOptions[i].selected = true;
            console.log('Selected weight:', weightOptions[i].value);
            break;
        }
    }

    document.querySelectorAll('#saleDate').forEach(function (el) {
        var saleDate = el.value; // Get the original date string
        var formattedSaleDate = formatDate(saleDate); // Use the modified formatDateTime function

        flatpickr(el, {
            altInput: true,
            altFormat: "l, d M Y",
            dateFormat: "Y-m-d",
            defaultDate: formattedSaleDate,
            minDate: "today", // Set the minDate to the formatted date
            // other options you want to set
        });
    });

    // Initialize Flatpickr for Expiry Date
    document.querySelectorAll('#expiryDate').forEach(function (el) {
        var expiryDate = el.value; // Get the original date string
        var formattedExpiryDate = formatDate(expiryDate); // Use the modified formatDateTime function

        flatpickr(el, {
            altInput: true,
            altFormat: "l, d M Y",
            dateFormat: "Y-m-d",
            defaultDate: formattedExpiryDate,
            minDate: "today", // Set the minDate to the formatted date
            // other options you want to set
        });
    });

    console.log('expiryDate (after conversion):', formatDate(expiryDate));
    console.log('saleDate (after conversion):', formatDate(saleDate));

    // Show the modal
    var productModal = document.getElementById('productModal');
    productModal.style.display = 'block';
}

function calculateTrayAndTrolley(productSalesOrder, weightElement, clientElement, trayElement, trolleyElement) {
    console.log(weightElement.value);
    var clientValue = clientElement.value;
    var weightValue = weightElement.value;
    var salesOrderValue = parseFloat(productSalesOrder.value);
    console.log(salesOrderValue);

    var divisor = (clientValue === 'GFS') ? 12 : (clientValue === 'GBKL') ? 15 : 12;

    if (!isNaN(weightValue) && !isNaN(salesOrderValue) && weightValue > 0) {
        var trays = salesOrderValue / weightValue;
        trayElement.value = Math.ceil(trays);
        console.log(trays);

        var trolleys = trays / divisor;
        trolleyElement.value = Math.ceil(trolleys);
        console.log(trolleys);
    } else {
        console.error('Invalid weight or sales order value');
        trayElement.value = '';
        trolleyElement.value = '';
    }
}

var salesOrderElement = document.getElementById('productSalesOrder');
var weightElement = document.getElementById('weight');
var trayElement = document.getElementById('tray');
var trolleyElement = document.getElementById('trolley');
var clientElement = document.getElementById('client');
var editProductModalButton = document.getElementById('editProductModalButton');

// Add event listeners to productSalesOrder and weight
salesOrderElement.addEventListener('input', function () {
    calculateTrayAndTrolley(salesOrderElement, weightElement, client, trayElement, trolleyElement);
});

weightElement.addEventListener('input', function () {
    calculateTrayAndTrolley(salesOrderElement, weightElement, client, trayElement, trolleyElement);
});

clientElement.addEventListener('input', function () {
    // Get the selected client value
    var selectedClient = this.value;

    var recipeDateAttribute = editProductModalButton.getAttribute('data-recipe-date');

    if (recipeDateAttribute && selectedClient) {
        var recipeDate = new Date(recipeDateAttribute);
        var dayOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        var dayName = dayOfWeek[recipeDate.getDay()]; // Get the day name

        // Get the selected color based on client and day of the week
        var selectedColor = getColorForClient(selectedClient, dayName);

        // Update the colorSetField with the selected color
        updateColorSetField(selectedColor);
    } else {
        // Handle cases where the data or recipe details are not set
        console.error("Recipe date or selected client is not set. Cannot update the ColorSetField.");
    }
    calculateTrayAndTrolley(salesOrderElement, weightElement, clientElement, trayElement, trolleyElement);
});

function getColorForClient(client, dayOfWeek) {
    switch (client) {
        case "GFS":
            switch (dayOfWeek) {
                case "SUNDAY": return "WHITE";
                case "MONDAY": return "TAN";
                case "TUESDAY": return "ORANGE";
                case "WEDNESDAY": return "YELLOW";
                case "THURSDAY": return "BLUE";
                case "FRIDAY": return "DARK GREEN";
                case "SATURDAY": return "RED";
                default: return "DEFAULT_COLOR";
            }
        case "GBKL":
            switch (dayOfWeek) {
                case "SUNDAY": return "TAN";
                case "MONDAY": return "BLUE";
                case "TUESDAY": return "YELLOW";
                case "WEDNESDAY": return "ORANGE";
                case "THURSDAY": return "GREEN";
                case "FRIDAY": return "RED";
                case "SATURDAY": return "WHITE";
                default: return "DEFAULT_COLOR";
            }
        default:
            return "DEFAULT_COLOR";
    }
}

// Function to update the ColorSetField
function updateColorSetField(selectedColor) {
    var colorSetField = document.getElementById('colorSet');
    console.log('colorSetField:', colorSetField); // Debug line to check if colorSetField is found
    if (colorSetField) {
        colorSetField.value = selectedColor;
        console.log('Updated colorSetField with:', selectedColor); // Debug line to check if value is set
    }
}

function submitJobOrder(jobOrderId) {
    const url = `/update/${jobOrderId}/`; // Replace with the correct URL
    let recipes = [];
    isFormSubmission = true;
    let allProducts = collectAllProductData();

    // Collect recipes data
    document.querySelectorAll('.recipe-form').forEach(form => {
        const recipeId = form.getAttribute('data-recipe-id');
        let recipeData = {
            recipeId: recipeId,
            prodRate: form.querySelector('[name="productionRate"]').value,
            batchSize: form.querySelector('[name="batchSize"]').value,
            totalSales: form.querySelector('[name="salesOrder"]').value,
            batches: form.querySelector('[name="batches"]').value,
            waste: form.querySelector('[name="waste"]').value,
            beltNo: form.querySelector('[name="beltNo"]').value,
            gap: form.querySelector('[name="gap"]').value,
            stdTime: form.querySelector('[name="stdTime"]').value,
            cycleTime: form.querySelector('[name="cycleTime"]').value,
            timeVariable: form.querySelector('[name="timeVariable"]').value,
            totalTray: form.querySelector('[name="totalTray"]').value,
            totalTrolley: form.querySelector('[name="totalTrolley"]').value,
            spongeStartTime: form.querySelector('[name="spongeStartTime"]').value,
            activity: getActivityData(recipeId)
        };
        recipes.push(recipeData);
    });

    const data = {
        recipes: recipes,
        products: allProducts // Add the temporaryProducts to the data being sent
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'), // Assumes a function to get CSRF token
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            window.location.href = `/details/${jobOrderId}/`;
        })
        .catch((error) => {
            console.error('Error:', error);
            // Handle errors here (e.g., display an error message)
        });
}

function getActivityData(recipeId) {
    // Find the container for the activity steps for this recipe
    const activityStepsDiv = document.querySelector(`.activity-steps[data-recipe-id='${recipeId}']`);

    // Extract the time values from the activity steps
    let activityData = {
        spongeStart: activityStepsDiv.querySelector('#spongeStartTimeTracker').textContent,
        spongeEnd: activityStepsDiv.querySelector('#spongeEndTimeTracker').textContent,
        doughStart: activityStepsDiv.querySelector('#doughStartTimeTracker').textContent,
        doughEnd: activityStepsDiv.querySelector('#doughEndTimeTracker').textContent,
        firstLoafPacked: activityStepsDiv.querySelector('#firstLoafPackedTracker').textContent,
        cutOffTime: activityStepsDiv.querySelector('#cutOffTimeTracker').textContent
    };

    return activityData;
}

function collectAllProductData() {
    let allProducts = [];

    // Select all product-edit icons
    document.querySelectorAll('.product-item').forEach(productItem => {
        let editIcon = productItem.querySelector('i.fa-edit');
        if (editIcon) {
            let productData = {
                productId: editIcon.getAttribute('data-product-id'),
                productName: editIcon.getAttribute('data-product-name'),
                productSalesOrder: editIcon.getAttribute('data-sales-order'),
                productPrice: editIcon.getAttribute('data-product-price'),
                currency: editIcon.getAttribute('data-currency'),
                client: editIcon.getAttribute('data-client'),
                colorSet: editIcon.getAttribute('data-color-set'),
                expiryDate: editIcon.getAttribute('data-expiry-date'),
                saleDate: editIcon.getAttribute('data-sale-date'),
                weight: editIcon.getAttribute('data-weight'),
                noOfSlices: editIcon.getAttribute('data-no-of-slices'),
                thickness: editIcon.getAttribute('data-thickness'),
                tray: editIcon.getAttribute('data-tray'),
                trolley: editIcon.getAttribute('data-trolley'),
                productRemarks: editIcon.getAttribute('data-remarks'),
                recipeId: editIcon.getAttribute('data-recipe-id'),
                // ... include other attributes as needed ...
            };
            allProducts.push(productData);
        }
    });
    return allProducts;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to open the modal and set the product information
function openProductAlertModal(productElement) {
    var productName = productElement.getAttribute('data-product-name');
    var recipeName = productElement.getAttribute('data-recipe-name');
    var productId = productElement.getAttribute('data-product-id');
    console.log(productName)

    document.getElementById('alertProductNamePlaceholder').textContent = productName;
    document.getElementById('alertRecipeNamePlaceholder').textContent = recipeName;
    document.getElementById('productConfirmDelete').setAttribute('data-product-id', productId);
    document.getElementById('productAlertModal').style.display = 'block';
}

document.getElementById('productConfirmDelete').addEventListener('click', function () {
    var productId = this.getAttribute('data-product-id');
    // Get the edit button for the current product
    var editButton = document.querySelector(`i.fa-edit[data-product-id='${productId}']`);
    if (!editButton) {
        console.error('Edit button not found for product', productId);
        return;
    }

    var recipeId = editButton.getAttribute('data-recipe-id');

    // Parse and subtract product values from recipe totals
    var trayToRemove = parseInt(editButton.getAttribute('data-tray')) || 0;
    var trolleyToRemove = parseInt(editButton.getAttribute('data-trolley')) || 0;
    var salesOrderToRemove = parseInt(editButton.getAttribute('data-sales-order')) || 0;

    var recipeTotalTrayElement = document.querySelector(`#totalTray-${recipeId}`);
    var recipeTotalTrolleyElement = document.querySelector(`#totalTrolley-${recipeId}`);
    var recipeTotalSalesElement = document.querySelector(`#salesOrder-${recipeId}`);

    var currentTray = parseInt(recipeTotalTrayElement.value) || 0;
    var currentTrolley = parseInt(recipeTotalTrolleyElement.value) || 0;
    var currentSales = parseInt(recipeTotalSalesElement.value) || 0;

    recipeTotalTrayElement.value = Math.max(0, currentTray - trayToRemove);
    recipeTotalTrolleyElement.value = Math.max(0, currentTrolley - trolleyToRemove);
    recipeTotalSalesElement.value = Math.max(0, currentSales - salesOrderToRemove);

    // Remove the product item from the UI
    var productElement = document.querySelector(`.product-item[data-product-id='${productId}']`);
    if (productElement) {
        productElement.remove();
    }

    // Close the modal
    document.getElementById('productAlertModal').style.display = 'none';
});


// Close modal functionality
document.querySelector('.modal-close').addEventListener('click', function () {
    document.getElementById('productAlertModal').style.display = 'none';
});

document.getElementById('productCancelDelete').addEventListener('click', function () {
    document.getElementById('productAlertModal').style.display = 'none';
});

document.getElementById('cancelDelete').addEventListener('click', function () {
    document.getElementById('alertModal').style.display = 'none';
});


window.addEventListener('beforeunload', function (e) {
    if (!isFormSubmission) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? You have unsaved changes.';
    }
});