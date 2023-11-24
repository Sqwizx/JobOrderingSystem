$(document).ready(function () {
    $('#createJobOrderButton').on('click', function () {
        var today = new Date();
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var formattedDate = today.toLocaleDateString('en-US', options);

        var jobOrderId = 'JO' + String(today.getDate()).padStart(2, '0') +
            String(today.getMonth() + 1).padStart(2, '0') + today.getFullYear();
        var jobOrderCreatedDate = formattedDate;
        var totalSalesOrder = null; // You can set this to a default value
        var jobOrderStatus = null; // You can set this to a default value
        var currentActivity = null; // You can set this to a default value
        var nextActivity = null; // You can set this to a default value
        var jobOrderRevision = null; // You can set this to a default value
        var recipes = []; // You can set this to a default value
        var userId = $(this).data('user-id');

        var jobOrderObject = {
            jobOrderId: jobOrderId,
            jobOrderCreatedDate: jobOrderCreatedDate,
            totalSalesOrder: totalSalesOrder,
            jobOrderStatus: jobOrderStatus,
            currentActivity: currentActivity,
            nextActivity: nextActivity,
            jobOrderRevision: jobOrderRevision,
            recipes: recipes,
            userId: userId
        };

        // Store the job order object in local storage
        localStorage.setItem('jobOrderObject', JSON.stringify(jobOrderObject));

        // Retrieve the job order object from local storage
        var retrievedObject = localStorage.getItem('jobOrderObject');
        console.log('Retrieved job order object: ', JSON.parse(retrievedObject));
    });
});
