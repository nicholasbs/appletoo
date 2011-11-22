var appleToo,
    setupTeardown = {
      setup: function() {
        appleToo = new AppleToo();
      },
      teardown: function() {
        appleToo = undefined;
      }
    },
    unset_flags = {N:0, V:0, _:0, B:0, D:0, I:0, Z:0, C:0},
    zero_flag = clone(unset_flags),
    neg_flag = clone(unset_flags),
    carry_flag = clone(unset_flags),
    overflow_neg_flag = clone(unset_flags),
    overflow_carry_flag = clone(unset_flags),
    dec_flag = clone(unset_flags),
    dec_carry_flag = clone(unset_flags);

zero_flag["Z"] = 1;
neg_flag["N"] = 1;
carry_flag["C"] = 1;
overflow_neg_flag["V"] = 1;
overflow_neg_flag["N"] = 1;
overflow_carry_flag["V"] = 1;
overflow_carry_flag["C"] = 1;
dec_flag["D"] = 1;
dec_carry_flag["D"] = 1;
dec_carry_flag["C"] = 1;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

//TODO: Make this less hacky and awful
function test_status_after(appleToo, program, expected_SR) {
  var test_string = "flag(s) should be set";
  for (var k in expected_SR) {
    if (expected_SR[k] === 1) {
      test_string = k + ", " + test_string;
    }
  }
  test_string = test_string.replace(", flag", " flag");
  appleToo.run6502(program);
  deepEqual(appleToo.get_status_flags(), expected_SR, test_string);
}


module("Helper functions", setupTeardown);
test("get_register", function() {
  expect(1);
  appleToo.XR = 1;
  equal(appleToo.get_register("XR"), "01");
});
test("set_register", function() {
  expect(1);
  appleToo.set_register("XR", "01");
  equal(appleToo.XR, 1);
});
test("get_status_flags", function() {
  expect(1);
  deepEqual(appleToo.get_status_flags(), {N:0, V:0, _:0, B:0, D:0, I:0, Z:0, C:0});
});
test("set_status_flags", function() {
  expect(1);
  appleToo.set_status_flags({N:1, V:0, _:0, B:0, D:0, I:0, Z:1, C:0});
  equal(appleToo.SR, 130);
});
test("to_bcd", function(){
  expect(1);

  equal(to_bcd(34), parseInt("00110100",2));
});
test("from_bcd", function() {
  expect(1);

  equal(from_bcd(parseInt("00110100",2)), 34);
});

module("Memory Addressing Modes", setupTeardown);
test("Accumlator", function() {
  expect(2);

  appleToo.set_register("AC", 0xBB);

  equal(appleToo.accumulator(), 0xBB, "AppleToo.accumulator should return the value in the Accumulator register");
  equal(appleToo.PC, 0xC000, "Program Counter should not be incremented");
});

test("Immediate", function() {
  expect(2);

  var addr = appleToo.PC
  appleToo.write_memory(addr, 0xBB);

  equal(appleToo.immediate(), addr, "AppleToo.immediate should return the program counter");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Relative", function() {
  expect(3);

  //Running the function will change the program counter,
  //so we store the value to test before that
  var testValue = appleToo.PC + 0x10;
  appleToo.write_memory(appleToo.PC, 0x10);

  equal(appleToo.relative(), testValue, "AppleToo.relative should return the sum of the Program Counter and its argument");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");

  testValue = appleToo.PC - 1;
  appleToo.write_memory(appleToo.PC, 0xFF);

  equal(appleToo.relative(), testValue, "AppleToo.relative should return the sum of the Program Counter and its argument");
});

