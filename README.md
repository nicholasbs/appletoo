# AppleToo

**AppleToo** is an Apple II emulator written in JavaScript. It currently
supports all 151 opcodes for the original 6502 CPU, high-resolution graphics
mode, full-screen text mode, keyboard input, and a disassembler.

It's not complete and still has bugs, but you can boot and play games,
including _Spy's Demise_.

![](https://dl.dropbox.com/u/50246/hosted/spysdemise.png)

## Usage

You'll need ROM files to use AppleToo (you can find ROMs pretty easily with
a little Googling). 

### Your own machine code

Here's a minimal program, that just paints some dots in [hi-res
graphics](https://www.xtof.info/blog/?p=768).
Paste `a9558d3c22` into the Data field, `c000` into program counter, and
then Run.

### Disassembler

You’ll need [CodeMirror](https://codemirror.net/) to use the disassembler.

```
git clone https://github.com/codemirror/CodeMirror.git
cd CodeMirror
npm build
```


## TODO

 - Finish disk controller
 - Audio
 - Implement other graphics and text modes (low-res, mixed, etc)
 - 65C02 opcodes

## Contributors

  - Nicholas Bergson-Shilcock
  - Steve Ciraolo
  - Amy Dyer
  - Sam Epstein
  - Sarah Gonzalez
  - Nathan Hoffman
  - Nathan Michalov
  - Sidney San Martín

## License
Copyright (C) 2012 Hacker School

Distributed under the terms of the [GNU General Public License version
3](http://www.gnu.org/copyleft/gpl.html).
