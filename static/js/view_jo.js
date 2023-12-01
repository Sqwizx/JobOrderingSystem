var tabButtons = document.querySelectorAll('.tablinks');
tabButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
        console.log('Tablink clicked!');
        openTab(event, button.getAttribute('data-day'));
    });
});

function openTab(event, day) {
    var activeDay = day;

    event.stopPropagation();

    var allTabContents = document.querySelectorAll('.tabcontent');
    allTabContents.forEach(function (content) {
        content.style.display = "none";
    });

    var allTabLinks = document.querySelectorAll('.tablinks');
    allTabLinks.forEach(function (link) {
        link.classList.remove("active");
    });

    document.getElementById(activeDay).style.display = "block";
    event.currentTarget.classList.add("active");
}
