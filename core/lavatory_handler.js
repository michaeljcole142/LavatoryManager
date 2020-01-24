/*
 * The LavatoryHandler is the interface to google sheets.  It is intended to be an
 * abstraction layer hiding the details of google sheets.  It is intended that google sheets
 * ultimately be replaced by a database server.  Probably sql server.  So, this interace
 * will be somewhat close to a database.
 *
 * It is intended to be a Factory interface design pattern.
 */
const Lavatory = require('./lavatory');
 
const StudentMasterTable = require('./student_master_table');
 
 
class LavatoryHandler {

	constructor() {
		
		this.theLavatoryKeys = require('../config/lav_keys.json');
		this.theLavatories = new Map();
		
	    this.theStudentMasterTable = new StudentMasterTable();
	}
	
	initialize() {
		
		for (var i=0; i < this.theLavatoryKeys.length; i++ ) {
			var thisLav = new Lavatory(this.theLavatoryKeys[i].lav);
			thisLav.initialize();
			this.theLavatories.set(thisLav.name,thisLav);
		}	
    }
	

	lookUpStudent(id) {
		var student = this.theStudentMasterTable.getStudent(id);
		if ( student != null ) {
			return student.name;
		}
		return null;
	}
	getLavKeyList() {  
		var theList = [];
		for (var i=0; i < this.theLavatoryKeys.length; i++ ) {
			theList.push(this.theLavatoryKeys[i].lav);
		}
		return theList; 
	}
	
    lavCheckIn(id, lav, by, comments ) { 
		console.log("in lavCheckIn");
		console.log("lavs ->", this.theLavatories);
		console.log("id ", id,",lav ", lav);

		var lavAt = this.theLavatories.get(lav);
		console.log("lav at---->", lavAt);
		var name = this.lookUpStudent(id);
		
		lavAt.checkInLav(id,name,by,comments);;
	}
	lavCheckInWithName(id, lav, name, by, comments ) { 
		console.log("in lavCheckIn");
		console.log("lavs ->", this.theLavatories);
		console.log("id ", id,",lav ", lav);
		var lavAt = this.theLavatories.get(lav);
		console.log("lav at---->", lavAt.name);
		lavAt.checkInLav(id,name,by,comments);;
	}   
	isCheckedIn(id, lav) { 
		var lavAt = this.theLavatories.get(lav);
		return lavAt.isCheckedIn(id);;
	}
	multiLavCheckOut(data,lav) {
		console.log("in LavHandler.multiLavCheckOut");
		var lavAt = this.theLavatories.get(lav);
		(async()=> { await lavAt.multiLavCheckOut(data); } )();
		console.log("leaving LavHandler.lavCheckout");
	}
	lavCheckOut(id, lav) {
			console.log("in LavHandler.lavCheckout");
			var lavAt = this.theLavatories.get(lav);
			(async()=> { await lavAt.checkOutLav(id); } )();
			console.log("leaving LavHandler.lavCheckout");
	}
	async getLavList(lav) {
	   var lavAt = this.theLavatories.get(lav);
	   var lavlist =  await lavAt.getLavList().catch(err => console.log("IN ERR: ", err));;
//		console.log("in lavhandler.getLavList() -> ", lavlist);
	   return lavlist;
	}
	getLavDataCache(lav) {
		var lavAt = this.theLavatories.get(lav);
		var lavlist =  lavAt.getLavListFromCache();
		return lavlist;
	}
 }
 
 module.exports = LavatoryHandler;
 