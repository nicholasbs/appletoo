var AppleToo = function(options) {
  options = options || {compatiblity: false};
  // Memory is stored as numbers
  // See: http://jsperf.com/tostring-16-vs-parseint-x-16
  this.memory = [];
  // Registers
  this.AC = 0;
  this.XR = 0;
  this.YR = 0;
  this.SR = 0;
  this.SP = 0xFF;
  this.PC = 0xC000;

  this.COMPATIBILITY_MODE = options.compatiblity;

  this.running = true;

  this.cycles = 0;

  this.initialize_memory();
};

AppleToo.prototype.run6502 = function(program, pc) {
  this.running = true;
  this.PC = pc === undefined ? 0xC000 : pc;
  var opcode;

  this.program = program.replace(/\s+/g, "");

  for (var i = 0; i < this.program.length; i += 2) {
    this.memory[0xC000 + i/2] = parseInt(this.program.substr(i, 2), 16);
  }

  while (this.running) {
    this.run(this._read_memory(this.PC++));
  }

  //this.print_registers();
};

AppleToo.prototype.run = function(opcode) {
  return OPCODES[opcode].call(this);
};

AppleToo.prototype.immediate = function() {
  return this.PC++;
};
//implied addressing mode function unnecessary
AppleToo.prototype.accumulator = function() {
  return this.AC;
};
AppleToo.prototype.relative = function() {
  return this.PC + unsigned_to_signed(this._read_memory(this.PC++));
};
AppleToo.prototype.zero_page = function() {
  if (this._read_memory(this.PC) > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return this._read_memory(this.PC++);
};
AppleToo.prototype.zero_page_indexed_with_x = function() {
  var addr = this._read_memory(this.PC++) + this.XR;
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return addr;
};
AppleToo.prototype.zero_page_indexed_with_y = function() {
  var addr = this._read_memory(this.PC++) + this.YR;
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");
  return addr;
};
AppleToo.prototype.absolute = function() {
  var addr = this.read_word(this.PC);
  this.PC += 2;
  return addr;
};
AppleToo.prototype.absolute_indexed_with_x = function() {
  var addr = this.read_word(this.PC) + this.XR;
  this.PC += 2;
  return addr;
};
AppleToo.prototype.absolute_indexed_with_y = function() {
  var addr = this.read_word(this.PC) + this.YR;
  this.PC += 2;
  return addr;
};
AppleToo.prototype.absolute_indirect = function() {
  var addr = this.read_word(this.PC);
  if (this.COMPATIBILITY_MODE && addr | 0x00FF === 0x00FF){
    addr = this._read_memory(addr) + (this._read_memory(addr & 0xFF00) << 8);
  } else {
    addr = this.read_word(addr);
  }
  this.PC += 2;
  return addr;
};
AppleToo.prototype.zero_page_indirect_indexed_with_x = function() {
  var addr = this._read_memory(this.PC++);
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");

  addr = (addr + this.XR) % 255;
  return this.read_word(addr);
};
AppleToo.prototype.zero_page_indirect_indexed_with_y = function() {
  var addr = this._read_memory(this.PC++);
  if (addr > 0xFF) throw new Error("Zero_Page boundary exceeded");

  addr = (addr + this.YR) % 255;
  return this.read_word(addr);
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
  for (var i=0; i<65536; i++) {
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
  return this.memory[loc];
};

AppleToo.prototype.write_memory = function(loc, val) {
  if (typeof loc === "string") loc = parseInt(loc, 16);
  if (typeof val === "string") val = parseInt(val, 16);

  if (val <= 255) {
    this.memory[loc] = val;
  } else {
    console.log(val);
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

// Internally, data in memory is numbers, not strings.
AppleToo.prototype._write_memory = function(loc, val) {
  if (typeof loc === "string") {
    loc = parseInt(loc, 16);
  }
  if (val <= 255) {
    this.memory[loc] = val;
  } else if (val <= 65535) {
    var high_byte = (val & 0xFF00) >> 8,
        low_byte = val & 0x00FF;
    this.memory[loc] = low_byte;
    this.memory[loc+1] = high_byte;
  } else {
    throw new Error("ERROR: Tried to write more than a word!");
  }
};

AppleToo.prototype.read_word = function(addr) {
 return this._read_memory(addr) + (this._read_memory(addr + 1) << 8);
};

AppleToo.prototype.set_register = function(register, val) {
  if (typeof val === "string") val = parseInt(val, 16);
  return this[register] = val;
};

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

AppleToo.prototype._ld_register = function(register, addr) {
  // Reset Zero and Negative Flags
  this.SR &= (255 - SR_FLAGS["Z"] - SR_FLAGS["N"]);

  this[register] = this._read_memory(addr);

  this.update_zero_and_neg_flags(this[register]);
};

AppleToo.prototype.update_zero_and_neg_flags = function(val) {
  this.SR |= (val & SR_FLAGS.N); // Set negative flag
  if (val & SR_FLAGS.N) {
    this.SR |= SR_FLAGS.N;
  } else {
    this.SR &= ~SR_FLAGS.N & 0xFF;
  }

  if (val === 0) {
    this.SR |= SR_FLAGS.Z; //Set zero flag
  } else {
    this.SR &= ~SR_FLAGS.Z & 0xFF; //Clear zero flag
  }
};

AppleToo.prototype.ldy = function(addr) { this._ld_register("YR", addr); };
AppleToo.prototype.ldx = function(addr) { this._ld_register("XR", addr); };
AppleToo.prototype.lda = function(addr) { this._ld_register("AC", addr); };
AppleToo.prototype.stx = function(addr) {
  this._write_memory(addr, this.XR);
};
AppleToo.prototype.sty = function(addr) {
  this._write_memory(addr, this.YR);
};
AppleToo.prototype.sta = function(addr) {
  this._write_memory(addr, this.AC);
};
AppleToo.prototype.adc = function(addr) {
  var result = this.AC + this._read_memory(addr) + (this.SR & SR_FLAGS.C);

  if ((this.AC & SR_FLAGS.N) !== (result & SR_FLAGS.N)) {
    this.SR |= SR_FLAGS.V; //Set Overflow Flag
  } else {
    this.SR &= ~SR_FLAGS.V & 0xFF; //Clear Overflow Flag
  }

  this.update_zero_and_neg_flags(result);

  if (this.SR & SR_FLAGS.D) {
    result = to_bcd(from_bcd(this.AC) + from_bcd(this._read_memory(addr)) + (this.SR & SR_FLAGS.C));
    if (result > 99) {
      this.SR |= SR_FLAGS.C;
    } else {
      this.SR &= ~SR_FLAGS.C & 0xFF;
    }
  } else {
    if (result > 0xFF) {
      this.SR |= SR_FLAGS.C;
      result &= 0xFF;
    } else {
      this.SR &= ~SR_FLAGS.C & 0xFF;
    }
  }
  this.AC = result;
};
AppleToo.prototype.sbc = function(addr) {
  return false;
};
AppleToo.prototype.inc_dec_register = function(register, val) {
  this[register] += val;
  this.update_zero_and_neg_flags(this[register]);
};
AppleToo.prototype.inc_dec_memory = function(addr, val) {
  var result = this._read_memory(addr) + val;
  this._write_memory(addr, result);
  this.update_zero_and_neg_flags(result);
};
AppleToo.prototype.set_flag = function(flag) {
  this.SR |= SR_FLAGS[flag];
};
AppleToo.prototype.clear_flag = function(flag) {
  this.SR &= ~SR_FLAGS[flag] & 0xFF;
};
AppleToo.prototype.push = function(val) {
  var addr = (0x0100 + this.SP);
  this._write_memory(addr, val);

  if (this.SP <= 0x00) {
    this.SP = 0xFF;
  } else {
    this.SP--;
  }
};
AppleToo.prototype.pop = function(register) {
  this.SP++;
  var addr = (0x0100 + this.SP),
      val = this._read_memory(addr);
  if (register !== undefined) this[register] = val;

  if (addr >= 0x01FF) {
    this.SP = 0xFF;
  }
  return val;
};
AppleToo.prototype.push_word = function(val) {
  var low_byte = val & 0x00FF,
      high_byte = (val & 0xFF00) >> 8;
  this.push(high_byte);
  this.push(low_byte);
};
AppleToo.prototype.pop_word = function() {
  var low_byte = this.pop(),
      high_byte = (this.pop() << 8);

  return low_byte | high_byte;
};

AppleToo.prototype.transfer_register = function(from, to) {
  this[to] = this[from];
  this.cycles += 2;
  this.PC += 1;
  this.update_zero_and_neg_flags(this[to]);
};
AppleToo.prototype.logic_op = function(oper, addr) {
  switch (oper) { // TODO: I hate this. I want to pass operators as functions!
    case "AND":
      this.AC = this.AC & this._read_memory(addr);
      break;
    case "ORA":
      this.AC = this.AC | this._read_memory(addr);
      break;
    case "EOR":
      this.AC = this.AC ^ this._read_memory(addr);
  }
  this.AC = this.AC & 0xFF;
  this.update_zero_and_neg_flags(this.AC);
};
AppleToo.prototype.jump = function(addr) {
  this.PC = addr;
};
AppleToo.prototype.rts = function() {
  this.PC = this.pop_word() + 1;
};
AppleToo.prototype.rti = function() {
  this.pop("SR" );
  this.PC = this.pop_word();
};
AppleToo.prototype.branch_flag_set = function(flag) {
  var addr = this.relative();
  if ((this.SR & SR_FLAGS[flag]) === SR_FLAGS[flag]) {
    this.PC = addr;
  }
};
AppleToo.prototype.branch_flag_clear = function(flag) {
  var addr = this.relative();
  if ((this.SR & SR_FLAGS[flag]) === 0) {
    this.PC = addr;
  }
};
AppleToo.prototype.brk = function() {
  this.running = false;
  this.cycles += 7;

  this.SR |= SR_FLAGS.I;
  this.SR |= SR_FLAGS.B;

  this.push_word(this.PC + 1);
  this.push(this.SR);

  this.PC = this.read_word(0xFFFE);
};

var OPCODES = {
  0xA0 : function() { this.ldy(this.immediate()); this.cycles += 2; },
  0xA4 : function() { this.ldy(this.zero_page()); this.cycles += 3; },
  0xB4 : function() { this.ldy(this.zero_page_indexed_with_x()); this.cycles += 4; },
  0xAC : function() { this.ldy(this.absolute()); this.cycles += 4; },
  0xBC : function() { this.ldy(this.absolute_indexed_with_x()); this.cycles += 4; },
  0xA2 : function() { this.ldx(this.immediate()); this.cycles += 2; },
  0xA6 : function() { this.ldx(this.zero_page()); this.cycles += 3; },
  0xB6 : function() { this.ldx(this.zero_page_indexed_with_y()); this.cycles += 4; },
  0xAE : function() { this.ldx(this.absolute()); this.cycles += 4; },
  0xBE : function() { this.ldx(this.absolute_indexed_with_y()); this.cycles += 4; },
  0xA9 : function() { this.lda(this.immediate()); this.cycles += 2; },
  0xA5 : function() { this.lda(this.zero_page()); this.cycles += 3; },
  0xB5 : function() { this.lda(this.zero_page_indexed_with_x()); this.cycles += 4; },
  0xAD : function() { this.lda(this.absolute()); this.cycles += 4; },
  0xBD : function() { this.lda(this.absolute_indexed_with_x()); this.cycles += 4; },
  0xB9 : function() { this.lda(this.absolute_indexed_with_y()); this.cycles += 4; },
  0xA1 : function() { this.lda(this.zero_page_indirect_indexed_with_x()); this.cycles += 6; },
  0xB1 : function() { this.lda(this.zero_page_indirect_indexed_with_y()); this.cycles += 6; },
  0x86 : function() { this.stx(this.zero_page()); this.cycles += 3; },
  0x96 : function() { this.stx(this.zero_page_indexed_with_y()); this.cycles += 4; },
  0x8E : function() { this.stx(this.absolute()); this.cycles += 4; },
  0x84 : function() { this.sty(this.zero_page()); this.cycles += 3; },
  0x94 : function() { this.sty(this.zero_page_indexed_with_x()); this.cycles += 4; },
  0x8C : function() { this.sty(this.absolute()); this.cycles += 4; },
  0x85 : function() { this.sta(this.zero_page()); this.cycles += 3; },
  0x95 : function() { this.sta(this.zero_page_indexed_with_x()); this.cycles += 4; },
  0x8D : function() { this.sta(this.absolute()); this.cycles += 4; },
  0x9D : function() { this.sta(this.absolute_indexed_with_x()); this.cycles += 5; },
  0x99 : function() { this.sta(this.absolute_indexed_with_y()); this.cycles += 5; },
  0x81 : function() { this.sta(this.zero_page_indirect_indexed_with_x()); this.cycles += 6; },
  0x91 : function() { this.sta(this.zero_page_indirect_indexed_with_y()); this.cycles += 6; },
  0xE8 : function() { this.inc_dec_register("XR", 1); this.cycles += 2; this.PC++; },
  0xC8 : function() { this.inc_dec_register("YR", 1); this.cycles += 2; this.PC++; },
  0xCA : function() { this.inc_dec_register("XR", -1); this.cycles += 2; this.PC++; },
  0x88 : function() { this.inc_dec_register("YR", -1); this.cycles += 2; this.PC++; },
  0xE6 : function() { this.inc_dec_memory(this.zero_page(), 1); this.cycles += 5; },
  0xF6 : function() { this.inc_dec_memory(this.zero_page_indexed_with_x(), 1); this.cycles += 6; },
  0xEE : function() { this.inc_dec_memory(this.absolute(), 1); this.cycles += 6; },
  0xFE : function() { this.inc_dec_memory(this.absolute_indexed_with_x(), 1); this.cycles += 7; },
  0xC6 : function() { this.inc_dec_memory(this.zero_page(), -1); this.cycles += 5; },
  0xD6 : function() { this.inc_dec_memory(this.zero_page_indexed_with_x(), -1); this.cycles += 6;},
  0xCE : function() { this.inc_dec_memory(this.absolute(), -1); this.cycles += 6; },
  0xDE : function() { this.inc_dec_memory(this.absolute_indexed_with_x(), -1); this.cycles += 7; },
  0x38 : function() { this.set_flag("C"); this.cycles += 2; this.PC++; },
  0xF8 : function() { this.set_flag("D"); this.cycles += 2; this.PC++; },
  0x78 : function() { this.set_flag("I"); this.cycles += 2; this.PC++; },
  0x18 : function() { this.clear_flag("C"); this.cycles += 2; this.PC++; },
  0xD8 : function() { this.clear_flag("D"); this.cycles += 2; this.PC++; },
  0x58 : function() { this.clear_flag("I"); this.cycles += 2; this.PC++; },
  0xB8 : function() { this.clear_flag("V"); this.cycles += 2; this.PC++; },
  0xAA : function() { this.transfer_register("AC", "XR"); },
  0x8A : function() { this.transfer_register("XR", "AC"); },
  0xA8 : function() { this.transfer_register("AC", "YR"); },
  0x98 : function() { this.transfer_register("YR", "AC"); },
  0xBA : function() { this.transfer_register("SP", "XR"); },
  0x9A : function() { this.transfer_register("XR", "SP"); },
  0x48 : function() { this.push(this.AC); this.update_zero_and_neg_flags(this.AC); this.cycles += 3; this.PC++; },
  0x08 : function() { this.push(this.SR); this.update_zero_and_neg_flags(this.SR); this.cycles += 3; this.PC++; },
  0x68 : function() { this.pop("AC"); this.update_zero_and_neg_flags(this.AC); this.cycles += 4; this.PC++; },
  0x28 : function() { this.pop("SR"); this.update_zero_and_neg_flags(this.SR); this.cycles += 4; this.PC++; }, // TODO: there's no need to call update_zero_and_neg_flags here, right?
  0x29 : function() { this.logic_op("AND", this.immediate()); this.cycles += 2; },
  0x25 : function() { this.logic_op("AND", this.zero_page()); this.cycles += 3; },
  0x35 : function() { this.logic_op("AND", this.zero_page_indexed_with_x()); this.cycles += 4; },
  0x2D : function() { this.logic_op("AND", this.absolute()); this.cycles += 4; },
  0x3D : function() { this.logic_op("AND", this.absolute_indexed_with_x()); this.cycles += 4; },
  0x39 : function() { this.logic_op("AND", this.absolute_indexed_with_y()); this.cycles += 4; },
  0x21 : function() { this.logic_op("AND", this.zero_page_indirect_indexed_with_x()); this.cycles += 6; },
  0x31 : function() { this.logic_op("AND", this.zero_page_indirect_indexed_with_y()); this.cycles += 5; },
  0x09 : function() { this.logic_op("ORA", this.immediate()); this.cycles += 2; },
  0x05 : function() { this.logic_op("ORA", this.zero_page()); this.cycles += 3; },
  0x15 : function() { this.logic_op("ORA", this.zero_page_indexed_with_x()); this.cycles += 4; },
  0x0D : function() { this.logic_op("ORA", this.absolute()); this.cycles += 4; },
  0x1D : function() { this.logic_op("ORA", this.absolute_indexed_with_x()); this.cycles += 4; },
  0x19 : function() { this.logic_op("ORA", this.absolute_indexed_with_y()); this.cycles += 4; },
  0x01 : function() { this.logic_op("ORA", this.zero_page_indirect_indexed_with_x()); this.cycles += 6; },
  0x11 : function() { this.logic_op("ORA", this.zero_page_indirect_indexed_with_y()); this.cycles += 5; },
  0x49 : function() { this.logic_op("EOR", this.immediate()); this.cycles += 2; },
  0x45 : function() { this.logic_op("EOR", this.zero_page()); this.cycles += 3; },
  0x55 : function() { this.logic_op("EOR", this.zero_page_indexed_with_x()); this.cycles += 4; },
  0x4D : function() { this.logic_op("EOR", this.absolute()); this.cycles += 4; },
  0x5D : function() { this.logic_op("EOR", this.absolute_indexed_with_x()); this.cycles += 4; },
  0x59 : function() { this.logic_op("EOR", this.absolute_indexed_with_y()); this.cycles += 4; },
  0x41 : function() { this.logic_op("EOR", this.zero_page_indirect_indexed_with_x()); this.cycles += 6; },
  0x51 : function() { this.logic_op("EOR", this.zero_page_indirect_indexed_with_y()); this.cycles += 5; },
  0x4C : function() { this.jump(this.absolute()); this.cycles += 3; },
  0x6C : function() { this.jump(this.absolute_indirect()); this.cycles += 5; },
  0x20 : function() { this.push_word(this.PC + 1); this.jump(this.absolute()); this.cycles += 6; },
  0x60 : function() { this.rts(this.immediate()); this.cycles += 6; },
  0x40 : function() { this.rti(); this.cycles += 6; },
  0x90 : function() { this.branch_flag_clear("C"); },
  0xB0 : function() { this.branch_flag_set("C"); },
  0xF0 : function() { this.branch_flag_set("Z"); },
  0xD0 : function() { this.branch_flag_clear("Z"); },
  0x10 : function() { this.branch_flag_clear("N"); },
  0x30 : function() { this.branch_flag_set("N"); },
  0x50 : function() { this.branch_flag_clear("V"); },
  0x70 : function() { this.branch_flag_set("V"); },
  0xEA : function() { this.PC++; },
  0x00 : function() { this.brk(); }
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

function unsigned_to_signed(val) {
  if (val > 255) throw new Error("unsigned_to_signed only works on 1 byte numbers");
  if (val < 128) return val;
  return (val - 256);
}

function from_bcd(val) {
  var high = (val & 0xF0) >> 4,
      low = val & 0x0F;
  return high * 10 + low;
}

function to_bcd(val) {
  if (val > 99 || val < 0) throw new Error("Bad BCD Value");
  var digits = val.toString().split("");

  return (parseInt(digits[0],10)<<4) + parseInt(digits[1],10);
}
// vim: expandtab:ts=2:sw=2
