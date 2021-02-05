function showSnackBar(text) {
    // Get the snackbar DIV
    let snackbar = $("#snackbar");
    snackbar.html(text);
    snackbar.addClass("show");
    setTimeout(() => snackbar.removeClass("show"), 3000);
}