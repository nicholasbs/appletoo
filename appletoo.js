var AppleToo = function(options) {
  if (options === undefined){
    options = default_options;
  } else {
    options = extend(default_options, options);
  }
  // Memory is stored as numbers
  // See: http://jsperf.com/tostring-16-vs-parseint-x-16
  this.memory = [];
  this.slots = new Array(8);

  this.pixel_w = 3;
  this.pixel_h = 3;
  this.char_w = this.pixel_w * 7;
  this.char_h = this.pixel_h * 8;

  this.screen = document.getElementById(options.screen);
  if (this.screen) {
    this.ctx = this.screen.getContext("2d");
  }
  this.display = !!this.screen;
  this.display_page = 0;

  this.cycles = 0;

  //Used for visualization
  this.memory_map_writes = [];

  this.initialize_memory();
  
  this.cpu = new CPU6502(this.memory);
  this.cpu.set_memory_callbacks(this, [this.update_soft_switch, this.update_memory_map]);
  this.cpu.COMPATIBILITY_MODE = options.compatibility;
};

AppleToo.COLORS = {
  green: "#00FF00"
};

AppleToo.prototype.load_memory = function(addr, data) {
  data = data.replace(/\s+/g, "");

  for (var i = 0; i < data.length; i += 2) {
    this.memory[addr + i/2] = parseInt(data.substr(i, 2), 16);
  }
};

AppleToo.prototype.update_memory_map = function(addr, val) {
  if (typeof val === "undefined")
    return;

  this.memory_map_writes[addr] += 1;
};

var default_options = {
  compatiblity: false,
  screen: "screen",
  rom: null
};

// TODO: Make this less horrible?
AppleToo.prototype.draw = function() {
  if (!this.display) { return; }
  this.screen.width = this.screen.width; //Clear Screen (This will be very slow in FF)
  if (this.display_res === "low") {
    for (var row = 0; row < 24; row++) {
      for (var col = 0; col < 40; col++) {
        if (this.display_mode === "graphics") {
          var val = this.cpu._read_memory(ROW_ADDR[this.display_page][row] + col),
              top = (val & 0xF0) >> 4,
              bottom = val & 0x0F;

          this.draw_pixel(row, col, top, bottom);
        } else if (this.display_mode === "text") {
          var val = this.cpu._read_memory(ROW_ADDR[this.display_page][row] + col);

          this.draw_lowtext(row, col, val);
        }
      }
    }
  } else {
    for (var row = 0; row < 192; row++) { //192 = 24 Char Rows * 8 Pixel Rows
      var row_data = this.ctx.createImageData(this.pixel_w * 280, 1), // 7 pixels * 40 cols
          pixels = row_data.data,
          row_offset = HIGH_RES_ROW_ADDR[this.display_page][row];
      for (var byte = 0; byte < 40; byte++) {
        var val = this.cpu._read_memory(row_offset + byte);
        this.byte_to_rgba(val, pixels, byte * 7 * 4 * this.pixel_w); //7 pixels times 4 elements RGBA
      }
      for (var css_pixel_row = 0; css_pixel_row < this.pixel_h; css_pixel_row++) {
        a.ctx.putImageData(row_data, 0, row * this.pixel_h + css_pixel_row);
      }
    }
  }
};

/* See page 35 of the Apple IIe Technical Reference Manual
 * We use these offests to generate the 192 pixel rows for display page one and the
 * 192 pixel rows for display page two. */
var HIGH_RES_CHAR_ROW_OFFSETS = [
  0x2000, // row 0
  0x2080,
  0x2100,
  0x2180,
  0x2200,
  0x2280,
  0x2300,
  0x2380,
  0x2028,
  0x20A8,
  0x2128,
  0x21A8,
  0x2228,
  0x22A8,
  0x2328,
  0x23A8,
  0x2050,
  0x20D0,
  0x2150,
  0x21D0,
  0x2250,
  0x22D0,
  0x2350,
  0x23D0 // row 23
];

var HIGH_RES_ROW_ADDR = [[],[]];
(function () {
  var page_offset = 0x2000;
  for (var page = 0; page < 2; page++){
    for (var pixel_row = 0; pixel_row < 192; pixel_row++) {
      var addr = page_offset * page; // Beginning of display page
      addr += HIGH_RES_CHAR_ROW_OFFSETS[Math.floor(pixel_row / 8)]; // Offset for char row
      addr += pixel_row % 8 * 0x400; // Offset for pixel row

      HIGH_RES_ROW_ADDR[page].push(addr);
    }
  };
})();

AppleToo.prototype.byte_to_rgba = function(byte, pixels, index) {
  for (var i = 0; i < 7; i++) {
    var on = (byte >> i) & 1,
        offset = index + (i * 4 * this.pixel_w);
    for (var k = 0; k < this.pixel_w * 4; k+=4 ) {
      pixels[offset + k] = 0;               //Red
      pixels[offset + 1 + k] = (on * 0xFF); //Green
      pixels[offset + 2 + k] = 0;           //Blue
      pixels[offset + 3 + k] = 0xFF;        //Alpha
    }
  }
};

