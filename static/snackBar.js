function showSnackBar(text) {
    // Get the snackbar DIV
    let snackbar = $("#snackbar");
    snackbar.html(text);
    snackbar.toggleClass("show");
    setTimeout(() => snackbar.toggleClass("show"), 3000);
}