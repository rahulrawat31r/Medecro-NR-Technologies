/* For Fetching the schedule of a particular date */

function checksch() {
    document.getElementById('mainform').innerHTML = "";
    $(document).ready(function () {
        let x = document.getElementById('dateCal').value;
        x = new Date(x);
        let year = x.getFullYear();
        let month = x.getMonth();
        let date = x.getDate();

        let q = `/checkschedule?year=` + year + `&month=` + (month + 1) + `&date=` + date;

        $.getJSON(q, function (data) {
            if (data.status) {

                document.getElementById('scheduleInfo').value = "No Earlier Scheduling for this Date !";
                let form = document.getElementsByClassName('table-responsive')[0];
                let farm = document.getElementById('mainform');

                let cont = document.createElement('div');
                cont.setAttribute('class', 'row');

                cont.innerHTML = `
                        <div class="col-md-4 mb-4">
                        Visits
                            <div class="form-outline textBox">
                                <input type="text" required id="docvisits" name="docvisits" class="form-control form-control-lg"/ value = "0" oninput = "createvisits(this)">
                            </div>
                        </div>
                    `;

                farm.append(cont);
                form.append(farm);

            }

            else {
                document.getElementById('scheduleInfo').value = "A Schedule Already Exists For this Date !";
            }



        })



    })
}

/* For Filling the doctor naem after taking the contact details of the doctor */

function filldoctornameSch(i) {
    $(document).ready(function () {
        let x = "doctorcontact" + i;
        let a = document.getElementById(x).value;
        // console.log ('kake' + a);

        let id = "doctorName" + i;
        if (a != "") {
            let p = '/getDoctorNameSch?num=' + a;
            $.getJSON(p, function (data2) {
                // console.log (data2)

                if (data2.length == 1) {
                    document.getElementById(id).value = data2[0].name;

                }

                else {
                    // console.log (data2);
                    document.getElementById(id).value = "No Visit";

                }
            })

        }

        else {
            document.getElementById(id).value = "No Visit";

        }
    })
}


/* For Adding the number of visits fileds after taking the visits as input */
function createvisits(a) {
    let v = parseInt(a.value);

    let form = document.getElementsByClassName('table-responsive')[0];
    let farm = document.getElementById('mainform');


    $(document).ready(function () {
        $('.visitRow').remove();


        for (i = 0; i < v; i++) {

            let cont = document.createElement('div');
            cont.setAttribute('class', 'row');
            cont.innerHTML = `
            <div class = "row visitRow">
                <div class="col-md-4 mb-4">
                    Doctor Contact
                    <div class="form-outline textBox">
                        <input required type="text" id="doctorcontact` + i + `" name="doctorcontact` + i + `" class="form-control form-control-lg"/ oninput = "filldoctornameSch(` + i + `)">
                        
                    </div>
                </div>
    
                <div class="col-md-4 mb-4">
                Doctor Name
                    <div class="form-outline textBox">
                        <input required type="text" required id="doctorName` + i + `" name="doctorName` + i + `" class="form-control form-control-lg"/ readonly value = "No Visit">
                    </div>
                </div>
    
                <div class="col-md-4 mb-4">
                    Visit Time
                    <div class="form-outline textBox">
                        <input required type="time" required id="visitTime` + i + `" name="visitTime` + i + `" class="form-control form-control-lg active"/ value = "00:00">
                        
                    </div>
                </div>
            </div>
            `;

            farm.append(cont);
        }

        if (v != 0) {
            cont = document.createElement('div');

            let datecal = document.getElementById('dateCal').value;

            cont.innerHTML = `
                <div class="d-flex justify-content-center pt-3 visitRow">
                    <input required type="text" name="dateField" id="dateField" hidden value = "`+ datecal + `">
        
                    <button type="reset" class="btn btn-light btn-lg">Reset all</button>
                    <button type="submit" id="submit-btn" class="btn btn-warning btn-lg ms-2" >Submit form</button>
                </div>
            `;

            farm.append(cont);

            form.append(farm);

        }

    });


}




