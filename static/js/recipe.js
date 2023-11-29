document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById('recipeModal');
    var btn = document.getElementById('createRecipeProfile');
    var span = document.getElementById('closeRecipeModal');

    btn.addEventListener("click", function () {
        modal.style.display = 'block';
    });

    span.addEventListener("click", function () {
        modal.style.display = 'none';
    });

    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

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

    function formatNameInput(inputElem) {
        inputElem.value = inputElem.value.replace(/[^A-Z0-9]/ig, '').toUpperCase();
    }

    var cycleTimeVariableInput = document.getElementById('cycleTimeVariable');
    var recipeNameInput = document.getElementById('recipeName');

    function handleBackspaceAndDelete(inputElem) {
        inputElem.addEventListener('keydown', function (e) {
            if (e.key == 'Backspace' || e.key == 'Delete') {
                e.preventDefault(); // Prevent default backspace behavior
                inputElem.value = '00:00:00'; // Clear the input field
            }
        });
    }

    handleBackspaceAndDelete(cycleTimeVariableInput);

    cycleTimeVariableInput.addEventListener('input', function (e) {
        formatDurationInput(e.target);
    });

    // Apply the formatNameInput function to both create and edit form inputs
    recipeNameInput.addEventListener("input", function () {
        formatNameInput(this);
    });

    // Get all "Edit" buttons
    var editButtons = document.querySelectorAll('.edit-btn');

    // Function to open the recipeEditModal and populate it with recipe data
    function openEditModal(event) {
        // Retrieve the recipe data from the data attributes of the clicked button
        var recipeId = event.currentTarget.getAttribute('data-recipe-id');
        var recipeName = event.currentTarget.getAttribute('data-recipe-name');
        var productionRate = event.currentTarget.getAttribute('data-production-rate');
        var stdBatchSize = event.currentTarget.getAttribute('data-std-batch-size');
        var cycleTimeVariable = event.currentTarget.getAttribute('data-cycle-time-variable');

        // Populate the recipeEditModal with the retrieved data
        var editModal = document.getElementById('recipeEditModal');
        editModal.querySelector('#recipeId').value = recipeId;
        editModal.querySelector('#recipeName').value = recipeName;
        editModal.querySelector('#productionRate').value = productionRate;
        editModal.querySelector('#stdBatchSize').value = stdBatchSize;
        editModal.querySelector('#cycleTimeVariable').value = cycleTimeVariable;

        // Show the recipeEditModal
        editModal.style.display = 'block';
    }

    // Attach a click event listener to each "Edit" button
    editButtons.forEach(function (button) {
        button.addEventListener('click', openEditModal);
    });

    // Function to close the recipeEditModal
    var closeRecipeEditModal = document.getElementById('closeRecipeEditModal');
    if (closeRecipeEditModal) {
        closeRecipeEditModal.addEventListener('click', function () {
            var editModal = document.getElementById('recipeEditModal');
            editModal.style.display = 'none';
        });
    }

    // Apply the formatDurationInput function to the edit form input
    var editCycleTimeVariableInput = document.getElementById('recipeEditModal').querySelector('#cycleTimeVariable');
    if (editCycleTimeVariableInput) {
        editCycleTimeVariableInput.addEventListener('input', function (e) {
            handleBackspaceAndDelete(e.target);
            formatDurationInput(e.target);
        });
    }

    // Apply the formatNameInput function to edit form input
    var editRecipeNameInput = document.getElementById('recipeEditModal').querySelector('#recipeName');
    if (editRecipeNameInput) {
        editRecipeNameInput.addEventListener("input", function () {
            formatNameInput(this);
        });
    }

    function getCsrfToken() {
        // Get all cookies from the document and split into individual items
        let cookies = document.cookie.split(';');

        // Look for the "csrftoken" cookie and return its value
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            let cookieParts = cookie.split('=');
            if (cookieParts[0] === 'csrftoken') {
                return cookieParts[1];
            }
        }
        return ''; // Return an empty string if not found
    }

    // Get all "Delete" buttons
    var deleteButtons = document.querySelectorAll('.delete-btn');

    // Function to delete a recipe
    function deleteRecipe(recipeId) {
        $.ajax({
            type: 'POST',
            url: '/delete_recipe/',
            data: {
                recipeId: recipeId,
                csrfmiddlewaretoken: getCsrfToken(),
            },
            success: function (response) {
                if (response.success) {
                    // Handle the case where deletion was successful
                    window.location.reload();
                } else {
                    // Handle the case where deletion was not successful
                    console.error(response.message);
                }
            },
            error: function (error) {
                // Handle AJAX error
                console.error('Error:', error);
            },
        });
    }

    // Attach a click event listener to each "Delete" button
    var deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            var recipeId = event.currentTarget.getAttribute('data-recipe-id');
            if (confirm('Are you sure you want to delete this recipe?')) {
                deleteRecipe(recipeId);
            }
        });
    });

});