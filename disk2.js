var DiskII = function(apple) {
  this.apple = apple;
  this.drive = 0;
  this.isMotorOn = false;
  this.diskData = [];
  this.isWriteProtected = [];
  this.currPhysTrack = 0;
  this.currNibble = 0;

  this.driveCurrPhysTrack = [];
  this.realTrack = [];

  this.latchData = 0;
  this.writeMode = false;
  this.loadMode = false;
  this.driveSpin = false;

  this.gcrSwapBit = [0,2,1,3];
  this.gcrBuffer = [];
  this.gcrBuffer2 = [];

  this.gcrLogicalDos33Sector = [
		0x0, 0x7, 0xE, 0x6, 0xD, 0x5, 0xC, 0x4,
		0xB, 0x3, 0xA, 0x2, 0x9, 0x1, 0x8, 0xF
  ];

  this.gcrLogicalProdosSector = [
		0x0, 0x8, 0x1, 0x9, 0x2, 0xA, 0x3, 0xB,
		0x4, 0xC, 0x5, 0xD, 0x6, 0xE, 0x7, 0xF
  ];

  this.gcrNibbles = [];
  this.gcrNibblesPos = 0;

  // this.readDisk(0, null, "", false, DEFAULT_VOLUME);
  // this.readDisk(1, null, "", false, DEFAULT_VOLUME);
};

DiskII.ROM = [
		0xA2,0x20,0xA0,0x00,0xA2,0x03,0x86,0x3C,0x8A,0x0A,0x24,0x3C,0xF0,0x10,0x05,0x3C,
		0x49,0xFF,0x29,0x7E,0xB0,0x08,0x4A,0xD0,0xFB,0x98,0x9D,0x56,0x03,0xC8,0xE8,0x10,
		0xE5,0x20,0x58,0xFF,0xBA,0xBD,0x00,0x01,0x0A,0x0A,0x0A,0x0A,0x85,0x2B,0xAA,0xBD,
		0x8E,0xC0,0xBD,0x8C,0xC0,0xBD,0x8A,0xC0,0xBD,0x89,0xC0,0xA0,0x50,0xBD,0x80,0xC0,
		0x98,0x29,0x03,0x0A,0x05,0x2B,0xAA,0xBD,0x81,0xC0,0xA9,0x56,0xa9,0x00,0xea,0x88,
		0x10,0xEB,0x85,0x26,0x85,0x3D,0x85,0x41,0xA9,0x08,0x85,0x27,0x18,0x08,0xBD,0x8C,
		0xC0,0x10,0xFB,0x49,0xD5,0xD0,0xF7,0xBD,0x8C,0xC0,0x10,0xFB,0xC9,0xAA,0xD0,0xF3,
		0xEA,0xBD,0x8C,0xC0,0x10,0xFB,0xC9,0x96,0xF0,0x09,0x28,0x90,0xDF,0x49,0xAD,0xF0,
		0x25,0xD0,0xD9,0xA0,0x03,0x85,0x40,0xBD,0x8C,0xC0,0x10,0xFB,0x2A,0x85,0x3C,0xBD,
		0x8C,0xC0,0x10,0xFB,0x25,0x3C,0x88,0xD0,0xEC,0x28,0xC5,0x3D,0xD0,0xBE,0xA5,0x40,
		0xC5,0x41,0xD0,0xB8,0xB0,0xB7,0xA0,0x56,0x84,0x3C,0xBC,0x8C,0xC0,0x10,0xFB,0x59,
		0xD6,0x02,0xA4,0x3C,0x88,0x99,0x00,0x03,0xD0,0xEE,0x84,0x3C,0xBC,0x8C,0xC0,0x10,
		0xFB,0x59,0xD6,0x02,0xA4,0x3C,0x91,0x26,0xC8,0xD0,0xEF,0xBC,0x8C,0xC0,0x10,0xFB,
		0x59,0xD6,0x02,0xD0,0x87,0xA0,0x00,0xA2,0x56,0xCA,0x30,0xFB,0xB1,0x26,0x5E,0x00,
		0x03,0x2A,0x5E,0x00,0x03,0x2A,0x91,0x26,0xC8,0xD0,0xEE,0xE6,0x27,0xE6,0x3D,0xA5,
		0x3D,0xCD,0x00,0x08,0xA6,0x2B,0x90,0xDB,0x4C,0x01,0x08,0x00,0x00,0x00,0x00,0x00
 ];