AppleToo.prototype.draw_pixel = function(row, col, top, bottom) {
  var x = col * this.char_w,
      y = row * this.char_h;

  this.ctx.fillStyle = top == 0 ? "black" : AppleToo.COLORS.green;
  this.ctx.fillRect(x, y, this.char_w, this.char_h/2);

  this.ctx.fillStyle = bottom == 0 ? "black" : AppleToo.COLORS.green;
  this.ctx.fillRect(x, y + this.char_h/2, this.char_w, this.char_h/2);
};

AppleToo.prototype.draw_lowtext = function(row, col, char) {
  var x = col * this.char_w,
      y = row * this.char_h + this.char_h,
      font = (this.char_h * (7/8)) + " px Monaco";

  if (char == 255) console.log("Delete");
  if (typeof char === "number") {
    char = String.fromCharCode(char & 0x7F);
  }
  if (this.ctx.font != font) {
    this.ctx.font = font;
  }
  this.ctx.fillStyle = char == "" ? "black" : AppleToo.COLORS.green;
  this.ctx.fillText(char, x, y);
};

AppleToo.prototype.update_soft_switch = function(addr, val) {
  if ((addr & 0xFF00) == 0xC000 && (addr & 0xFF) >= 0x90) {
    var device = this.slots[(addr & 0x70) >> 4];
    return device ? device.update_soft_switch(addr, val) : 0;
  }
  switch (addr) {
    case 0xC010: //Clear Keyboard Strobe
      this.cpu._write_memory(0xC000, 0x00);
      break;
    case 0xC050: //Graphics
      this.display_mode = "graphics";
      this.cpu._write_memory(0xC01A, 0x00);
      break;
    case 0xC051: //Text
      this.display_mode = "text";
      this.cpu._write_memory(0xC01A, 0xFF);
      break;
    case 0xC052: //Full Graphics
      this.display_split = "full";
      break;
    case 0xC053: //Split Screen
      this.display_split = "split";
      break;
    case 0xC054: //Page one
      this.display_page = 0;
      this.cpu._write_memory(0xC01C, 0x00);
      break;
    case 0xC055: //Page two
      this.display_page = 1;
      this.cpu._write_memory(0xC01C, 0xFF);
      break;
    case 0xC056: //Low Res
      this.display_res = "low";
      this.cpu._write_memory(0xC01D, 0x00);
      break;
    case 0xC057: //High Res
      this.display_res = "high";
      this.cpu._write_memory(0xC01D, 0xFF);
      break;
    default:
      return undefined;
  }
  return 0;
};

AppleToo.prototype.write_char_code = function(char_code) {
  this.cpu._write_memory(0xC000, char_code);
}

AppleToo.prototype.run_step = function() {
  this.cpu.run_step(this.draw, this)
}

AppleToo.prototype.run_loop = function() {
  this.cpu.run_loop(this.draw, this)
};

AppleToo.prototype.stop = function() {
  this.cpu.stop();
};

AppleToo.prototype.stack = function() {
  return this.cpu.stack();
}

AppleToo.prototype.initialize_memory = function() {
  for (var i=0; i<65536; i++) {
    this.memory[i] = 0;
    this.memory_map_writes[i] = 0;
  }
};

AppleToo.MEM_ROM_EXTERNAL = 0x24000;

AppleToo.prototype.setPeripheral = function(peripheral, slot) {
  this.slots[slot] = peripheral;

  var offset = AppleToo.MEM_ROM_EXTERNAL + (slot << 8);
  for (var i = 0; i < 0x100; i++)
    this.memory[offset + i] = peripheral.memoryRead(i);
};

var ROW_ADDR = [ //See Figure 2-5 of Apple IIe Technical Reference
  [ //Page One
    0x400,
    0x480,
    0x500,
    0x580,
    0x600,
    0x680,
    0x700,
    0x780,
    0x428,
    0x4A8,
    0x528,
    0x5A8,
    0x628,
    0x6A8,
    0x728,
    0x7A8,
    0x450,
    0x4D0,
    0x550,
    0x5D0,
    0x650,
    0x6D0,
    0x750,
    0x7D0
  ],
  [ //Page Two
    0x800,
    0x880,
    0x900,
    0x980,
    0xA00,
    0xA80,
    0xB00,
    0xB80,
    0x828,
    0x8A8,
    0x928,
    0x9A8,
    0xA28,
    0xAA8,
    0xB28,
    0xBA8,
    0x850,
    0x8D0,
    0x950,
    0x9D0,
    0xA50,
    0xAD0,
    0xB50,
    0xBD0
  ]
];

function extend(base, add) {
  var obj = JSON.parse(JSON.stringify(base)); //Clone base
  for (var i in add) {
    if (add.hasOwnProperty(i)) {
      obj[i] = add[i];
    }
  }
  return obj;
}
