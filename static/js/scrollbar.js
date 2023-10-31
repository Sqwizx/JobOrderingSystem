document.addEventListener('DOMContentLoaded', function () {
    const mainScrollContainer = document.getElementById('scrollContainer');
    const recipeContainer = document.querySelector('.card');

    OverlayScrollbars(mainScrollContainer, {
        // Your options for mainScrollContainer
        className: "os-theme-dark",
        resize: "none",
        sizeAutoCapable: true,
        paddingAbsolute: true,
        scrollbars: {
            autoHide: 'scroll',
            autoHideDelay: 500
        }
    });

    OverlayScrollbars(recipeContainer, {
        // Your options for productContainer
        className: "os-theme-dark",
        resize: "none", // Assuming you don't want to resize this container
        scrollbars: {
            autoHide: 'leave',
            autoHideDelay: 500
        }
    });
});
