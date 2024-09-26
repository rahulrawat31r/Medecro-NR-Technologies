$(document).ready(function(){

        /* For Getting the users email */
        $.getJSON('/admin/getemployee',function(data){
            // console.log (data)
            $('#employeename').empty()
            $('#employeename').append($('<option selected disabled>').text('Select Employee Email'))
            data.map((item)=>{
                $('#employeename').append($('<option>').text(item.email).val(item.email))
            })
        })
        
        /* For getting the admin  names */
        $.getJSON('/admin/getworkingwith',function(data){
            $('#workingwith').empty()
            $('#workingwith').append($('<option selected disabled>').text('Select Working With'))
            data.map((item)=>{
                $('#workingwith').append($('<option>').text(item.name).val(item.name))
            })
        })

   
})

function contactfiller (){

    $(document).ready(function(){

        let x = document.getElementById('doctorname').value;
        let y = "/admin/getcorrectdoctor?name=" + x;
        $.getJSON(y,function(data){
            // console.log (data)
            $('#dcontact').empty()
            $('#dcontact').append($('<option selected disabled>').text('Select Contact Number'))
            data.map((item)=>{
                $('#dcontact').append($('<option>').text(item.phone).val(item.phone))
            })
        })

   
})
}



/* For filling the docttor name and area after the contact  */
function areafiller (){
    $(document).ready(function(){

        let z = document.getElementById('dcontact').value;
        let y = "/admin/getcorrectdoctor?contact=" + x;
        $.getJSON(y,function(data){
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


function contactfillerChemist(){
    $(document).ready(function(){
        let name = document.getElementById('chemistname').value;   
        let y = "/admin/getchemistcontact?name=" + name;

        $.getJSON(y,(data)=>{
            $('#chemistphone').empty()
            $('#chemistphone').append($('<option selected disabled>').text('Select Contact Number'))
            data.map((item)=>{
                $('#chemistphone').append($('<option>').text(item.contact).val(item.contact))
            })
        })
})
}


function contactfillerStockist(){
    $(document).ready(function(){
        let name = document.getElementById('stockistname').value;   
        let y = "/admin/getstockistcontact?name=" + name;

        $.getJSON(y,(data)=>{
            $('#stockistphone').empty()
            $('#stockistphone').append($('<option selected disabled>').text('Select Contact Number'))
            data.map((item)=>{
                $('#stockistphone').append($('<option>').text(item.contact).val(item.contact))
            })
        })
})
}