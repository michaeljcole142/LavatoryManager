class Student {
  constructor(cd, name) {
	  this.cd = cd;
	  this.name = name;
  }
  
 
  toString() {
	 return this.cd + ":" + this.name;
  }
}

module.exports = Student;