test("Zero Page", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);

  equal(appleToo.zero_page(), 0x01, "AppleToo.zero_page should return the given zero page address");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indexed With X", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);
  appleToo.set_register("XR", 0x01);

  equal(appleToo.zero_page_indexed_with_x(), 0x02, "AppleToo.zero_page_indexed_with_x should return the zero page address equal to the given address plus the value in the X register");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indexed With Y", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0x01);
  appleToo.set_register("YR", 0x01);

  equal(appleToo.zero_page_indexed_with_y(), 0x02, "AppleToo.zero_page_indexed_with_y should return the zero page address equal to the given address plus the value in the Y register");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Absolute", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBF);
  appleToo.write_memory(appleToo.PC+1, 0x1B);

  equal(appleToo.absolute(), 0x1BBF, "AppleToo.absolute should return the given (two byte) address");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indexed With X", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBE);
  appleToo.write_memory(appleToo.PC+1, 0x1B);
  appleToo.set_register("XR", 0x01);

  equal(appleToo.absolute_indexed_with_x(), 0x1BBF, "AppleToo.absolute_indexed_with_x should return the given (two byte) address offset with the value of the X register");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indexed With Y", function() {
  expect(2);

  appleToo.write_memory(appleToo.PC, 0xBE);
  appleToo.write_memory(appleToo.PC+1, 0x1B);
  appleToo.set_register("YR", 0x01);

  equal(appleToo.absolute_indexed_with_y(), 0x1BBF, "AppleToo.absolute_indexed_with_y should return the given (two byte) address offset with the value of the Y register");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Absolute, Indirect", function() {
  expect(2);

  appleToo.write_memory(0x1BBF, 0xAB);
  appleToo.write_memory(0x1BBE, 0xCD);

  appleToo.write_memory(appleToo.PC, 0xBE);
  appleToo.write_memory(appleToo.PC+1, 0x1B);

  equal(appleToo.absolute_indirect(), 0xABCD, "AppleToo.absolute_indirect should return the address formed by reading the low byte at the absolute address and the high byte at the absolute address plus one");
  equal(appleToo.PC, 0xC002, "Program Counter should be increased by 2");
});