DiskII.GCR_ENCODING_TABLE = [
		0x96, 0x97, 0x9A, 0x9B, 0x9D, 0x9E, 0x9F, 0xA6,
		0xA7, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB2, 0xB3,
		0xB4, 0xB5, 0xB6, 0xB7, 0xB9, 0xBA, 0xBB, 0xBC,
		0xBD, 0xBE, 0xBF, 0xCB, 0xCD, 0xCE, 0xCF, 0xD3,
		0xD6, 0xD7, 0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE,
		0xDF, 0xE5, 0xE6, 0xE7, 0xE9, 0xEA, 0xEB, 0xEC,
		0xED, 0xEE, 0xEF, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6,
		0xF8, 0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF
];

DiskII.DEFAULT_VOLUME = 254;
DiskII.NUM_DRIVES = 2;
DiskII.DOS_NUM_SECTORS = 16;
DiskII.DOS_NUM_TRACKS = 35;
DiskII.DOS_TRACK_BYTES = 256 * DiskII.DOS_NUM_SECTORS;
DiskII.RAW_TRACK_BYTES = 0x1A00;
DiskII.STANDARD_2IMG_HEADER_SIZE = 64;
DiskII.STANDARD_PRODOS_BLOCKS = 280;


DiskII.prototype.ioRead = function(address) {
  switch (address & 0xf) {
		case 0x0:
		case 0x1:
		case 0x2:
		case 0x3:
		case 0x4:
		case 0x5:
		case 0x6:
		case 0x7:
			this.setPhase(address);
			break;
		case 0x8:
			this.isMotorOn = false;
			break;
		case 0x9:
			this.isMotorOn = true;
			break;
		case 0xa:
			this.setDrive(0);
			break;
		case 0xb:
			this.setDrive(1);
			break;
		case 0xc:
			this.ioLatchC();
			break;
		case 0xd:
			this.loadMode = true;
			if (this.isMotorOn && !this.writeMode) {
        this.latchData &= 0x7F;
        // TODO: check phase - write protect is forced if phase 1 is on [F9.7]
        if (this.isWriteProtected[this.drive]) {
          this.latchData |= 0x80;
        }
      }
			break;
    case 0xe:
      this.writeMode = false;
      break;
    case 0xf:
      this.writeMode = true;
      break;
  }

  if ((address & 1) == 0) {
    // only even addresses return the latch
    if (this.isMotorOn) {
      return this.latchData;
    }

    // simple hack to fool DOS SAMESLOT drive spin check (usually at $BD34)
    this.driveSpin = !this.driveSpin;
    return this.driveSpin ? 0x7E : 0x7F;
  }

  return rand.nextInt(256); // TODO: floating bus
}

DiskII.prototype.ioWrite = function(address, value) {
  switch (address & 0xf) {
    case 0x0:
    case 0x1:
    case 0x2:
    case 0x3:
    case 0x4:
    case 0x5:
    case 0x6:
    case 0x7:
      this.setPhase(address);
      break;
    case 0x8:
      this.isMotorOn = false;
      break;
    case 0x9:
      this.isMotorOn = true;
      break;
    case 0xa:
      this.setDrive(0);
      break;
    case 0xb:
      this.setDrive(1);
      break;
    case 0xc:
      this.ioLatchC();
      break;
    case 0xd:
      this.loadMode = true;
      break;
    case 0xe:
      this.writeMode = false;
      break;
    case 0xf:
      this.writeMode = true;
      break;
  }

  if (this.isMotorOn && this.writeMode && this.loadMode) {
    // any address writes latch for sequencer LD; OE1/2 irrelevant ['323 datasheet]
    this.latchData = value;
  }
};

