function initializeCustomScrollbar() {
    const mainScrollContainer = document.getElementById('scrollContainer');
    const modalContent = document.getElementById('productModalContent');

    OverlayScrollbars(mainScrollContainer, {
        className: "os-theme-dark",
        resize: "none",
        sizeAutoCapable: true,
        paddingAbsolute: true,
        scrollbars: {
            autoHide: 'scroll',
            autoHideDelay: 500
        }
    });

    if (modalContent) {
        OverlayScrollbars(modalContent, {
            className: "os-theme-dark",
            resize: "none",
            sizeAutoCapable: true,
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 1000
            }
        });
    }

    // Initialize OverlayScrollbars for all .card elements
    document.querySelectorAll('.tabcontent .card').forEach(function (recipeContainer) {
        OverlayScrollbars(recipeContainer, {
            className: "os-theme-dark",
            resize: "none",
            sizeAutoCapable: true,
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializeCustomScrollbar();

    document.querySelectorAll('.tablinks').forEach(function (tabButton) {
        tabButton.addEventListener('click', function () {
            // Wait for the tab's content to become visible
            initializeCustomScrollbar();
        });
    });
});
