var AppleToo = {};

var program = "A2 00 BC 00 02".replace(/\s+/g, "");

var opcode,
    program_counter = 0,
    memory = [],
    AC, // Registers
    XR,
    YR,
    SR,
    SP;

var OPCODES = {
  "A0" : function ldy_i() {
    YR = get_args(1)[0];
  },
  "A4" : function ldy_zp() {
    var addr = get_args(1)[0];
    YR = read_memory(addr);
  },
  "B4" : function ldy_zpx() {
	var offset = get_args(1)[0],
		addr = offset + XR;
	YR = read_memory(addr);
  },
  "AC" : function ldy_a() {
	var addr = get_args(2).join('');
	YR = read_memory(addr);
  },
  "BC" : function ldy_ax() {
	var offset = get_args(2).join(''),
		addr = XR + offset;
	YR = read_memory(addr);
  },
  "A2" : function ldx_i() {
    XR = get_args(1)[0];
  },
  "A6" : function ldx_zp() {
    var addr = get_args(1)[0];
    XR = read_memory(addr);
  },
  "A9" : function lda_i() {
    AC = get_args(1)[0];
  },
  "A5" : function lda_zp() {
    var addr = get_args(1)[0];
    AC = read_memory(addr);
  }
}

initialize_memory();

write_memory("02", "0F");

while (program_counter < program.length) {
  opcode = get_opcode();
  run(opcode);
}

print_registers();

function print_registers() {
  console.log("AC: " + AC);
  console.log("XR: " + XR);
  console.log("YR: " + YR);
  console.log("SR: " + SR);
  console.log("SP: " + SP);
  console.log("PC: " + program_counter);
}

function initialize_memory() {
  for (var i=0; i<8192; i++) {
    memory[i] = 0;
  }
}

function read_memory(hex_loc) {
  var loc = parseInt(hex_loc, 16);
  return memory[loc].toString(16); 
}

function write_memory(hex_loc, val) {
  var loc = parseInt(hex_loc, 16); 
  if (val.toString(16).length <= 2) {
    memory[loc] = val;
  } else {
    throw new Error("ERROR: Tried to write more than a word!");
  }
}

function get_opcode() {
  var opcode = program.substr(program_counter, 2); 
  program_counter += 2;
  return opcode;
}

function run(opcode) {
  return OPCODES[opcode]();
}

function get_args(n) {
  var arg_str = program.substr(program_counter, n*2);
  program_counter += n*2;
  var args = [];
  for (var i=0; i<arg_str.length; i+=2) {
    args.push(arg_str.substr(i, 2));
  }
  return args;
}
