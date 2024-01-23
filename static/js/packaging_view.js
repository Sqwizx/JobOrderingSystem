document.addEventListener('DOMContentLoaded', function () {
    var dateTabs = document.querySelectorAll('.tablinks');
    // Ensure this logic is applied when a main tab is clicked
    dateTabs.forEach(function (tab) {
        tab.addEventListener('click', function (event) {
            setActiveTab(tab);
        });
    });

    function setActiveTab(selectedTab) {
        dateTabs.forEach(function (tab) {
            tab.classList.remove('active');
        });
        selectedTab.classList.add('active');

        var day = selectedTab.getAttribute('data-day');
        openDateTab(day);
        activateFirstProductAndRecipe(selectedTab.getAttribute('data-day'));
    }


    function activateFirstProductAndRecipe(day) {
        var productItemsForDay = document.querySelectorAll('.product-item[data-day="' + day + '"]');
        if (productItemsForDay.length > 0) {
            setActiveProductItem(productItemsForDay[0]);
        }
    }
    function openDateTab(day) {
        // Hide all product items first
        var allProductItems = document.querySelectorAll('.product-item');
        allProductItems.forEach(function (item) {
            item.style.display = 'none';
            item.classList.remove('active');
        });

        // Show product items for the selected day
        var productItemsForDay = document.querySelectorAll('.product-item[data-day="' + day + '"]');
        if (productItemsForDay.length > 0) {
            productItemsForDay.forEach(function (item) {
                item.style.display = 'block';
            });
            setActiveProductItem(productItemsForDay[0]);
        }

        // Hide all tab contents first
        var allTabContents = document.querySelectorAll('.tabcontent');
        allTabContents.forEach(function (content) {
            content.style.display = 'none';
        });

        // Show tab content for the selected day
        var selectedTabContent = document.getElementById(day);
        if (selectedTabContent) {
            selectedTabContent.style.display = 'block';
        }
    }


    function setActiveProductItem(product) {
        var productItems = document.querySelectorAll('.product-item');
        productItems.forEach(function (item) {
            item.classList.remove('active');
        });
        console.log("Recipe pressed")
        product.classList.add('active');

        var recipeId = product.getAttribute('data-recipe-id');
        showProductsForRecipe(recipeId);

        var firstRecipeTab = document.querySelector('.tablinks-recipes[data-recipe-id="' + recipeId + '"]');
        if (firstRecipeTab) {
            firstRecipeTab.click();
        }
    }
    function showProductsForRecipe(recipeId) {
        // Hide all recipe tabs first
        var allProductTabs = document.querySelectorAll('.tablinks-recipes');
        allProductTabs.forEach(function (tab) {
            tab.style.display = 'none';
            tab.classList.remove('active'); // Remove the active class if it's there
        });

        // Show recipe tabs for the selected recipe
        var productTabsForRecipe = document.querySelectorAll('.tablinks-recipes[data-recipe-id="' + recipeId + '"]');
        productTabsForRecipe.forEach(function (tab) {
            tab.style.display = 'block';
            if (!tab.classList.contains('active')) {
                tab.classList.add('active'); // Set the first one as active
            }
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

        // Show the recipe form for the selected recipe
        showRecipeForm(recipeId);
    }


    var productItems = document.querySelectorAll('.product-item');
    productItems.forEach(function (product) {
        product.addEventListener('click', function (event) {
            setActiveProductItem(product);
        });
    });

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

    var activeTab = document.querySelector('.tablinks.active');
    if (activeTab) {
        setActiveTab(activeTab);
    }

    // Get the modal
    var reviseModal = document.getElementById("reviseModal");
    var reviseButtons = document.querySelectorAll(".revise-button");

    // When the user clicks the button, open the modal 
    reviseButtons.forEach(function (button) {
        button.onclick = function () {
            reviseModal.style.display = "block";
        }
    });

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

    var submitButton = document.getElementById("submit-revision");

    var revisionModal = document.getElementById("revisionModal");
    var revisionText = document.getElementById("revisionText");

    var alertModal = document.getElementById("alertModal");

    var confirmModal = document.getElementById("confirmModal");

    var alertEditModal = document.getElementById("alertEditModal");

    var confirmDeleteModal = document.getElementById("confirmDeleteModal");

    var activateModal = document.getElementById("activateModal");

    var archiveModal = document.getElementById("archiveModal");

    var deactivateModal = document.getElementById("deactivateModal");

    var productModal = document.getElementById("productModal");


    submitButton.addEventListener('click', function () {
        var jobOrderId = reviseModal.getAttribute('data-joborder-id');
        var revisionData = {
            'revisionText': revisionText.value
        };

        fetch(`/add_revision/${jobOrderId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(revisionData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    reviseModal.style.display = 'none';
                    // Consider clearing the textarea after successful submission
                    revisionText.value = '';
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    });

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

    var hiddenWeightValue = document.getElementById('hiddenWeight').value;
    setSelectedWeight(hiddenWeightValue);

    // Close button for reviseModal
    var closeReviseModal = document.getElementById("closeReviseModal");
    closeReviseModal.onclick = function () {
        reviseModal.style.display = "none";
    }

    // Close button for revisionModal
    var closeRevisionModal = document.getElementById("closeRevisionModal");
    closeRevisionModal.onclick = function () {
        revisionModal.style.display = "none";
    }

    // Close button for alertModal
    var closeAlertModal = document.getElementById("closeAlertModal");
    closeAlertModal.onclick = function () {
        alertModal.style.display = "none";
    }

    var closeConfirmModal = document.getElementById("closeConfirmModal");
    closeConfirmModal.onclick = function () {
        confirmModal.style.display = "none";
    }

    var closeAlertEditModal = document.getElementById("closeAlertEditModal");
    closeAlertEditModal.onclick = function () {
        alertEditModal.style.display = "none";
    }

    var closeConfirmDeleteModal = document.getElementById("closeConfirmDeleteModal");
    closeConfirmDeleteModal.onclick = function () {
        confirmDeleteModal.style.display = "none";
    }

    var closeActivateModal = document.getElementById("closeActivateModal");
    closeActivateModal.onclick = function () {
        activateModal.style.display = "none";
    }

    var closeArchiveModal = document.getElementById("closeArchiveModal");
    closeArchiveModal.onclick = function () {
        archiveModal.style.display = "none";
    }

    var closeDeactivateModal = document.getElementById("closeDeactivateModal");
    closeDeactivateModal.onclick = function () {
        deactivateModal.style.display = "none";
    }

    var closeProductModal = document.getElementById("closeProductModal");
    closeProductModal.onclick = function () {
        productModal.style.display = "none";
    }


    window.onclick = function (event) {
        var modals = document.getElementsByClassName("modal");
        for (var i = 0; i < modals.length; i++) {
            if (event.target == modals[i]) {
                modals[i].style.display = "none";
            }
        }
    }

    var accordions = document.getElementsByClassName("accordion");
    for (var i = 0; i < accordions.length; i++) {
        accordions[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    }

    // Event delegation to handle click on eye icon
    document.querySelector('.product-container').addEventListener('click', function (event) {
        if (event.target.classList.contains('fa-eye')) {
            var recipeId = event.target.closest('.product-item').getAttribute('data-recipe-id');
            fetchRecipeDetails(recipeId);
        }
    });

    function setProgress(percentage, recipeElement) {
        if (!recipeElement) {
            console.error("Invalid recipeElement");
            return;
        }

        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const progressLineOverlay = recipeElement.querySelector('.progressLineOverlay');

        if (!progressLineOverlay) {
            console.error("progressLineOverlay not found in recipeElement", recipeElement);
            return;
        }

        progressLineOverlay.style.top = `${clampedPercentage}%`;
        progressLineOverlay.style.height = `${100 - clampedPercentage}%`;

        const recipeId = recipeElement.dataset.recipeId;
        const currentTime = Math.floor(new Date().getTime() / 1000); // Current time in seconds

        const steps = [
            'spongeStartProgress',
            'spongeEndProgress',
            'doughStartProgress',
            'doughEndProgress',
            'firstLoafPackedProgress',
            'cutOffProgress'
        ];

        steps.forEach(stepBaseId => {
            const stepId = `${stepBaseId}_${recipeId}`;
            const element = recipeElement.querySelector('#' + stepId);
            if (!element) {
                console.error("Step element not found:", stepId);
                return;
            }

            // Retrieve the timestamp for the current step
            const stepTimestamp = parseInt(element.dataset.timestamp, 10);
            if (!stepTimestamp) {
                console.error("Timestamp not found for step:", stepId);
                return;
            }

            const label = element.querySelector('.progressLabel');
            if (!label) {
                console.error("Label not found in step:", stepId);
                return;
            }

            // Check if the current time has passed the step's timestamp
            if (currentTime >= stepTimestamp) {
                element.classList.add('active');
                label.classList.add('active'); // Apply active class to label
            } else {
                element.classList.remove('active');
                label.classList.remove('active'); // Remove active class from label
            }
        });
    }

    function updateProgress() {
        const currentTime = Math.floor(new Date().getTime() / 1000); // Current time in seconds

        document.querySelectorAll('.activity-steps').forEach(recipeElement => {
            const startTime = parseInt(recipeElement.querySelector('.startTime').value, 10);
            const endTime = parseInt(recipeElement.querySelector('.endTime').value, 10);

            const progressPercentage = calculateProgress(startTime, endTime, currentTime);
            setProgress(progressPercentage, recipeElement);
        });
    }

    function calculateProgress(startTime, endTime, currentTime) {
        const totalDuration = endTime - startTime;
        const elapsed = currentTime - startTime;
        return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    }


    // Add click event listener to the whole window.
    window.addEventListener('click', function (event) {
        // Get all modals.
        var modals = document.querySelectorAll('.modal');

        // Loop through each modal.
        modals.forEach(function (modal) {

            // Check if the click is outside of this modal's content.
            if (event.target == modal && modal.style.display === 'block') {
                // Close the modal.
                modal.style.display = 'none';
            }
        });
    });

    // Initial update and interval setup
    updateProgress();
    setInterval(updateProgress, 60000); // Update every minute
});

const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

function fetchRecipeDetails(recipeId) {
    fetch(`/recipe/${recipeId}/`) // Adjust URL as needed
        .then(response => response.json())
        .then(data => {
            populateRecipeModal(data);
            openRecipeModal();
        })
        .catch(error => console.error('Error:', error));
}

function setSelectedWeight(weight) {
    var weightSelect = document.getElementById('weight');
    var weightOptions = weightSelect.options;

    // Make sure weight is an integer
    var numericWeight = parseInt(weight, 10);

    for (var i = 0; i < weightOptions.length; i++) {
        // Parse the data-weight attribute as an integer
        var optionWeight = parseInt(weightOptions[i].getAttribute('data-weight'), 10);

        if (optionWeight === numericWeight) {
            weightOptions[i].selected = true;
            break;
        }
    }
}


function populateRecipeModal(recipe) {
    document.getElementById('recipeName').value = recipe.recipeName || '';
    document.getElementById('productionRate').value = recipe.recipeProdRate || 0;
    document.getElementById('salesOrder').value = recipe.recipeTotalSales || 0;
    document.getElementById('waste').value = recipe.recipeWaste || 0;
    document.getElementById('stdTime').value = recipe.recipeStdTime || '';
    document.getElementById('totalTray').value = recipe.recipeTotalTray || 0;
    document.getElementById('beltNo').value = recipe.recipeBeltNo || 0;
    document.getElementById('dateTimePicker').value = recipe.recipeProdDate || '';
    document.getElementById('batchSize').value = recipe.recipeBatchSize || 0;
    document.getElementById('batches').value = recipe.recipeBatches || 0;
    document.getElementById('cycleTime').value = recipe.recipeCycleTime || '';
    document.getElementById('spongeStartTime').value = recipe.recipeSpongeStartTime || '';
    document.getElementById('totalTrolley').value = recipe.recipeTotalTrolley || 0;
    document.getElementById('gap').value = recipe.recipeGap || '';
    // ...additional fields as needed
}

function openRecipeModal() {
    var modal = document.getElementById('productModal');
    modal.style.display = 'block';
}

function openRevisionsModal(jobOrderId) {
    // Get the modal by ID
    var modal = document.getElementById("revisionModal");

    // Set the job order ID in the modal's data attribute (optional, if needed for further processing)
    modal.setAttribute("data-joborder-id", jobOrderId);

    // Display the modal
    modal.style.display = "block";
}

function editJobOrder(jobOrderId, jobOrderStatus) {
    // Check if the job order status is 'APPROVED'
    if (jobOrderStatus === 'APPROVED') {
        // Open the alertEditModal
        var alertEditModal = document.getElementById('alertEditModal');
        alertEditModal.style.display = 'block';

        // Find the 'Confirm' button and attach click event for redirecting to the edit page
        var confirmEditButton = document.getElementById('confirmEditButton');
        confirmEditButton.onclick = function () {
            redirectToEditPage(jobOrderId);
        };

        // Find the 'Cancel' button to close the modal
        var cancelEditButton = document.getElementById('cancelEditButton');
        cancelEditButton.onclick = function () {
            alertEditModal.style.display = 'none';
        };
    } else {
        // Redirect directly to the edit page for other statuses
        redirectToEditPage(jobOrderId);
    }
}

// Function to redirect to the edit page
function redirectToEditPage(jobOrderId) {
    var editUrl = `/edit/${jobOrderId}/`;
    window.location.href = editUrl;
}

function submitJobOrder(jobOrderId) {
    // Open the alert modal instead of sending the AJAX request immediately
    var alertModal = document.getElementById('alertModal');
    alertModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmButton = document.getElementById('confirmButton');
    confirmButton.onclick = function () {
        submitJobOrderAjax(jobOrderId);
    }

    // Find the 'Cancel' button inside the modal to close it
    var cancelButton = document.getElementById('cancelButton');
    cancelButton.onclick = function () {
        alertModal.style.display = 'none';
    }
}

// Extracted the AJAX call into a separate function
function submitJobOrderAjax(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/submit/${jobOrderId}/`,
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken
        },
        success: function (data) {
            if (data.status === 'success') {
                window.location.reload();
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}

// Optional: Close the modal if the user clicks outside of it
window.onclick = function (event) {
    var alertModal = document.getElementById('alertModal');
    if (event.target == alertModal) {
        alertModal.style.display = "none";
    }
};

function deleteJobOrder(jobOrderId) {
    // Open the confirmDeleteModal instead of sending the AJAX request immediately
    var confirmDeleteModal = document.getElementById('confirmDeleteModal');
    confirmDeleteModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmDeleteButton = document.getElementById('confirmDeleteButton');
    confirmDeleteButton.onclick = function () {
        confirmDeletion(jobOrderId);
    }

    // Find the 'Cancel' button inside the modal to close it
    var cancelDeleteButton = document.getElementById('cancelDeleteButton');
    cancelDeleteButton.onclick = function () {
        confirmDeleteModal.style.display = 'none';
    }

    // Close the modal when clicking on the close (x) button
    var closeConfirmDeleteModal = document.getElementById("closeConfirmDeleteModal");
    closeConfirmDeleteModal.onclick = function () {
        confirmDeleteModal.style.display = "none";
    }
}

// Extracted the AJAX call into a separate function
function confirmDeletion(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/delete/${jobOrderId}/`,  // Update the URL pattern as needed
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken  // Include the CSRF token in the headers
        },
        success: function (data) {
            if (data.status === 'success') {
                // Redirect to the dashboard page on success
                window.location.href = '/';  // Update the URL as needed
            } else {
                // Handle errors or display a message
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            // Handle AJAX errors
            console.error(error);
        }
    });
}

function approveJobOrder(jobOrderId) {
    // Open the confirm modal instead of sending the AJAX request immediately
    var confirmModal = document.getElementById('confirmModal');
    confirmModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmApproveButton = document.getElementById('confirmApproveButton');
    confirmApproveButton.onclick = function () {
        approveJobOrderAjax(jobOrderId);
    }

    // Find the 'Cancel' button inside the modal to close it
    var cancelApproveButton = document.getElementById('cancelApproveButton');
    cancelApproveButton.onclick = function () {
        confirmModal.style.display = 'none';
    }
}

// Extracted the AJAX call into a separate function
function approveJobOrderAjax(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/approve/${jobOrderId}/`,
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken
        },
        success: function (data) {
            if (data.status === 'success') {
                window.location.reload();
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}

function activateJobOrder(jobOrderId) {
    // Display the activateModal
    var activateModal = document.getElementById('activateModal');
    activateModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmActivateButton = document.getElementById('confirmActivateButton');
    confirmActivateButton.onclick = function () {
        activateJobOrderAjax(jobOrderId);
    }

    // Find the 'Cancel' button inside the modal to close it
    var cancelActivateButton = document.getElementById('cancelActivateButton');
    cancelActivateButton.onclick = function () {
        activateModal.style.display = 'none';
    }
}

function activateJobOrderAjax(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/activate/${jobOrderId}/`,  // Adjust the URL based on your URL patterns
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken  // Make sure to pass the CSRF token
        },
        success: function (data) {
            if (data.status === 'success') {
                console.log(data.message);
                location.reload(); // Reload the page
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}

function archiveJobOrder(jobOrderId) {
    // Display the archiveModal
    var archiveModal = document.getElementById('archiveModal');
    archiveModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmArchiveButton = document.getElementById('confirmArchiveButton');
    confirmArchiveButton.onclick = function () {
        archiveJobOrderAjax(jobOrderId);
    }

    // Find the 'Cancel' button inside the modal to close it
    var cancelArchiveButton = document.getElementById('cancelArchiveButton');
    cancelArchiveButton.onclick = function () {
        archiveModal.style.display = 'none';
    }
}

// AJAX call to perform the archive action
function archiveJobOrderAjax(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/archive/${jobOrderId}/`,  // Adjust the URL based on your URL patterns
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken  // Make sure to pass the CSRF token
        },
        success: function (data) {
            if (data.status === 'success') {
                console.log(data.message);
                location.reload();  // Redirect as needed
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}

function deactivateJobOrder(jobOrderId) {
    // Display the deactivateModal
    var deactivateModal = document.getElementById('deactivateModal');
    deactivateModal.style.display = 'block';

    // Find the 'Confirm' button inside the modal and attach the click event
    var confirmDeactivateButton = document.getElementById('confirmDeactivateButton');
    confirmDeactivateButton.onclick = function () {
        sendDeactivateRequest(jobOrderId);
    };

    // Find the 'Cancel' button inside the modal to close it
    var cancelDeactivateButton = document.getElementById('cancelDeactivateButton');
    cancelDeactivateButton.onclick = function () {
        deactivateModal.style.display = 'none';
    };
}

function sendDeactivateRequest(jobOrderId) {
    $.ajax({
        type: "POST",
        url: `/deactivate/${jobOrderId}/`, // URL to Django view
        dataType: "json",
        headers: {
            'X-CSRFToken': csrfToken // CSRF token
        },
        success: function (data) {
            if (data.status === 'success') {
                window.location.reload(); // Reload the page on success
            } else {
                console.error(data.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
}