DiskII.prototype.update_soft_switch = function(address, value) {
  switch (address & 0xf) {
		case 0x0:
		case 0x1:
		case 0x2:
		case 0x3:
		case 0x4:
		case 0x5:
		case 0x6:
		case 0x7:
			this.setPhase(address);
			break;
		case 0x8:
			this.isMotorOn = false;
			break;
		case 0x9:
			this.isMotorOn = true;
			break;
		case 0xa:
			this.setDrive(0);
			break;
		case 0xb:
			this.setDrive(1);
			break;
		case 0xc:
			this.ioLatchC();
			break;
    case 0xd:
      this.loadMode = true;
			if (value === undefined && this.isMotorOn && !this.writeMode) {
        this.latchData &= 0x7F;
        // TODO: check phase - write protect is forced if phase 1 is on [F9.7]
        if (this.isWriteProtected[this.drive]) {
          this.latchData |= 0x80;
        }
      }
      break;
    case 0xe:
      this.writeMode = false;
      break;
    case 0xf:
      this.writeMode = true;
      break;
  }

  if (value !== undefined && this.isMotorOn && this.writeMode && this.loadMode) {
    // any address writes latch for sequencer LD; OE1/2 irrelevant ['323 datasheet]
    this.latchData = value;
  }
  if (value === undefined && (address & 1) == 0) {
    // only even addresses return the latch
    if (this.isMotorOn) {
      return this.latchData;
    }

    // simple hack to fool DOS SAMESLOT drive spin check (usually at $BD34)
    this.driveSpin = !this.driveSpin;
    return this.driveSpin ? 0x7E : 0x7F;
  }
  return 0; // TODO: floating bus
}

DiskII.prototype.memoryRead = function(address) {
  return DiskII.ROM[address & 0xff];
};

DiskII.prototype.reset = function() {
	this.ioRead(0x8);
};


// DiskII.prototype.readDisk = function(drive, is, name, isWriteProtected, volumeNumber) {
//   for (var trackNum = 0; trackNum < DiskII.DOS_NUM_TRACKS; trackNum++) {
//     this.diskData[this.drive][trackNum] = zeroArray(DiskII.RAW_TRACK_BYTES);
//
//     if (is != null) {
//       if (nib)
//       {
//         is.readFully(diskData[drive][trackNum], 0, RAW_TRACK_BYTES);
//       }
//       else
//       {
//         is.readFully(track, 0, DOS_TRACK_BYTES);
//         trackToNibbles(track, diskData[drive][trackNum], volumeNumber, trackNum, !proDos);
//       }
//     }
//   }
//
//   this.realTrack = diskData[drive][currPhysTrack >> 1];
//   this.isWriteProtected[drive] = isWriteProtected;
//
//   return true;
// }

DiskII.prototype.readDiskString = function(dataStr) {
  var dataStrs = dataStr.replace(/\s+/g, "").match(/.{8192}/g);
  this.diskData = dataStrs.reduce(function(acc, trackString, i) {
    var nibbleTrack, track = (trackString.match(/../g).map(function(n) {
      return parseInt(n, 16);
    }));
    acc.push((nibbleTrack = []));
    this.trackToNibbles(track, nibbleTrack, i);
    return acc;
  }.bind(this), []);
};

DiskII.prototype.trackToNibbles = function(track, nibbles, volumeNum, trackNum) {
  this.gcrNibbles = nibbles;
  this.gcrNibblesPos = 0;

  for (var sectorNum = 0; sectorNum < DiskII.DOS_NUM_SECTORS; sectorNum++) {
    this.encode62(track, this.gcrLogicalDos33Sector[sectorNum] << 8);
    this.writeSync(12);
    this.writeAddressField(volumeNum, trackNum, sectorNum);
    this.writeSync(8);
    this.writeDataField();
  }
  this.writeNibbles(0x7F, DiskII.RAW_TRACK_BYTES - this.gcrNibblesPos); // invalid nibbles to skip on read
}