test("Zero Page, Indirect, Indexed with X", function() {
  expect(2);

  appleToo.write_memory(0x00FF, 0xAB);
  appleToo.write_memory(0x00FE, 0xCD);
  appleToo.set_register("XR", 0x0E);

  appleToo.write_memory(appleToo.PC, 0xF0);

  equal(appleToo.zero_page_indirect_indexed_with_x(), 0xABCD, "AppleToo.zero_page_indirect_indexed_with_x should return the address formed by reading low byte at the zero page address plus the X register and the high byte at the zero page address plus X register plus one");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

test("Zero Page, Indirect, Indexed with Y", function() {
  expect(2);

  appleToo.write_memory(0x00FF, 0xAB);
  appleToo.write_memory(0x00FE, 0xCD);
  appleToo.set_register("YR", 0x0E);

  appleToo.write_memory(appleToo.PC, 0xF0);

  equal(appleToo.zero_page_indirect_indexed_with_y(), 0xABCD, "AppleToo.zero_page_indirect_indexed_with_y should return the address formed by reading low byte at the zero page address plus the Y register and the high byte at the zero page address plus Y register plus one");
  equal(appleToo.PC, 0xC001, "Program Counter should be increased by 1");
});

module("Load and Store", setupTeardown);
test("LDY_I", function() {
  expect(5);

  appleToo.run6502("A0 0F");
  equal(appleToo.get_register("YR"), "0F", "Argument should be loaded into Register Y");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A0 00", zero_flag);
  test_status_after(appleToo, "A0 FF", neg_flag);
});

test("LDY_ZP", function() {
  expect(5);

  appleToo.write_memory("0F", "11");

  appleToo.run6502("A4 0F");
  equal(appleToo.get_register("YR"), "11", "Value from Zero Page Memory should be loaded into Register Y");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("0F", "00");
  test_status_after(appleToo, "A4 0F", zero_flag);

  appleToo.write_memory("0F", "FF");
  test_status_after(appleToo, "A4 0F", neg_flag);
});

test("LDY_ZPX", function() {
  expect(5);

  appleToo.set_register("XR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B4 02");
  equal(appleToo.get_register("YR"), "0F", "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("03", "00");
  test_status_after(appleToo, "B4 02", zero_flag);

  appleToo.write_memory("03", "FF");
  test_status_after(appleToo, "B4 02", neg_flag);
});

test("LDY_A", function() {
  expect(5);

  appleToo.write_memory("ABCD", "11");
  appleToo.run6502("AC CD AB");
  equal(appleToo.get_register("YR"), "11", "Value at 2-byte argument should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("ABCD", "00");
  test_status_after(appleToo, "AC CD AB", zero_flag);

  appleToo.write_memory("ABCD", "FF");
  test_status_after(appleToo, "AC CD AB", neg_flag);
});

test("LDY_AX", function() {
  expect(5);

  appleToo.write_memory("AABB", "11");
  appleToo.set_register("XR", "BB");
  appleToo.run6502("BC 00 AA");
  equal(appleToo.get_register("YR"), "11", "Value at memory location (absolute arg + value at Register X) should be loaded into Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("AABB", "00");
  test_status_after(appleToo, "BC 00 AA", zero_flag);

  appleToo.write_memory("AABB", "FF");
  test_status_after(appleToo, "BC 00 AA", neg_flag);
});

test("LDX_I", function() {
  expect(5);

  appleToo.run6502("A2 11");
  equal(appleToo.get_register("XR"), "11", "Argument should be loaded into Register X");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A2 00", zero_flag);
  test_status_after(appleToo, "A2 FF", neg_flag);
});

test("LDX_ZP", function() {
  expect(5);

  appleToo.write_memory("0F", "11");

  appleToo.run6502("A6 0F");
  equal(appleToo.get_register("XR"), "11", "Value from Zero Page Memory should be loaded into Register X");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("0F", "00");
  test_status_after(appleToo, "A6 0F", zero_flag);

  appleToo.write_memory("0F", "FF");
  test_status_after(appleToo, "A6 0F", neg_flag);
});

test("LDX_ZPY", function() {
  expect(5);

  appleToo.set_register("YR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B6 02");
  equal(appleToo.get_register("XR"), "0F", "Value at Memory location (Zero Page Arg + value in Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("03", "00");
  test_status_after(appleToo, "B6 02", zero_flag);

  appleToo.write_memory("03", "FF");
  test_status_after(appleToo, "B6 02", neg_flag);
});

test("LDX_A", function() {
  expect(5);

  appleToo.write_memory("ABCD", "11");
  appleToo.run6502("AE CD AB");
  equal(appleToo.get_register("XR"), "11", "Value at 2-byte argument should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("ABCD", "00");
  test_status_after(appleToo, "AE CD AB", zero_flag);

  appleToo.write_memory("ABCD", "FF");
  test_status_after(appleToo, "AE CD AB", neg_flag);
})

test("LDX_AY", function() {
  expect(5);

  appleToo.write_memory("AABB", "11");
  appleToo.set_register("YR", "BB");
  appleToo.run6502("BE 00 AA");
  equal(appleToo.get_register("XR"), "11", "Value at memory location (absolute arg + value at Register Y) should be loaded into Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("AABB", "00");
  test_status_after(appleToo, "BE 00 AA", zero_flag);

  appleToo.write_memory("AABB", "FF");
  test_status_after(appleToo, "BE 00 AA", neg_flag);
});

test("LDA_I", function() {
  expect(5);

  appleToo.run6502("A9 11");
  equal(appleToo.get_register("AC"), "11", "Argument should be loaded into Accumulator");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  test_status_after(appleToo, "A9 00", zero_flag);
  test_status_after(appleToo, "A9 FF", neg_flag);
});

test("LDA_ZP", function() {
  expect(5);

  appleToo.write_memory("0F", "11");

  appleToo.run6502("A5 0F");
  equal(appleToo.get_register("AC"), "11", "Value from Zero Page Memory should be loaded into Accumulator");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("0F", "00");
  test_status_after(appleToo, "A5 0F", zero_flag);

  appleToo.write_memory("0F", "FF");
  test_status_after(appleToo, "A5 0F", neg_flag);
});

test("LDA_ZPX", function() {
  expect(5);

  appleToo.set_register("XR", "01");
  appleToo.write_memory("03", "0F");

  appleToo.run6502("B5 02");
  equal(appleToo.get_register("AC"), "0F", "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("03", "00");
  test_status_after(appleToo, "B5 02", zero_flag);

  appleToo.write_memory("03", "FF");
  test_status_after(appleToo, "B5 02", neg_flag);
});

test("LDA_A", function() {
  expect(5);

  appleToo.write_memory("ABCD", "11");
  appleToo.run6502("AD CD AB");
  equal(appleToo.get_register("AC"), "11", "Value at 2-byte argument should be loaded into Accumulator");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("ABCD", "00");
  test_status_after(appleToo, "AD CD AB", zero_flag);

  appleToo.write_memory("ABCD", "FF");
  test_status_after(appleToo, "AD CD AB", neg_flag);
})

test("LDA_AX", function() {
  expect(5);

  appleToo.write_memory("AABB", "11");
  appleToo.set_register("XR", "BB");
  appleToo.run6502("BD 00 AA");
  equal(appleToo.get_register("AC"), "11", "Value at memory location (absolute arg + value at Register X) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("AABB", "00");
  test_status_after(appleToo, "BD 00 AA", zero_flag);

  appleToo.write_memory("AABB", "FF");
  test_status_after(appleToo, "BD 00 AA", neg_flag);
});

test("LDA_AY", function() {
  expect(5);

  appleToo.write_memory("AABB", "11");
  appleToo.set_register("YR", "BB");
  appleToo.run6502("B9 00 AA");
  equal(appleToo.get_register("AC"), "11", "Value at memory location (absolute arg + value at Register Y) should be loaded into Accumlator");
  equal(appleToo.cycles, 4, "Should take 4 cycles if no page boundary crossed");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("AABB", "00");
  test_status_after(appleToo, "B9 00 AA", zero_flag);

  appleToo.write_memory("AABB", "FF");
  test_status_after(appleToo, "B9 00 AA", neg_flag);
});

test("LDA_IDX", function() {
  expect(5);

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "11");
  appleToo.set_register("XR", "02");
  appleToo.run6502("A1 15");
  equal(appleToo.get_register("AC"), "11", "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("D010", "00");
  test_status_after(appleToo, "A1 15", zero_flag);

  appleToo.write_memory("D010", "FF");
  test_status_after(appleToo, "A1 15", neg_flag);
});

test("LDA_IDY", function() {
  expect(5);

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.write_memory("D010", "11");
  appleToo.set_register("YR", "02");
  appleToo.run6502("B1 15");
  equal(appleToo.get_register("AC"), "11", "Load value into Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
  deepEqual(appleToo.get_status_flags(), unset_flags, "No flags should be set");

  appleToo.write_memory("D010", "00");
  test_status_after(appleToo, "B1 15", zero_flag);

  appleToo.write_memory("D010", "FF");
  test_status_after(appleToo, "B1 15", neg_flag);
});


test("STA_A", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.run6502("8D 37 13");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_AX", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("XR", "02");
  appleToo.run6502("9D 35 13");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address + value in Register X");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_AY", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("YR", "02");
  appleToo.run6502("99 35 13");
  equal(appleToo.read_memory("1337"), "AA", "Store Accumlator at given absolute address + value in Register Y");
  equal(appleToo.cycles, 5, "Should take 5 cycles");
});

test("STA_ZP", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.run6502("85 01");

  equal(appleToo.read_memory("01"), "AA", "Store Accumlator at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STA_ZPX", function() {
  expect(2);

  appleToo.set_register("AC", "AA");
  appleToo.set_register("XR", "01");
  appleToo.run6502("95 01");

  equal(appleToo.read_memory("02"), "AA", "Store Accumlator at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STA_IDX", function() {
  expect(2);

  appleToo.set_register("AC", "BB");
  appleToo.set_register("XR", "02");

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.run6502("81 15");
  equal(appleToo.read_memory("D010"), "BB", "Store Accumlator using Zero Page Indexed Indirect addressing mode with X");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STA_IDY", function() {
  expect(2);

  appleToo.set_register("AC", "BB");
  appleToo.set_register("YR", "02");

  appleToo.write_memory("17", "10");
  appleToo.write_memory("18", "D0");
  appleToo.run6502("91 15");

  equal(appleToo.read_memory("D010"), "BB", "Store Accumlator using Zero Page Indexed Indirect addressing mode with Y");
  equal(appleToo.cycles, 6, "Should take 6 cycles");
});

test("STX_ZP", function() {
  expect(2);

  appleToo.set_register("XR", "AA");
  appleToo.run6502("86 01");

  equal(appleToo.read_memory("01"), "AA", "Store Register X at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STX_ZPY", function() {
  expect(2);

  appleToo.set_register("XR", "AA");
  appleToo.set_register("YR", "01");
  appleToo.run6502("96 01");

  equal(appleToo.read_memory("02"), "AA", "Store Register X at (Zero Page Memory Location + value in Register Y");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STX_A", function() {
  expect(2);

  appleToo.set_register("XR", "AA");
  appleToo.run6502("8E 37 13");
  equal(appleToo.read_memory("1337"), "AA", "Store Register X at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_ZP", function() {
  expect(2);

  appleToo.set_register("YR", "AA");
  appleToo.run6502("84 01");

  equal(appleToo.read_memory("01"), "AA", "Store Register Y at Zero Page Memory Location");
  equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("STY_ZPX", function() {
  expect(2);

  appleToo.set_register("YR", "AA");
  appleToo.set_register("XR", "01");
  appleToo.run6502("94 01");

  equal(appleToo.read_memory("02"), "AA", "Store Register Y at (Zero Page Memory Location + value in Register X");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

test("STY_A", function() {
  expect(2);

  appleToo.set_register("YR", "AA");
  appleToo.run6502("8C 37 13");
  equal(appleToo.read_memory("1337"), "AA", "Store Register Y at given absolute address");
  equal(appleToo.cycles, 4, "Should take 4 cycles");
});

module("Arithmetic", setupTeardown);

test("ADC", function() {
  expect(12);

  appleToo.AC = 0x02;
  appleToo.write_memory(0xABCD, 0x11);
  appleToo.adc(0xABCD);

  equal(appleToo.AC, 0x13, "Value at address should be added to accumulator");
  deepEqual(appleToo.get_status_flags(), unset_flags);

  appleToo.AC = 0x01;
  appleToo.set_status_flags({C:1});
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.adc(0xABCD);

  equal(appleToo.AC, 0x03, "ADC should take into account the carry flag");
  deepEqual(appleToo.get_status_flags(), unset_flags, "Carry flag should be cleared");

  appleToo.SR = 0;
  appleToo.AC = to_bcd(30);
  appleToo.write_memory(0xABCD, to_bcd(20));
  appleToo.set_status_flags({D:1});
  appleToo.adc(0xABCD);

  equal(appleToo.AC, to_bcd(50), "ADC should correctly handle BCD");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.AC = to_bcd(35);
  appleToo.set_status_flags({C:1});
  appleToo.adc(0xABCD);

  equal(appleToo.AC, to_bcd(56), "ADC should correctly handle BCD with Carry");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x00;
  appleToo.adc(0xFFFF);

  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.AC = 0xB0;
  appleToo.write_memory(0xABCD, 0x02);
  appleToo.adc(0xABCD);

  deepEqual(appleToo.get_status_flags(), neg_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x02;
  appleToo.write_memory(0xABCD, 0xFF);
  appleToo.adc(0xABCD);

  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x7F;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.adc(0xABCD);

  deepEqual(appleToo.get_status_flags(), overflow_neg_flag);
});

/*test("SBC", function() {
  expect(12);

  appleToo.AC = 0x11;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 0x0F, "Value at address should be subtracted from accumulator");
  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.AC = 0x03;
  appleToo.set_status_flags({"C":1});
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 0x01, "SBC should take into account the carry flag");
  deepEqual(appleToo.get_status_flags(), unset_flags, "Carry flag should be cleared");

  appleToo.SR = 0;
  appleToo.AC = 10;
  appleToo.write_memory(0xABCD, 5);
  appleToo.set_status_flags({D:1});
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 4, "SBC should correctly handle BCD");
  deepEqual(appleToo.get_status_flags(), dec_carry_flag);

  appleToo.AC = 10;
  appleToo.set_status_flags({C:1, D:1});
  appleToo.sbc(0xABCD);

  equal(appleToo.AC, 5, "SBC should correctly handle BCD with Carry");
  deepEqual(appleToo.get_status_flags(), dec_flag);

  appleToo.SR = 0;
  appleToo.set_status_flags({C:1});
  appleToo.AC = 0x00;
  appleToo.sbc(0xFFFF);

  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x01;
  appleToo.write_memory(0xABCD, 0x02);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), neg_flag);

  appleToo.SR = 0;
  appleToo.AC = 0x02;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), carry_flag);

  appleToo.SR = 0;
  appleToo.set_status_flags({C:1});
  appleToo.AC = 0x80;
  appleToo.write_memory(0xABCD, 0x01);
  appleToo.sbc(0xABCD);

  deepEqual(appleToo.get_status_flags(), overflow_carry_flag);
});*/

module("Increment and Decrement", setupTeardown);

test("Inc/dec register", function() {
  expect(5);

  appleToo.SR = 0;
  appleToo.XR = 0;
  appleToo.inc_dec_register("XR", 1);
  equal(appleToo.XR, 1, "Should increment register by 1");
  deepEqual(appleToo.get_status_flags(), unset_flags);

  appleToo.SR = 0;
  appleToo.XR = 1;
  appleToo.inc_dec_register("XR", -1);
  equal(appleToo.XR, 0, "Should decrement register by 1");
  deepEqual(appleToo.get_status_flags(), zero_flag);

  appleToo.SR = 0;
  appleToo.XR = 0;
  appleToo.inc_dec_register("XR", -1);
  deepEqual(appleToo.get_status_flags(), neg_flag);
});

test("Inc/dec memory", function() {
  expect(2);

  appleToo.write_memory(0xABCD, 0x01);
  appleToo.inc_dec_memory(0xABCD, 1);
  equal(appleToo._read_memory(0xABCD), 2, "Should increment value at addr by 1");

  appleToo.write_memory(0xABCD, 0x01);
  appleToo.inc_dec_memory(0xABCD, -1);
  equal(appleToo._read_memory(0xABCD), 0, "Should decrement value at addr by 1");
});

module("Set and Clear", setupTeardown);
test("Set Flag", function(){
  expect(8);

  appleToo.SR = 1;
  appleToo.set_flag("N");
  equal(appleToo.SR, 129, "set_flag shouldn't clober flags");

  appleToo.SR = 0;
  appleToo.set_flag("N");
  equal(appleToo.SR, 128);

  appleToo.SR = 0;
  appleToo.set_flag("V");
  equal(appleToo.SR, 64);

  appleToo.SR = 0;
  appleToo.set_flag("B");
  equal(appleToo.SR, 16);

  appleToo.SR = 0;
  appleToo.set_flag("D");
  equal(appleToo.SR, 8);

  appleToo.SR = 0;
  appleToo.set_flag("I");
  equal(appleToo.SR, 4);

  appleToo.SR = 0;
  appleToo.set_flag("Z");
  equal(appleToo.SR, 2);

  appleToo.SR = 0;
  appleToo.set_flag("C");
  equal(appleToo.SR, 1);
});
test("Clear Flag", function() {
  expect(1);

  appleToo.SR = 3;
  appleToo.clear_flag("C");

  equal(appleToo.SR, 2);
});

module("Stack", setupTeardown);
test("Push", function() {
  expect(4);

  equal(appleToo.SP, 0xFF, "Stack pointer should be properly initialized");

  appleToo.push(0xAA);
  equal(appleToo.SP, 0xFE, "Push should decrement the stack pointer by one");
  equal(appleToo._read_memory(0x01FF), 0xAA, "Value should be on the stack");

  appleToo.SP = 0x00;
  appleToo.push(0xAA);
  equal(appleToo.SP, 0xFF, "Stack should wrap around on overflow");
});

test("Pop", function() {
  expect(2);

  appleToo.write_memory(0x01FF, 0xAA);
  appleToo.SP = 0xFE;

  appleToo.pop("AC");
  equal(appleToo.AC, 0xAA, "Value from top of stack should be returned");
  equal(appleToo.SP, 0xFF, "Stack Pointer should be incremented");
});

module("Transfer", setupTeardown);
test("transfer_register", function() {
  appleToo.SR = 0;
  appleToo.AC = 0x00;
  appleToo.transfer_register("AC", "XR");

  equal(appleToo.XR, 0x00, "Accumulator should be transfered to X");
  equal(appleToo.cycles, 2, "Should take 2 cycles");
  equal(appleToo.PC, 0xC001, "PC should be incremented by one");
  deepEqual(appleToo.get_status_flags(), zero_flag, "Zero flag should be set");

  appleToo.SR = 0;
  appleToo.AC = 0xB0;
  appleToo.transfer_register("AC", "XR");

  deepEqual(appleToo.get_status_flags(), neg_flag, "Neg flag should be set");
});
test("TAX", function() {
  expect(1);

  appleToo.AC = 0xAA;
  OPCODES[0xAA].call(appleToo);
  equal(appleToo.XR, 0xAA, "Accumulator should be transfered to X");
});
test("TXA", function() {
  expect(1);

  appleToo.XR = 0xAA;
  OPCODES[0x8A].call(appleToo);
  equal(appleToo.AC, 0xAA, "X should be transfered to Accumulator");
});
test("TAY", function() {
  expect(1);

  appleToo.AC = 0xAA;
  OPCODES[0xA8].call(appleToo);
  equal(appleToo.YR, 0xAA, "Accumulator should be transfered to Y");
});
test("TYA", function() {
  expect(1);

  appleToo.YR = 0xAA;
  OPCODES[0x98].call(appleToo);
  equal(appleToo.AC, 0xAA, "Y should be transfered to Accumulator");
});
test("TSX", function() {
  expect(1);

  appleToo.SP = 0xAA;
  OPCODES[0xBA].call(appleToo);
  equal(appleToo.XR, 0xAA, "SP should be transfered to X");
});
test("TXS", function() {
  expect(1);

  appleToo.XR = 0x0100;
  OPCODES[0x9A].call(appleToo);
  equal(appleToo.SP, 0x0100, "X should be transfered to SP");
});
// vim: expandtab:ts=2:sw=2
