document.addEventListener('DOMContentLoaded', function () {
    var tabButtons = document.querySelectorAll('.tablinks');
    tabButtons.forEach(function (button) {
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
        allProducts.forEach(function (product) {
            product.style.display = 'none';
        });
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

        var firstTabLinksRecipe = selectedTabContent.querySelector('.tablinks-recipes');
        if (firstTabLinksRecipe) {
            selectedTabContent.querySelectorAll('.tablinks-recipes').forEach(function (recipeTab) {
                recipeTab.classList.remove('opened');
            });
            firstTabLinksRecipe.classList.add('opened');
            openRecipeTab(firstTabLinksRecipe.getAttribute('data-recipe-id'));
        }
    }

    var tabRecipesButtons = document.querySelectorAll('.tablinks-recipes');
    tabRecipesButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
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
            var productId = event.target.closest('.product-item').getAttribute('data-product-id');
            fetchProductDetails(productId);
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

        let latestActiveStep = null;

        steps.forEach(stepBaseId => {
            const stepId = `${stepBaseId}_${recipeId}`;
            const element = recipeElement.querySelector('#' + stepId);
            if (!element) {
                console.error("Step element not found:", stepId);
                return;
            }

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

            if (currentTime >= stepTimestamp) {
                element.classList.add('active');
                label.classList.add('active');
                latestActiveStep = stepId;
            } else {
                if (stepId !== latestActiveStep) {
                    element.classList.remove('active');
                    label.classList.remove('active');
                }
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

    // Initial update and interval setup
    updateProgress();
    setInterval(updateProgress, 60000); // Update every minute

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

});

const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

function fetchProductDetails(productId) {
    fetch(`/product/${productId}/`) // Adjust URL as needed
        .then(response => response.json())
        .then(data => {
            populateProductModal(data);
            openProductModal();
        })
        .catch(error => console.error('Error:', error));
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
}

function populateProductModal(product) {
    document.getElementById('productName').value = product.productName;
    document.getElementById('productSalesOrder').value = product.productSalesOrder;
    document.getElementById('currency').value = product.currency;
    document.getElementById('productPrice').value = product.productPrice;
    document.getElementById('client').value = product.client;
    document.getElementById('colorSet').value = product.colorSet;
    // Format and display dates
    document.getElementById('expiryDate').value = formatDate(product.productExpDate);
    document.getElementById('saleDate').value = formatDate(product.productSaleDate);

    setSelectedWeight(product.weight);
    document.getElementById('noOfSlices').value = product.noOfSlices;
    document.getElementById('thickness').value = product.thickness;
    document.getElementById('tray').value = product.tray;
    document.getElementById('trolley').value = product.trolley;
    document.getElementById('remarks').value = product.productRemarks;
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

function openProductModal() {
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