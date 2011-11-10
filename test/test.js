var appleToo,
	setupTeardown = {
	  setup: function() {
		appleToo = new AppleToo();
		console.log("setup run");
	  },
	  teardown: function() {
		appleToo = undefined;
		console.log("teardown run");
	  }
	};
module("Load and Store", setupTeardown);
test("LDY_I", function() {
	expect(2);

	appleToo.run6502("A0 0F");
	equal(appleToo.YR, "0F", "Argument should be loaded into Register Y");
	equal(appleToo.cycles, 2, "Should take 2 cycles");
});

test("LDY_ZP", function() {
	expect(2);

	appleToo.write_memory("0F", "AA");

	appleToo.run6502("A4 0F");
	equal(appleToo.YR, "AA", "Value from Zero Page Memory should be loaded into Register Y");
	equal(appleToo.cycles, 3, "Should take 3 cycles");
});

test("LDY_ZPX", function() {
	expect(2);
	console.log(appleToo.memory);

	appleToo.XR = "01";
	appleToo.write_memory("03", "0F");

	appleToo.run6502("B4 02");
	equal(appleToo.YR, "0F", "Value at Memory location (Zero Page Arg + value in Register X) should be loaded into Register Y");
	equal(appleToo.cycles, 4, "Should take 4 cycles");
});
