$(document).ready(() => {
    var d = new Date();
    var n = d.getFullYear();
    $("#yrs").text(n); 
    function readURL(input) {
        if (input.files && input.files[0]) {
            // var reader = new FileReader();
            const fileBlob = URL.createObjectURL(input.files[0]); 
            $('.playable').attr('src', fileBlob);
            $('.playable').on('load', () => {
                URL.revokeObjectURL(fileBlob); 
            });
        }
    }
    $("#imgInp").change(function() {
    readURL(this);
    });
});