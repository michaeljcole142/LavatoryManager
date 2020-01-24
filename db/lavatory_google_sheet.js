const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');


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
		await aSheet.addRow({"Student Id": sId,"Student Name":sName,"Date": dt,"Time In" : timeIn, "Time Out":"","Recorded By":byName, "Comments" : comments},
		   something => console.log("IN Save with: ", something));
	}
	
	saveCB() {
			console.log("Saved");
	}
	saveCB(err) {  console.log("Saved err:  " , err); }
	
	
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
			console.log("In Lavatory.checkOutLav()");
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
			console.log("there are rows->", rows);
			for ( i=0; i < rows*7; i=i+7) {
				var idCell = cells[i];
				if ( idCell.value.length == 0 ) {
					console.log("Leaving For Loop");
					break;
				}
				
				console.log("Looking up", idCell.value);
				if ( idlist.includes(idCell.value) ) {
					console.log("Found it");
					//***  Gotta change code here.  I need to find the comment and/or checkout flag.
					var changeRecord = this.getChangeRecord(idCell.value,data);
					console.log("change Record is", changeRecord);
					if ( changeRecord != null ) {
						var changeComment = changeRecord.commentChanged;
						var checkOut = changeRecord.checkOut;
					
						console.log("working with record->", changeRecord);
						console.log("changeComment = ", changeComment);
						console.log("checkOut = " , checkOut);
						if ( changeComment == true ) {
							console.log("changed comment");
							var commentCell = cells[i+6];
							commentCell.value = changeRecord.commentValue;
							commentCell.save((err)=> { console.log("Saved",err); });
						}
						if  ( checkOut == true ) {
							console.log("checkedout");
							var outCell = cells[i+4];
							outCell.value = getTimeString(new Date());
							outCell.save( (err) => { console.log("Saved. ", err) });
						}
						
					}
				};
			};
		} catch (e) {
			console.log("Error in Lavatory.checkOutLav for id=" , data, " Error: " , e);
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
	
	async checkOutStudent(sId) {

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
				if ( idCell.value == sId ) {
					console.log("Checking Out ", sId );
					console.log(`${idCell.row},${idCell.col}: ${idCell.value}`);
					var outCell = cells[i+4];
					outCell.value = getTimeString(new Date());
					outCell.save( (err) => { console.log("Saved. ", err) });
					console.log("----saved");
				}
			};
		} catch (e) {
			console.log("Error in Lavatory.checkOutLav for id=" , sId, " Error: " , e);
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