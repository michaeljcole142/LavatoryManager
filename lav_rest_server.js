var http = require('http');  
const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const { promisify } = require('util');
const port = process.env.PORT || 8888;

//Middle ware

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(publicDir));

const LavatoryHandler = require('./core/lavatory_handler.js');

app.set('view engine', 'ejs');

/*
 * Here i am actually creating an instance of a lav handler and 
 * iniializing it.  We can decide later if putting it in the global namespace
 * is a good or bad thing.
 */
const theLavHandler = new LavatoryHandler();
(async() =>  { await theLavHandler.initialize();
	console.log("Initialized thLavHandler");
	} )();

/*
 * This returns the home page.
 */
app.get('/', (req, res)=>{   
	// The render method takes the name of the HTML 
	// page to be rendered as input 
	// This page should be in the views folder 
	// in the root directory. 
	var lavs = theLavHandler.getLavKeyList();  
	res.render('home'); 
}); 

/*
 *  These are all the rest services to get and update data.
 */
 
/**
 * checking a student into the lav.
 */
app.post("/check_in", (req, res) => {
	const checkin_key = req.body;
	console.log("/check_in with key->", checkin_key);
	var checkedIn = theLavHandler.isCheckedIn(checkin_key.id, checkin_key.lav);
	
	if ( checkedIn == false ) {
		(async() =>  { 
			await theLavHandler.lavCheckInWithName(checkin_key.id, checkin_key.lav, checkin_key.name, checkin_key.by, checkin_key.comments);
			res.status(200).json({
				message: "Checked In Successfully"
			});
		} )();
	} else {
		res.status(401).json({
		message: "Already Checked In"
		});
	}
});
/**
 * checking a student into or out of the lav.
 * This is used by the phone app barcode function.
 */
app.post("/check_in_or_out", (req, res) => {
	const student_key = req.body;
	console.log("/check_in_or_out with key->", student_key);
	console.log("student_key->",student_key[0].id, student_key[0].lav);
	
	var checkedIn = theLavHandler.isCheckedIn(student_key[0].id, student_key[0].lav);
	
	if ( checkedIn == true ) {
		(async() =>  { 
			await theLavHandler.lavCheckOut(student_key[0].id, student_key[0].lav);
			res.status(200).json({
				message: "Checked In Successfully"
			});
		} )();
	} else {
		(async() =>  { 
			await theLavHandler.lavCheckIn(student_key[0].id, student_key[0].lav,student_key[0].by, "");
			res.status(200).json({
				message: "Checked In Successfully"
			});
		} )();
	}
});
/**
 * checking a student out of the lav.
 */
app.post("/check_out",(req,res) => {
	const checkout_key = req.body;
	console.log("/check_out with key->", checkout_key);
	if (checkout_key.id || checkout_key.lav ) {
		theLavHandler.lavCheckOut(checkout_key.id, checkout_key.lav); 
			res.status(200).json({
				message: "Checked Out Successfully"
			});
	} else {
		res.status(401).json({
			message: "Invalid Checkout"
		});
	}
});

/**
 * Check multiple students out of the lav.
 */
app.post("/multi_check_out",(req,res) => {
	const checkout = req.body;
	const lav = checkout.lav;
	const data = checkout.data;
	theLavHandler.multiLavCheckOut(data,lav); 
	res.status(200).json({ message: "Checked Out Successfully"	});
});
/**
 * get lav list passing a key for the lav.
 * this returns all those checked in and/or out of the lav.
 * It bypasses the cache.
 *
 */
app.post("/get_lavlist_byname", (req,res) => {
	const lavname = req.body;
	console.log("/get_lavlist_byname with key->", lavname);
	if (lavname.lav ) {
		(async() =>  { 
			var lavlist = await theLavHandler.getLavList(lavname.lav) ;
			res.status(200).send(lavlist); 
		} )();
		
	} else {
		res.status(401).json({
			message: "Invalid lavname"
		});
	}
});

/*
 * This gets the data from the cache.
 */
app.post("/get_lavdatacache", (req, res) => {
	console.log("in get_lavlistcache");
	const lavname = req.body;
	
	var lavlist ='';
	(async() =>  { 
		lavlist = theLavHandler.getLavDataCache(lavname.lav) ;
		res.status(200).send(lavlist); 
	} )();
	
});
/** 
 * Get the distinct list of lavatory keys.
 */
app.get("/get_lavkeylist", (req, res) => {
	console.log("in get_lavkeylist");
	
	var lavkeylist ='';
	(async() =>  { 
		lavkeylist = await theLavHandler.getLavKeyList() ;
console.log("sending ", lavkeylist);
		res.status(200).send(JSON.stringify(lavkeylist)); 
	} )();
	
});

/*
 * These are used to return json data.
 */
 
app.get('/get_studentlist.json', (req,res) => {
	console.log('in get_studentlist.json');
	var myStudentList = require('./student_list.json');
	res.json(myStudentList);
});
app.get('/get_lavkeys.json', (req, res)=>{ 
	var myLavList = require('./lav_keys.json');
	res.json(myLavList); 
}); 

/*
 * Startup the server!
 */
app.listen(port, () => {
  console.log(`running at port ${port}`);
});
