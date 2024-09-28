var express = require("express");
const pool = require("./pool");
var router = express.Router();
var aes256 = require("aes256");
const { json } = require("express");
var passKey = "MRTECH";
var nodemailer = require("nodemailer");
var logger = require("../controller/logger");
var ip = require("ip");
var multer = require("multer");
const { v4: uuid, parse } = require("uuid");


const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/reports");
	},
	filename: function (req, file, cb) {
		let ext = file.originalname.split(".");
		ext = ext[ext.length - 1];

		let filename = uuid() + "." + ext;
		req.session.FileName = filename;
		cb(null, filename);
	},
});

const upload = multer({ storage: storage });

var transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "rahulrawat31r@gmail.com",
		pass: "yyovxputsyodvdyy",
	},
});

/* GET User Login Page. */

router.get("/", function (req, res, next) {
	res.render("index", { errorp: req.session.signinerror, data: [] });
});

/* Render the User Dashboard */

router.get("/showdashboard", function (req, res) {
	if (req.session.email) {
		let mes = `| Request -> /showdashboard | IP -> ${req.ip} | User Dashboard Rendered | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);

		pool.query ('select count(*) as total from patients where email = ?', [req.session.email], (err, obj) => {
			if (err){
				console.log (err);
				res.render("userdashboard", { email: req.session.email , total : 0});

			}

			else{
				res.render("userdashboard", { email: req.session.email , total : obj[0].total});

			}
		})
	} else {
		let mes = `| Request -> /showdashboard | IP -> ${req.ip} | User Dashboard Rendered Denied | NO User Login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Counters for the user Dashboard FROM userdashboard.ejs */

router.get("/getcounters", (req, res) => {
	return;
	if (req.session.email) {
		let finobj = {};

		pool.query("SELECT * FROM `doctor`", (err, obj) => {
			if (err) {
				let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
				logger.customLogger.log("error", mes);
				res.send(500).json([]);
			} else {
				finobj["doctor"] = obj;

				q = "SELECT * FROM `product`";
				pool.query(q, (err2, obj2) => {
					if (err2) {
						let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
						logger.customLogger.log("error", mes);
						res.send(500).json([]);
					} else {
						finobj["product"] = obj2;

						pool.query(
							"SELECT * FROM `product` WHERE employeename=?",
							[req.query.email],
							(err3, obj3) => {
								if (err3) {
									let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
									logger.customLogger.log("error", mes);
									console.log(err3);
									res.status(500).json([]);
								} else {
									finobj["yourProduct"] = obj3;
									pool.query("SELECT * FROM `users`", (err4, obj4) => {
										if (err4) {
											let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
											logger.customLogger.log("error", mes);

											console.log(err4);
											res.status(500).json([]);
										} else {
											finobj["users"] = obj4;
											pool.query(
												"SELECT DISTINCT `month`,`year` FROM `schedule` WHERE status = ? AND email = ?",
												["Pending For Approval", req.query.email],
												(err5, obj5) => {
													if (err5) {
														let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
														logger.customLogger.log("error", mes);
														console.log(err);
														res.status(500).json([]);
													} else {
														finobj["pending"] = obj5;

														pool.query(
															"SELECT DISTINCT `month`,`year` FROM `schedule` WHERE status = ? AND email = ?",
															["Approved", req.query.email],
															(err6, obj6) => {
																if (err6) {
																	let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
																	logger.customLogger.log("error", mes);
																	console.log(err6);
																	res.status(500).json([]);
																} else {
																	finobj["approve"] = obj6;
																	pool.query(
																		"SELECT DISTINCT `month`,`year` FROM `schedule` WHERE status = ? AND email = ?",
																		["Declined", req.query.email],
																		(err7, obj7) => {
																			if (err7) {
																				let mes = `| Request -> /getcounters | IP -> ${req.ip} | Error getting Data from DB | User -> ${req.session.email} | `;
																				logger.customLogger.log("error", mes);
																				console.log(err7);
																				res.status(500).json([]);
																			} else {
																				finobj["decline"] = obj7;

																				let mes = `| Request -> /getcounters | IP -> ${req.ip} | Dashboard Counters | User -> ${req.session.email} | `;
																				logger.customLogger.log("info", mes);

																				res.status(200).json(finobj);
																			}
																		}
																	);
																}
															}
														);
													}
												}
											);
										}
									});
								}
							}
						);
					}
				});
			}
		});
	} else {
		let mes = `| Request -> /getcounters | IP -> ${req.ip} | User Dasboard Counters Denied | No User Login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* User Login Request FROM index.ejs */

router.post("/checkuser", function (req, res) {
	pool.query("select * from patients where email=?", [req.body.email], function (error, result) {
		if (error) {
			let mes = `| Request -> /checkuser | IP -> ${req.ip} | Error Getting Data from db | User logging | `;
			logger.customLogger.log("error", mes);
			console.log(error);
			res.redirect("/");
		} else {
			let mes = `| Request -> /checkuser | IP -> ${req.ip} | Checked user for login | User Logging | `;
			logger.customLogger.log("info", mes);

			try {
				let pswd = aes256.decrypt(passKey, result[0].password);

				console.log(pswd);
				if (result.length == 1 && pswd == req.body.password) {
					req.session.email = req.body.email;
					req.session.data = result[0];

					res.redirect("/showdashboard");
				} else {
					req.session.signinerror = "invalid credentials";
					res.redirect("/");
				}
			} catch (error) {
				req.session.signinerror = "invalid credentials";
				res.redirect("/");
			}
		}
	});
});

/* Logout User */

router.get("/logout", (req, res) => {
	let mes = `| Request -> / | IP -> ${req.ip} | User Logout | User -> ${req.session.email} | `;
	logger.customLogger.log("info", mes);

	req.session.destroy();
	res.redirect("/");
});

/* Render the product page of the user */

router.get("/showproducts", function (req, res) {
	// console.log ("chalna")
	if (req.session.email) {
		pool.query("select * from patients where email = ?", [req.session.email], (err, obj) => {
			if (err) {
				console.log(err);
				let mes = `| Request -> /showproducts | IP -> ${req.ip} | Error getting data from db | User -> ${req.session.email} | `;
				logger.customLogger.log("error", mes);
				res.redirect("/");
			} else {
				res.render("showproductUser", { email: req.session.email, data: obj[0] });
			}
		});
	} else {
		let mes = `| Request -> /showproducts | IP -> ${req.ip} | User product page denied | No user login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/*Adding Products From showproductUser.ejs */

router.post("/addproduct", function (req, res) {
	const text = req.body;

	if (req.session.email) {
		if (!text.doctorname || !text.workingwith) {
			res.redirect("/showproducts");
		} else {
			pool.query(
				"insert into product (doctorname,productname,chemistname,stockistname,date,employeename,workingwith,adder,ip,dcontact,stockistphone,chemistphone) values(?,?,?,?,?,?,?,?,?,?,?,?)",
				[
					req.body.doctorname,
					req.body.productname,
					req.body.chemistname,
					req.body.stockistname,
					req.body.date.toString(),
					req.body.employeename,
					req.body.workingwith,
					req.session.email,
					req.body.ip,
					req.body.dcontact,
					req.body.stockistphone,
					req.body.chemistphone,
				],
				function (error, result) {
					if (error) {
						let mes = `| Request -> /addproduct  | IP -> ${req.ip} | Error getting data from db | User -> ${req.session.email} | `;
						logger.customLogger.log("error", mes);
						res.redirect("/");
					} else {
						let mes = `| Request -> /addproduct | IP -> ${req.ip} | Product Added | User -> ${req.session.email} | `;
						logger.customLogger.log("info", mes);

						pool.query(
							"SELECT * FROM `users` WHERE email = ?",
							[req.session.email],
							(err2, obj2) => {
								let num = parseInt(obj2[0].productnum);
								num++;

								pool.query(
									"UPDATE `users` SET productnum = ? WHERE email = ?",
									[num, req.session.email],
									(err3, obj3) => {}
								);
							}
						);
						res.redirect("/showproducts");
					}
				}
			);
		}
	} else {
		let mes = `| Request -> /addproduct | IP -> ${req.ip} | Adding product denied | No user login | `;
		logger.customLogger.log("info", mes);
		res.redirect("/");
	}
});

/* Deleting A Product From showproductUser.ejs */

router.get("/deleteproduct", function (req, res) {
	if (req.session.email) {
		pool.query(
			"delete from product where productid=?",
			[req.query.productid],
			function (error, result) {
				if (error) {
					let mes = `| Request -> /deleteproduct | IP -> ${req.ip} | Error deleting the product DB | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);

					res.status(500).json([]);
				} else {
					let mes = `| Request -> /deleteproduct | IP -> ${req.ip} | Product Deleted | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);

					pool.query("SELECT * FROM `users` WHERE email = ?", [req.session.email], (err, obj) => {
						let num = parseInt(obj[0].productnum);
						num--;

						pool.query(
							"UPDATE `users` SET productnum = ? WHERE email = ?",
							[num, req.session.email],
							(err2, obj2) => {
								res.redirect("/showproducts");
							}
						);
					});
				}
			}
		);
	} else {
		let mes = `| Request -> /deleteproduct | IP -> ${req.ip} | Product Deletion Denied | No User login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/*Getting Doctor Names form the showproductUser.ejs / showproduct2.ejs*/
router.get("/getdoctorname", (req, res) => {
	pool.query("SELECT * FROM `doctor`", (err, obj) => {
		if (err) {
			let mes = `| Request -> /getdoctorname | IP -> ${req.ip} | Error getting data from db | `;
			logger.customLogger.log("error", mes);
			res.send(500).json([]);
		} else {
			let mes = `| Request -> /getdoctorname | IP -> ${req.ip} | Getting doctor names  | `;
			logger.customLogger.log("info", mes);
			res.status(200).json(obj);
		}
	});
});

/*Get Admin Names from the showproductuser.ejs / showproduct2.ejs*/
router.get("/getworkingwith", function (req, res) {
	if (req.session.email) {
		pool.query("select * from `admin`", function (error, result) {
			if (error) {
				let mes = `| Request -> /getworkingwith | IP -> ${req.ip} | Error GEtting data from db | User -> ${req.session.email} | `;
				logger.customLogger.log("error", mes);

				res.status(500).json([]);
			} else {
				let mes = `| Request -> /getworkingwith | IP -> ${req.ip} | Get Admin Names | User -> ${req.session.email} | `;
				logger.customLogger.log("info", mes);
				res.status(200).json(result);
			}
		});
	} else {
		let mes = `| Request -> /getworkingwith | IP -> ${req.ip} | Get admin names denied | No user login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Render the profile page of the user */

router.get("/getprofile", (req, res) => {
	res.redirect("/showdashboard");
	return;
	if (req.session.email) {
		pool.query("SELECT * FROM `patients` WHERE email = ?", [req.session.email], (err, obj) => {
			if (err) {
				console.log(err);
				let mes = `| Request -> /getprofile | IP -> ${req.ip} | Error getting data from the db | User -> ${req.session.email} | `;
				logger.customLogger.log("error", mes);
				res.redirect("/");
			} else {
				let mes = `| Request -> /getprofile | IP -> ${req.ip} | User profile page rendered | User -> ${req.session.email} | `;
				logger.customLogger.log("info", mes);
				res.render("profileuser", {
					img: "logo.jpeg",
					name: obj[0].name,
					email: obj[0].email,
					designation: "NA",
					product: obj[0].productnum,
					permission: obj[0].permission,
				});
			}
		});
	} else {
		let mes = `| Request -> /getprofile | IP -> ${req.ip} | User Profile page denied | NO user login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Render Create Schedule page of the user */
router.get("/createSchedule", (req, res) => {
	if (req.session.email) {
		let mes = `| Request -> /createSchedule | IP -> ${req.ip} | Create schedule page rendering | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);

		res.render("addscheduleUser", { adminemail: req.session.email });
	} else {
		let mes = `| Request -> /createSchedule | IP -> ${req.ip} | User Schedule page deniend | No User login | `;
		logger.customLogger.log("warn", mes);

		res.redirect("/");
	}
});

/* Add the Schedule of the user FROM addscheduleuser.ejs */

router.post("/addScheduleForm", (req, res) => {
	if (req.session.email) {
		const text = req.body;

		let date = new Date(text.dateField);
		let c = 0;

		for (i = 0; i < text.docvisits; i++) {
			let x = "doctorName" + i;
			let y = "doctorcontact" + i;
			let z = "visitTime" + i;
			let doc;
			let time;
			if (text[x] != "No Visit") {
				doc = text[x] + " ( " + text[y] + " ) ";
				time = text[z];
			} else {
				if (c == 1) {
					continue;
				}
				c++;
				doc = text[x];
				time = "00:00";
			}

			pool.query(
				"INSERT INTO `schedule` (email,month,year,date,status,doctor,time,task,remarks,actdoctor,acttime) VALUES (?,?,?,?,'Pending For Approval',?,?,'NA','NA','NA','NA')",
				[req.session.email, date.getMonth() + 1, date.getFullYear(), date.getDate(), doc, time],
				(err, obj) => {
					if (err) {
						let mes = `| Request -> /addScheduleForm | IP -> ${req.ip} | Error getting data from the db | User -> ${req.session.email} | `;
						logger.customLogger.log("error", mes);
						console.log(err);
						res.redirect("/");
					}
				}
			);
		}

		let mes = `| Request -> /addscheduleform | IP -> ${req.ip} | Schedule added | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);

		res.redirect("/createSchedule");
	} else {
		let mes = `| Request -> /addscheduleform | IP -> ${req.ip} | Schedule addition denied | No User login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* For Fetching the schedule for a particular date FROM addschedule.js */

router.get("/checkschedule", (req, res) => {
	const text = req.query;

	if (req.session.email) {
		pool.query(
			"SELECT * FROM `schedule` WHERE email = ? AND date = ? AND year = ? AND month = ? AND NOT status = 'Declined'",
			[req.session.email, text.date, text.year, text.month],
			(err, obj) => {
				if (err) {
					let mes = `| Request -> /checkSchedule | IP -> ${req.ip} | Error getting data from db | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);
					console.log(err);
					res.redirect("/");
				} else {
					let mes = `| Request -> /checkSchedule | IP -> ${req.ip} | Schedule details checked | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);
					if (obj.length == 0) {
						res.status(200).json({ status: 1 });
					} else {
						res.status(200).json({ status: 0 });
					}
				}
			}
		);
	} else {
		let mes = `| Request -> /checkSchedule | IP -> ${req.ip} | Schedule details checking denied | No user login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* For gettting the doctor name after getting the contact number FROM adddcr.js AND addschedule.js AND adddcradmin.js*/
router.get("/getDoctorNameSch", (req, res) => {
	const text = req.query;

	let p = "SELECT `name` FROM `doctor` WHERE phone =" + text.num;
	pool.query(p, (err, data) => {
		if (err) {
			let mes = `| Request -> /getDoctorNameSch | IP -> ${req.ip} | Error getting data from db | User -> ${req.session.email} | `;
			logger.customLogger.log("error", mes);

			console.log(err);
			res.redirect("/");
		} else {
			let mes = `| Request -> /getDoctorNameSch | IP -> ${req.ip} | Getting Doctor Name from schedule | User -> ${req.session.email} | `;
			logger.customLogger.log("info", mes);
			res.status(200).json(data);
		}
	});
});

// User Schedule

// router.get('/checkapprovalmonth', (req, res) => {
//   const text = req.query;

//   if (req.session.email) {
//     // console.log (text.year + text.month)
//     pool.query("SELECT * FROM `schedule` WHERE email = ? AND year = ? AND month = ? AND (status = ? OR status = ?)", [req.session.email, text.year, text.month, "Pending for Approval", "Approved"], (err, obj) => {
//       // console.log (obj);
//       if (obj.length != 0) {
//         res.status(200).json({ status: 0 });
//       }

//       else {
//         res.status(200).json({ status: 1 })
//       }
//     })
//   }

//   else {
//     res.redirect('/');
//   }
// })

/* Render get schedule page of the user  */

router.get("/getSchedule", (req, res) => {
	if (req.session.email) {
		let mes = `| Request -> /getSchedule | IP -> ${req.ip} | User Scheduling Page rendered | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);
		res.render("userScheduleDetails", {
			email: req.session.email,
			data: [],
			title: "Get Schedule",
		});
	} else {
		let mes = `| Request -> /getSchedule | IP -> ${req.ip} | User schedule page denied | No User Login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Taking the scheudle for a date range FROM userscheduledetails.ejs */

router.post("/getFinalScheduleData", (req, res) => {
	if (req.session.email) {
		const text = req.body;
		if (text.approval == "Pending") {
			text.approval = "Pending For Approval";
		} else if (text.approval == "Declined") {
			text.approval = "Declined";
		}
		pool.query(
			"SELECT * FROM `schedule` WHERE email = ? AND status = ? AND year = ? AND month = ? AND date >= ? AND date <= ? ORDER BY `date`",
			[
				text.useremail,
				text.approval,
				text.yearuser,
				text.monthuser,
				text.datestartrange,
				text.dateendrange,
			],
			(err, obj) => {
				if (err) {
					let mes = `| Request -> /getFinalScheduleData | IP -> ${req.ip} | Error Getting Data from Db | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);

					console.log(err);
					res.redirect("/");
				} else {
					let months = [
						"January",
						"Feburary",
						"March",
						"April",
						"May",
						"June",
						"July",
						"August",
						"September",
						"October",
						"November",
						"December",
					];

					let t = text.useremail + " - " + months[text.monthuser - 1];

					let mes = `| Request -> /getFinalScheduleData | IP -> ${req.ip} | Getting the schedule data | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);

					if (text.checking == "no") {
						res.render("userScheduleDetails", {
							email: req.session.email,
							data: obj,
							title: t,
						});
					} else {
						res.render("userScheduleDetailswithDcr", {
							email: req.session.email,
							data: obj,
							title: t,
						});
					}
				}
			}
		);
	} else {
		let mes = `| Request -> /getFinalScheduleData | IP -> ${req.ip} | Final Schedule Data denied | No User login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Render DCR page of the user  */
router.get("/getdcr", (req, res) => {
	if (req.session.email) {
		let mes = `| Request -> /getdcr | IP -> ${req.ip} | User DCR page rendered | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);
		res.render("dcruser", { adminemail: req.session.email });
	} else {
		let mes = `| Request -> /getdcr | IP -> ${req.ip} | User DCR page rendering denied | No User login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Submitting the form of the DCR user FROM dcruser.ejs */
router.post("/dcrform", (req, res) => {
	if (req.session.email) {
		const text = req.body;

		for (i = 0; i < parseInt(text.visitStatus); i++) {
			acd = "doctorName" + i;
			acd = text[acd];

			x = "doctorcontact" + i;

			act = "visitTime" + i;
			act = text[act];

			if (acd != "No Visit") {
				acd = acd + " ( " + text[x] + " ) ";
			} else {
				act = "00:00";
			}

			pool.query(
				"UPDATE `schedule` SET `actdoctor` = ? , `acttime` = ?, `remarks` = ?,task = ? WHERE email = ? AND year = ? AND month = ? AND date = ? AND doctor = ? AND time = ? AND status = ?",
				[
					acd,
					act,
					text.remarks,
					text.schStatus,
					req.session.email,
					JSON.parse(text.sendData)[0].year,
					JSON.parse(text.sendData)[0].month,
					JSON.parse(text.sendData)[0].date,
					JSON.parse(text.sendData)[i].doctor,
					JSON.parse(text.sendData)[i].time,
					"Approved",
				],
				(err, obj) => {
					if (err) {
						let mes = `| Request -> /dcrform | IP -> ${req.ip} | Error Putting data in the db | User -> ${req.session.email} | `;
						logger.customLogger.log("error", mes);
						console.log(err);

						res.redirect("/");
					}
				}
			);
		}

		let mes = `| Request -> /dcrform | IP -> ${req.ip} | User DCR submitted | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);
		res.redirect("/getdcr");
	} else {
		let mes = `| Request -> /dcrform  | IP -> ${req.ip} | User DCR submission failed | No User Login  | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Checking the status of the schedule of a date FROM adddcr.js */
router.get("/checkDateSchedule", (req, res) => {
	if (req.session.email) {
		const text = req.query;

		text.month++;

		pool.query(
			"SELECT * FROM `schedule` WHERE date = ? AND year = ? AND month = ? AND email = ? AND status = ?",
			[text.date, text.year, text.month, req.session.email, "Approved"],
			(err, obj) => {
				if (err) {
					let mes = `| Request -> /checkDateSchedule | IP -> ${req.ip} | Error Getting data from db | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);
					console.log(err);

					res.redirect("/");
				} else {
					let mes = `| Request -> /checkDateSchedule | IP -> ${req.ip} | User checked status of schedule | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);
					res.status(200).json(obj);
				}
			}
		);
	} else {
		let mes = `| Request -> /checkDateSchedule | IP -> ${req.ip} | User Schedule Check Denied | No User Login | `;
		logger.customLogger.log("warn", mes);

		res.redirect("/");
	}
});

/* Getting the dcr visits schedule FROM adddcr.js */
router.get("/getDCRvisits", (req, res) => {
	if (req.session.email) {
		const text = req.query;
		let x = new Date(text.date);

		pool.query(
			"SELECT * FROM `schedule` WHERE date = ? AND year = ? AND month = ? AND email = ? AND status = ?",
			[x.getDate(), x.getFullYear(), x.getMonth() + 1, req.session.email, "Approved"],
			(err, obj) => {
				if (err) {
					let mes = `| Request -> /getDCRvisits | IP -> ${req.ip} | Error Getting data from db | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);

					console.log(err);
					res.redirect("/");
				} else {
					let mes = `| Request -> /getDCRvisits | IP -> ${req.ip} | DCR visits schedule | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);
					res.status(200).json(obj);
				}
			}
		);
	} else {
		let mes = `| Request -> /getDCRvisits | IP -> ${req.ip} | DCR visits scheudle denied | No User Login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Changing Password USER page Rendering */

router.get("/changepswd", (req, res) => {
	if (req.session.email) {
		let mes = `| Request -> /changepswd | IP -> ${req.ip} | Change user pswd page rendered | User -> ${req.session.email} | `;
		logger.customLogger.log("info", mes);
		res.render("changePswdUser", { adminemail: req.session.email });
	} else {
		let mes = `| Request -> /changepswd | IP -> ${req.ip} | User change pswd page denied | No User login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Checking the old passwords FROM changePswdUser.ejs */

router.get("/checkPswd", (req, res) => {
	if (req.session.email) {
		pool.query(
			"SELECT `password` FROM `patient` WHERE `email` =?",
			[req.session.email],
			(err, obj) => {
				if (err) {
					let mes = `| Request -> /checkPswd | IP -> ${req.ip} | Error Getting data from db | User -> ${req.session.email} | `;
					logger.customLogger.log("error", mes);

					console.log(err);
					res.redirect("/");
				} else {
					let pswd = aes256.decrypt(passKey, obj[0].password);

					let mes = `| Request -> /checkPswd | IP -> ${req.ip} | User checking old Pswd | User -> ${req.session.email} | `;
					logger.customLogger.log("info", mes);

					if (pswd == req.query.pswd) {
						res.status(200).send({ status: 1 });
					} else {
						res.status(200).send({ status: 0 });
					}
				}
			}
		);
	} else {
		let mes = `| Request -> /checkPswd | IP -> ${req.ip} | User Checking old pswd denied | No User Login | `;
		logger.customLogger.log("warn", mes);
		res.redirect("/");
	}
});

/* Changing passwords form FROM changePswdUsers.ejs */

router.post("/changePswdForm", (req, res) => {
	if (req.session.email) {
		const text = req.body;

		pool.query("select password from patients where email = ?", [req.session.email], (err2, obj2) => {
			if (err2) {
				let mes = `| Request -> /changePswdForm | IP -> ${req.ip} | Error updating data in db | User -> ${req.session.email} | `;
				logger.customLogger.log("error", mes);
				console.log(err);

				res.redirect("/");
			} else {
				let password = aes256.decrypt(passKey, obj2[0].password);

				if (password == text.oldpswd) {
					let pswd = aes256.encrypt(passKey, text.newpswd);
					pool.query(
						"UPDATE `patients` SET `password` = ? WHERE `email` = ?",
						[pswd, req.session.email],
						(err, obj) => {
							if (err) {
								let mes = `| Request -> /changePswdForm | IP -> ${req.ip} | Error updating data in db | User -> ${req.session.email} | `;
								logger.customLogger.log("error", mes);
								console.log(err);

								res.redirect("/");
							} else {
								let mes = `| Request -> /changePswdForm | IP -> ${req.ip} | User Password Changed | User -> ${req.session.email} | `;
								logger.customLogger.log("info", mes);

								let message =
									`Attention ` +
									req.session.email +
									`!!
                    Your Password Has Been Changed Successfully !
                                
                    Your Login Credentials are --->
                                
                    Email : ` +
									req.session.email +
									` 
                    Password : ` +
									text.newpswd +
									`
        
                    You can now Login To --> /loginPage
                    
                    MR Technologies`;

								var mailOptions = {
									from: "rahulrawat31r@gmail.com",
									to: req.session.email,
									subject: "Password Changed !",
									text: message,
								};

								transporter.sendMail(mailOptions, function (error, info) {
									if (error) {
										console.log(error);
									} else {
										console.log("Email sent ");
									}
								});

								res.redirect("/changepswd");
							}
						}
					);
				} else {
					let mes = `| Request -> /changePswdForm | IP -> ${req.ip} | Incorrect Old password  | User -> ${req.session.email} | `;
					logger.customLogger.log("warn", mes);
					// console.log (err);

					res.redirect("/dashboard");
				}
			}
		});
	} else {
		let mes = `| Request -> /changePswdForm | IP -> ${req.ip} | User Password changing denied | No User Login | `;
		logger.customLogger.log("warn", mes);

		res.redirect("/");
	}
});

/* ADding the products FROM showproducts.ejs */
router.post("/addAppointment", function (req, res) {
	if (req.session.email) {
		const text = req.body;
		if (0) {
			let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Empty Fields in Form | Admin -> ${req.session.emai} |`;
			res.redirect("/admin/showproducts");
			logger.customLogger.log("info", mes);
		} else {
			pool.query(
				"INSERT INTO `appointment`( `mobile`, `email`, `name`, `aadhar`, `symptoms`, `mcondition`, `doctor`, `adate`) VALUES (?,?,?,?,?,?,?,?)",
				[
					req.body.mobile,
					req.body.email,
					req.body.name,
					req.body.aadhar,
					req.body.symptoms,
					req.body.condition,
					req.body.doctor,
					req.body.date,
				],
				function (error, result) {
					if (error) {
						console.log(err);

						let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Error in DB | Admin -> ${req.session.email} |`;
						res.redirect("/");
						logger.customLogger.log("error", mes);
					} else {
						pool.query("select name from doctor where email = ?", [text.doctor], (err, obj) => {
							if (err) {
								console.log(err);
								let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Error getting data from db | Admin -> ${req.session.email} |`;
							} else {
								let message =
									`Congratulations  ` +
									text.name +
									`  !!
                      Your Appointment has been Created !
                      
                      Token Number : ` +
									result.insertId +
									`
                      Date : ` +
									text.date +
									`
                      Doctor : ` +
									obj[0].name +
									`
                      Condition : ` +
									text.condition +
									`

                      NR Technologies`;

								var mailOptions = {
									from: "rahulrawat31r@gmail.com",
									to: text.email,
									subject: "Admin Account Created !",
									text: message,
								};

								transporter.sendMail(mailOptions, function (error, info) {
									if (error) {
										console.log(error);
									} else {
										console.log("Email sent ");
									}
								});
							}
						});

						let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Product Registered  | Admin -> ${req.session.email} |`;

						res.redirect("/showproducts");
						logger.customLogger.log("info", mes);
					}
				}
			);
		}
	} else {
		let mes = `| Request -> /admin/addproduct | IP -> ${req.ip} | Product Not Registered  | No Admin Login |`;
		res.redirect("/");
		logger.customLogger.log("warn", mes);
	}
});

/* Getting the appointments */

router.get('/getAppointments' , (req , res) =>{
  if (req.session.email) {
    pool.query("SELECT a.* , d.name as doctorn, d.speciality as speciality FROM `appointment` a, doctor d where a.email = ? and d.email = a.doctor", [req.session.email], (err, obj) => {
      if (err) {
        let mes = `| Request -> /getAppointments | IP -> ${req.ip} | Error getting data from db | Admin -> ${req.session.email} |`;
        logger.customLogger.log("error", mes);
        console.log(err);
        res.status(500).json([]);
      } else {
        let mes = `| Request -> /getAppointments | IP -> ${req.ip} | Getting Appointments | Admin -> ${req.session.email} |`;
        logger.customLogger.log("info", mes);
        res.status(200).json(obj);
      }
    });
  } else {
    let mes = `| Request -> /getAppointments | IP -> ${req.ip} | Appointments Denied | No Admin Login |`;
    logger.customLogger.log("warn", mes);
    res.send([]);
  }
})


/* View report */

router.get('/viewReport/:token' , (req,res)=>{
  if (req.session.email) {

		pool.query(
			"select a.* , p.age as age from appointment a, patients p where a.token = ? and p.email = a.email",
			[req.params.token],
			(err, obj) => {
				if (err) {
					console.log(err);
					res.send([]);
				} else {
					res.render("viewReportUser", {
						adminemail: req.session.adminemail,
						pname: obj[0].name,
						mcond: obj[0].mcondition,
						symptoms: obj[0].symptoms,
						token: obj[0].token,
						page: obj[0].age,
					});
				}
			}
		);
  } else {
    let mes = `| Request -> /viewReport | IP -> ${req.ip} | Report View Denied | No Admin Login |`;
    logger.customLogger.log("warn", mes);
    res.redirect("/");
  }
})


router.post('/submitReport', upload.single('reports') , (req,res)=>{
  if (req.session.email) {
    const text = req.body;
    pool.query("insert into reports ( token , description,  files ) values (?,?,?)", [text.token, text.description , req.session.FileName], (err, obj) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        res.redirect("/viewReport/" + text.token);
      }
    });
  } else {
    let mes = `| Request -> /submitReport | IP -> ${req.ip} | Report Submission Denied | No Admin Login |`;
    logger.customLogger.log("warn", mes);
    res.redirect("/");
  }
})


/* Getting the medical reports */

router.post('/getMedicalReports' , (req,res)=>{
  if (1) {
    pool.query("SELECT * FROM `reports` WHERE token = ?", [req.body.token], (err, obj) => {
      if (err) {
        let mes = `| Request -> /getMedicalReports | IP -> ${req.ip} | Error getting data from db | `;
        logger.customLogger.log("error", mes);
        console.log(err);
        res.status(500).json([]);
      } else {
        let mes = `| Request -> /getMedicalReports | IP -> ${req.ip} | Getting Medical Reports |`;
        logger.customLogger.log("info", mes);
        res.status(200).json(obj);
      }
    });
  } else {
    let mes = `| Request -> /getMedicalReports | IP -> ${req.ip} | Medical Reports Denied | No Admin Login |`;
    logger.customLogger.log("warn", mes);
    res.send([]);
  }
})

module.exports = router;
