var AppleToo = function() {
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
  console.log("Init memory run");
  for (var i=0; i<8192; i++) {
    this.memory[i] = 0;
  }
};

AppleToo.prototype.read_memory = function(hex_loc) {
  var loc = parseInt(hex_loc, 16);
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

AppleToo.prototype.get_args = function(n) {
  var arg_str = this.program.substr(this.PC, n*2);
  this.PC += n*2;
  var args = [];
  for (var i=0; i<arg_str.length; i+=2) {
    args.push(arg_str.substr(i, 2));
  }
  return args;
};

AppleToo.prototype.ldy_i = function() {
    this.YR = this.get_args(1)[0];
	this.cycles += 2;
};
AppleToo.prototype.ldy_zp = function() {
    var addr = this.get_args(1)[0];
    this.YR = this.read_memory(addr);
	this.cycles += 3;
};
AppleToo.prototype.ldy_zpx = function() {
	var offset = this.get_args(1)[0],
		addr = offset + this.XR;
	this.YR = this.read_memory(addr);
	this.cycles += 4;
};
AppleToo.prototype.ldy_a = function() {
	var addr = this.get_args(2).join('');
	this.YR = this.read_memory(addr);
};
AppleToo.prototype.ldy_ax = function() {
	var offset = this.get_args(2).join(''),
		addr = this.XR + offset;
	this.YR = this.read_memory(addr);
};
AppleToo.prototype.ldx_i = function() {
    this.XR = this.get_args(1)[0];
};
AppleToo.prototype.ldx_zp = function() {
    var addr = this.get_args(1)[0];
    this.XR = this.read_memory(addr);
};
AppleToo.prototype.lda_i = function() {
    this.AC = this.get_args(1)[0];
};
AppleToo.prototype.lda_zp = function() {
    var addr = this.get_args(1)[0];
    this.AC = this.read_memory(addr);
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
