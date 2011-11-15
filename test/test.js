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
    neg_flag = clone(unset_flags);

zero_flag["Z"] = 1;
neg_flag["N"] = 1;

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

// vim: expandtab:ts=2:sw=2
