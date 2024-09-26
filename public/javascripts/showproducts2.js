
/* Fill Area of the doctor and call the function to fecth the stockist and the chemist  */
function areafiller() {
    $(document).ready(function () {

    let z = document.getElementById('dcontact').value;

    let y = "/admin/getcorrectdoctor?contact=" + z;
    $.getJSON(y, function (data) {
        if (data.length == 0){
            document.getElementById('doctorname').value = "No Doctor Found !";
            document.getElementById('darea').value = "No Doctor Found !";
            document.getElementById('formblockerd').value = "";
            document.getElementById('doctorname').style.borderColor = 'red';
        }

        else{
            document.getElementById('doctorname').value = data[0].name;
            document.getElementById('darea').value = data[0].area;
            document.getElementById('formblockerd').value = "ok";
            document.getElementById('doctorname').style.borderColor = '#18c018';
        }


    })

    })
}


/* Function for filling the contact number of the chemist */
function contactfillerChemist() {
    $(document).ready(function () {
        let contact = document.getElementById('chemistphone').value;
        let y = "/admin/getchemistcontact?contact=" + contact;

        $.getJSON(y, (data) => {
            if (data.length == 0){
                document.getElementById('chemistname').value = "No Chemist Found !";
                document.getElementById('formblockerc').value = "";
                document.getElementById('chemistname').style.borderColor = 'red';
            }

            else{
                document.getElementById('chemistname').value = data[0].name;
                document.getElementById('formblockerc').value = "ok";
                document.getElementById('chemistname').style.borderColor = '#18c018';
            }
        })
    })
}


/* For Filling the contact of the stockists FROM showproducts2.js */
function contactfillerStockist() {
    $(document).ready(function () {
        let contact = document.getElementById('stockistphone').value;
        let y = "/admin/getstockistcontact?contact=" + contact;

        $.getJSON(y, (data) => {
            if (data.length == 0){
                document.getElementById('stockistname').value = "No Stockist Found !";
                document.getElementById('formblockers').value = "";
                document.getElementById('stockistname').style.borderColor = 'red';
            }

            else{
                document.getElementById('stockistname').value = data[0].name;
                document.getElementById('formblockers').value = "ok";
                document.getElementById('stockistname').style.borderColor = '#18c018';
            }
        })
    })
}
