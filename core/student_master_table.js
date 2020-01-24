const HashMap = require('hashmap');
const { promisify } = require('util');
const Student = require('./student');
/*
 * The StudentMasterTable class holds the list of all students with their Code39
 * bar code id.  This class also contains initialization code for reading from GoogleSheets.
 * Ultimately, this code will need to change once we move from googlesheets to a database.
 */
  
class StudentMasterTable {
	
	constructor() {
		this.myMap = new HashMap();
		this.studentList = require('../config/student_list.json');
		for (var i=0; i < this.studentList.length; i++ ) {
			var aStudent = new Student(this.studentList[i].cd,this.studentList[i].name);
			this.addStudent(aStudent);
		}
	}
	
	addStudent(theStudent) {
	  console.log("adding ", theStudent);
	 this.myMap.set(theStudent.cd, theStudent);
	}
	getStudent(aCode) {
	  return this.myMap.get(aCode);
	}
	
	getStudentList() { return this.studentList;}
	
	printIt() {
		this.myMap.forEach(function(value, key) {
			console.log(key + " <-:-> " + value);
		});
	}
	
}

module.exports = StudentMasterTable;
