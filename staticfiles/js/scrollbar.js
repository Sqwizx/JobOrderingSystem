function initializeCustomScrollbar() {
    const mainScrollContainer = document.getElementById('scrollContainer');
    const modalContent = document.getElementById('productModalContent');
    const productList = document.getElementById('product-list');


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

    if (productList) {
        OverlayScrollbars(productList, {
            className: "os-theme-dark",
            resize: "none",
            sizeAutoCapable: true,
            paddingAbsolute: true,
            scrollbars: {
                autoHide: 'leave',
                autoHideDelay: 500
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
            initializeCustomScrollbar();
        });
    });

    // Initialize OverlayScrollbars for all .recipe-form elements that do not have the custom scrollbar yet
    document.querySelectorAll('.recipe-form').forEach(function (recipeForm) {
        if (!recipeForm.classList.contains('os-host')) {
            OverlayScrollbars(recipeForm, {
            });
        }
    });
});