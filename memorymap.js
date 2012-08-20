var MemoryMap = function(size) {
	this.data = [];
	this.clear(size);
}

MemoryMap.prototype.increment = function(location) {
	this.data[location] += 1;
	this.max = this.data[location] > this.max ? this.data[location] : this.max;
}

MemoryMap.prototype.clear = function(size) {
	if (size === null) {
		size = this.data.length;
	}

	for (var i = 0; i < size; i++) {
		this.data[i] = 0;
	}
	
	this.max = 0;
}

function map_color(val, max) {
	var h = val/max * 360;
	var h_prime = h/60;
	var x = 1 - Math.abs(h_prime % 2 - 1);
	var c = 1.0;

	var r = 0;
	var g = 0;
	var b = 0;

	if (h_prime >= 0 && h_prime < 1) {
		r = c;
		g = x;
		b = 0;
	}

	if (h_prime >= 1 && h_prime < 2) {
		r = x;
		g = c;
		b = 0;
	}

	if (h_prime >= 2 && h_prime < 3) {
		r = 0;
		g = c;
		b = x;
	}

	if (h_prime >= 3 && h_prime < 4) {
		r = 0;
		g = x;
		b = 1;
	}

	if (h_prime >=4 && h_prime < 5) {
		r = x;
		g = 0;
		b = c;
	}

	if (h_prime >= 5 && h_prime < 6) {
		r = c;
		g = 0;
		b = x;
	}

	r = Math.round(r * 255);
	g = Math.round(g * 255);
	b = Math.round(b * 255);

	return [r, g, b];
}

MemoryMap.prototype.draw = function(canvas) {
	var map_width = 256;
	var map_height = Math.floor((this.data.length/256));
	var px = 1;
	
	canvas.width = map_width * px;
	canvas.height = map_height * px;

	var ctx = canvas.getContext("2d");	
	var max = Math.log(this.max);

	for (var y=0; y<map_height; y++) {
		for (var x=0; x<map_width; x++) {
			var indx = y*map_height + x;
			var val = this.data[indx];
			var color = map_color(Math.log(val), max);
			ctx.fillStyle = "rgb(" + color[0] +"," + color[1] + "," + color[2]+")";
			ctx.fillRect(x*px, y*px, px, px);
		}
	}
}