DiskII.prototype.encode62 = function(track, offset) {
  // 86 * 3 = 258, so the first two byte are encoded twice
  this.gcrBuffer2[0] = this.gcrSwapBit[track[offset + 1] & 0x03];
  this.gcrBuffer2[1] = this.gcrSwapBit[track[offset] & 0x03];

  // Save higher 6 bits in gcrBuffer and lower 2 bits in gcrBuffer2
  for (var i = 255, j = 2; i >= 0; i--, j = j == 85 ? 0: j + 1) {
     this.gcrBuffer2[j] = ((this.gcrBuffer2[j] << 2) | this.gcrSwapBit[track[offset + i] & 0x03]);
     this.gcrBuffer[i] = (track[offset + i] & 0xff)  >> 2;
  }

  // Clear off higher 2 bits of GCR_buffer2 set in the last call
  for (var i = 0; i < 86; i++)
     this.gcrBuffer2[i] &= 0x3f;
};

DiskII.prototype.encode44 = function(value) {
  this.gcrWriteNibble((value >> 1) | 0xaa);
  this.gcrWriteNibble(value | 0xaa);
}

DiskII.prototype.writeSync = function(length) {
  this.writeNibbles(0xff, length);
}

DiskII.prototype.writeNibbles = function(nibble, length) {
  while(length > 0) {
    length--;
    this.gcrWriteNibble(nibble);
  }
}

DiskII.prototype.gcrWriteNibble = function(value) {
  this.gcrNibbles[this.gcrNibblesPos] = value;
  this.gcrNibblesPos++;
}

DiskII.prototype.writeAddressField = function(volumeNum, trackNum, sectorNum) {
  // Write address mark
  this.gcrWriteNibble(0xd5);
  this.gcrWriteNibble(0xaa);
  this.gcrWriteNibble(0x96);

  // Write volume, trackNum, sector & checksum
  this.encode44(volumeNum);
  this.encode44(trackNum);
  this.encode44(sectorNum);
  this.encode44(volumeNum ^ trackNum ^ sectorNum);

  // Write epilogue
  this.gcrWriteNibble(0xde);
  this.gcrWriteNibble(0xaa);
  this.gcrWriteNibble(0xeb);
}

DiskII.prototype.writeDataField = function() {
  var last = 0;
  var checksum;

  // Write prologue
  this.gcrWriteNibble(0xd5);
  this.gcrWriteNibble(0xaa);
  this.gcrWriteNibble(0xad);

  // Write GCR encoded data
  for(var i = 0x55; i >= 0; i--) {
    checksum = last ^ this.gcrBuffer2[i];
    this.gcrWriteNibble(DiskII.GCR_ENCODING_TABLE[checksum]);
    last = this.gcrBuffer2[i];
  }
  for(var i = 0; i < 256; i++) {
    checksum = last ^ this.gcrBuffer[i];
    this.gcrWriteNibble(DiskII.GCR_ENCODING_TABLE[checksum]);
    last = this.gcrBuffer[i];
  }

  // Write checksum
  this.gcrWriteNibble(DiskII.GCR_ENCODING_TABLE[last]);

  // Write epilogue
  this.gcrWriteNibble(0xde);
  this.gcrWriteNibble(0xaa);
  this.gcrWriteNibble(0xeb);
}

