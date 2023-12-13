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
});

const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

function editJobOrder(jobOrderId) {
    // Construct the URL for the edit_joborder page with the job order ID as a parameter
    var editUrl = `/edit/${jobOrderId}/`;

    // Redirect the user to the edit_joborder page
    window.location.href = editUrl;
}

function submitJobOrder(jobOrderId) {

    // Send a POST request to the submit URL with the jobOrderId
    $.ajax({
        type: "POST",
        url: `/submit/${jobOrderId}/`,  // Update the URL pattern as needed
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

function deleteJobOrder(jobOrderId) {
    // Send a POST request to the delete URL with the jobOrderId
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