document.addEventListener('DOMContentLoaded', function () {
    var createJobOrderButton = document.getElementById('createJobOrderButton');
    if (createJobOrderButton) {
        createJobOrderButton.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent the default form submission
            var dateInput = document.createElement('input');
            document.body.appendChild(dateInput); // Append it somewhere in your document

            // Initialize flatpickr on the new input element
            flatpickr(dateInput, {
                minDate: 'today',
                defaultDate: 'today',
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                onClose: function (selectedDates, dateStr, instance) {
                    // Once the user selects a date and closes the picker
                    if (selectedDates.length > 0) {
                        // Redirect to your Django view with the selected date
                        window.location.href = `/create_joborder?selected_date=${dateStr}`;
                    }
                    // Remove the input element after picking the date
                    instance.element.remove();
                }
            }).open(); // Open the flatpickr immediately
        });
    }
});