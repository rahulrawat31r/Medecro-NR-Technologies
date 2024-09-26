var express = require('express');
var router = express.Router();
var pool = require('./pool')
var multer = require ('multer');
const {v4 : uuid, parse} = require ('uuid');
var imgname;
var nodemailer = require('nodemailer');
var aes256 = require ('aes256');
var passKey = "MRTECH";
var fs = require ('fs');
var logger = require('../controller/logger');
var ip = require('ip');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rahulrawat31r@gmail.com',
    pass: 'yyovxputsyodvdyy'
  }
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images')
    },
    filename: function (req, file, cb) {
      
      let ext = file.originalname.split('.');
      ext = ext[ext.length-1];
  
      let filename = uuid() + "." + ext;
      imgname = filename;
      cb(null, filename)
    }
  })
  
  const upload = multer({ storage: storage })


router.get('/adminlogin',function(req,res){

    let mes = `| Request -> /admin/adminlogin | IP -> ${req.ip} | Admin Login Page Rendered |`;
    logger.customLogger.log ('info',mes);
    res.render('adminlogin',{error:req.session.invaliderror})
})




/* Admin Login Check  */

router.post('/checkadmin',function(req,res){
   
    pool.query('select * from doctor where email=?',[req.body.adminemail],function(error,result){
        if(error)
        {   
            console.log (error);
            let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Error Fetching Data from Database |`;
            res.redirect('/admin/adminlogin')
            logger.customLogger.log ('error',mes);
        }
        else
        {
            if (result.length == 0){
                let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Admin Not Found | Email Was -> ${req.body.adminemail} |`;
                res.redirect('/admin/adminlogin');
                
                logger.customLogger.log ('warn',mes);
            }

            else{
                let pswd = aes256.decrypt(passKey,result[0].password)
                if(result.length==1 && pswd==req.body.adminpassword)
                    {
                        req.session.adminemail = result[0].email;  
                        req.session.photu = "logo.jpeg"
                        req.session.type = result[0].type;

                        let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Admin Logged In | Admin -> ${req.session.adminemail} |`;
                        res.redirect('/admin/admindashboard');
                        
                        logger.customLogger.log ('info',mes);
                    }
                    else
                    {
                        req.session.invaliderror='invaild credentails'

                        let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Invalid Login Credentials | Admin Email -> ${req.body.adminemail} |`;
                        res.redirect('/admin/adminlogin')

                        logger.customLogger.log ('warn',mes);
                    }

            }
        }
    })
})


/* Logout the Admin Session  */
router.get('/adminlogout',function(req,res){
 
    let mes = `| Request -> /admin/adminlogout | IP -> ${req.ip} | Admin Logged Out | Admin -> ${req.session.adminemail} |`;
    req.session.destroy()
    res.redirect('/')

    logger.customLogger.log ('info',mes);
})



/* Render Admin Dashboard Page */

router.get('/admindashboard',function(req,res){
    if(req.session.adminemail)
    {   
        let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Admin Dashboard Page | Admin -> ${req.session.adminemail} |`;
        res.render('admindashboard',{adminemail:req.session.adminemail , image : req.session.photu})
        logger.customLogger.log ('info',mes);
    }

    else{

        let mes = `| Request -> /admin/checkadmin | IP -> ${req.ip} | Error Fetching Dashboard | No Admin Login |`;
        res.redirect('/');

        logger.customLogger.log ('warn',mes);
    }
})



/* Render the product page */

router.get('/showproducts',function(req,res){
    if(req.session.adminemail)
    {
        pool.query('select * from admin',function(error,result){
            if(error)
            {
                console.log (error);
                let mes = `| Request -> /admin/showproducts | IP -> ${req.ip} | Error Fetching Data | Admin -> ${req.session.adminemail} |`;
                res.redirect('/');
                logger.customLogger.log ('error',mes);

            }
            else
            {   //logger.counsellingLogger.log('info',`${req.session.ip} admin ${req.session.adminemail} rendered show users page`)
                let mes = `| Request -> /admin/showproducts | IP -> ${req.ip} | Rendered Admin Products Page with Data | Admin -> ${req.session.adminemail} |`;
                
                res.render('showproducts',{data:result,adminemail:req.session.adminemail})
                logger.customLogger.log ('info',mes);
            }
        })
    }
    else{
        let mes = `| Request -> /admin/showproducts | IP -> ${req.ip} | Error Rendering Product Page | No Admin Login |`;
        res.redirect('/')

        logger.customLogger.log ('warn',mes);
    }
})


/* For getting the employee name FROM showprouduct.js */
router.get('/getemployee',function(req,res){
    if(req.session.adminemail)
    {
        pool.query('SELECT * FROM `users`',function(error,result){
            if(error)
            {
                let mes = `| Request -> /admin/getemployee | IP -> ${req.ip} | Error Getting Users Name from DB | Admin -> ${req.session.adminemail} |`;
                res.status(500).json([])
                logger.customLogger.log ('error',mes);
            }
            else
            {

                let mes = `| Request -> /admin/getemployee | IP -> ${req.ip} | Getting Users Name | Admin -> ${req.session.adminemail} |`;
                res.status(200).json(result)

                logger.customLogger.log ('info',mes);
            }
          })  
    }   
    else
    {
        let mes = `| Request -> /admin/getemployee | IP -> ${req.ip} | Getting Users Name without Login | No Admin Login | `;
        res.redirect('/')

        logger.customLogger.log ('warn',mes);
    }
})


// router.get('/getdoctorname',(req,res)=>{
//     if (req.session.adminemail){
//         pool.query ("SELECT * FROM `doctor`",(err,obj)=>{
//             if (err){
//                 res.send(500).json([]);
//             }

//             else{
//                 res.status(200).json(obj);
//             }
//         })
//     }
// })



/* Counters for the admin dashboard FROM admindashboard.ejs*/
router.get('/getcounters',(req,res)=>{
    if (req.session.adminemail){
            let finobj = {};
        
            pool.query ("SELECT * FROM `doctor`",(err,obj)=>{
                if (err){
                    console.log (err);

                    let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                    
                    logger.customLogger.log ('error',mes);
                }
        
                else{
                    finobj["doctor"] = obj;
        
                    q = "SELECT * FROM `product`";
                    pool.query (q,(err2,obj2)=>{
                        if (err2){
                            console.log (err2);

                            let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                            
                            logger.customLogger.log ('error',mes);
                        }
        
                        else{
                            finobj["product"] = obj2;
        
                            pool.query ("SELECT * FROM `product` WHERE employeename=?",[req.query.email],(err3,obj3)=>{
                                if (err3){
                                    console.log (err3)
                                    let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                                    
                                    logger.customLogger.log ('error',mes);
                                }
        
                                else{
                                    finobj["yourProduct"] = obj3;
                                    
                                    pool.query("SELECT * FROM `users`",(err4,obj4)=>{
                                        if (err4){
                                            console.log (err4);
                                            let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                                          
                                            logger.customLogger.log ('error',mes);
                                        }
        
                                        else{
                                            finobj["users"] = obj4;
                                            
                                            pool.query ("SELECT DISTINCT `month`,`year`,`email` FROM `schedule` WHERE status = ?",["Pending For Approval"],(err5,obj5)=>{
                                                if (err5){
                                                    // console.log ('aaa')
                                                    console.log (err);
                                                    let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                                                
                                                    logger.customLogger.log ('error',mes);
                                                }
        
                                                else{
                                                    finobj["pending"] = obj5;
                                                    // console.log ('ab2')  
                                                    pool.query ("SELECT DISTINCT `month`,`year`,`email` FROM `schedule` WHERE status = ?",["Approved"],(err6,obj6)=>{
                                                        if (err6){
                                                            console.log (err6);
                                                            let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                                                          
                                                            logger.customLogger.log ('error',mes);
                                                        }
        
                                                        else{
                                                            finobj["approve"] = obj6;
                                                            // console.log ('ab')
                                                            pool.query ("SELECT DISTINCT `month`,`year`,`email` FROM `schedule` WHERE status = ?",["Declined"],(err7,obj7)=>{
                                                                if (err7){
                                                                    
                                                                    console.log (err7);
                                                                    let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Error Getting Counters From DB | Admin -> ${req.session.adminemail} |`;
                    
                                                              
                                                                    logger.customLogger.log ('error',mes);
                                                                }
                
                                                                else{
                                                                   
                                                                    finobj["decline"] = obj7;
                                                                    let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Fetched Counters | Admin -> ${req.session.adminemail} |`;
                    
                                                            
                                                                    res.status(200).json(finobj);
                                                                    logger.customLogger.log ('info',mes);
                
                                                                }
                                                            })
        
        
                                                    
        
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                            
                        }
                    })
        
                }
            })

    }

    else{

        let mes = `| Request -> /admin/getcounters | IP -> ${req.ip} | Restricted Request | No Admin Login |`;
                    
        res.redirect('/');
        logger.customLogger.log ('error',mes);
    }

})


/* For getting Contact Details of a Particular Doctor/s FROM showproduct2.js AND showproduct.js  */
router.get('/getcorrectdoctor',(req,res)=>{
    const text = req.query.contact;
    pool.query ("SELECT * FROM `doctor` WHERE phone = ?",[text],(err,obj)=>{
        if (err){
            console.log (err);

            let mes = `| Request -> /admin/getcorrectdoctor | IP -> ${req.ip} | Error Getting Doctor Info From DB | Admin -> ${req.session.adminemail} |`;        
            // res.send (500).json([]);

            logger.customLogger.log ('error',mes);
        }

        else{

            // let mes = `| Request -> /admin/getcorrectdoctor | IP -> ${req.ip} | Doctor's Data Fetched | Admin -> ${req.session.adminemail} |`;
                
            res.status(200).json(obj);
            // logger.customLogger.log ('info',mes);
        }
    })
})


