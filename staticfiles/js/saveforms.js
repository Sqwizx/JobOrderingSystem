function collectFormData(forms) {
    let formsData = {};

    // Loop over each form with the class .recipe-form
    forms.forEach(form => {
        let formId = form.id;
        let inputElements = form.querySelectorAll('input, select, textarea');

        // Initialize an object for the formId if not already present
        if (!formsData[formId]) {
            formsData[formId] = {};
        }

        inputElements.forEach(element => {
            let idParts = element.id.split('-'); // e.g., ["recipeName", "uniqueFormId"]
            let fieldName = idParts[0];
            // Add the field value to the form's data object
            formsData[formId][fieldName] = element.value;
        });
    });

    return formsData;
}

document.querySelector('save-all-button').addEventListener('click', function () {
    let forms = document.querySelectorAll('.recipe-form');
    let allFormsData = collectFormData(forms);

    // Now, allFormsData is an object containing the data for each form
    fetch('/save-recipes/', {
        method: 'POST',
        body: JSON.stringify(allFormsData),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() // Replace with your method for getting the CSRF token
        }
    })
        .then(response => response.json()) // Parse the JSON from the response
        .then(data => {
            console.log(data.status); // prints 'success'
            console.log(data.message); // prints 'Recipe saved successfully!'

            // You can perform actions based on the content of the response
            if (data.status === 'success') {
                // Redirect the user to the homepage or show a success message
                window.location.href = '/';
            } else {
                // Handle any other statuses, or show an error message
                alert('Failed to save the recipe: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
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

