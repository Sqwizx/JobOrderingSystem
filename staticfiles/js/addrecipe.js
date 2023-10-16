// document.addEventListener('DOMContentLoaded', function () {
//     // Get the container for recipe tabs
//     var recipeTabsContainer = document.getElementById("recipe-tabs");

//     // Get the "Add Recipe" button
//     var addRecipeButton = document.getElementById("add-recipe-button");

//     // Event listener for the "Add Recipe" button
//     addRecipeButton.addEventListener("click", function () {
//         var modal = document.getElementById('myModal');
//         modal.style.display = 'block';
//     });

//     var closeButton = document.querySelector('.close');
//     closeButton.addEventListener('click', function () {
//         var modal = document.getElementById('myModal');
//         modal.style.display = 'none';
//     });

//     var recipeForm = document.getElementById('recipeForm');
//     recipeForm.addEventListener('submit', function (event) {
//         event.preventDefault();
//         var enteredRecipeName = document.getElementById('recipeName').value;
//         if (enteredRecipeName) {
//             var newRecipeButton = document.createElement('button');
//             newRecipeButton.classList.add('tablinks-recipes');
//             newRecipeButton.textContent = enteredRecipeName;

//             newRecipeButton.addEventListener('click', function () {
//                 displayRecipeDetails(enteredRecipeName);
//             });

//             recipeTabsContainer.appendChild(newRecipeButton);

//             var modal = document.getElementById('myModal');
//             modal.style.display = 'none';
//         }
//     });
// });