/* ADding the products FROM showproducts.ejs */
router.post('/addAppointment',function(req,res){
    
    if(req.session.adminemail)
    {
        const text = req.body;
        if (0){

            let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Empty Fields in Form | Admin -> ${req.session.adminemail} |`;
            res.redirect('/admin/showproducts');
            logger.customLogger.log ('info',mes);
        }

        else{
            pool.query('INSERT INTO `appointment`( `mobile`, `email`, `name`, `aadhar`, `symptoms`, `mcondition`, `doctor`, `adate`) VALUES (?,?,?,?,?,?,?,?)',[
                req.body.mobile,
                req.body.email,
                req.body.name,
                req.body.aadhar,
                req.body.symptoms,
                req.body.condition,
                req.body.doctor,
                req.body.date
            ],function(error,result){
              if(error)
              {
                console.log (err);

                let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Error in DB | Admin -> ${req.session.adminemail} |`;
                res.redirect('/')
                logger.customLogger.log ('error',mes);
              }
              else
              {  
             

                let message = `Congratulations  `+ text.name + `  !!
                        Your Appointment has been Created !
                        
                        Token Number : ` + result.insertId + `
                        Date : ` + text.date + `
                        Doctor : ` + text.doctor + `
                        Condition : ` + text.condition + `

                        NR Technologies`;
                                   
                                        
                        var mailOptions = {
                            from: 'rahulrawat31r@gmail.com',
                            to: text.email,
                            subject: "Admin Account Created !",
                            text : message
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            } else {
                            console.log('Email sent ');
                            }
                        });
                

                let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Product Registered  | Admin -> ${req.session.adminemail} |`;
                
                res.redirect('/admin/showproducts')
                logger.customLogger.log ('info',mes);

              }
            });

        }

    }
    else
    {
        let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Product Not Registered  | No Admin Login |`;
        res.redirect('/')
        logger.customLogger.log ('warn',mes);
    }
 })
 


 /* Delete the product FROM showproducts.ejs */

 router.get('/deleteproduct',function(req,res){
    // console.log(req.query.adder);
    if(req.session.adminemail)
    {
        pool.query('delete from product where productid=?',[req.query.productid],function(error,result){
            if(error)
            {
                console.log (error)
                let mes = `| Request -> /admin/deleteproduct | IP -> ${req.ip} | Error Fetchning Data from DB |`;
                logger.customLogger.log ('error',mes);
                res.status(500).json([])
            }
            else
            {
               

                    pool.query("SELECT * FROM `users` WHERE email = ?",[req.query.empmail],(err,obj)=>{
                        let num = parseInt(obj[0].productnum);
                        num--;

                        pool.query ("UPDATE `users` SET productnum = ? WHERE email = ?",[num,req.query.empmail],(err2,obj2)=>{

                            let mes = `| Request -> /admin/deleteproduct | IP -> ${req.ip} | Product Deleted | Admin -> ${req.session.adminemail} |`;
                            logger.customLogger.log ('info',mes);
                            res.redirect('/admin/showproducts')

                        });


                    })
    



            }
        })
    }
    else{
        let mes = `| Request -> /admin/deleteproduct | IP -> ${req.ip} | Deletion of Product Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/')
    }
 })


/* For getting the admin names FROM showproduct.js */
router.get('/getworkingwith',function(req,res){
    if(req.session.adminemail)
    {
        pool.query('select * from `admin`',function(error,result){
            if(error)
            {
                console.log (error)
                let mes = `| Request -> /admin/getworkingwith | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.status(500).json([])
            }
            else
            {
                let mes = `| Request -> /admin/getworkingwith | IP -> ${req.ip} | Admin Names fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
              res.status(200).json(result)
            }
          })  
    }   
    else{
        let mes = `| Request -> /admin/getworkingwith | IP -> ${req.ip} | Admin Names Fetching Denied |No Admin Login | `;
        logger.customLogger.log ('error',mes);
        res.redirect('/')
    }
})




/* Render the admin Doctor Page  */
router.get ('/adddoctorAdmin',(req,res)=>{
    if(req.session.adminemail)
        {
    
            let mes = `| Request -> /admin/adddoctorAdmin | IP -> ${req.ip} | Admin Doctor Page Rendered | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.render ('adddoctorAdmin',{adminemail : req.session.adminemail, image : req.session.image});
        

    }
    else{
        let mes = `| Request -> /admin/adddoctorAdmin | IP -> ${req.ip} | Admin Doctor Page Rendering Deined |No Admin Login  | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/')    
    }
})



/* Add the Doctor from the form FROM adddoctorAdmin.ejs */
router.post ('/adddoctor',(req,res)=>{
    const text = req.body;

    if (req.session.adminemail){
        let password = Math.floor(1000 + Math.random() * 9000);
        let p = password.toString();
        password = aes256.encrypt(passKey,password.toString());
        pool.query ("INSERT INTO `doctor` (email , name, type, password , speciality) VALUES (?,?,?,?,?)",[text.email , text.name , "Doctor" , password , text.speciality]
          ,(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/adddoctor | IP -> ${req.ip} | Error Getting Data from Db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);

                res.redirect('/');
            }

            else{

                

                let mes = `| Request -> /admin/adddoctorAdmin | IP -> ${req.ip} | Doctor ${text.name} Added | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                let message = `Congratulations  Dr.  `+ text.name + `  !!
                        Your Account has been Successfully Created !
                        
                        Your Login Credentials are --->
                        
                        Email : ` + text.email + ` 
                        Password : ` + p + `
                        
                        
                        You can now Login to --> /admin/adminlogin
                        Good Luck !
                        
                        NR Technologies`;
                                   
                                        
                        var mailOptions = {
                            from: 'rahulrawat31r@gmail.com',
                            to: text.email,
                            subject: "Admin Account Created !",
                            text : message
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            } else {
                            console.log('Email sent ');
                            }
                        });
                res.redirect ('/admin/adddoctorAdmin');
            }
        })
    }

    else{
        let mes = `| Request -> /admin/adddoctorAdmin | IP -> ${req.ip} | Doctor Addition Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect ('/');
    }
})


/* Deletes the Doctor From the database FROM adddoctoradmin.ejs */
router.get('/deletedoctor',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("DELETE FROM `doctor` WHERE id = ?",[req.query.doctorid],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/deletedoctor | IP -> ${req.ip} | Error Deleting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/deletedoctor | IP -> ${req.ip} | Doctor Deleted from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.redirect('/admin/adddoctorAdmin');
            }
        })

    }

    else{
        let mes = `| Request -> /admin/deletedoctor | IP -> ${req.ip} | Doctor Deletion Denied | NO Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})  




