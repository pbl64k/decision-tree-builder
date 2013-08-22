
var dt =
{
	dt: null,

	selected: null,

	data: null,

	cnv: null,
	ctx: null,

	ctxWidth: 1400,
	ctxHeight: 800,

	hGap: 8,
	vGap: 32,

	font: '8pt sans-serif',
	textMargin: 8,

	defaultColor: 'black',
	selectedColor: '#f00',
	termBgColor: '#ccf',
	binBgColor: '#ccc',

	cellWidth: null,
	cellHeight: null,

	maxCellWidth: 300,
	maxCellHeight: 40,
	
	init: function()
	{
		this.cnv = document.getElementById('dt');

		this.cnv.addEventListener('click', this.click);

		this.data = document.getElementById('data');

		this.ctx = this.cnv.getContext('2d');

		this.ctx.font = this.font;

		this.reset(true);

		var url = new String(window.location);
		loc = url.split('#');

		if (loc.length > 1)
		{
			this.load(loc[1], true);
		}
	},

	reset: function(force)
	{
		if (force || confirm('Are you sure you want to reset the workspace?'))
		{
			this.dt =
			{
				type: 'terminal',
				text: '???',
				selected: false,
			};

			this.render();
		}
	},

	recalcDt: function(dt)
	{
		if (dt.type == 'terminal')
		{
			dt.cellWidth = 1;
			dt.cellHeight = 1;
		}
		else if (dt.type == 'multi')
		{
			dt.cellWidth = 0;
			dt.cellHeight = 1;

			for (var k in dt.children)
			{
				this.recalcDt(dt.children[k])

				dt.cellWidth += dt.children[k].cellWidth;
				dt.cellHeight = (dt.cellHeight > dt.children[k].cellHeight + 1)
						? dt.cellHeight
						: (dt.children[k].cellHeight + 1);
			}
		}
		else
		{
			throw 'Fatal error';
		}
	},

	recalcBox: function(dt, x1, y1, x2, y2)
	{
		var fudge = Math.floor((x2 - x1 - this.cellWidth) / 3);

		dt.x1 = x1 + fudge;
		dt.y1 = y1;
		dt.x2 = x2 - fudge;
		dt.y2 = y1 + this.cellHeight;

		var cnt = 0;

		if (dt.type == 'multi')
		{
			for (var k in dt.children)
			{
				this.recalcBox(dt.children[k], x1 + Math.floor(cnt * ((x2 - x1 + this.hGap) / dt.cellWidth)), y1 + this.cellHeight + this.vGap,
						x1 + ((cnt + dt.children[k].cellWidth) * Math.floor((x2 - x1 + this.hGap) / dt.cellWidth)) - this.hGap, y2);

				cnt += dt.children[k].cellWidth;
			}
		}
	},

	recalc: function()
	{
		this.recalcDt(this.dt);

		this.cellWidth = Math.floor((this.ctxWidth - (this.hGap * (this.dt.cellWidth + 1))) / this.dt.cellWidth);
		this.cellHeight = Math.floor((this.ctxHeight - (this.vGap * (this.dt.cellHeight + 1))) / this.dt.cellHeight);

		if (this.cellWidth > this.maxCellWidth)
		{
			this.cellWidth = this.maxCellWidth;
		}

		if (this.cellHeight > this.maxCellHeight)
		{
			this.cellHeight = this.maxCellHeight;
		}

		this.recalcBox(this.dt, this.hGap, this.vGap, this.ctxWidth - this.hGap, this.ctxHeight - this.vGap);
	},

	clear: function()
	{
		this.ctx.clearRect(0, 0, this.ctxWidth, this.ctxHeight);
	},

	renderBox: function(dt)
	{
		if (dt.type == 'terminal')
		{
			this.ctx.fillStyle = this.termBgColor;
		}
		else if (dt.type == 'multi')
		{
			this.ctx.fillStyle = this.binBgColor;
		}

		if (dt.selected)
		{
			this.ctx.strokeStyle = this.selectedColor;
		}
		else
		{
			this.ctx.strokeStyle = this.defaultColor;
		}

		this.ctx.fillRect(dt.x1, dt.y1, (dt.x2 - dt.x1), (dt.y2 - dt.y1));
		this.ctx.strokeRect(dt.x1, dt.y1, (dt.x2 - dt.x1), (dt.y2 - dt.y1));

		this.ctx.strokeStyle = this.defaultColor;
		this.ctx.fillStyle = this.defaultColor;
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';

		this.ctx.fillText(dt.text, (dt.x1 + dt.x2) / 2, (dt.y1 + dt.y2) / 2, (dt.x2 - dt.x1) - (2 * this.textMargin));

		if (dt.type == 'multi')
		{
			for (var k in dt.children)
			{
				this.ctx.beginPath();
				this.ctx.moveTo((dt.x1 + dt.x2) / 2, dt.y2);
				this.ctx.lineTo((dt.children[k].x1 + dt.children[k].x2) / 2, dt.children[k].y1);
				this.ctx.stroke();

				this.ctx.fillText(k, (dt.children[k].x1 + dt.children[k].x2) / 2, (dt.y2 + dt.children[k].y1) / 2,
						(dt.children[k].x2 - dt.children[k].x1) - (2 * this.textMargin));

				this.renderBox(dt.children[k]);
			}
		}
	},

	render: function()
	{
		this.clear();

		this.recalc();

		this.renderBox(this.dt);

		this.data.value = JSON.stringify(this.dt);
	},

	select: function(dt, x, y)
	{
		dt.selected = false;

		if ((x >= dt.x1) && (x <= dt.x2)
				&& (y >= dt.y1) && (y <= dt.y2))
		{
			dt.selected = true;
			this.selected = dt;
		}
		else if (dt.type == 'multi')
		{
			for (var k in dt.children)
			{
				this.select(dt.children[k], x, y);
			}
		}
	},

	deselect: function()
	{
		this.select(this.dt, -1, -1);
	},

	click: function(evt)
	{
		if (dt.selected != null)
		{
			dt.selected.selected = false;
			dt.selected = null;
		}

		var x = evt.clientX - document.documentElement.scrollLeft - dt.cnv.offsetLeft;
		var y = evt.clientY - document.documentElement.scrollTop - dt.cnv.offsetTop;

		dt.select(dt.dt, x, y);

		dt.render();
	},

	edit: function()
	{
		if (this.selected == null)
		{
			alert('You must select a node to edit.');
		}
		else
		{
			var txt = prompt('Please enter a new text for this node', this.selected.text);

			this.selected.text = txt;

			this.render();
		}
	},

	split: function()
	{
		if (this.selected == null)
		{
			alert('You must select a node to split.');
		}
		else if (this.selected.type != 'terminal')
		{
			alert('Only terminal nodes may be split.');
		}
		else
		{
			this.selected.type = 'multi';
			this.selected.text = '???';
			this.selected.selected = true;
			this.selected.children =
			{
				'yes':
				{
					type: 'terminal',
					text: '???',
				},
				'no':
				{
					type: 'terminal',
					text: '???',
				},
			};

			this.render();
		}
	},

	splitMulti: function()
	{
		if (this.selected == null)
		{
			alert('You must select a node to split.');
		}
		else if (this.selected.type != 'terminal')
		{
			alert('Only terminal nodes may be split.');
		}
		else
		{
			var n = prompt('How many categories would you like?');

			var x = parseInt(n);

			if (Number.isNaN(x) || (x < 2))
			{
				alert('At least two categories are required.');
			}
			else
			{
				var labels = [];

				for (var i = 0; i != x - 1; ++i)
				{
					labels[i] = prompt('Please enter the name of category #' + (i + 1));
				}

				labels[x - 1] = 'otherwise';

				this.selected.type = 'multi';
				this.selected.text = '???';
				this.selected.selected = true;
				this.selected.children = {};

				for (var i = 0; i != x; ++i)
				{
					this.selected.children[labels[i]] =
					{
						type: 'terminal',
						text: '???',
					};
				}

				this.render();
			}
		}
	},

	prune: function()
	{
		if (this.selected == null)
		{
			alert('You must select a node to prune.');
		}
		else
		{
			this.selected.type = 'terminal';
			this.selected.text = '???';
			this.selected.selected = true;
			this.selected.children = null;

			this.render();
		}
	},

	importData: function(force)
	{
		if (force || confirm('Are you sure? Importing raw data will overwrite current workspace.'))
		{
			this.dt = JSON.parse(this.data.value);

			this.deselect();

			this.render();
		}
	},

	load: function(fn, force)
	{
		var url = new String(window.location);
		loc = url.split('#');
		window.location = loc[0] + '#' + encodeURIComponent(fn);

		var http = new XMLHttpRequest();

		http.open('GET', fn, true);

		http.onreadystatechange = function()
		{
			if (http.readyState == 4)
			{
				dt.data.value = http.responseText;

				dt.importData(force);
			}
		};

		http.send();
	},

	runOn: function(dt)
	{
		if (dt.type == 'terminal')
		{
			this.selected = dt;
			dt.selected = true;
		}
		else if (dt.type == 'multi')
		{
			var answer = prompt(dt.text);

			var def;

			for (var k in dt.children)
			{
				if (k == answer)
				{
					return this.runOn(dt.children[k]);
				}

				def = k;
			}

			this.runOn(dt.children[def]);
		}
		else
		{
			throw 'Fatal error.';
		}
	},

	run: function()
	{
		this.deselect();

		this.runOn(this.dt);

		this.render();
	},
};