DiskII.prototype.setPhase = function(address) {
  var phase;

  switch (address & 0xf) {
    case 0x0:
    case 0x2:
    case 0x4:
    case 0x6:
      // Q0, Q1, Q2, Q3 off
      break;
    case 0x1:
      // Q0 on
      phase = this.currPhysTrack & 3;
      if (phase === 1) {
        if (this.currPhysTrack > 0)
          this.currPhysTrack--;
      } else if (phase === 3) {
        if (this.currPhysTrack < ((2 * DiskII.DOS_NUM_TRACKS) - 1))
          this.currPhysTrack++;
      }
      //System.out.println("half track=" + currPhysTrack);
      this.realTrack = this.diskData[this.drive][this.currPhysTrack >> 1];
      break;
    case 0x3:
      // Q1 on
      phase = this.currPhysTrack & 3;
      if (phase === 2) {
        if (this.currPhysTrack > 0)
          this.currPhysTrack--;
      } else if (phase == 0) {
        if (this.currPhysTrack < ((2 * DiskII.DOS_NUM_TRACKS) - 1))
          this.currPhysTrack++;
      }
      //System.out.println("half track=" + currPhysTrack);
      this.realTrack = this.diskData[this.drive][this.currPhysTrack >> 1];
      break;
    case 0x5:
      // Q2 on
      phase = this.currPhysTrack & 3;
      if (phase === 3) {
        if (this.currPhysTrack > 0)
          this.currPhysTrack--;
      } else if (phase === 1) {
        if (this.currPhysTrack < ((2 * DiskII.DOS_NUM_TRACKS) - 1))
          this.currPhysTrack++;
      }
      //System.out.println("half track=" + currPhysTrack);
      this.realTrack = this.diskData[this.drive][this.currPhysTrack >> 1];
      break;
    case 0x7:
      // Q3 on
      phase = this.currPhysTrack & 3;
      if (phase === 0) {
        if (this.currPhysTrack > 0)
          this.currPhysTrack--;
      } else if (phase === 2) {
        if (this.currPhysTrack < ((2 * DiskII.DOS_NUM_TRACKS) - 1))
          this.currPhysTrack++;
      }
      //System.out.println("half track=" + currPhysTrack);
      this.realTrack = this.diskData[this.drive][this.currPhysTrack >> 1];
      break;
  }
};



/*
	try {
			var track = [],
			    proDos = false,
			    nib = false;

			String lowerName = name.toLowerCase();
			if (lowerName.indexOf(".2mg") != -1 || lowerName.indexOf(".2img") != -1)
			{
				// 2IMG, so check if we can handle it
				byte[] header = new byte[STANDARD_2IMG_HEADER_SIZE];
				is.readFully(header, 0, STANDARD_2IMG_HEADER_SIZE);

				int headerSize = (header[0x09] << 8) | (header[0x08]);
				if (headerSize != STANDARD_2IMG_HEADER_SIZE)
					return false;

				int format = (header[0x0F] << 24) | (header[0x0E] << 16) | (header[0x0D] << 8) | (header[0x0C]);
				if (format == 1)
				{
					proDos = true;
					int blocks = (header[0x17] << 24) | (header[0x16] << 16) | (header[0x15] << 8) | (header[0x14]);
					if (blocks != STANDARD_PRODOS_BLOCKS)
						return false; // only handle standard 5.25 inch images
				}
				else if (format == 2)
				{
					nib = true;
				}
				else if (format != 0)
				{
					return false; // if not ProDOS, NIB or DSK
				}

				// use write protected and volume number if present
				int flags = (header[0x13] << 24) | (header[0x12] << 16) | (header[0x11] << 8) | (header[0x10]);
				if ((flags & (1 << 31)) != 0)
				{
					isWriteProtected = true; // only override if set
				}
				if ((flags & (1 << 8)) != 0)
				{
					volumeNumber = (flags & 0xFF);
				}
			}
			else
			{
				// check for PO and NIB in the name
				proDos = lowerName.indexOf(".po") != -1;
				nib = lowerName.indexOf(".nib") != -1;
			}

			for (int trackNum = 0; trackNum < DOS_NUM_TRACKS; trackNum++) {
				diskData[drive][trackNum] = new byte[RAW_TRACK_BYTES];

				if (is != null) {
					if (nib)
					{
						is.readFully(diskData[drive][trackNum], 0, RAW_TRACK_BYTES);
					}
					else
					{
						is.readFully(track, 0, DOS_TRACK_BYTES);
						trackToNibbles(track, diskData[drive][trackNum], volumeNumber, trackNum, !proDos);
					}
				}
			}

			this.realTrack = diskData[drive][currPhysTrack >> 1];
			this.isWriteProtected[drive] = isWriteProtected;

			return true;
		} catch (IOException e) {
		}

		return false;
	}
*/

function zeroArray(length) {
  var zeros = [];
  for (var i = 0; i < length; i++) {
    zeros.push(0);
  }
  return zeros;
}
// vim: expandtab:ts=2:sw=2
