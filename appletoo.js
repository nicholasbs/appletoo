var AppleToo = function() {
  // Memory is stored as numbers
  // See: http://jsperf.com/tostring-16-vs-parseint-x-16
  this.memory = [];
  this.AC; // Registers
  this.XR;
  this.YR;
  this.SR = 0;
  this.SP;
  this.PC = 0;

  this.cycles = 0;

  this.initialize_memory();
};

AppleToo.prototype.run6502 = function(program, pc) {
  this.PC = pc === undefined ? 0 : pc;
  var opcode;

  this.program = program.replace(/\s+/g, "");
  while (this.PC < this.program.length) {
    opcode = this.get_opcode();
    this.run(opcode);
  }

  //this.print_registers();
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

AppleToo.prototype.read_memory = function(loc, word) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }
  if (word !== undefined) {
    return (this.memory[loc + 1].toString(16) + this.memory[loc].toString(16)).toString(16);
  }
  return this.memory[loc].toString(16).toUpperCase();
};

AppleToo.prototype._read_memory = function(loc) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }
  return this.memory[loc];
};

AppleToo.prototype.write_memory = function(hex_loc, val) {
  var loc = parseInt(hex_loc, 16);
  if (val.toString(16).length <= 2) {
    this.memory[loc] = parseInt(val, 16);
  } else {
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

// Internally, we data in memory is numbers, not strings.
AppleToo.prototype._write_memory = function(loc, val) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }
  if (val <= 65535) {
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

AppleToo.prototype.get_status_flags = function() {
  var bits = zero_pad(this.SR, 8, 2).split('');
  bits = bits.map(function(item) {
    return parseInt(item, 10);
  });
  return {
    N: bits[0],
    V: bits[1],
    _: bits[2],
    B: bits[3],
    D: bits[4],
    I: bits[5],
    Z: bits[6],
    C: bits[7]
  };
};

AppleToo.prototype.set_status_flags = function(obj) {
  for (var bit in obj) {
    if (obj[bit]) {
      this.SR = this.SR | SR_FLAGS[bit];
    }
  };
};

AppleToo.prototype.ldy_i = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  this.YR = this.get_arg();
  this.cycles += 2;

  //Set negative flag
  this.SR |= this.YR & SR_FLAGS["N"];
  //Set zero flag
  if (this.YR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldy_zp = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg();
  this.YR = this._read_memory(addr);
  this.cycles += 3;

  //Set negative flag
  this.SR |= this.YR & SR_FLAGS["N"];
  //Set zero flag
  if (this.YR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
}
AppleToo.prototype.ldy_zpx = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(),
      addr = offset + this.XR;
  this.YR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.YR & SR_FLAGS["N"];
  //Set zero flag
  if (this.YR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldy_a = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg(2);
  this.YR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.YR & SR_FLAGS["N"];
  //Set zero flag
  if (this.YR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldy_ax = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(2),
      addr = this.XR + offset;
  this.YR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.YR & SR_FLAGS["N"];
  //Set zero flag
  if (this.YR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldx_i = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  this.XR = this.get_arg();
  this.cycles += 2;

  //Set negative flag
  this.SR |= this.XR & SR_FLAGS["N"];
  //Set zero flag
  if (this.XR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldx_zp = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg();
  this.XR = this._read_memory(addr);
  this.cycles += 3;

  //Set negative flag
  this.SR |= this.XR & SR_FLAGS["N"];
  //Set zero flag
  if (this.XR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldx_zpy = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(),
      addr = offset + this.YR;
  this.XR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.XR & SR_FLAGS["N"];
  //Set zero flag
  if (this.XR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldx_a = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg(2);
  this.XR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.XR & SR_FLAGS["N"];
  //Set zero flag
  if (this.XR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.ldx_ay = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(2),
      addr = this.YR + offset;
  this.XR = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.XR & SR_FLAGS["N"];
  //Set zero flag
  if (this.XR === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.lda_i = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  this.AC = this.get_arg();
  this.cycles += 2;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.lda_zp = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg();
  this.AC = this._read_memory(addr);
  this.cycles += 3;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};

AppleToo.prototype.lda_zpx = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(),
      addr = offset + this.XR;
  this.AC = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};

AppleToo.prototype.lda_a = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var addr = this.get_arg(2);
  this.AC = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};

AppleToo.prototype.lda_ax = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(2),
      addr = this.XR + offset;
  this.AC = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};

AppleToo.prototype.lda_ay = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(2),
      addr = this.YR + offset;
  this.AC = this._read_memory(addr);
  this.cycles += 4;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};
AppleToo.prototype.stx_zp = function() {
  var addr = this.get_arg();
  this._write_memory(addr, this.XR);
  this.cycles += 3;
};
AppleToo.prototype.stx_zpy = function() {
  var addr = this.YR + this.get_arg();
  this._write_memory(addr, this.XR);
  this.cycles += 4;
};
AppleToo.prototype.stx_a = function() {
  var addr = this.get_arg(2);
  this._write_memory(addr, this.XR);
  this.cycles += 4;
};
AppleToo.prototype.sty_zp = function() {
  var addr = this.get_arg();
  this._write_memory(addr, this.YR);
  this.cycles += 3;
};
AppleToo.prototype.sty_zpx = function() {
  var addr = this.XR + this.get_arg();
  this._write_memory(addr, this.YR);
  this.cycles += 4;
};
AppleToo.prototype.sty_a = function() {
  var addr = this.get_arg(2);
  this._write_memory(addr, this.YR);
  this.cycles += 4;
};
AppleToo.prototype.sta_zp = function() {
  var addr = this.get_arg();
  this._write_memory(addr, this.AC);
  this.cycles += 3;
};
AppleToo.prototype.sta_zpx = function() {
  var addr = this.XR + this.get_arg();
  this._write_memory(addr, this.AC);
  this.cycles += 4;
};
AppleToo.prototype.sta_a = function() {
  var addr = this.get_arg(2);
  this._write_memory(addr, this.AC);
  this.cycles += 4;
};
AppleToo.prototype.sta_ax = function() {
  var addr = this.XR + this.get_arg(2);
  this._write_memory(addr, this.AC);
  this.cycles += 5;
};
AppleToo.prototype.sta_ay = function() {
  var addr = this.YR + this.get_arg(2);
  this._write_memory(addr, this.AC);
  this.cycles += 5;
};

AppleToo.prototype.lda_idx = function() {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  var offset = this.get_arg(),
      addr = this.XR + offset,
      final_addr = this.read_memory(addr, true);
  this.AC = this._read_memory(final_addr);
  this.cycles += 6;

  //Set negative flag
  this.SR |= this.AC & SR_FLAGS["N"];
  //Set zero flag
  if (this.AC === 0) {
    this.SR |= SR_FLAGS["Z"];
  }
};

var OPCODES = {
  "A0" : "ldy_i",
  "A4" : "ldy_zp",
  "B4" : "ldy_zpx",
  "AC" : "ldy_a",
  "BC" : "ldy_ax",
  "A2" : "ldx_i",
  "A6" : "ldx_zp",
  "B6" : "ldx_zpy",
  "AE" : "ldx_a",
  "BE" : "ldx_ay",
  "A9" : "lda_i",
  "A5" : "lda_zp",
  "B5" : "lda_zpx",
  "AD" : "lda_a",
  "BD" : "lda_ax",
  "B9" : "lda_ay",
  "A1" : "lda_idx",
  "B1" : "lda_idy",
  "86" : "stx_zp",
  "96" : "stx_zpy",
  "8E" : "stx_a",
  "84" : "sty_zp",
  "94" : "sty_zpx",
  "8C" : "sty_a",
  "85" : "sta_zp",
  "95" : "sta_zpx",
  "8D" : "sta_a",
  "9D" : "sta_ax",
  "99" : "sta_ay"
};

var SR_FLAGS = {
  "N" : 128,
  "V" : 64,
  "_" : 32,
  "B" : 16,
  "D" : 8,
  "I" : 4,
  "Z" : 2,
  "C" : 1
};

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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// vim: expandtab:ts=2:sw=2
