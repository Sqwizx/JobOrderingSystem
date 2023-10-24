document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('createJobOrderButton').addEventListener('click', function () {
        var today = new Date();
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var formattedDate = today.toLocaleDateString('en-US', options);

        var jobOrderId = 'JO' + String(today.getDate()).toString().padStart(2, '0') +
            String(today.getMonth() + 1).toString().padStart(2, '0') + today.getFullYear();
        var jobOrderCreatedDate = formattedDate;
        var totalSalesOrder = null; // You can set this to a default value
        var jobOrderStatus = null; // You can set this to a default value
        var currentActivity = null; // You can set this to a default value
        var nextActivity = null; // You can set this to a default value
        var jobOrderRevision = null; // You can set this to a default value
        var recipeId = null; // You can set this to a default value
        var userId = null; // You can set this to a default value

        var jobOrderObject = {
            jobOrderId: jobOrderId,
            jobOrderCreatedDate: jobOrderCreatedDate,
            totalSalesOrder: totalSalesOrder,
            jobOrderStatus: jobOrderStatus,
            currentActivity: currentActivity,
            nextActivity: nextActivity,
            jobOrderRevision: jobOrderRevision,
            recipeId: recipeId,
            userId: userId
        };

        // Do something with the jobOrderObject
        console.log("Created Job Order Object:", jobOrderObject);
    });
});