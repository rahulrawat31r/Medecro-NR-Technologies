/* Checking the Status of schedule of a particular date */
function checksch (){
    let x = document.getElementById('date').value;
    x = new Date (x);
    let year = x.getFullYear();
    let month = x.getMonth();
    let date = x.getDate();

    $(document).ready(function(){
        let q = '/checkDateSchedule?date=' + date + '&month=' + month + '&year=' + year;

        $.getJSON(q,function(data){

            if ((data.length != 0) && (data[0].status == "Approved")){

                $('#schedulestatus').val("Schedule is Approved !");
                $(".schdepend").css('display','flex');
                $("#buttonss").attr('style','display : flex !important;');
                
                /* For getting the Visits */
                checkvisits(x);
                
            }
            
            
            else{
                $(".schdepend").css('display','none');
                $('#schedulestatus').val("Schedule is Not Available !");
                $("#buttonss").attr('style','display : none !important;');
              
            }
        }) 
    
    })
}


/* Getting the Visits Fields */
function checkvisits(x){

    let form = document.getElementsByClassName('table-responsive')[0];                
    let farm = document.getElementById('mainform');

    $(document).ready(function(){
        $('.visitRow').remove();
        let path = "/getDCRvisits?date=" + x;

        $.getJSON(path,(data)=>{
            document.getElementById('visitOpt').style.display = "flex";
            
            document.getElementById('visitOpt').value = data.length;
            
            
            // Counter
            let o = -1;

            data.map(items=>{
                o++;
                let dc ;
                let d;
                if (items.doctor == "No Visit"){
                    dc = "No Visit"
                    d = "No Visit"
                }

                else{

                    // Gettting the doctor contact
                    dc = items.doctor.match(/\((.*?)\)/)[1];

                    // GEtting the doctor name
                    d = items.doctor.substring(0,items.doctor.indexOf('('));
                }
                
                let cont = document.createElement('div');
                cont.setAttribute('class','row');
                let visits = document.getElementById('visitOpt').value;

                cont.innerHTML = `
                <div class = "row visitRow schdepend">
                    <div class="col-md-4 mb-4">
                        Doctor Contact
                        <div class="form-outline textBox">
                            <input type="text" id="doctorcontact` + o +`" name="doctorcontact` + o +`" class="form-control form-control-lg active"/ value = '` + dc + `' oninput = "filldoctornameSch(` + o + `)">
                        </div>
                    </div>  
        
                    <div class="col-md-4 mb-4">
                        Doctor Name
                        <div class="form-outline textBox">
                            <input type="text" required id="doctorName` + o + `" name="doctorName`+ o+`" class="form-control form-control-lg active"/ readonly value = '` + d + `'>
                        </div>
                    </div>
        
                    <div class="col-md-4 mb-4">
                        Visit Time
                        <div class="form-outline textBox">
                            <input type="time" required id="visitTime` + o +`" name="visitTime` + o +`" class="form-control form-control-lg active"/ value = '` + items.time + `' >
                        </div>
                    </div>

                    
                </div>
                `;
                
                farm.append(cont);                
            })

            cont = document.createElement('div');
            let y = JSON.stringify(data);
            let visits = document.getElementById('visitOpt').value;
            
            cont.innerHTML = `

                <div class = "row schdepend visitRow">
                    <div class="col-md-12 mb-4">
                        Remarks
                        <div class="form-outline textBox">
                            <textarea name="remarks" id="remarks" cols="10" rows="1" class = "form-control form-control-lg active">None</textarea>
                            <input type="text" name="schStatus" id="schStatus" hidden required value = "Work From Home">
                            <input type="text" name="visitStatus" id="visitStatus" hidden required value = "`+ visits + `">
                            <input type="text" name="sendData" id="sendData" hidden required value = '` + y + `'>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-center pt-3 visitRow" id = "buttonss">
                    
        
                    <button type="reset" class="btn btn-light btn-lg">Reset all</button>
                    <button type="submit" id="submit-btn" class="btn btn-warning btn-lg ms-2" >Submit form</button>
                </div>
            `;
        
            farm.append(cont);
        
            form.append(farm);
            $(".schdepend").css('display','flex');

        })
    });

    
}


/* Filling the doctor name after getting the contact details  */
function filldoctornameSch(i){
    $(document).ready(function(){
        let x = "doctorcontact" + i;
        let a = document.getElementById(x).value;

        let id = "doctorName" + i;
        if (a != ""){
            let p = '/getDoctorNameSch?num=' + a;    
            $.getJSON(p,function(data2){


                if (data2.length == 1){
                    document.getElementById(id).value = data2[0].name;
                    
                }
                
                else{

                    document.getElementById(id).value = "No Visit";
                    
                }
            })
            
        }
        
        else{
            document.getElementById(id).value = "No Visit";

        }
    })
}

/* Update the breaker of the schedule work option */
function updateSchStatus(e){
    console.log (e.value)
    document.getElementById('schStatus').value = e.value;
    document.getElementById('visitStatus').value = document.getElementById('visitOpt').value;
}