/* For Finding whether a doctor exits in Database FROM adddoctoradmin.ejs */
router.get ('/findDoc',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * FROM `doctor` WHERE phone = ?",[req.query.contact],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/findDoc | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/findDoc | IP -> ${req.ip} | Doctor Existence in DB Checked | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);

                if (obj.length == 0){
                    res.status (200).json ({status : 1});
                }
                
                else{
                    res.status (200).json ({status : 0});

                }
            }
        })
    }

    else{
        let mes = `| Request -> /admin/findDoc | IP -> ${req.ip} | Doctor Existence Check Denied | NO Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})



/* Render the Admin Add User Page */

router.get ('/adduser',(req,res)=>{
    let finobj = {};

    if (req.session.adminemail){
        pool.query ("SELECT * FROM `admin`",(err,obj)=>{
            if (err){
                let mes = `| Request -> /admin/adduser | IP -> ${req.ip} | Error Gettiing Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                console.log (err);

                res.redirect('/');
            }

            else{

                let mes = `| Request -> /admin/adduser | IP -> ${req.ip} | Users Data Fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                i=0;
                g = 0;
                obj.map((item)=>{
                    i++;
                    item.password = aes256.decrypt(passKey,item.password);

                    if (i == obj.length){
                        g++;
                        res.render('adduser',{adminemail : req.session.adminemail,data : obj,addingcorrect : ""});
                    }
                })

                if (g == 0){
                    res.render('adduser',{adminemail : req.session.adminemail,data : obj,addingcorrect : ""});
                }
            }
        })
    }

    else{
        let mes = `| Request -> /admin/adduser | IP -> ${req.ip} | Users Data Fetching Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})



/* Checking if a user already exists FROM adduser.ejs */

router.get ('/checkPatient',(req,res)=>{
    let finobj = {};

    if (req.session.adminemail){
        pool.query ("SELECT `name` FROM `patients` WHERE email = ?",[req.query.email],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/checkUser | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);

                res.send ({status : 'An Error Occured !'});
            }

            else{
                let mes = `| Request -> /admin/checkUser | IP -> ${req.ip} | User Existence Checked | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                if (obj.length == 0){
                    res.send ({status : "ok"})
                }
                
                else{
                    res.send ({status : "Patient Already Exists !"});

                }
            }
        })
    }

    else{
        let mes = `| Request -> /admin/checkUser | IP -> ${req.ip} | User Existence Check Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.send ({status : "An Error Occured !"});
    }
})




/* Getting the permissions data FROM adduser.ejs */

