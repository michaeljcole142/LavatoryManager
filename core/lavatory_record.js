/*
 * The Lavatory Record  class is used to hold a lavatory record. 
 * It can be used in a cache and used to serialize to disk as a csvfile.
 *
 */
 
 class LavatoryRecord {
	constructor(aStudentId, aName, aDate, aTimeIn, aBy, aComment) { 
	  this.studentId = aStudentId;
	  this.name = aName;
	  this.date = aDate;
	  this.timeIn = aTimeIn;
	  this.timeOut = "";
	  this.by = aBy;
	  this.comment = aComment;
	}
 }	
	
module.exports = LavatoryRecord;