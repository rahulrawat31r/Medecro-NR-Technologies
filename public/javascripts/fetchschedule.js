/* For getting the year of the schedule */
function getyear(ele){

    $(document).ready(function(){
        let x = ele.value;
        let y = document.getElementById('approval').value;

        if (y == "Pending"){
            y = "Pending For Approval";
        }
        let q = `/admin/getSchedulesYear?email=`+ x + `&approval=` + y;
        $.getJSON(q,function(data){

            /* Filling the year field */
            $('#yearuser').empty()
            $('#yearuser').append($('<option value selected disabled>').text('Select Year'))
            data.map((item)=>{
                $('#yearuser').append($('<option>').text(item.year).val(item.year))
            })
        })
    
    })
}


/* For getting the month of the schedule after taking the year  */
function getmonth(ele){
    $(document).ready(function(){
        let x = ele.value;
        let y = document.getElementById('useremail').value;
        let z = document.getElementById('approval').value;

        if (z == "Pending"){
            z = "Pending For Approval";
        }

        let q = `/admin/getScheduleMonth?email=`+ y + `&year=` + x + `&status=` + z;
        $.getJSON(q,function(data){
            
            /* Filling the months field */
            $('#monthuser').empty()
            $('#monthuser').append($('<option value selected disabled>').text('Select Month'))
            data.map((item)=>{
                $('#monthuser').append($('<option>').text(item.month).val(item.month))
            })
        })
           
    })
}

/* For getting number of days in a month */
function getdate(ele){
    let m = ele.value;
    let y = document.getElementById('yearuser').value;

    let date = new Date (y,m,0).getDate();

    $(document).ready(function(){
        
        /* Filling the Dates field */
        $('#datestartrange').empty()
        $('#datestartrange').append($('<option selected value disabled>').text('Select Starting Date'))
        for(i=0;i<date;i++){
            $('#datestartrange').append($('<option>').text((i+1)).val((i+1)));
        }      
    
    })

}


/* For restricting the end dates to start after the starting date */
function getenddate (ele){
    let d = ele.value;
    let y = document.getElementById('yearuser').value;
    let m = document.getElementById('monthuser').value;

    let date = new Date (y,m,0).getDate();

    $(document).ready(function(){
        
        /* Filling the end date Range */
        $('#dateendrange').empty()
        $('#dateendrange').append($('<option selected value disabled>').text('Select Ending Date'))
        for(i=d-1;i<date;i++){
            $('#dateendrange').append($('<option>').text((i+1)).val((i+1)));
        }      
    })
}


// function approval (ele){

//         let email = document.getElementById('useremail').value;
//         let year = document.getElementById('yearuser').value;
//         let month = document.getElementById('monthuser').value;

//         let q = "/approvingStatus?email=" + email + "&year=" + year + "&month=" + month + "&status=" + ele;
//         window.location.href =q;
// }