router.get ('/permissiondata',(req,res)=>{
    pool.query("SELECT `email`,`permission` FROM `users`",(err,obj)=>{
        if (err){
            let mes = `| Request -> /admin/permissiondata | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            console.log (err);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/permissiondata | IP -> ${req.ip} | User Permission Checked | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })
})



/* Adds the user Data FROM adduser.ejs */

router.post('/adduserform',(req,res)=>{
    const text = req.body;

    if (req.session.adminemail){
        let password = Math.floor(1000 + Math.random() * 9000);
        let pswd = aes256.encrypt(passKey,toString(password));
        pool.query ("SELECT * FROM `patients` WHERE email = ?",[text.useremail],(err3,obj3)=>{
            if (err3){
                console.log (err3);
                let mes = `| Request -> /admin/adduserform | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                
                if (obj3.length !=0){
                    res.redirect('/admin/adduserinvalid')
                }
                
            else{
        
                    pool.query ("INSERT INTO `patients` (email,name,age,password,aadhar,gender,mob) VALUES (?,?,?,?,?,?,?)",[text.email,text.name,text.age,pswd,text.aadhar,text.gender,text.mob],(err,obj)=>{
                        if (err){
                            console.log (err);
        
                            res.redirect ('/');
                        }
        
                        else{
                            let mes = `| Request -> /admin/adduserfrom | IP -> ${req.ip} | User ${text.useremail} Added | Admin -> ${req.session.adminemail} | `;
                            logger.customLogger.log ('info',mes);
                            let message = `congratulations `+ text.name + `!!
                            Your Account has been Successfully Created !
                            
                            Your Login Credentials are --->
                            
                            Email : ` + text.email + ` 
                            Password : ` + password + `
                            
                            
                            Good Luck !

                            You can now Login To --> /loginPage
                            
                            MR Technologies`;
                        
                            
                            var mailOptions = {
                                from: 'rahulrawat31r@gmail.com',
                                to: text.email,
                                subject: "Account Created !",
                                text : message
                                };
                                
                                transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent ');
                                }
                                });

                            res.redirect ('/admin/adduser');
                        }
                    })
            
    
                }
            }
        })

    }

    else{
        let mes = `| Request -> /admin/adduserform | IP -> ${req.ip} | Adding User Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.render ('/')
    }
})




/* Change the permissions of the user FROM adduser.ejs */
router.get ('/changepermission',(req,res)=>{

    pool.query ("UPDATE `users` SET permission = ? WHERE email = ?",[req.query.permission,req.query.email],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/changepermission | IP -> ${req.ip} | Error Changing Permissions (DB) | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/changepermission | IP -> ${req.ip} | User Permission Changed  | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.redirect('/admin/adduser');
        }
    })
})


/* Deletes the users FROM adduser.ejs */

router.get ('/deleteuser',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("DELETE FROM `users` WHERE email = ?",[req.query.email],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/deleteuser | IP -> ${req.ip} | Error Deleting User from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }
    
            else{
                let mes = `| Request -> /admin/deleteuser | IP -> ${req.ip} | User ${req.query.email} Deleted  | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);

                let message = `Attention !!
                Your Account has been Deleted  !
                            
                Your Email : ` + req.query.email + ` 
                
                
                is no longer acceptable. 


                Contact Administrator !


                MR Technologies
                                         `;
                       
                            
                            var mailOptions = {
                                from: 'rahulrawat31r@gmail.com',
                                to: req.query.email,
                                subject: "Account Deleted !",
                                text : message
                              };
                              
                              transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent ');
                                }
                              });

                res.redirect('/admin/adduser')
            }
        })

    }

    else{
        let mes = `| Request -> /admin/deleteuser | IP -> ${req.ip} | User Deletion Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }

})




/* Render The Admin Profile Page */

router.get ('/profile',(req,res)=>{
    if (req.session.adminemail){

        pool.query("SELECT * FROM `admin` WHERE adminemail=?",[req.session.adminemail],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/profle | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let isrc = "/images/" + obj[0].img;
                let mes = `| Request -> /admin/profile | IP -> ${req.ip} | Admin Profile Rendered | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.render('profile.ejs',{name : obj[0].name,email : req.session.adminemail,img : isrc,remark : obj[0].remark});
            }
        })
    }

    else{
        let mes = `| Request -> /admin/profile | IP -> ${req.ip} | Admin Profile Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }

})



/* Render Admin Chemist Page */

router.get ('/loadchemist',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * from `chemist`",(err,obj)=>{
            if (err){
                let mes = `| Request -> /admin/loadchemist | IP -> ${req.ip} | Error Getting Data from dB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                console.log (err);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/loadchemist | IP -> ${req.ip} | Rendering the chemist Page | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.render ('adminchemist',{adminemail : req.session.adminemail,data : obj});
            }
        })
    }

    else{
        let mes = `| Request -> /admin/loadchemist | IP -> ${req.ip} | Chemist Page Rendering Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect ('/');
    }
})




/* Add the chemsit to the DB FROM adminchemist.ejs */

router.post('/addchemist',(req,res)=>{
    if (req.session.adminemail){
        const text = req.body;

        pool.query ("INSERT INTO `chemist` (name,contact,area) VALUES(?,?,?)",[text.chemistname,text.phone,text.area],(err2,obj2)=>{
            if (err2){
                let mes = `| Request -> /admin/addchemist | IP -> ${req.ip} | Error Inserting Chemist Data | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                console.log (err);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/addchemist | IP -> ${req.ip} | Chemist ${text.chemistname} Added to Db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.redirect('/admin/loadchemist');
            }
        });


    }

    else{
        let mes = `| Request -> /admin/addchemist | IP -> ${req.ip} | Chemist Addition Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect ('/');
    }
})



/* Delete the chemist FROM adminchemist.ejs */

router.get('/deletechemist',(req,res)=>{
    const text = req.query.contact;

    pool.query("DELETE FROM `chemist` WHERE contact = ?",[text],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/deletechemist | IP -> ${req.ip} | Error Deleting Chemist DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getworkingwith | IP -> ${req.ip} | Chemist Deleted from DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.redirect('/admin/loadchemist');
        }
    })
})



/* For getting the Name details of the chemist FROM showproducts2.js */
router.get('/getchemistcontact',(req,res)=>{
    const text = req.query.contact;
    pool.query ("SELECT * FROM `chemist` WHERE contact = ?",[text],(err,obj)=>{
        if (err){
            console.log (err);

            let mes = `| Request -> /admin/getchemistcontact | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }
        
        else{
            let mes = `| Request -> /admin/getchemistcontact | IP -> ${req.ip} | Chemist Data Fetched | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);

            res.status(200).json(obj);
        }
    })

})




/* For Finding whether a chemist exits in Database FROM adminchemist.ejs */
router.get ('/findChem',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * FROM `chemist` WHERE contact = ?",[req.query.contact],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/findChem | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/findChem | IP -> ${req.ip} | Chemist Data Fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                if (obj.length == 0){
                    res.status (200).json ({status : 1});
                }
                
                else{
                    res.status (200).json ({status : 0});

                }
            }
        })
    }

    else{
        let mes = `| Request -> /admin/findChem | IP -> ${req.ip} | Chemist Data Fetching Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})



/* Render The Admin Stockist Page */

router.get ('/loadstockist',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * FROM `stockist`",(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/loadstockist | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);

                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/loadstockist | IP -> ${req.ip} | Rendered the admin stockist Page | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.render ('adminstockist',{adminemail : req.session.adminemail,data : obj});
            }
        })
    }

    else{
        let mes = `| Request -> /admin/loadchemist | IP -> ${req.ip} | Admin Stockist Page Rendering Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})




/* Add the stockist FROM adminstokcist.ejs */

router.post('/addstockist',(req,res)=>{
    if (req.session.adminemail){
        const text = req.body;

        pool.query ("INSERT INTO `stockist` (name,contact,area) VALUES(?,?,?)",[text.stockistname,text.phone,text.area],(err2,obj2)=>{
            if (err2){
                console.log (err);
                let mes = `| Request -> /admin/addstockist | IP -> ${req.ip} | Error Inserting Data (DB) | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/addstockist | IP -> ${req.ip} | Stockist ${text.stockistname} Added | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.redirect('/admin/loadstockist');
            }
        });


    }

    else{
        let mes = `| Request -> /admin/addstockist | IP -> ${req.ip} | Adding Stockist Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect ('/');
    }
})



/* Delete A particular stockist FROM adminstockist.ejs */

router.get('/deletestockist',(req,res)=>{
    const text = req.query.contact;

    pool.query("DELETE FROM `stockist` WHERE contact = ?",[text],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/deletestockist | IP -> ${req.ip} | Error Deleting Stockist | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/deletestockist | IP -> ${req.ip} | Stockist deleted | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.redirect('/admin/loadstockist');
        }
    })
})



/* For Getting the stokcist Name FROM showproduct2.js */
router.get('/getstockistcontact',(req,res)=>{
    const text = req.query.contact;

    pool.query ("SELECT * FROM `stockist` WHERE contact = ?",[text],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getstockistcontact | IP -> ${req.ip} | Error Getting Data from Db | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }
        
        else{
            let mes = `| Request -> /admin/getstockistcontact | IP -> ${req.ip} | Stockist Data Fetched | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })

})



/* For Finding whether a doctor exits in Database FROM adddoctoradmin.ejs */
router.get ('/findStock',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * FROM `stockist` WHERE contact = ?",[req.query.contact],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/findStock | IP -> ${req.ip} | Error Getting Stockist Data From DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/findStock | IP -> ${req.ip} | Stockist Data Fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                if (obj.length == 0){
                    res.status (200).json ({status : 1});
                }
                
                else{
                    res.status (200).json ({status : 0});

                }
            }
        })
    }


    else{
        let mes = `| Request -> /admin/findStock | IP -> ${req.ip} | Stockist Data Fetching Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})



/* Render the Admin Schedule Approving Page  */

router.get ('/approveSchedulePage',(req,res)=>{
    const text = req.query;
    if (req.session.adminemail){
        let mes = `| Request -> /admin/approveSchedulePage | IP -> ${req.ip} | Rendered Schedule Approval Page | Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('info',mes);

        res.render ('adminSchedule',{adminemail : req.session.adminemail,data : [],email : text.email,year : text.year,month : text.month, start : "", end : "", amt : ""})
    }

    else{
        let mes = `| Request -> /admin/approveSchedulePage | IP -> ${req.ip} | Schedule Page Rendering Denied | No Admin Login | `;
        logger.customLogger.log ('info',mes);

        res.redirect('/');
    }
})




