$(document).ready(function () {
    var recipeObjects = {};

    // Event handler for clicking the "Add Recipe" button
    $(".add-recipe-tab").on("click", function () {
        var tablinkIndex = $(this).closest('.tabcontent').index(); // Get the index of the current tab content

        $("#myModal-" + tablinkIndex).css("display", "block");
        $("#recipeForm-" + tablinkIndex).data("tablinkIndex", tablinkIndex);
    });

    // Event handler for closing the modal
    $("span.close").on("click", function () {
        $(this).closest(".modal").css("display", "none");
    });

    // Event delegation for dynamically added elements
    $('body').on('click', '.add-recipe-tab', function () {
        var index = $(this).attr('id').split('-').pop();
        var modal = document.getElementById('myModal-' + index);
        modal.style.display = 'block';
    });

    // Event delegation for dynamically added elements
    $('body').on('click', '.close', function () {
        var index = $(this).data('index');
        var modal = document.getElementById('myModal-' + index);
        modal.style.display = 'none';
    });

    // Event handler for clicking outside the modal
    $(window).on("click", function (event) {
        if ($(event.target).hasClass("modal")) {
            $(event.target).css("display", "none");
        }
    });

    // Event handler for recipe form submission
    $(document).on('submit', 'form[id^="recipeForm"]', function (event) {
        event.preventDefault();
        var today = new Date();
        var recipeNameInput = $(this).find('input[name="recipeName"]');
        var recipeName = recipeNameInput.val();
        var tablinkIndex = $(this).data("tablinkIndex");
        var recipeId = tablinkIndex + " " + recipeName + " " + today.getDate() + (today.getMonth() + 1) + today.getFullYear();;

        if (recipeNameInput) {
            var formattedDate = today.toISOString().split('T')[0];
            var recipeSalesOrder = null;
            var recipeProdRate = null;
            var recipeBatchSize = null;
            var recipeProdDate = formattedDate;
            var recipeBatches = null;
            var recipeCycleTime = null;
            var recipeWaste = 2.00;
            var recipeReqTime = null;
            var recipeTotalTray = null;
            var recipeTotalTrolley = null;
            var recipeBeltNo = null;
            var recipeProducts = null;

            var recipeObject = {
                recipeId: recipeId,
                recipeSalesOrder: recipeSalesOrder,
                recipeProdRate: recipeProdRate,
                recipeBatchSize: recipeBatchSize,
                recipeProdDate: recipeProdDate,
                recipeBatches: recipeBatches,
                recipeCycleTime: recipeCycleTime,
                recipeWaste: recipeWaste,
                recipeReqTime: recipeReqTime,
                recipeTotalTray: recipeTotalTray,
                recipeTotalTrolley: recipeTotalTrolley,
                recipeBeltNo: recipeBeltNo,
                recipeProducts: recipeProducts
            };

            // Store the recipe object in local storage with a unique identifier
            if (!recipeObjects[tablinkIndex]) {
                recipeObjects[tablinkIndex] = {};
            }
            recipeObjects[tablinkIndex][recipeId] = recipeObject;
            localStorage.setItem('recipeObject-' + tablinkIndex, JSON.stringify(recipeObjects[tablinkIndex]));

            $("#myModal-" + tablinkIndex).css('display', 'none');

            var recipeTab = $(".tabcontent").eq(tablinkIndex).find(".tab-recipes");
            recipeTab.append("<p>" + recipeName + "</p>");
        } else {
            console.error("Recipe Name Input not found!");
        }
    });
});
