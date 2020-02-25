
const LavatoryCache = require('./lavatory_cache.js');
const LavatoryGoogleSheet = require('../db/lavatory_google_sheet.js');

/*
 * The Lavatory class is used to hold lavatory data and persist it to a db.
 * Initially there is an in memory cache and data is stored in google sheets.
 * Later google-sheets will be replaced with a DB.
 *
 */
 
 class Lavatory {
	 
	constructor(aName) { 
		this.name = aName;
		this.creds = require('../config/client_secret.json');
		this.cache = new LavatoryCache();
		this.googleSheetDB = new LavatoryGoogleSheet(aName);
	
	
	}
	/*
	 * This method is intended to initialize whatever needs to be setup after
	 * constructor finishes.
	 * For now it just connects to googlesheet.
	 */
	async initialize() {
		this.googleSheetDB.connect();
		var initializeList = await this.googleSheetDB.initializeCacheAtStartup();
		for ( var i=0; i< initializeList.length ; i++ ) {
			var aRecord = initializeList[i];
			this.cache.checkInWithLavatoryRecord(aRecord);
		}
	}
    /*
	 * This methood is used to check students into the lav.
	 * It should handle both the cache and db.  In the initial
	 * case the db is google-sheet.  later SQL server.
	 */
    checkInLav(sId, sName, byName, comments) {
		var inTime = new Date();
		var d = getDateString(inTime);
		var t = getTimeString(inTime);
		/* This code is used for keeping a cache in sync. */
		var ret = this.cache.checkInStudent(sId, sName, d, t, byName, comments); 
		
		var ret = this.googleSheetDB.checkInLav(sId, sName, d, t, byName, comments);
		return ret;
	}
	
	/*
	 * Boolean check to see if a student is checked in.
	 */
	isCheckedIn(id) {
		return this.cache.isCheckedIn(id);
	}
	
	/*
	 * used to bulk checkout or update.  
	 * 3 scenarios in data: 
	 * 1) comment update only
	 * 2) comment and checkout.
	 * 3) checkout only.
	 */
	async multiLavCheckOut(data) {
		var i;
		var checkingOut=[];
		var commentsOnly=[];

		for ( i=0; i < data.length ; i++ ) {
			if ( data[i].checkOut == true ) {
				checkingOut.push(data[i]);
			} else {
				commentsOnly.push(data[i]);
			}
		}
		console.log("checkingout->", checkingOut);
		console.log("commentsOnly->", commentsOnly);

		var err = this.cache.multiStudentUpdate(data);
		/* This code handles the cache.  */
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
		
		err = await this.googleSheetDB.multiLavCheckOut(checkingOut);
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
		err = await this.googleSheetDB.multiLavCommentUpdate(commentsOnly);
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
	}
	
	/*
	 * returns json version of cache.  This can 
	 * be used to return data to the presentation layer.
	 */
	getCacheData() {
		return this.cache.getJSON();
	}
	
	/*
	 * check a single id out of lav.
	 */
	async checkOutLav(sId) {
		try {
			/*
			 * This code used to keep checked out students in cache.  
			 * Changed to just delete them.
			var err = this.cache.checkOutStudentById(sId);
			*/
			var err = this.cache.removeStudentFromCache(sId);
			if ( err != null ) {
				console.log("ERROR:  " + err);
			}
			var err = await this.googleSheetDB.checkOutStudent(sId);
			if ( err != null ) { console.log("ERROR!!!!!", err); } 
		} catch (e) {
			console.log("error checking out " , e);
		}	
	}
	getLavListFromCache() {
		return this.cache.getJSON();
	}
	getLavList() {
		return this.googleSheetDB.getLavList();
	}
}
/*
 * These are utility functions to convert date to just the time.
 */
function getTimeString(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}
function getDateString(d) {
	var day = d.getDate();
	var month = d.getMonth() + 1; // Since getMonth() returns month from 0-11 not 1-12
	var year = d.getFullYear();
	var dateStr = month + "/" + day + "/" + year;
	return dateStr;
}

module.exports = Lavatory;