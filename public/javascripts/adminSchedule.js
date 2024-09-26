$(document).ready(function(){

    /* Getting the pending email names */
    $.getJSON('/admin/getpendingRequests',function(data){

        $('#useremail').empty()
        $('#useremail').append($('<option selected disabled>').text('Select User Email'))
        data.map((item)=>{
            $('#useremail').append($('<option>').text(item.email).val(item.email))
        })
    })

    if (document.getElementById('formbreakera').value == ""){
        document.getElementById('btnhid').style.display = "none";
    }
       

})


/* Getting the year of the requests */
function getyear(ele){
    $(document).ready(function(){
        let x = ele.value;
        
        let q = `/admin/getpendingRequestsYear?email=`+ x;
        $.getJSON(q,function(data){
            $('#yearuser').empty()
            $('#yearuser').append($('<option selected disabled>').text('Select Year'))
            data.map((item)=>{
                $('#yearuser').append($('<option>').text(item.year).val(item.year))
            })
        })
           
    
    })
}


/* Getting the month of the requests  */
function getmonth(ele){
    $(document).ready(function(){
        let x = ele.value;
        let y = document.getElementById('useremail').value;
        let q = `/admin/getpendingRequestsMonth?email=`+ y + `&year=` + x;
        $.getJSON(q,function(data){
            // console.log (data)
            $('#monthuser').empty()
            $('#monthuser').append($('<option selected disabled>').text('Select Month'))
            data.map((item)=>{
                $('#monthuser').append($('<option>').text(item.month).val(item.month))
            })
        })
    
    })
}


/* Getting the whole data from the server  */
function getdata(){
    $(document).ready(function(){
        let x = document.getElementById('monthuser').value;
        let y = document.getElementById('useremail').value;
        let z = document.getElementById('yearuser').value;
        let start = document.getElementById('datestartrange').value;
        let end = document.getElementById('dateendrange').value;

        let q = `/admin/getpendingRequestsData?email=`+ y + `&year=` + z + `&month=` + x + `&start=` + start + `&end=` + end;
        
        window.location.href = q;
    
    })
}



/* Getting the end date of the schedule */
function getenddate (ele){
    let d = ele.value;
    let y = document.getElementById('yearuser').value;
    let m = document.getElementById('monthuser').value;

    let date = new Date (y,m,0).getDate();

    $(document).ready(function(){
        
        $('#dateendrange').empty()
        $('#dateendrange').append($('<option selected value disabled>').text('Select Ending Date'))
        for(i=d-1;i<date;i++){
            $('#dateendrange').append($('<option>').text((i+1)).val((i+1)));
        }      

    
    })
}


/* Getting the starting date of the schedule  */
function getdate(ele){
    let m = ele.value;
    let y = document.getElementById('yearuser').value;

    let date = new Date (y,m,0).getDate();

    $(document).ready(function(){
        
        $('#datestartrange').empty()
        $('#datestartrange').append($('<option selected value disabled>').text('Select Starting Date'))
        for(i=0;i<date;i++){
            $('#datestartrange').append($('<option>').text((i+1)).val((i+1)));
        }      
    
    })

}