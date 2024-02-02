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

// Function to update the dashboard table
function updateDashboardTable() {
    $.ajax({
        url: '/update_dashboard_table/',  // Update with the actual endpoint URL
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            updateTable(data.job_orders);
        },
        error: function (error) {
            console.error('Error fetching dashboard data:', error);
        }
    });
}

function updateTable(jobOrders) {
    var tableBody = $('#dashboard-table tbody');
    tableBody.empty();

    if (jobOrders.length > 0) {
        $.each(jobOrders, function (index, job) {
            var createdDate = new Date(job.jobOrderCreatedDate);
            var formattedCreatedDate = formatDate(createdDate);
            var activityTime = job.current_activity_time ? new Date(job.current_activity_time) : null;
            var formattedActivityTime = activityTime ? formatDateTime(activityTime) : '';

            // Determine the class for the status button based on job order status
            var statusClass = "status-" + job.jobOrderStatus.toLowerCase();

            var newRow = '<tr class="clickable-row" data-job-order-id="' + job.jobOrderId + '">' +
                '<td>' + job.jobOrderId + '</td>' +
                '<td>' + formattedCreatedDate + '</td>' +
                '<td><button class="status-button ' + statusClass + '">' + job.jobOrderStatus + '</button></td>' +
                '<td>' + job.current_recipe_name + '</td>' +
                '<td>' + job.current_activity_name + '</td>' +
                '<td>' + formattedActivityTime + '</td>' +
                '</tr>';
            tableBody.append(newRow);
        });
    } else {
        var noDataRow = '<tr><td colspan="6">No job orders found.</td></tr>';
        tableBody.append(noDataRow);
    }
}


// Event delegation for handling click event on table rows
$(document).on("click", ".clickable-row", function () {
    const jobOrderId = $(this).data("job-order-id"); // Retrieve the job order ID
    const jobOrderStatus = $(this).find('.status-button').text().trim(); // Retrieve the job order status from the row

    localStorage.setItem("jobOrderId", jobOrderId); // Store job order ID in localStorage
    localStorage.setItem("jobOrderStatus", jobOrderStatus); // Store job order status in localStorage
    window.location.href = `/details/${jobOrderId}/`; // Redirect to the details page
});

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Call updateDashboardTable immediately and set an interval to update it every 1 minute
$(document).ready(function () {
    var searchInput = $("#searchInput");
    var searchResults = $("#searchResults");
    $("#searchInput").on("keyup", function () {
        var query = $(this).val();
        var escapedQuery = escapeRegExp(query);

        if (query.length > 0) {
            searchResults.show();
            $.ajax({
                url: '/search_jo/', // Update this with the URL to your search view
                data: { 'q': query },
                success: function (data) {
                    $("#searchResults").empty();
                    if (data.length > 0) {
                        $.each(data, function (index, item) {
                            var highlightedText = item.jobOrderId.replace(new RegExp(escapedQuery, 'gi'), function (match) {
                                return '<strong>' + match + '</strong>';
                            });
                            $("#searchResults").append(
                                $('<div>').addClass('search-item').html(highlightedText)
                                    .data('jobOrderId', item.jobOrderId)
                                    .data('jobOrderStatus', item.jobOrderStatus) // if you're using jobOrderStatus
                            );
                        });
                    } else {
                        $("#searchResults").append(
                            $('<div>').addClass('search-item').text("No Results Found")
                        );
                    }
                }
            });
        } else {
            searchResults.empty().hide();
        }
    });

    searchResults.on("click", ".search-item", function () {
        var jobOrderId = $(this).data('jobOrderId');
        var jobOrderStatus = $(this).data('jobOrderStatus'); // Retrieve job order status

        // Store in localStorage
        localStorage.setItem("jobOrderId", jobOrderId);
        localStorage.setItem("jobOrderStatus", jobOrderStatus);

        window.location.href = '/details/' + jobOrderId + '/'; // Redirect to the correct URL
    });

    // Hide search results when clicking outside of the input and results
    $(document).on("click", function (event) {
        if (!$(event.target).closest("#searchInput, #searchResults").length) {
            searchResults.hide();
        }
    });

    searchInput.on("focus", function () {
        if (searchInput.val().length > 0) {
            searchResults.show();
        }
    });

    $('#createJobOrderButton').click(function () {
        $('#dropdownContent').toggle();
    });

    // Optional: Close the dropdown if the user clicks outside of it
    $(window).click(function (event) {
        if (!event.target.matches('#createJobOrderButton')) {
            $('.dropdown-content').hide();
        }
    });

    updateDashboardTable();
    setInterval(updateDashboardTable, 60000); // Update every 1 minute
});