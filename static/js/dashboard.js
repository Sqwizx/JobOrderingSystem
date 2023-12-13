// dashboard.js

function updateDashboardTable() {
    // Make an AJAX request to the endpoint
    $.ajax({
        url: '/update_dashboard_table/',  // Update with the actual endpoint URL
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // Update the table with the new data
            updateTable(data.job_orders);
        },
        error: function (error) {
            console.error('Error fetching dashboard data:', error);
        }
    });
}

function formatDateTime(date) {
    var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var dayOfWeek = daysOfWeek[date.getDay()];
    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var ampm = hour >= 12 ? 'PM' : 'AM';

    // Adjust the hour to 12-hour format
    hour = hour % 12;
    hour = hour ? hour : 12; // '0' should be '12' in 12-hour format

    return dayOfWeek + ', ' + day + ' ' + month + ' ' + year + ' ' + hour + ':' + (minute < 10 ? '0' : '') + minute + ' ' + ampm;
}

function formatDate(date) {
    var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var dayOfWeek = daysOfWeek[date.getDay()];
    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var ampm = hour >= 12 ? 'PM' : 'AM';

    // Adjust the hour to 12-hour format
    hour = hour % 12;
    hour = hour ? hour : 12; // '0' should be '12' in 12-hour format

    return dayOfWeek + ', ' + day + ' ' + month + ' ' + year;
}

function updateTable(jobOrders) {
    // Update the table rows with the new data
    var tableBody = $('#dashboard-table tbody');
    tableBody.empty();

    if (jobOrders.length > 0) {
        $.each(jobOrders, function (index, job) {
            // Format date and time using the custom function
            var createdDate = new Date(job.jobOrderCreatedDate);
            var formattedCreatedDate = formatDate(createdDate);

            var activityTime = job.current_activity_time ? new Date(job.current_activity_time) : null;
            var formattedActivityTime = activityTime ? formatDateTime(activityTime) : '';

            var newRow = '<tr>' +
                '<td>' + job.jobOrderId + '</td>' +
                '<td>' + formattedCreatedDate + '</td>' +
                '<td>' + job.jobOrderStatus + '</td>' +
                '<td>' + job.current_recipe_name + '</td>' +
                '<td>' + job.current_activity_name + '</td>' +
                '<td>' + formattedActivityTime + '</td>' +
                '</tr>';
            tableBody.append(newRow);
        });
    } else {
        // Display a message if no job orders are found
        var noDataRow = '<tr><td colspan="6">No job orders found.</td></tr>';
        tableBody.append(noDataRow);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Get all rows with the class "clickable-row"
    const rows = document.querySelectorAll(".clickable-row");

    // Add a click event listener to each row
    rows.forEach(function (row) {
        row.addEventListener("click", function () {
            const jobOrderId = this.getAttribute("data-job-order-id"); // Get the job order ID from data attribute
            localStorage.setItem("jobOrderId", jobOrderId); // Store job order ID in localStorage
            window.location.href = `/details/${jobOrderId}/`; // Redirect to the details page
        });
    });
});

// Update the dashboard table every 1 minute in miliseconds
setInterval(updateDashboardTable, 60000);