/* Get the Pending Schedule user emaiils FROM adminSchedule.js */
router.get ('/getpendingRequests',(req,res)=>{
    pool.query ("SELECT DISTINCT `email` FROM `schedule` WHERE status = ?",["Pending For Approval"],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getpendingRequests | IP -> ${req.ip} | Error Getting Data from dB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getpendingRequests | IP -> ${req.ip} | Fetched Pending Schedule User Emails | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })
})


/* Get the pending requests year FROM adminschedule.js */
router.get ('/getpendingRequestsYear',(req,res)=>{
    const text = req.query.email;

    pool.query ('SELECT DISTINCT `year` FROM `schedule` WHERE email = ? AND status = ? ',[req.query.email,'Pending For Approval'],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getpendingRequestYear | IP -> ${req.ip} | Error Getting Data from Db | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getpendingRequestYear | IP -> ${req.ip} | Fetched Pending Request year | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })
})


/* Get the pending requests monthe from adminscheule.js */
router.get ('/getpendingRequestsMonth',(req,res)=>{
    const text = req.query;

    pool.query ("SELECT DISTINCT `month` FROM `schedule` WHERE email = ? AND status = ? AND year = ? ",[text.email,"Pending For Approval",text.year],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getpendingRequestsMonth | IP -> ${req.ip} | Error Getting Data | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getpendingRequestsMonth | IP -> ${req.ip} | Fetched the pending Requests Month | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })
})




/* Getting Pending Requests for a date range FROM adminscheudle.js */

