const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');
const LavatoryRecord = require("../core/lavatory_record.js");

/*
 * The Lavatory class is used persist lavatory data to google sheets.
 *
 */
 
 class LavatoryGoogleSheet {
	 
	constructor(name) { 
		this.name = name;
		this.creds = require('../config/client_secret.json');
		const lavKeys = require('../config/lav_keys.json');
		for ( var i=0; i < lavKeys.length ; i++ ) {
			if (lavKeys[i].lav == name ) {
				this.sheetId = lavKeys[i].key;
				break;
			}
		}
	}
	
	async connect() {
		var doc = new GoogleSpreadsheet(this.sheetId);
		await promisify(doc.useServiceAccountAuth)(this.creds);
		var info = await promisify(doc.getInfo)();
		console.log(`Connected and Loaded to doc: ` + info.title + ` by ` + info.author.email);
	}
	
    
    async checkInLav(sId, sName, dt, timeIn, byName, comments) {
		
		
		var doc = new GoogleSpreadsheet(this.sheetId);
		await promisify(doc.useServiceAccountAuth)(this.creds);
		var info = await promisify(doc.getInfo)();
		const aSheet = info.worksheets[0];
		await aSheet.addRow({"StudentId": sId,"StudentName":sName,"Date": dt,"TimeIn" : timeIn, "TimeOut":"","RecordedBy":byName, "Comments" : comments},
		   something => console.log("IN Save with: ", something));
	}
	
	saveCB() {
			console.log("Saved");
	}
	saveCB(err) {  console.log("Saved err:  " , err); }
	/*
	 * This function adds a record to the archive page.
	 */
	async addToArchive(id, name, dt, tmIn, tmOut, by, comment, sheet) {
		await sheet.addRow({"StudentId": id,"StudentName":name,"Date": dt,"TimeIn" : tmIn, "TimeOut":tmOut,"RecordedBy":by, "Comments" : comment},
		   something => console.log("IN Save with: ", something));
	}
	async multiLavCheckOut(data) {

		var idlist = [];
		for (var i=0; i < data.length ; i++ ){
				idlist.push(data[i].studentId);
		}
		console.log("ids->", idlist);
		// THis code assumes there is only 1 record per student in the file.
		// this will eventually need to change because there are recored across
		// days.
		try {
			var doc = new GoogleSpreadsheet(this.sheetId);
			await promisify(doc.useServiceAccountAuth)(this.creds);
			const info = await promisify(doc.getInfo)();
			const sheet = info.worksheets[0];
			const archiveSheet = info.worksheets[1]; 
			const rowss = await promisify(sheet.getRows)({
					'min-row': 2,
					'max-row': sheet.rowCount
			});
			var i; 
			var rows = sheet.rowCount -1;

			for ( i=0; i < rows; i++) {
				if ( rowss[i] == null ) {
					break;
				}
				var idAt = rowss[i].studentid;
				if ( idlist.includes(idAt) ) {
					//This means a change record came in for a record in the active sheet.
					var changeRecord = this.getChangeRecord(idAt,data);
					console.log("change Record is", changeRecord);
					if ( changeRecord != null ) {
						/* If here then we have a record that changed. */
						var changeComment = changeRecord.commentChanged;
						var checkOut = changeRecord.checkOut;
						if ( rowss[i].outTime == null ) {
							var commentAt=rowss[i].comments;
							if ( changeComment == true ) {
								commentAt = changeRecord.commentValue;
							}
							await this.addToArchive(rowss[i].studentid, rowss[i].studentname,
										rowss[i].date,  rowss[i].timein, getTimeString(new Date()),
										rowss[i].recordedby, commentAt,archiveSheet);
							rowss[i].del();
						}
					}
				};
			};
		} catch (e) {
			console.log("Error in Lavatory.checkOutLav for id=" , data, " Error: " , e);
		} 
	}
	/*
	 * This function takes a list of comments to be updated and updates them in the
	 * Active sheet of the lav log.
	 */
	async multiLavCommentUpdate(data) {

		// This is a list of id's updating.
		var idlist = [];
		for (var i=0; i < data.length ; i++ ){
				idlist.push(data[i].studentId);
		}
		// THis code assumes there is only 1 record per student in the file.
		// this will eventually need to change because there are recored across
		// days.
		try {
			var doc = new GoogleSpreadsheet(this.sheetId);
			await promisify(doc.useServiceAccountAuth)(this.creds);
			const info = await promisify(doc.getInfo)();
			const sheet = info.worksheets[0];
			const cells = await promisify(sheet.getCells)({
					'min-row': 2,
					'max-row': sheet.rowCount,
					'min-col': 1,
					'max-col': 7,
					'return-empty': true,
			});
			var i; 
			var rows = sheet.rowCount -1;
			for ( i=0; i < rows*7; i=i+7) {
				var idCell = cells[i];
				if ( idCell.value.length == 0 ) {
					break;
				}
				var idAt = idCell.value;
				if ( idlist.includes(idAt) ) {
					//This means a change record came in for a record in the active sheet.
					var changeRecord = this.getChangeRecord(idAt,data);
					if ( changeRecord != null ) {
						/* If here then we have a record that changed. */
						var changeComment = changeRecord.commentChanged;
						var commentCell = cells[i+6];
						commentCell.value = changeRecord.commentValue;
						commentCell.save((err)=> { console.log("Saved",err); });
					}
				};
			};
		} catch (e) {
			console.log("Error in Lavatory.multiLavCommentUpdate for id=" , data, " Error: " , e);
		} 
	}
	getChangeRecord(id, data) {
		for ( var i=0; i < data.length ; i++ ) {
			if ( data[i].studentId == id ) {
				return data[i];
			}
		}
		return null;
	}
	
	/*
	 * This function is used to check a student out of the lav.  It
	 * will remove the student from the active page and put them into
	 * the archive page of a google sheet.  It will also set the checkout time.
	 */
	async checkOutStudent(sId) {

		try {
			var doc = new GoogleSpreadsheet(this.sheetId);

			await promisify(doc.useServiceAccountAuth)(this.creds);
			const info = await promisify(doc.getInfo)();
			const sheet = info.worksheets[0];
			const archiveSheet = info.worksheets[1]; 
			
			const rowss = await promisify(sheet.getRows)({
					'min-row': 2,
					'max-row': sheet.rowCount
			});
			var i; 
			var rows = sheet.rowCount -1;
			var checkedOut=false;
			for ( i=0; i < rows; i++) {
				if ( rowss[i] == null ) {
					break;
				}
				var idAt = rowss[i].studentid;
				if ( idAt == sId ) {
					if ( rowss[i].timeout == "" ) {
						await this.addToArchive(rowss[i].studentid, rowss[i].studentname,
										rowss[i].date,  rowss[i].timein, getTimeString(new Date()),
										rowss[i].recordedby, rowss[i].comments,archiveSheet);
						await rowss[i].del();
						console.log("Checked Out ", sId );
						checkedOut=true;
					}
				}
			};
			if ( checkedOut == false ) {
				throw new Error("Could not check student " + sId + " out");
			}
		} catch (e) {
			console.log("Error in Lavatory.checkOutLav for id=" , sId, " Error: " , e);
			throw e;
		} 
	}
	async initializeCacheAtStartup() {

		try {
			var doc = new GoogleSpreadsheet(this.sheetId);

			await promisify(doc.useServiceAccountAuth)(this.creds);
			const info = await promisify(doc.getInfo)();
			const sheet = info.worksheets[0];
			const rowss = await promisify(sheet.getRows)({
					'min-row': 2,
					'max-row': sheet.rowCount
			});
			var i; 
			var checkedIn=[];
			var rows = sheet.rowCount -1;
			for ( i=0; i < rows; i++) {
				if ( rowss[i] == null ) {
					break;
				}
				var aStudent =	new LavatoryRecord(rowss[i].studentid, rowss[i].studentname, rowss[i].date,
							rowss[i].timein, rowss[i].timeout, rowss[i].recordedby, rowss[i].comments);
				checkedIn.push(aStudent);
			};
			return checkedIn;
		} catch (e) {
			console.log("Error in Lavatory.checkOutLav for id=" , sId, " Error: " , e);
			throw e;
		} 
	}
	async getLavList() {
		
		var doc = new GoogleSpreadsheet(this.sheetId);
		await promisify(doc.useServiceAccountAuth)(this.creds);
		var info = await promisify(doc.getInfo)();
		const sheet = info.worksheets[0];
		const cells = await promisify(sheet.getCells)({
			'min-row': 2,
			'max-row': sheet.rowCount,
			'min-col': 1,
			'max-col': 7,
			'return-empty': true,
		})
		var i;
		var lavList=[];
		
		var rowCount = sheet.rowCount -1 ;
		// Starting 
		for ( i=0; i < rowCount*7; i=i+7) {
			var idCell = cells[i];
			if ( idCell.value ) {
				var nmCell = cells[i+1];
				var dtCell = cells[i+2];
				var inCell = cells[i+3];
				var outCell = cells[i+4];
				var byCell = cells[i+5];
				var comCell = cells[i+6];
				
				lavList.push({ 	"StudentId" : idCell.value, 
								"StudentName" : nmCell.value, 
								"Date" : dtCell.value,
								"TimeIn" : inCell.value, 
								"TimeOut" : outCell.value, 
								"RecordedBy" : byCell.value, 
								"Comments" : comCell.value
							});
				
			}
		}
		return lavList;
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

module.exports = LavatoryGoogleSheet;