// dashboard.js



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

    // Adjust the hour to 12-hour format
    hour = hour % 12;
    hour = hour ? hour : 12; // '0' should be '12' in 12-hour format

    return dayOfWeek + ', ' + day + ' ' + month + ' ' + year;
}

// // Function to update the dashboard table
// function updateDashboardTable() {
//     $.ajax({
//         url: '/update_dashboard_table/',  // Update with the actual endpoint URL
//         type: 'GET',
//         dataType: 'json',
//         success: function (data) {
//             updateTable(data.job_orders);
//         },
//         error: function (error) {
//             console.error('Error fetching dashboard data:', error);
//         }
//     });
// }

// function updateTable(jobOrders) {
//     var tableBody = $('#dashboard-table tbody');
//     tableBody.empty();

//     if (jobOrders.length > 0) {
//         $.each(jobOrders, function (index, job) {
//             var createdDate = new Date(job.jobOrderCreatedDate);
//             var formattedCreatedDate = formatDate(createdDate);
//             var activityTime = job.current_activity_time ? new Date(job.current_activity_time) : null;
//             var formattedActivityTime = activityTime ? formatDateTime(activityTime) : '';

//             var newRow = '<tr class="clickable-row" data-job-order-id="' + job.jobOrderId + '">' +
//                 '<td>' + job.jobOrderId + '</td>' +
//                 '<td>' + formattedCreatedDate + '</td>' +
//                 '<td>' + job.jobOrderStatus + '</td>' +
//                 '<td>' + job.current_recipe_name + '</td>' +
//                 '<td>' + job.current_activity_name + '</td>' +
//                 '<td>' + formattedActivityTime + '</td>' +
//                 '</tr>';
//             tableBody.append(newRow);
//         });
//     } else {
//         var noDataRow = '<tr><td colspan="6">No job orders found.</td></tr>';
//         tableBody.append(noDataRow);
//     }
// }

// Event delegation for handling click event on table rows
$(document).on("click", ".clickable-row", function () {
    const jobOrderId = $(this).data("job-order-id"); // Retrieve the job order ID
    const jobOrderStatus = $(this).find('.status-button').text().trim(); // Retrieve the job order status from the row

    localStorage.setItem("jobOrderId", jobOrderId); // Store job order ID in localStorage
    localStorage.setItem("jobOrderStatus", jobOrderStatus); // Store job order status in localStorage
    window.location.href = `/details/${jobOrderId}/`; // Redirect to the details page
});

// Call updateDashboardTable immediately and set an interval to update it every 1 minute
$(document).ready(function () {
    $('#createJobOrderButton').click(function () {
        $('#dropdownContent').toggle();
    });

    // Optional: Close the dropdown if the user clicks outside of it
    $(window).click(function (event) {
        if (!event.target.matches('#createJobOrderButton')) {
            $('.dropdown-content').hide();
        }
    });
});

// Call updateDashboardTable immediately and set an interval to update it every 1 minute
// $(document).ready(function () {
//     updateDashboardTable();
//     setInterval(updateDashboardTable, 60000); // Update every 1 minute
// });