router.get ("/getpendingRequestsData",(req,res)=>{
    if (req.session.adminemail){
        const text = req.query;
        // console.log (text);
        pool.query ("SELECT * FROM `schedule` WHERE email = ? AND status = ? AND year = ? AND month = ? AND date >= ? AND date <= ? ORDER BY `date`",[text.email,"Pending For Approval",text.year,text.month,text.start,text.end],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/getpendingRequestsData | IP -> ${req.ip} | Error Getting Data | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
    
            }
    
            else{
                amt = "1"
                if (obj.length == 0){
                    amt = "";
                }

                let mes = `| Request -> /admin/getpendingRequestsData | IP -> ${req.ip} | Pending Requests Data Fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.render('adminSchedule',{adminemail : req.session.email,data : obj,email : text.email,year : text.year,month : text.month, start : text.start, end : text.end, amt : amt});
            }
        })

    }

    else{

        let mes = `| Request -> /admin/getpendingRequestsData | IP -> ${req.ip} | Fetching Pending Requests Data Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }

})



/* Approve or Decline the schedule of the user FROM adminSchedule.ejs */

router.get ('/approvingStatus',(req,res)=>{

    if (req.session.adminemail){
        const text = req.query;

        if (text.status == 1){
            pool.query ("UPDATE `schedule` SET status = ? WHERE email = ? AND year = ? AND month = ? AND date >= ? AND date <= ? AND NOT status = ?",["Approved",text.email,text.year,text.month, text.start, text.end,"Declined"],(err,obj)=>{
                if (err){
                    console.log (err)
                    let mes = `| Request -> /admin/approvingStatus | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
                    logger.customLogger.log ('error',mes);
                    res.redirect('/')
                }

                else{
                    let mes = `| Request -> /admin/approvingStatus | IP -> ${req.ip} | Updated Schedule Status | Admin -> ${req.session.adminemail} | `;
                    logger.customLogger.log ('info',mes);
                    let message = `congratulations !!
                            Your Schedule for 

                            Month : ` + text.month + `
                            Year : ` + text.year + `

                            Date Range : ` + text.start +` To ` + text.end + `
                            
                            Has Been APPROVED !
                            

                            MR Technologies
                            `;
                       
                            
                            var mailOptions = {
                                from: 'rahulrawat31r@gmail.com',
                                to: text.email,
                                subject: "Schedule Approved !",
                                text : message
                              };
                              
                              transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent ');
                                }
                              });


                    res.redirect('/admin/admindashboard');
                }
            })
        }
    

    else{
        pool.query ("UPDATE `schedule` SET status = ? WHERE email = ? AND year = ? AND month = ? AND date >= ? AND date <= ?",["Declined",text.email,text.year,text.month,text.start, text.end],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/approvingStatus | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/approvingStatus | IP -> ${req.ip} | Updated Schedule Status | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                let message = `Attention !!
                            Your Schedule for 

                            Month : ` + text.month + `
                            Year : ` + text.year + `
                            Date Range : ` + text.start +` To ` + text.end + `
                            
                            Has Been Declined  !

                            Please Create A New Schedule


                            MR Technologies
                            
                            `;
                       
                            
                            var mailOptions = {
                                from: 'rahulrawat31r@gmail.com',
                                to: text.email,
                                subject: "Schedule Declined !",
                                text : message
                              };
                              
                              transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent ');
                                }
                              });

                res.redirect('/admin/admindashboard');
            }
        })
    }

    }
    
    else{
        let mes = `| Request -> /admin/approvingStatus | IP -> ${req.ip} | Updating Schedule Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');

    }
})




/* Getting the email of the users for the schedule FROM adminscheduledetails.ejs */

router.get('/getuserappapi',(req,res)=>{
    if (req.session.adminemail){
        pool.query("SELECT DISTINCT `email` FROM `schedule`",(err,obj)=>{
            if (err){
                console.log (err);

                let mes = `| Request -> /admin/getuserappapi | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
            }

            else{
                let mes = `| Request -> /admin/getuserappapi | IP -> ${req.ip} | Fetched user emails| Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.status(200).json(obj);
            }
        })
    }

    else{
        let mes = `| Request -> /admin/getuserappapi | IP -> ${req.ip} | Fetching User Emails Denied| Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})


/* Rendering the Admin Schedule Details Page */

router.get ('/fetchSchedule',(req,res)=>{
    if (req.session.adminemail){
        let mes = `| Request -> /admin/fetchSchedule | IP -> ${req.ip} | Rendered Admin Schedule Details | Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('info',mes);

        res.render ('adminScheduleDetails',{adminemail : req.session.adminemail,data : [],title : "Get Schedule"});
    }

    else{
        let mes = `| Request -> /admin/fetchSchedule | IP -> ${req.ip} | Admin Schedule Details Rendering Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})

// router.get ('/getSchedules',(req,res)=>{
//     pool.query ("SELECT DISTINCT `email` FROM `schedule`",(err,obj)=>{
//         if (err){
//             console.log (err);
//             res.redirect('/');
//         }

//         else{
//             res.status(200).json(obj);
//         }
//     })
// })


/* For getting the year of the schudles FROM fetchschedule.js */
router.get ('/getSchedulesYear',(req,res)=>{
    const text = req.query;

    pool.query ("SELECT DISTINCT `year` FROM `schedule` WHERE email = ? AND status = ?",[text.email,text.approval],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getSchedulesYear | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getSchedulesYear | IP -> ${req.ip} | Year of Schedule Fetched | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json(obj);
        }
    })
})

/* For gettting the month of a particular year schedule FROM fetchschedule.js */
router.get ('/getScheduleMonth',(req,res)=>{
    const text = req.query;

    pool.query ("SELECT DISTINCT `month` FROM `schedule` WHERE email = ? AND year = ? AND status = ? ",[text.email,text.year,text.status],(err,obj)=>{
        if (err){
            console.log (err);
            let mes = `| Request -> /admin/getScheduleMonth | IP -> ${req.ip} | Error Getting Data from db | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getScheduleMonth | IP -> ${req.ip} | Fetch Month of the schedule | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);  
            res.status(200).json(obj);
        }
    })
})



/* Get Details of the schedule for a particular date range FROM adminscheudledetials.ejs */

router.post ('/getFinalScheduleData',(req,res)=>{
    if (req.session.adminemail){

        const text= req.body;
        // console.log (text.checking);
        if (text.approval == "Pending"){
            text.approval = "Pending For Approval";
        }

        else if (text.approval == "Declined"){
            text.approval = "Declined";
        }
        pool.query ("SELECT * FROM `schedule` WHERE email = ? AND status = ? AND year = ? AND month = ? AND date >= ? AND date <= ? ORDER BY `date`",[text.useremail,text.approval,text.yearuser,text.monthuser,text.datestartrange,text.dateendrange],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/getFinalScheduleData | IP -> ${req.ip} | Error Getting data from DB| Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }
    
            else{
                let mes = `| Request -> /admin/getFinalScheduleData | IP -> ${req.ip} | Final Schedule Data Fetched | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);

                let months = ['January', 'Feburary','March','April','May','June','July','August','September','October','November','December'];

                if (text.checking == "no"){
                    res.render ('adminScheduleDetails',{adminemail : req.session.adminemail, data : obj,title : (text.useremail +" - "+ months[(text.monthuser - 1)])})
                    
                }
                
                else{
                    res.render ('adminScheduleDetailswithDcr',{adminemail : req.session.adminemail, data : obj,title : (text.useremail +" - "+ months[(text.monthuser - 1)])})

                }

            }
        })
    }

    else{
        let mes = `| Request -> /admin/getFinalScheduleData | IP -> ${req.ip} | Final Schedule Data Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }

})




/* Render the Admin DCR Page */

router.get ('/getdcr',(req,res)=>{
    if (req.session.adminemail){
        let mes = `| Request -> /admin/getdcr | IP -> ${req.ip} | Rendered DCR Admin Page | Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('info',mes);
        res.render ('dcradmin',{adminemail : req.session.adminemail})
    }

    else {
        let mes = `| Request -> /admin/getdcr | IP -> ${req.ip} | Rendering DCR Admin Page Denied | No Admin Login | `;
        logger.customLogger.log ('info',mes);
        res.redirect ('/');
    }
})


/* Checking the schedule for a particular date FROM adddcradmin.js */

router.get ('/checkDateSchedule',(req,res)=>{
    if (req.session.adminemail){
      const text = req.query;
      
      text.month ++ ;

  
      pool.query ("SELECT * FROM `schedule` WHERE date = ? AND year = ? AND month = ? AND email = ? AND status = ?",[text.date,text.year,text.month,text.email,"Approved"],(err,obj)=>{
        if (err){
          console.log (err);
          let mes = `| Request -> /admin/checkDateSchedule | IP -> ${req.ip} | Error getting Data from Db | Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('error',mes);
  
          res.redirect('/');
        }
  
        else{
            let mes = `| Request -> /admin/checkDateSchedule | IP -> ${req.ip} | Fetched Schedule for a date  | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
          res.status(200).json (obj);
        }
      })
    }
  
    else{
        let mes = `| Request -> /admin/checkDateSchedule | IP -> ${req.ip} | Fetching Schedule for a date Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
      res.redirect('/');
    }
  })




  /* Add the DCR report from the admin side FROM dcradmin.esj */

  router.post ('/dcrform',(req,res)=>{
    if (req.session.adminemail){
      const text = req.body;  
      
      for (i=0;i<parseInt( text.visitStatus );i++){
        acd = "doctorName" + i;
        acd = text[acd];
  
        x = "doctorcontact" + i;
  
        act = "visitTime" + i;
        act = text[act];
        if (acd != "No Visit"){
          acd = acd + " ( " + text[x] + " ) ";
        }
  
        else{
  
          act = "00:00";
        }

        pool.query ("UPDATE `schedule` SET `actdoctor` = ? , `acttime` = ?, `remarks` = ?,task = ? WHERE email = ? AND year = ? AND month = ? AND date = ? AND doctor = ? AND time = ? AND status = ?",[acd,act,text.remarks,text.schStatus,text.emailForm,JSON.parse(text.sendData)[0].year,JSON.parse(text.sendData)[0].month,JSON.parse(text.sendData)[0].date,JSON.parse(text.sendData)[i].doctor,JSON.parse(text.sendData)[i].time,"Approved"],(err,obj)=>{
          if (err){
            console.log (err);
            let mes = `| Request -> /admin/dcrform | IP -> ${req.ip} | Error Updating DCR DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
          }
          
  
        })
      }
      
      res.redirect('/admin/getdcr');
      
  
    }
  
    else{
        let mes = `| Request -> /admin/dcrform | IP -> ${req.ip} | Updating the DCR Denied | No Admin Login | `;
        logger.customLogger.log ('info',mes);
      res.redirect('/');
    }
  })



  
  /* Selecting updated schedules FROM adddcradmin.js */

  router.get ('/getDCRemails',(req,res)=>{
    pool.query ("SELECT DISTINCT `email` FROM `schedule` WHERE status = ?",["Approved"],(err,obj)=>{
        if (err){
            
            console.log (err);


            let mes = `| Request -> /admin/getDCRemails | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            let mes = `| Request -> /admin/getDCRemails | IP -> ${req.ip} | Fetch approved Schedules | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.status(200).json (obj);
        }
    })
  })



  /* Getting the number of visits in a particular schedule FROM adddcradmin.js */

  router.get ('/getDCRvisits',(req,res)=>{
    if (req.session.adminemail){
      const text = req.query;
        
      let x = new Date(text.date);
    
      pool.query("SELECT * FROM `schedule` WHERE date = ? AND year = ? AND month = ? AND email = ? AND status = ?",[x.getDate(), x.getFullYear(), (x.getMonth() +1),text.email,"Approved"],(err,obj)=>{
        if (err){
          console.log (err);
          let mes = `| Request -> /admin/getDCRvisits | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
          res.redirect('/');
        }
    
        else{

            let mes = `| Request -> /admin/getDCRvisits | IP -> ${req.ip} | Getting number of visits of a particular schedule | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
          res.status(200).json (obj);
        }
      })
  
    }
  
    else{

        let mes = `| Request -> /admin/getDCRvisits | IP -> ${req.ip} | Getting visits Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
      res.redirect('/');
    }
  
  })



 /* Render the Admin Product Images  */

  router.get ('/getproductimage',(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * from `productimage`",(err,obj)=>{
            if (err){
                console.log (err);

                let mes = `| Request -> /admin/getproductimage | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let mes = `| Request -> /admin/getproductimage | IP -> ${req.ip} | Admin product page rendered | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('info',mes);
                res.render ('productimage',{adminemail : req.session.adminemail,data : obj})

            }

        })
    }

    else{
        
        let mes = `| Request -> /admin/getproductimage | IP -> ${req.ip} | Admin product page denine | NO Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
  })


  /* Deletes the product image FROM productimage.ejs */

  router.get ('/deleteimage',(req,res)=>{
    const text = req.query;

    let path = "./public/images/" + text.name;

    fs.unlink(path,(err5)=>{
        console.log ('File Deleted !');
    })

    if (req.session.adminemail){
        pool.query ("DELETE FROM `productimage` WHERE id = ?",[text.id],(err,obj)=>{
            if (err){
                console.log (err);
                let mes = `| Request -> /admin/deleteimage | IP -> ${req.ip} | Error Deleting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }


            let mes = `| Request -> /admin/deleteimage | IP -> ${req.ip} | Product image Deleted | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('info',mes);
            res.redirect('/admin/getproductimage');
        })

    }

    else{
        let mes = `| Request -> /admin/deleteimage | IP -> ${req.ip} | Product image deletion denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
  })



  /* Add the Product image FROM productimage.ejs */

  router.post ('/addproductimage',upload.single('img'),(req,res)=>{
    if (req.session.adminemail){
        pool.query ("SELECT * FROM `users`",(err,obj)=>{
            pool.query ("INSERT INTO `productimage` (img) VALUES (?)",[imgname],(err2,obj2)=>{
                if (err2){

                    let mes = `| Request -> /admin/addproductimage | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                    logger.customLogger.log ('error',mes);
                    console.log (err2);
                    res.redirect('/');
                }

                else{

                    let mes = `| Request -> /admin/addproductimage | IP -> ${req.ip} | Product image added | Admin -> ${req.session.adminemail} | `;
                    logger.customLogger.log ('info',mes);
                    res.redirect('/admin/getproductimage');
                }
            })
        })
    }

    else{

        let mes = `| Request -> /admin/addproductimage | IP -> ${req.ip} | Product image addition denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
  })




/* Opening the admin registrations */

  router.get ('/adminregistrations',(req,res)=>{

    let mes = `| Request -> /admin/adminregistrations | IP -> ${req.ip} | Rendered the admin registrations page | Admin Registrations | `;
    logger.customLogger.log ('info',mes);
    res.render ('addadmin');
  })





  /* Adding the Admin Form FROM addadmin.js */

  router.post ('/addadminform',upload.single('img'),(req,res)=>{
    const text = req.body;
    console.log (text);

    let pswd = aes256.encrypt(passKey,text.password);

    pool.query ("INSERT INTO `admin` (email , name, role, image, password) VALUES (?,?,?,?,?)",[text.email , text.name , text.role , imgname , pswd],(err,obj)=>{
        if (err){
            console.log (err);


            let mes = `| Request -> /admin/addadminform | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
            logger.customLogger.log ('error',mes);
            res.redirect('/');
        }

        else{
            if (text.role == "Doctor"){
                pool.query ('Insert into speciality (email, speciality) values (?,?)',[text.email,text.speciality] ,(err,obj)=>{
                    if (err){
                        console.log (err);

                        let mes = `| Request -> /admin/addadminform | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                        logger.customLogger.log ('error',mes);
                        res.redirect('/');
                    }

                    else{
                        let message = `Congratulations  Admin  `+ text.name + `  !!
                        Your Account has been Successfully Created !
                        
                        Your Login Credentials are --->
                        
                        Email : ` + text.email + ` 
                        Password : ` + text.password + `
                        
                        
                        You can now Login to --> /admin/adminlogin
                        Good Luck !
                        
                        MR Technologies`;
                                   
                                        
                        var mailOptions = {
                            from: 'rahulrawat31r@gmail.com',
                            to: text.email,
                            subject: "Admin Account Created !",
                            text : message
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            } else {
                            console.log('Email sent ');
                            }
                        });
            
            
                        let mes = `| Request -> /admin/addadminform | IP -> ${req.ip} | Admin Added to the DB | Admin -> ${text.email} | `;
                        logger.customLogger.log ('info',mes);
                        res.redirect('/');
                    }
                })
            }

            else{
                let message = `Congratulations  Admin  `+ text.name + `  !!
                        Your Account has been Successfully Created !
                        
                        Your Login Credentials are --->
                        
                        Email : ` + text.email + ` 
                        Password : ` + text.password + `
                        
                        
                        You can now Login to --> /admin/adminlogin
                        Good Luck !
                        
                        MR Technologies`;
                                   
                                        
                        var mailOptions = {
                            from: 'rahulrawat31r@gmail.com',
                            to: text.email,
                            subject: "Admin Account Created !",
                            text : message
                        };
                        
                        transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                            console.log(error);
                            } else {
                            console.log('Email sent ');
                            }
                        });
            
            
                        let mes = `| Request -> /admin/addadminform | IP -> ${req.ip} | Admin Added to the DB | Admin -> ${text.email} | `;
                        logger.customLogger.log ('info',mes);
                        res.redirect('/');
            }
        }
    })
  })



  
  /* For Finding whether an admin is registered is present FROM addadmin.js */
  router.get('/checkadminmail',(req,res)=>{
    
    pool.query ("SELECT * FROM `admin` WHERE `email` = ?",[req.query.email],(err,obj)=>{
        if (err){
            console.log (err);

            let mes = `| Request -> /admin/checkadminmail | IP -> ${req.ip} | Error Getting Data from DB | Admin Registrations | `;
            logger.customLogger.log ('error',mes);
            res.status(200).json({status : 0});
        }

        else{

            let mes = `| Request -> /admin/checkadminmail | IP -> ${req.ip} | Admin Check performed | Admin Registrations | `;
            logger.customLogger.log ('info',mes);
            if (obj.length == 0){
                res.status(200).json ({status : 1});
            }

            else{
                res.status(200).json({status : 0});
            }
        }
    })
  })


/* Changing Password page Rendering */

router.get('/changepswd',(req,res)=>{
    if (req.session.adminemail){
        let mes = `| Request -> /admin/changepswd | IP -> ${req.ip} | Admin password change page rendered | Admin -> ${req.session.adminemail} | `;
        logger.customLogger.log ('info',mes);
        res.render ('changePswdAdmin', {adminemail : req.session.adminemail});
    }

    else{

        let mes = `| Request -> /admin/changepswd | IP -> ${req.ip} | Admin password change page Denied | NO Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})


/* Checking the old passwords FROM changePswdAdmin.ejs */

router.get ('/checkPswd',(req,res)=>{
    if (req.session.adminemail){

        pool.query ("SELECT `adminpassword` FROM `admin` WHERE `adminemail` =?",[req.session.adminemail], (err,obj)=>{
            if (err){
                console.log (err);

                let mes = `| Request -> /admin/checkPswd | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                let pswd = aes256.decrypt(passKey,obj[0].adminpassword);

                let mes = `| Request -> /admin/checkPswd | IP -> ${req.ip} | Admin Password Checked for changing password | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                if (pswd == req.query.pswd){
                    res.status (200).send ({status : 1});
                }

                else{
                    res.status (200).send ({status : 0});
                }
            }
        })
    }

    else{

        let mes = `| Request -> /admin/checkPswd | IP -> ${req.ip} | Admin Password Check Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})



/* Changing passwords form FROM changePswdAdmin.ejs */

router.post ('/changePswdForm',(req,res)=>{
    if (req.session.adminemail){
        const text = req.body;

        pool.query ("select adminpassword from admin where adminemail = ?",[req.session.adminemail],(err2,obj2)=>{
            if (err){
                console.log (err);

                let mes = `| Request -> /admin/changePswdForm | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                logger.customLogger.log ('error',mes);
                res.redirect('/');
            }

            else{
                
                let password = aes256.decrypt(passKey, obj[0].adminpassword);

                if (password == text.oldpswd){
                    let pswd = aes256.encrypt(passKey,text.newpswd);;
                    pool.query ("UPDATE `admin` SET `adminpassword` = ? WHERE `adminemail` = ?",[pswd, req.session.adminemail],(err,obj)=>{
                        if (err){
                            console.log (err);

                            let mes = `| Request -> /admin/changePswdForm | IP -> ${req.ip} | Error Getting Data from DB | Admin -> ${req.session.adminemail} | `;
                            logger.customLogger.log ('error',mes);
                            res.redirect('/');
                        }

                        else{
                            let message = `Attention `+ req.session.adminemail + `!!
                            Your Password Has Been Changed Successfully !
                                        
                            Your Login Credentials are --->
                                        
                            Email : ` + req.session.adminemail + ` 
                            Password : ` + text.newpswd + `

                            You can now Login To --> /loginPage
                            
                            MR Technologies`;
                                
                                        
                            var mailOptions = {
                                from: 'rahulrawat31r@gmail.com',
                                to: req.session.adminemail,
                                subject: "Password Changed !",
                                text : message
                                };
                                
                                transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent ');
                                }
                                });

                                let mes = `| Request -> /admin/changePswdForm | IP -> ${req.ip} | Admin Password Changed | Admin -> ${req.session.adminemail} | `;
                                logger.customLogger.log ('info',mes);

                            res.redirect('/admin/changepswd');
                        }
                    })   
                }

                else{

                    let mes = `| Request -> /admin/changePswdForm | IP -> ${req.ip} | Incorrect Old Password | Admin -> ${req.session.adminemail} | `;
                    logger.customLogger.log ('warn',mes);
                    res.redirect('/admin/dashboard');
                }

            }
        })

         
    }

    else{

        let mes = `| Request -> /admin/changePswdForm | IP -> ${req.ip} | Admin Password Change Denied | No Admin Login | `;
        logger.customLogger.log ('warn',mes);
        res.redirect('/');
    }
})

router.get ('/finalDoc' , (req,res)=>{
    pool.query ('select * from doctor where email =? ' , [req.query.email] , (err,obj)=> {
        if (obj.length == 0){
            res.send ({status : "ok"});
        }

        else{
            res.send({status : "no"});
        }
    })
})


/* Getting the doctors */

router.get('/getdoctors',(req,res)=> {
    pool.query ('select * from doctor where type = "Doctor"' , (err,obj)=> {
        if (err){
            console.log (err);
            res.send ([]);
        }

        else{
            res.send (obj);
        }
    })
})

/* Getting teh doctor with the particular speciality */

router.get('/getdoctorS/:speciality',(req,res)=> {
    pool.query ('select d.name, d.email from doctor d where d.speciality = ?' , [req.params.speciality] , (err,obj)=> {
        if (err){
            console.log (err);
            res.send ([]);
        }

        else{
            res.send (obj);
        }
    })
})

/* Getting the patients */

router.get('/fetchPatients' , (req,res)=>{
    pool.query ('select * from patients ' , (err,obj)=> {
        if (err){
            console.log (err);
            res.send ([]);
        }

        else{
            res.send (obj);
        }
    })
})

/* Getting the particular patient data */

router.get('/getpatient/:phone' , (req,res)=>{
    pool.query ('select * from patients where mob = ?' , [req.params.phone] , (err,obj)=> {
        if (err){
            console.log (err);
            res.send ([]);
        }

        else{
            res.send (obj);
        }
    })
})

router.get('/appdetails',(req,res)=>{
    if(req.session.adminemail)
        {
            pool.query('select * from admin',function(error,result){
                if(error)
                {
                    console.log (error);
                    let mes = `| Request -> /admin/appdetails | IP -> ${req.ip} | Error Fetching Data | Admin -> ${req.session.adminemail} |`;
                    res.redirect('/');
                    logger.customLogger.log ('error',mes);
    
                }
                else
                {   //logger.counsellingLogger.log('info',`${req.session.ip} admin ${req.session.adminemail} rendered show users page`)
                    let mes = `| Request -> /admin/appdetails | IP -> ${req.ip} | Rendered Admin Products Page with Data | Admin -> ${req.session.adminemail} |`;
                    
                    res.render('appointmentDetails',{data:result,adminemail:req.session.adminemail})
                    logger.customLogger.log ('info',mes);
                }
            })
        }
        else{
            let mes = `| Request -> /admin/appdetails | IP -> ${req.ip} | Error Rendering Product Page | No Admin Login |`;
            res.redirect('/')
    
            logger.customLogger.log ('warn',mes);
        }
    
})

router.get('/checkpatients/:token',(req,res)=>{
    if(req.session.adminemail)

{
            const tokenNum = req.params.tokenNum; 
            res.render('checkPatients',{adminemail:req.session.adminemail});
        }
        else{
            let mes = `| Request -> /admin/appdetails | IP -> ${req.ip} | Error Rendering Product Page | No Admin Login |`;
            res.redirect('/')
            logger.customLogger.log ('warn',mes);
        }

})


/* Getting the appointments */

router.get('/getAppointments' , (req,res)=> {
    pool.query ('select a.* , d.name as dname, d.speciality as specs from appointment a, doctor d where d.email = a.doctor' , (err,obj)=> {
        if (err){
            console.log (err);
            res.send ([]);
        }

        else{
            res.send (obj);
        }
    })
})


/* Getting the appoitments for the doctor */

router.get('/getAppointmentsDoc/:condition/:date/:type' , (req,res)=>{
    if (req.session.type == "Doctor"){

        let query = 'select a.* , d.name as dname from appointment a, doctor d where d.email = a.doctor and a.doctor = ? and a.visit =? and a.adate = ?';
        if (req.params.condition != "All"){
            query = 'select a.* , d.name as dname from appointment a, doctor d where d.email = a.doctor and a.doctor = ? and a.visit = ? and a.adate = ? and a.mcondition = ?';
        }

        pool.query (query , [req.session.adminemail, req.params.type, req.params.date , req.params.condition] , (err,obj)=> {
            if (err){
                console.log (err);
                res.send ([]);
            }
    
            else{
                res.send (obj);
            }
        })
    }

    else{
        let query = 'select a.* , d.name as dname from appointment a, doctor d where d.email = a.doctor and a.visit = ? and a.adate = ?';
        if (req.params.condition != "All"){
            query = 'select a.* , d.name as dname from appointment a, doctor d where d.email = a.doctor and a.visit = ? and a.adate = ? and a.mcondition = ?';
        }

        pool.query (query , [req.params.type, req.params.date , req.params.condition] , (err,obj)=> {
            if (err){
                console.log (err);
                res.send ([]);
            }
    
            else{
                res.send (obj);
            }
        })
    }
})

module.exports = router;
