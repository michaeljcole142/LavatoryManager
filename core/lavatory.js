
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
	
	
	initialize() {
		this.googleSheetDB.connect();
	}
	
    
    checkInLav(sId, sName, byName, comments) {
		var inTime = new Date();
		var d = getDateString(inTime);
		var t = getTimeString(inTime);

console.log("%%%%%%%%%%%%%%%%%%%%%%%%%% checking in id-", sId, "  name-", sName, " byName-", byName, " comments-", comments);		
		/* This code is used for keeping a cache in sync. */
		var ret = this.cache.checkInStudent(sId, sName, d, t, byName, comments); 
		
		var ret = this.googleSheetDB.checkInLav(sId, sName, d, t, byName, comments);
	}
	
	isCheckedIn(id) {
		return this.cache.isCheckedIn(id);
	}
	
	async multiLavCheckOut(data) {

		var err = this.cache.multiStudentUpdate(data);
		/* This code handles the cache.  */
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
		
		var err = await this.googleSheetDB.multiLavCheckOut(data);
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
		
	}
	
	getCacheData() {
		return this.cache.getJSON();
	}
	
	checkOutLav(sId) {
	console.log("in checkOutLav with ", sId);
		var err = this.cache.checkOutStudent(sId);
		if ( err != null ) {
			console.log("ERROR:  " + err);
		}
		var err = this.googleSheetDB.checkOutStudent(sId);
		if ( err != null ) { console.log("ERROR!!!!!", err); } 
		
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