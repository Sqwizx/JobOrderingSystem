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

    // Select all icons with the 'fa-book' class and attach a click event listener
    document.querySelectorAll('.fa-book').forEach(icon => {
        icon.addEventListener('click', function () {
            // Retrieve the recipeId from the clicked icon
            let recipeId = this.getAttribute('data-recipe-id');
            let recipeName = this.getAttribute('data-recipe-name');
            console.log('This is recipe Name:', recipeName + ' with Id:', recipeId);

            // Set the recipeId in the hidden input of the modal's form
            document.getElementById('recipeId').value = recipeId;

            // Fetch products associated with this recipe
            fetchProductsForRecipe(recipeId, recipeName);
            openProductModal();
        });
    });

    function openProductModal() {
        // Your code to display the modal, e.g., setting the display style to 'block'
        document.getElementById('productModal').style.display = 'block';
    }


    // Event listener for closing the modal
    document.getElementById('closeProductModal').addEventListener('click', function () {
        document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('newProductForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // Get the selected option in the weight dropdown
        let selectedWeightOption = document.querySelector('#weight option:checked');
        let weightValue = selectedWeightOption.getAttribute('data-weight');

        let formData = {
            recipeId: document.getElementById('recipeId').value,
            productName: document.getElementById('productName').value,
            currency: document.getElementById('currency').value,
            productPrice: document.getElementById('productPrice').value,
            client: document.getElementById('client').value,
            weight: weightValue,
            noOfSlices: document.getElementById('noOfSlices').value,
            thickness: document.getElementById('thickness').value
        };

        fetch('/add_recipeproduct/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken() // Ensure you have a function to get CSRF token
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Handle success (e.g., display a success message, clear the form)
                    appendProductToTable(data)
                    document.getElementById('newProductForm').reset();
                    console.log('Product added successfully:', data.productName);
                } else {
                    // Handle errors
                    console.error('Error adding product:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    });

    function appendProductToTable(productData) {
        var productListTable = document.querySelector('#productList table');
        var noProductsRow = productListTable.querySelector('tr td[colspan="7"]');

        // If there's a 'No products' row, remove it
        if (noProductsRow) {
            noProductsRow.remove();
        }

        // Append the new product row
        var newProductRow = `
    <tr>
        <td>${productData.productName}</td>
        <td>${productData.currency} ${productData.productPrice}</td>
        <td>${productData.client}</td>
        <td>${productData.weight}</td>
        <td>${productData.noOfSlices}</td>
        <td>${productData.thickness}</td>
        <td>
            <button onclick="deleteProduct(${productData.product_id})">Delete</button>
        </td>
    </tr>`;
        productListTable.insertAdjacentHTML('beforeend', newProductRow);

    }

    //Formatting
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

function fetchProductsForRecipe(recipeId, recipeName) {
    // AJAX request to fetch products
    fetch('/get_product/' + recipeName + '/') // Update with the correct URL
        .then(response => response.json())
        .then(products => {
            let productListHtml;

            if (products.length > 0) {

                productListHtml = `<table>
                                <thead>
                                  <tr>
                                    <th>Product Name</th>
                                    <th>Product Price</th>
                                    <th>Client</th>
                                    <th>Weight</th>
                                    <th>No. Slices</th>
                                    <th>Thickness</th>
                                    <th>Actions</th>
                                  </tr>
                                  <thead>`;

                productListHtml += products.map(product =>
                    `<tbody><tr>
                    <td>${product.productName}</td>
                    <td>${product.currency} ${product.productPrice}</td>
                    <td>${product.client}</td>
                    <td>${product.weight}</td>
                    <td>${product.noOfSlices}</td>
                    <td>${product.thickness}</td>
                    <td>
                        <button onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                </tr><tbody>`
                ).join('');

                productListHtml += `</table>`;
            } else {
                productListHtml = `<table>
                                <thead>
                                  <tr>
                                    <th>Product Name</th>
                                    <th>Product Price</th>
                                    <th>Client</th>
                                    <th>Weight</th>
                                    <th>No. Slices</th>
                                    <th>Thickness</th>
                                    <th>Actions</th>
                                  </tr>
                                  <thead>`;

                productListHtml +=
                    `<tbody><tr>
                    <td colspan="7">No products found for recipe ID: ${recipeName}</td>
                </tr><tbody>`;

                productListHtml += `</table>`;
            }

            document.getElementById('productList').innerHTML = productListHtml;
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            // Handle errors here
            document.getElementById('productList').innerHTML = `<p>Error loading products for recipe ID: ${recipeName}</p>`;
        });
}
