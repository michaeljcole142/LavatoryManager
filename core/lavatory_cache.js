/*
 * The LavatoryCashe is the interface to an in-memory version of a lavatory session.  
 * Ultimately this will serve as a memory based table that is persisted to the file system.
 */
const LavatoryRecord = require("./lavatory_record.js");
 
class LavatoryCache {

	constructor() {
		/* The checkedInList is a Map that allows a student to be in the lav in only one 
		 * record.  Or, in other words, the id can only exist once.
		 */
		this.checkedInList = new Map();
		/* The checkedOutList is an array because it can have duplicates for a person.
		 * for example a student may check in and out of the lav twice in one session.
		 */
		/*  checkedOutList is not obsolete.  I am keeping it here for now but ultimately 
		 * we get rid of it once we understand how we are loading history to view.
		 */
		this.checkedOutList = [];
	}
	
	updateCheckedInComment(aStudentId,aComment) {
		var aRecord = this.checkedInList.get(aStudentId);
		if ( aRecord == null ) {
			return new Error("Student " +  aStudentId + " is not checked in lavatory!");
		}
		aRecord.comment = aComment;
		return;
	}
	/*
	 * This function creates a lavatory record and then checks student into cache.
	 */
	checkInStudent(aStudentId, aName, aDate, aTimeIn, aBy, aComment) {
		var aRecord = new LavatoryRecord(aStudentId, aName, aDate, aTimeIn, aBy, aComment);
		return this.checkInWithLavatoryRecord(aRecord);
	}
	
	/*
	 * this will check a student into the cache.  It takes a LavatoryRecord in.
	 */
	checkInWithLavatoryRecord(aRecord) {
		if ( this.checkedInList.has(aRecord.studentId) ) {
			return new Error("Student " +  aRecord.studentId + ":" + aRecord.name + " already checked in lavatory!");
		}
		this.checkedInList.set(aRecord.studentId, aRecord);
		return;
	}
	/* 
	 * This returns a boolean True/False indicating if a student is in the lav currently.
	 */
	isCheckedIn(aStudentId) {
		if ( this.checkedInList.has(aStudentId) ) {
			return true;
		}
		return false;
	}
	
	/*
	 * Used to check a student out of the cache by their student id.
	 */
	checkOutStudentById(aStudentId) {
		console.log("in checkoutstudent");
		var aRecord = this.checkedInList.get(aStudentId) 
		if ( aRecord == null ) {
			return new Error("StudentId:" + aStudentId + " not currently checked in!");
		}
		console.log ("got record" , aRecord);
		var tm = getTimeString(new Date());
		console.log("time is ", tm);
		aRecord.timeOut = tm;
		console.log("In checkOutStudent ", aRecord);
		this.checkedOutList.push(aRecord);
		this.checkedInList.delete(aStudentId);
		return;
	}
	/*
	 * This is used to check a student out but is inclusive of being given aTimeOut and comment.
	 */
	checkOutStudent(aStudentId, aTimeOut, commentChanged, aComment ) {
		var aRecord = this.checkedInList.get(aStudentId);
		if ( aRecord == null ) {
			return new Error("StudentId:" + aStudentId + " not currently checked in!");
		}
		if ( commentChanged == true ) { 
			aRecord.comment = aComment;
		}
		aRecord.timeOut = aTimeOut;
		this.checkedOutList.push(aRecord);
		this.checkedInList.delete(aStudentId);
	}
	/*
	 * This method is used for the model where when a student checks
	 * out they are just removed from cache.
	 */
	removeStudentFromCache(aStudentId) {
		var aRecord = this.checkedInList.get(aStudentId);
		if ( aRecord == null ) {
			return new Error("StudentId:" + aStudentId + " not currently checked in!");
		}
		this.checkedInList.delete(aStudentId);
	}
	/*
	 * This method takes a data structure in that has multiple
	 * updates in it.  There are updates to comments of students that are 
	 * checked in.  There are updates to comments and checking a student out and
	 * finally there is just checking a student out of the lav.
	 */
	multiStudentUpdate(data) {
		var errorString = "";
		var aDtTm = new Date();
		var aDt = getDateString(aDtTm);
		var aTm = getTimeString(aDtTm);
		var err = "";
		for ( var i=0; i < data.length; i++ ) {
			var updateRec = data[i];
			if ( updateRec.checkOut == true ) {
				/* THis code was used to keep track of checked out students. 
				 * moving to a model where they are not kept in cache for now.
				 * Instead they are deleted from cache once checked out.
				 *
				err = this.checkOutStudent( updateRec.studentId, aTm, updateRec.commentChanged,updateRec.commentValue);
				*/
				err=this.removeStudentFromCache(updateRec.studentId);
				if ( err != null ) {
					errorString = errorString + JSON.stringify(err);
				}
			} else {
				err = this.updateCheckedInComment(updateRec.studentId,updateRec.commentValue);
				if ( err != null ) {
					errorString = errorString + JSON.stringify(err);
				}
			}
		}
		if ( errorString.length > 0 ) {
			return new Error(errorString);
		}
		return;
	}
	/*
	 * This function creates a string/JSON version of the cache.
	 */
	getJSON() { 
		var resp=[];
		var inLav=[];
		for ( const v of this.checkedInList.values() ) {
			inLav.push(v);
		}
		resp.push({ "checkedIn" : inLav });
		resp.push({ "checkedOut" : this.checkedOutList} );
		var ret = JSON.stringify(resp);
		return ret;
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
 module.exports = LavatoryCache;
 