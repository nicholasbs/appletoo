var AppleToo = function() {
  // Memory is stored as numbers
  // See: http://jsperf.com/tostring-16-vs-parseint-x-16
	this.memory = [];
	this.AC; // Registers
	this.XR;
	this.YR;
	this.SR;
	this.SP;
	this.PC = 0;

	this.cycles = 0;

	this.initialize_memory();
};

AppleToo.prototype.run6502 = function(program) {
	var opcode;

	this.program = program.replace(/\s+/g, "");
	while (this.PC < this.program.length) {
	  opcode = this.get_opcode();
	  this.run(opcode);
	}

	this.print_registers();
};

AppleToo.prototype.run = function(opcode) {
  return this[OPCODES[opcode]]();
};

AppleToo.prototype.print_registers = function() {
  console.log("--------------");
  console.log("AC: " + this.AC);
  console.log("XR: " + this.XR);
  console.log("YR: " + this.YR);
  console.log("SR: " + this.SR);
  console.log("SP: " + this.SP);
  console.log("PC: " + this.PC);
  console.log("--------------");
};

AppleToo.prototype.initialize_memory = function() {
  for (var i=0; i<1024; i++) {
    this.memory[i] = 0;
  }
};

AppleToo.prototype.read_memory = function(loc) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }
  return this.memory[loc].toString(16);
};

AppleToo.prototype.write_memory = function(hex_loc, val) {
  var loc = parseInt(hex_loc, 16);
  if (val.toString(16).length <= 2) {
    this.memory[loc] = val;
  } else {
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

AppleToo.prototype.get_opcode = function() {
  var opcode = this.program.substr(this.PC, 2);
  this.PC += 2;
  return opcode;
};

AppleToo.prototype.get_arg = function(bytes) {
  bytes = bytes || 1;
  var arg = this.program.substr(this.PC, bytes*2);
  this.PC += bytes*2;
  return parseInt(arg, 16)
};

AppleToo.prototype.get_register = function(register) {
  return zero_pad(this[register]);
}

AppleToo.prototype.set_register = function(register, val) {
  return this[register] = parseInt(val, 16);
}

AppleToo.prototype.ldy_i = function() {
    this.YR = this.get_arg();
	this.cycles += 2;
};
AppleToo.prototype.ldy_zp = function() {
    var addr = this.get_arg();
    this.YR = this.read_memory(addr);
	this.cycles += 3;
}
AppleToo.prototype.ldy_zpx = function() {
	var offset = this.get_arg(),
		  addr = offset + this.XR;
	this.YR = this.read_memory(addr);
	this.cycles += 4;
};
AppleToo.prototype.ldy_a = function() {
	var addr = this.get_arg(2);
	this.YR = this.read_memory(addr);
	this.cycles += 4;
};
AppleToo.prototype.ldy_ax = function() {
	var offset = this.get_arg(2),
		  addr = this.XR + offset;
	this.YR = this.read_memory(addr);
	this.cycles += 4;
};
AppleToo.prototype.ldx_i = function() {
  this.XR = this.get_arg();
	this.cycles += 2;
};
AppleToo.prototype.ldx_zp = function() {
  var addr = this.get_arg();
  this.XR = this.read_memory(addr);
	this.cycles += 3;
};
AppleToo.prototype.lda_i = function() {
    this.AC = this.get_arg();
    this.cycles += 2;
};
AppleToo.prototype.lda_zp = function() {
    var addr = this.get_arg();
    this.AC = this.read_memory(addr);
    this.cycles += 3;
};

var OPCODES = {
  "A0" : "ldy_i",
  "A4" : "ldy_zp",
  "B4" : "ldy_zpx",
  "AC" : "ldy_a",
  "BC" : "ldy_ax",
  "A2" : "ldx_i",
  "A6" : "ldx_zp",
  "A9" : "lda_i",
  "A5" : "lda_zp"
}

// Utilities
function zero_pad(n, len, base) {
  len = len || 2;
  base = base || 16;
  var result = n.toString(base).toUpperCase();
  while (result.length < len) {
    result = "0" + result;
  }
  return result;
}
