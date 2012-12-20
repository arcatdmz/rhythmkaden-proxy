//Copyright (c) 2011 http://jsdo.it/motomizuki/gYma
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

//Modified by Jun Kato

// ----------------------------------------------------------------
// Stack class
function Stack() {
	this.empty();
}

Stack.prototype.empty = function() {
	this.__a = new Array();
}

Stack.prototype.push = function(o) {
	this.__a.push(o);
}

Stack.prototype.pop = function() {
	if( this.__a.length > 0 ) {
		return this.__a.pop();
	}
	return null;
}

Stack.prototype.size = function() {
	return this.__a.length;
}

Stack.prototype.toString = function() {
	return '[' + this.__a.join(',') + ']';
}

// ----------------------------------------------------------------
// Retrieve information from the server
var kadecotServer = "http://192.168.1.4:31413/op.json";
var deviceList = [
{"id":"192.168.1.4","name":"192.168.1.4","devices":[
	{"className":"Controller","classGroupCode":5,"classCode":255,"instanceCode":1,"isRemote":false}
]}
,{"id":"192.168.1.9","name":"192.168.1.9","devices":[
	{"className":"TemperatureSensor","classGroupCode":0,"classCode":17,"instanceCode":1,"isRemote":true}
	,{"className":"HomeAirConditioner","classGroupCode":1,"classCode":48,"instanceCode":1,"isRemote":true}
	,{"className":"ElectricallyOperatedShade","classGroupCode":2,"classCode":96,"instanceCode":1,"isRemote":true}
	,{"className":"GeneralLighting","classGroupCode":2,"classCode":144,"instanceCode":1,"isRemote":true}
	,{"className":"GeneralLighting","classGroupCode":2,"classCode":144,"instanceCode":2,"isRemote":true}
	,{"className":"IlluminanceSensor","classGroupCode":0,"classCode":13,"instanceCode":1,"isRemote":true}
]}
,{"id":"192.168.1.6","name":"192.168.1.6","devices":[
	{"className":"Controller","classGroupCode":5,"classCode":255,"instanceCode":1,"isRemote":true}
]}
,{"id":"192.168.1.11","name":"192.168.1.11","devices":[
	{"className":"Controller","classGroupCode":5,"classCode":255,"instanceCode":1,"isRemote":true}
]}
];

/*
[
{"id":"192.168.126.102","name":"192.168.126.102","devices":[
	{"className":"Controller","classGroupCode":5,"classCode":255,"instanceCode":1,"isRemote":false}
]}
,{"id":"192.168.126.103","name":"192.168.126.103","devices":[
	{"className":"TemperatureSensor","classGroupCode":0,"classCode":17,"instanceCode":1,"isRemote":true}
	,{"className":"HomeAirConditioner","classGroupCode":1,"classCode":48,"instanceCode":1,"isRemote":true}
	,{"className":"ElectricallyOperatedShade","classGroupCode":2,"classCode":96,"instanceCode":1,"isRemote":true}
	,{"className":"GeneralLighting","classGroupCode":2,"classCode":144,"instanceCode":1,"isRemote":true}
	,{"className":"GeneralLighting","classGroupCode":2,"classCode":144,"instanceCode":2,"isRemote":true}
	,{"className":"IlluminanceSensor","classGroupCode":0,"classCode":13,"instanceCode":1,"isRemote":true}
]}
,{"id":"192.168.126.10","name":"BTR-4010AZ","devices":[
	{"className":"Controller","classGroupCode":5,"classCode":255,"instanceCode":1,"isRemote":true}
]}
];
*/

// ----------------------------------------------------------------
// Define commands
var shadeOpen, shadeClose, ceilingLighOn, ceilingLightOff, floorLightOn, floorLightOff, airconOn, airconOff, airconWarm;
$.each(deviceList, function(index, device){
	$.each(device.devices, function(i, d){
		if (d.className === "ElectricallyOperatedShade") {
			shadeOpen = {"nodeid": device.id, "devidx": i, "epc": "0xE0", "arg": "0x41"};
			shadeClose = {"nodeid": device.id, "devidx": i, "epc": "0xE0", "arg": "0x42"};
		} else if (d.className === "GeneralLighting") {
			if (d.instanceCode == 1) {
				ceilingLightOn = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x30"};
				ceilingLightOff = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x31"};
			} else {
				floorLightOn = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x30"};
				floorLightOff = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x31"};
			}
		} else if (d.className === "HomeAirConditioner") {
			airconOn = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x30"};
			airconOff = {"nodeid": device.id, "devidx": i, "epc": "0x80", "arg": "0x31"};
			airconWarm = {"nodeid": device.id, "devidx": i, "epc": "0xB0", "arg": "0x43"};
		}
	});
});

// ----------------------------------------------------------------
// Call command w/ Kadecot Server
var kadecotStack = new Stack();

function kadecotRawCall() {
	var url = kadecotStack.pop();
	console.log("call", url, otoge_current_time);
	$.get(url, function(data){}, function(jqXHR) {
		if (kadecotStack.size() > 0) {
			setTimeout(kadecotRawCall, 600);
		}
	});
}

function kadecotCall(cmd) {
	var parameters = "";
	for (var key in cmd) {
		parameters += "&" + key + "=" + cmd[key];
	}
	var url = kadecotServer + "?f=call" + parameters;
	if (kadecotStack.size() == 0) {
		kadecotStack.push(url);
		kadecotRawCall();
	} else {
		kadecotStack.push(url);
	}
}

// ----------------------------------------------------------------
// ぴたごらすいっち
var otoge_current_time;
var ceilingInit = false, floorInit = false;
function onTimeUpdated() {
	// ぴたごら以外のときは戻る
	if (get_otoge_id() != 669) return;

	// 決められた時間で電気をつける
	if (otoge_current_time > 6.9 && !ceilingInit) {
		ceilingInit = true;
		kadecotCall(ceilingLightOn);
	}
	if (otoge_current_time > 20 && !floorInit) {
		floorInit = true;
		kadecotCall(floorLightOn);
	}
}

// ----------------------------------------------------------------
// コネクト
var combo = 0;
function onComboUpdated() {
	// コネクト以外のときは戻る？
	// if (get_otoge_id() == 669) return;
	
	if (combo == 200) {
		kadecotCall(airconOn);
		return;
	}
	if (combo == 210) {
		kadecotCall(airconWarm);
		return;
	}

	// コンボで電気を点滅etc.
	if (combo % 10 == 0) {
		kadecotCall(floorLightOn);
	}
	if (combo % 10 == 5) {
		kadecotCall(floorLightOff);
//		kadecotCall(floorLightOn);
	}
//	if (combo % 40 == 0) {
//		kadecotCall(ceilingLightOn);
//		kadecotCall(ceilingLightOff);
//		kadecotCall(ceilingLightOn);
//	}
}

function onStart() {
	// 開始!! 幕が上がる。
	kadecotCall(shadeOpen);
}

function onFinish() {
	kadecotStack.empty();

	// 終了!! 幕が下りる。
	kadecotCall(shadeClose);

	// 暖房を止める
	kadecotCall(airconOff);
	kadecotCall(floorLightOff);
}

//kadecotCall(ceilingLightOff);
//kadecotCall(floorLightOff);
//kadecotCall(shadeOpen);
kadecotCall(shadeClose);




var PLAY_FIELD_WIDTH = 280;
var PLAY_FIELD_HEIGHT = 500;
var d = new JKL.Dumper();
var audio = new Audio("");
var json_count = 0;
var date;
var first_time;
var effect = true;
var music_file;
var view_mode = 0;
var otoge_speed_text;
if (get_lang() == 'ja') {
	otoge_speed_text = {'1':'普通','2':'速い', '3':'かなり速い','4':'物凄く速い'};
} else {
	otoge_speed_text = {'1':'Normal','2':'Quick', '3':'Very quick','4':'物凄く速い'};
}
//var score = 0;
var ytplayer;
//var font_1 = "'ヒラギノ角ゴ Pro W3' 'Meiryo UI' 'メイリオ' 'ＭＳ Ｐゴシック'";
var font_1 = "'ヒラギノ角ゴ Pro W3','メイリオ','Meiryo','Meiryo UI','Verdana','ＭＳ Ｐゴシック'";
var font_2 = "'Mistral','Comic Sans MS','Arial Rounded MT Bold','Arial','ＭＳ Ｐゴシック'";
var font_3 = "'ＭＳ ゴシック','Georgia','Osaka－等幅','Verdana'";
var font_4 = "'Arial Rounded MT Bold','Comic Sans MS','Arial'";
function onYouTubePlayerReady(playerId) {
	ytplayer = document.getElementById("myytplayer");
	$('#play').click(function(){
		ytplayer.playVideo();
	});
	$('#current_time').click(function(){
		alert(ytplayer.getCurrentTime());
	});
	$('#stop').click(function(){
		//ytplayer.stopVideo();
		ytplayer.pauseVideo();
	});
	$('#replay').click(function(){
		ytplayer.stopVideo();
		ytplayer.seekTo(0);
		ytplayer.playVideo();
	});
	rec_mode = 2;
	start_view();
}

$(document).ready(function(ev) {
	// rec_mode = 0
	$('#score_form').fadeOut(0);
	rec_mode = 1;
	loading_view();
	// canvas
});
function loading_view() {
	// rec_mode = 1
	canvas = document.getElementById("play_field");
	ctx = canvas.getContext("2d");
	ctx.beginPath();
	ctx.clearRect(0, 0, PLAY_FIELD_WIDTH, PLAY_FIELD_HEIGHT);
	//ctx.font = "20px '富士ポップＰ' 'ＭＳ Ｐゴシック'";
	ctx.font = "bold "+"22px"+font_1;
	ctx.fillStyle = "white";
	if (get_lang() == 'ja') {
		ctx.fillText('動画を読み込んでいます。。', 6, 120);
	} else {
		ctx.fillText('Loading video...', 16, 120);
	}
	ctx.fill();
//	var loading_text = true;
//	var id = setInterval(function() {
//		if (view_mode != 1) {
//			clearInterval(id);
//			//start_view();
//		} else if (loading_text) {
//			ctx.clearRect(0, 0, PLAY_FIELD_WIDTH, PLAY_FIELD_HEIGHT);
//			ctx.font = "bold "+ "22px '富士ポップＰ' 'ＭＳ Ｐゴシック'";
//			ctx.fillStyle = "white";
//			ctx.fillText("動画を読み込んでいます。。。", 10, 120);
//			ctx.fill();
//			//console.log(ctx);
//			loading_text = false;
//		} else if (!loading_text) {
//			ctx.clearRect(0, 0, PLAY_FIELD_WIDTH, PLAY_FIELD_HEIGHT);
//			loading_text = true;
//		}
//	}, 1000);
}

function start_view() {
	// rec_mode = 2
	canvas = document.getElementById("play_field");
	ctx = canvas.getContext("2d");
	ctx.beginPath();
	ctx.clearRect(0, 0, PLAY_FIELD_WIDTH, PLAY_FIELD_HEIGHT);
	ctx.font = "bold "+ "22px"+font_1;
	ctx.fillStyle = "white";
	if (get_lang() == 'ja') {
		ctx.fillText("SPACEキーでPLAY開始！", 10, 120);
	} else {
		ctx.fillText("Press Space to begin", 10, 120);
		ctx.fillText("playing!", 10, 150);
	}
	ctx.fill();
	view_mode = 3;
}


// ///////////////////////////////////////ゲーム本体
$(document).ready(function(e) {
	var WIDTH = 280;
	var HEIGHT = 500;
	var SIDE_WIDTH = 410;
	var SIDE_HEIGHT = 250;
	//var score = 0;
	var hits = 0;
	var life = 75;
	var f_b = [ false, false, false, false ];
	var time = 0;
	var etime = 0;
	var maxCombo = 0;
	var title = "";
	var nodeset = [];
	var nodes = [];
	var hiteff = [ 0, 0, 0, 0 ];
	var musicnum = 0;
	var k = 0;
	var musicnumMax = 3;
	var nanido = 0;
	var ftime = 0;
	var atime = 0;
	var ahantei = 0;
	var list = [];
	var kyes = [];
	var nlist = [];
	var elist = [];
	var hlist = [];
	var mSrc = "";
	var starttime = new Date();
	var yetstart = 0;
	var hightScore = new Array((musicnumMax + 1) * 3);
	var clearFlag = new Array((musicnumMax + 1) * 3);
	var lankSet = new Array((musicnumMax + 1) * 3);
	var mgcg = [ 0, 0, 0, 0 ];
	var key_flag = [true, true, true, true];
	var score = 0;
	var canvas = document.getElementById("play_field");
	var ctx = canvas.getContext("2d");
	var canvas = document.getElementById("side_field");
	var ctx2 = canvas.getContext("2d");
	// ///////////////////////////////////////オブジェクト関係
	var Node = function() {
		var rand = 3;
		if (keys[0] == 37) {
			rand = 1;
		} else if (keys[0] == 38) {
			rand = 2;
		} else if (keys[0] == 39) {
			rand = 4;
		} else {
			rand = 3;
		}
		keys.splice(0, 1);
		var createTime = new Date();
		this.x = 48 * rand;
		this.y = 0;
		this.tim = 0;
		this.now = function(c) {
			var nowTime = new Date();
			this.tim = (nowTime.getTime() - c);
		}
		this.move = function() {
			this.now(createTime.getTime());
			//落下速度
			if (get_otoge_speed() == 1) {
				this.y = 520.0-(520 * (1 - this.tim / 3500));
			} else if (get_otoge_speed() == 2) {
				this.y = 520.0-(520 * (1 - this.tim / 2500));
			} else if (get_otoge_speed() == 3) {
				this.y = 520.0-(520 * (1 - this.tim / 1500));
			} else if (get_otoge_speed() == 4) {
				this.y = 520.0-(520 * (1 - this.tim / 1000));
			}
			if (426 < this.y) {
				atime = 1;
				if (get_otoge_id() == 2 || get_otoge_id() == 669) {

// ----------------------------------------------------------------
// ズル
					var hantei = 2 + Math.round(Math.random()); // goodまたはcool扱い
					mgcg[hantei] ++;
					hits += 1;
					ahantei = hantei;
					combo += 1;
					onComboUpdated();
/*
					if (life < 100)
						life += lifepoint;
					// nodes.splice(n, 1);
					// n--;

					if (maxCombo < combo) {
						maxCombo = combo;
					}
					score += scorepoint * (1 + Math.floor(combo / 20));
					if (score > hightScore[musicnum * 3])
						hightScore[musicnum * 3] = score;
*/
// ----------------------------------------------------------------

				} else {
					ahantei = 0;
					life -= 6;
					mgcg[0]++;
					console.log("miss" + mgcg[0]);
					combo = 0;
					onComboUpdated();
					if (life < 0)
						life = 0;
				}
				return false;
			}

			return true;
		}
		this.num = rand;
		this.draw = function(ctx) {
			yajirusi(this.x, this.y, ctx, this.num, 0);
		}
	}

	var moveObjs = function(objs) {
		for ( var n = 0; n < objs.length; n++) {
			if (!objs[n].move()) {
				objs.splice(n, 1);
				n--;
			}
		}
	}
	var move = function() {
		moveObjs(nodes);
	}

	var drawObjs = function(objs, ctx) {
		for ( var n = 0; n < objs.length; n++) {
			objs[n].draw(ctx, 4);
		}
	}
	// 描写feild
	var draw = function(ctx) {
		ctx.beginPath();
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		field();
		drawObjs(nodes, ctx);
		ataridraw();
		for ( var i = 0; i < 4; i++) {
			if (hiteff[i]) {
				hiteffect(i);
			}
		}
	}
	
	// 描写side
	var draw2 = function(ctx) {
		ctx.beginPath();
		ctx.clearRect(0, 0, SIDE_WIDTH, SIDE_HEIGHT);
		field();
		lifeDraw();
	}
	// //////////////////////////////////////////操作関係
	// キー入力
	$('html').keydown(function(ke) {
		var code = ke.keyCode;

// ----------------------------------------------------------------
// Escキー
		if (code == 27) {
			console.log("current time", otoge_current_time);
		}
// ----------------------------------------------------------------

		check_not_helf_char(code);
		if (yetstart == 5 && view_mode == 3) {
			yetstart = 0;
		} else {
			if ((code == 39 || code == 76) && view_mode == 3 && key_flag[0]) {
				if (yetstart == 1) {
					key_flag[0]= false;
					atari(4);
					f_b[3] = true;
				}
			}
			if ((code == 38 || code == 73) && view_mode == 3 && key_flag[1]) {
				
				if (yetstart == 1) {
					key_flag[1]= false;
					if (get_arrow_type() != 2) {
						atari(2);
					} else {
						atari(3);
					}
					f_b[1] = true;
				}
			}
			if ((code == 37 || code == 74) && view_mode == 3 && key_flag[2]) {
				if (yetstart == 1) {
					key_flag[2]= false;
					atari(1);
					f_b[0] = true;
				}
			}
			if ((code == 40 || code == 75) && view_mode == 3 && key_flag[3]) {
				if (yetstart == 1) {
					key_flag[3]= false;
					if (get_arrow_type() != 2) {
						atari(3);
					} else {
						atari(2);
					}
					f_b[2] = true;
				}
			}
			if (code == 32 && view_mode == 3) {
				if (yetstart == 0) {
					yetstart = 1;
					start();
				}
			}
		}
	});
	// 離したら
	$('html').keyup(function(ev) {
		var code = ev.keyCode;
		if ((code == 39 || code == 76) && view_mode == 3) {
			if (yetstart == 1 && !key_flag[0]) {
				key_flag[0]= true;
			}
		}
		if ((code == 38 || code == 73) && view_mode == 3 && !key_flag[1]) {
			if (yetstart == 1) {
				key_flag[1]= true;
			}
		}
		if ((code == 37 || code == 74) && view_mode == 3 && !key_flag[2]) {
			if (yetstart == 1) {
				key_flag[2]= true;
			}
		}
		if ((code == 40 || code == 75) && view_mode == 3 && !key_flag[3]) {
			if (yetstart == 1) {
				key_flag[3]= true;
			}
		}
		f_b = [ 0, 0, 0, 0 ];
	});
	// ////////////////////////////////////////////////個々の描写
	// 矢印
	function yajirusi(x, y, ctx, i, c) {
		ctx.lineWidth = 4;
		if (i == 1) {
			ctx.save();
			ctx.beginPath();
			ctx.translate(x, y);
			ctx.font = "bold "+ "41px"+font_3;
			ctx.fillText('←', -3, 41);
			ctx.arc(17, 26, 23, 0, Math.PI*2, false);
			ctx.strokeStyle = "#F7F760";
			if (c == 0) {
				ctx.stroke();
			} else if (c == 1) {
				ctx.fillStyle = "#CCCCCC";
				ctx.fill();
			}  else if (c == 2) {
				ctx.fillStyle = "#F7F760";
				ctx.globalAlpha = 0.7;
				if (combo < 100) {
					ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				} else {
					ctx.arc(17, 26, 59, 0, Math.PI*2, false);
				}
				ctx.fill();
			}
			ctx.restore();
			
		} else if (i == 2) {
			ctx.save();
			ctx.beginPath();
			ctx.translate(x, y);
			ctx.font = "bold "+ "41px"+font_3;
			if (get_arrow_type() != 2) {
				ctx.fillText('↑', -3, 41);
			} else {
				ctx.fillText('↓', -3, 41);
			}
			ctx.arc(17, 26, 23, 0, Math.PI*2, false);
			if (get_arrow_type() != 2) {
				ctx.strokeStyle = "pink";
			} else {
				ctx.strokeStyle = "#2DFF32";
			}
			if (c == 0) {
				ctx.stroke();
			} else if (c == 1) {
				ctx.fillStyle = "#CCCCCC";
				ctx.fill();
			} else if (c == 2) {
				if (get_arrow_type() != 2) {
					ctx.fillStyle = "pink";
				} else {
					ctx.fillStyle = "#2DFF32";
				}
				ctx.globalAlpha = 0.7;
				//ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				if (combo < 100) {
					ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				} else {
					ctx.arc(17, 26, 59, 0, Math.PI*2, false);
				}
				ctx.fill();
			}
			ctx.restore();
		} else if (i == 3) {
			ctx.save();
			ctx.beginPath();
			ctx.translate(x, y);
			ctx.font = "bold "+ "41px"+font_3;
			if (get_arrow_type() != 2) {
				ctx.fillText('↓', -3, 41);
			} else {
				ctx.fillText('↑', -3, 41);
			}
			ctx.arc(17, 26, 23, 0, Math.PI*2, false);
			if (get_arrow_type() != 2) {
				ctx.strokeStyle = "#2DFF32";
			} else {
				ctx.strokeStyle = "pink";
			}
			if (c == 0) {
				ctx.stroke();
			} else if (c == 1) {
				ctx.fillStyle = "#CCCCCC";
				ctx.fill();
			}  else if (c == 2) {
				if (get_arrow_type() != 2) {
					ctx.fillStyle = "#2DFF32";
				} else {
					ctx.fillStyle = "pink";
				}
				ctx.globalAlpha = 0.7;
				//ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				if (combo < 100) {
					ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				} else {
					ctx.arc(17, 26, 59, 0, Math.PI*2, false);
				}
				ctx.fill();
			}
			ctx.restore();
		} else if (i == 4) {
			ctx.save();
			ctx.beginPath();
			ctx.translate(x, y);
			ctx.font = "bold "+ "41px"+font_3;
			ctx.fillText('→', -3, 41);
			ctx.arc(17, 26, 23, 0, Math.PI*2, false);
			ctx.strokeStyle = 'orange';
			if (c == 0) {
				ctx.stroke();
			} else if (c == 1) {
				ctx.fillStyle = "#CCCCCC";
				ctx.fill();
			}  else if (c == 2) {
				ctx.fillStyle = 'orange';
				ctx.globalAlpha = 0.7;
				//ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				if (combo < 100) {
					ctx.arc(17, 26, 46, 0, Math.PI*2, false);
				} else {
					ctx.arc(17, 26, 59, 0, Math.PI*2, false);
				}
				ctx.fill();
			}
			ctx.restore();
		}
	}
	// 背景
	function field() {
		var polarCanvas = document.getElementById("side_field");
		var ctx2 = polarCanvas.getContext("2d");
		ctx2.beginPath();
/*		ctx2.font = "20px"+font_4; */
		ctx2.fillStyle = "white";
		ctx2.font = "bold "+ "29px"+font_1;
		ctx2.fillText(get_otoge_name(), 20, 65);
		ctx2.font = "bold "+ "23px"+font_1;
		if (get_lang() == 'ja') {
			ctx2.fillText("速度 : "+otoge_speed_text[get_otoge_speed()], 20, 95);
		} else {
			ctx2.fillText("Speed : "+otoge_speed_text[get_otoge_speed()], 20, 95);
		}
		ctx2.font = "23px"+font_4;
		ctx2.fillText("Max Combo : " + maxCombo, 20, 159);
		
		ctx2.fillText("Score : " + score, 20, 220);
		ctx2.fillText("Hight Score : " + get_max_score(), 20,
				190);
		ctx2.stroke();
		
		// 当たり矢印
		ctx.fillStyle = "#FFFFFF";
		if (get_arrow_type() != 2) {
			if (f_b[0]) {
				yajirusi(48, 410, ctx, 1, 1);
			}
			if (f_b[1]) {
				yajirusi(48 * 2, 410, ctx, 2, 1);
			}
			if (f_b[2]) {
				yajirusi(48 * 3, 410, ctx, 3, 1);
			}
			if (f_b[3]) {
				yajirusi(48 * 4, 410, ctx, 4, 1);
			}
			yajirusi(48, 410, ctx, 1, 0);
			yajirusi(48 * 2, 410, ctx, 2, 0);
			yajirusi(48 * 3, 410, ctx, 3, 0);
			yajirusi(48 * 4, 410, ctx, 4, 0);
		} else {
			if (f_b[0]) {
				yajirusi(48, 410, ctx, 1, 1);
			}
			if (f_b[1]) {
				yajirusi(48 * 3, 410, ctx, 2, 1);
			}
			if (f_b[2]) {
				yajirusi(48 * 2, 410, ctx, 3, 1);
			}
			if (f_b[3]) {
				yajirusi(48 * 4, 410, ctx, 4, 1);
			}
			yajirusi(48, 410, ctx, 1, 0);
			yajirusi(48 * 2, 410, ctx, 2, 0);
			yajirusi(48 * 3, 410, ctx, 3, 0);
			yajirusi(48 * 4, 410, ctx, 4, 0);
		}
	}
	function hiteffect(k) {
		if ((etime > 0) && (etime < 10)) {
			var canvas = document.getElementById("play_field");
			var ctx = canvas.getContext("2d");

			yajirusi(48 * (k + 1), 410, ctx, k + 1, 2);
			etime++;
		} else {
			etime = 0;
			hiteff[k] = 0;
		}
	}
	// ライフゲージ描写
	function lifeDraw() {
		var lifeCanvas = document.getElementById("side_field");
		var lifectx = lifeCanvas.getContext("2d");
		lifectx.beginPath();
		lifectx.fillStyle = '#FF92B6';
		lifectx.fillRect(37, 8, life * 2, 25);
		lifectx.fill();
	}


	// clear&gameover
	function clear_over(i) {
		onFinish();

//		ytplayer.seekTo(0);
		ytplayer.stopVideo();
		if (get_user_auth() == true) {
			ajax_auth_after_play(get_otoge_id(), get_login_user_id(), score, get_base_url(), get_token_ajax());
			// TODO: まとめる？
//			update_user_play_count(get_login_user_id(), get_base_url(), get_token_ajax());
//			insert_recent_played(get_login_user_id(), get_otoge_id(), get_base_url(), get_token_ajax());
//			update_user_total_score(get_login_user_id(), score, get_base_url(), get_token_ajax());
//			update_play_count(get_otoge_id(), get_base_url(), get_token_ajax());
		} else {
			// UserId:106がNot Login用
			ajax_not_auth_after_play(get_otoge_id(), 106, get_base_url(), get_token_ajax());
//			insert_recent_played(106, get_otoge_id(), get_base_url(), get_token_ajax());
//			update_play_count(get_otoge_id(), get_base_url(), get_token_ajax());
		}
		var clearCanvas = document.getElementById("play_field");
		var clear = clearCanvas.getContext("2d");
		clear.beginPath();
		clear.clearRect(0, 0, WIDTH, HEIGHT);
		clear.font = "23px"+font_4;
		clear.fillStyle = "white";
		clear.fill();
		clear.beginPath();
		clear.fillStyle = "white";
		clear.fillText("Score : " + score, 66, 250 - 80);
		clear.fillText("Great : " + mgcg[1], 66, 280 - 80);
		clear.fillText("Cool : " + mgcg[2], 66, 310 - 80);
		clear.fillText("Good : " + mgcg[3], 66, 340 - 80);
		clear.fillText("Miss : " + mgcg[0], 66, 370 - 80);
		clear.fill();
		lank(
				(hits / (list.length + mgcg[0] + mgcg[1] + mgcg[2] + mgcg[3])) * 100,
				100, 110);
		if (i == 3)
			clearFlag[musicnum * 3] = 1;
		if (hightScore[musicnum * 3] < score)
			hightScore[musicnum * 3] = score;
		
		// score登録フォーム(ユーザがログインしている時のみ)
		if (((score > get_min_score()) && get_count10() == false && get_user_auth() == true)
			|| (get_count10() == true && get_user_auth() == true)) {
			//$('#otoge_score').attr('value', score);
			// Teiwtter投稿用のリンクを埋め込む
			var post_score = score;
//			$('#score_form').fadeIn();
			var pop_text_score;
			var pop_text_again;
			if (get_lang() == 'ja') {
				if ($('#twitter_link').size() == 0) {
					$('#finish_dialog').append('<a href="" target="_blank" id="twitter_link" title="ツイートした後に下のボタンからotoge.netにもスコアを投稿してください。2度手間ですが、そうしないとランキングに反映されません。">スコアをTwitterにつぶやく</a>');
					laquu('#twitter_link').tooltip({
						distX: -100,
						distY: 129
					});
				}
				$('#twitter_link').attr('href','https://twitter.com/share?url=http://otoge.net/otoge_detail/'+get_otoge_id()+'&text=スコア'+post_score+'点 '+get_otoge_full_name()+' %23otoge %23otoge_'+get_otoge_id())
								  .addClass('twitter_button');
				$('#finish_dialog').dialog({
					bgiframe: true,
					autoOpen: true,
					width: 239,
					modal: false,
					//position: [10, 70 ],
					position: 'center',
					buttons:{
						'スコアを投稿する':function(e) {
							// TODO: POST
							//location.href = get_base_url()+'/otoge_delete/'+otoge_id;
							var form = document.createElement('form');
							document.body.appendChild(form);
							var input = document.createElement('input');
							input.setAttribute('type','hidden');
							input.setAttribute('name','otoge_score');
							input.setAttribute('value', post_score);
							var input2 = document.createElement('input');
							input2.setAttribute('type','hidden');
							input2.setAttribute('name','_token_score');
							input2.setAttribute('value', get_token_score());
							form.appendChild(input);
							form.appendChild(input2);
							form.setAttribute('action',get_base_url()+'/otoge_play_youtube/'+get_otoge_id());
							form.setAttribute('method','post');
							form.submit();
						},
						'もう一度プレイする':function(v) {
							// play_count_ajax
							//update_play_count(get_otoge_id());
							$(this).dialog('close');
							play_again();
						}
					}	
				});
			} else {
				if ($('#twitter_link').size() == 0) {
					$('#finish_dialog').append('<a href="" target="_blank" id="twitter_link" title="After making the tweet, please submit the score with the button below to otoge.net, too. It may be twice the work, but without that it will not be reflected in the ranking.">Post score to Twitter</a>');
					laquu('#twitter_link').tooltip({
						distX: -100,
						distY: 129
					});
				}
				$('#twitter_link').attr('href','https://twitter.com/share?url=http://otoge.net/otoge_detail/'+get_otoge_id()+'&text=Score:'+post_score+' '+get_otoge_full_name()+' %23otoge %23otoge_'+get_otoge_id())
								  .addClass('twitter_button');
				pop_text_score = 'Submit score';
				pop_text_again = 'Play again';
				$('#finish_dialog').dialog({
					bgiframe: true,
					autoOpen: true,
					width: 200,
					modal: false,
					//position: [10, 70 ],
					position: 'center',
					buttons:{
						'Submit score':function(e) {
							// TODO: POST
							//location.href = get_base_url()+'/otoge_delete/'+otoge_id;
							var form = document.createElement('form');
							document.body.appendChild(form);
							var input = document.createElement('input');
							input.setAttribute('type','hidden');
							input.setAttribute('name','otoge_score');
							input.setAttribute('value', post_score);
							var input2 = document.createElement('input');
							input2.setAttribute('type','hidden');
							input2.setAttribute('name','_token_score');
							input2.setAttribute('value', get_token_score());
							form.appendChild(input);
							form.appendChild(input2);
							form.setAttribute('action',get_base_url()+'/otoge_play_youtube/'+get_otoge_id());
							form.setAttribute('method','post');
							form.submit();
						},
						'Play again':function(v) {
							// play_count_ajax
							//update_play_count(get_otoge_id());
							$(this).dialog('close');
							play_again();
						}
					}	
				});
			}
		} else {
			var post_score = score;
			if (get_lang() == 'ja') {
				if ($('#twitter_link').size() == 0) {
					$('#finish_dialog').append('<a href="" target="_blank" id="twitter_link">スコアをTwitterにつぶやく</a>');
				}
				$('#twitter_link').attr('href','https://twitter.com/share?url=http://otoge.net/otoge_detail/'+get_otoge_id()+'&text=スコア'+post_score+'点 '+get_otoge_full_name()+' %23otoge %23otoge_'+get_otoge_id())
								  .addClass('twitter_button');
				$('#finish_dialog').dialog({
					bgiframe: true,
					autoOpen: true,
					width: 239,
					modal: false,
					//position: [10, 70 ],
					position: 'center',
					buttons:{
						'もう一度プレイする':function(v) {
							//update_play_count(get_otoge_id());
							$(this).dialog('close');
							play_again();
						}
					}	
				});
			} else {
				if ($('#twitter_link').size() == 0) {
					$('#finish_dialog').append('<a href="" target="_blank" id="twitter_link" >Post score to Twitter</a>');
				}
				$('#twitter_link').attr('href','https://twitter.com/share?url=http://otoge.net/otoge_detail/'+get_otoge_id()+'&text=Score:'+post_score+' '+get_otoge_full_name()+' %23otoge %23otoge_'+get_otoge_id())
								  .addClass('twitter_button');
				$('#finish_dialog').dialog({
					bgiframe: true,
					autoOpen: true,
					width: 200,
					modal: false,
					//position: [10, 70 ],
					position: 'center',
					buttons:{
						'Play again':function(v) {
							//update_play_count(get_otoge_id());
							$(this).dialog('close');
							play_again();
						}
					}	
				});
			}
		}
//		$('#play_again').click(function(ev) {
//			play_again();
//			$('#score_form').fadeOut();
//		});
	}
	
	function play_again() {
		// TODO: 最初の画面を表示
		$('#play_again').unbind('click');
		view_mode = 3;
		yetstart = 1;
		start();
		
	}
	
	// lank表示
	function lank(par, x, y) {
		ctx.lineWidth = 15;
		ctx.font = "bold "+ "70px"+font_2;
		if (par >= 90) {
			ctx.fillStyle = "red";
			ctx.fillText("A", x, y);
		} else if (par >= 80) {
			ctx.fillStyle = "orange";
			ctx.fillText("B", x, y);
		} else if (par >= 70) {
			ctx.fillStyle = "yellow";
			ctx.fillText("C", x, y);
		} else if (par >= 60) {
			ctx.fillStyle = "blue";
			ctx.fillText("D", x, y);
		} else if (par >= 50) {
			ctx.fillStyle = "purple";
			ctx.fillText("E", x, y);
		} else if (par >= 0) {
			ctx.fillStyle = "gray";
			ctx.fillText("F", x, y);
		}
		if (lankSet[musicnum * 3] < par)
			lankSet[musicnum * 3] = par;
	}
	// ///goodとかbadとかcombotoka
	function ataridraw() {
		var canvas = document.getElementById("play_field");
		var ctx = canvas.getContext("2d");
		if ((atime > 0) && (atime < 50)) {
			ctx.beginPath();
			ctx.font = "60px"+font_2;
			if (ahantei == 0) {
				ctx.fillStyle = "purple";
				ctx.fillText("MISS!", 5, 250);
			} else if (ahantei == 1) {
				ctx.fillStyle = "#FFA400";
				ctx.fillText("GREAT!", 5, 250);
			} else if (ahantei == 2) {
				ctx.fillStyle = "white";
				ctx.fillText("COOL!", 5, 250);
			} else if (ahantei == 3) {
				ctx.fillStyle = "#B3F0B6";
				ctx.fillText("GOOD!", 5, 250);
			}
			if (combo > 0) {
				var scombo = String(combo);
				ctx.font = "35px"+font_1;
				for ( var i = 0; i < scombo.length; i++) {
					ctx.fillStyle = "red";
					ctx.fillText(parseInt(scombo[scombo.length - i - 1]), 100 - 35 * i, 315);
				}
				ctx.font = "35px"+font_2;
				ctx.fillStyle = "yellow";
				ctx.fillText("COMBO!", 130, 315);
			}
			ctx.fill();
			atime += 1;
		} else {
			atime = 0;
		}
	}
	// //////////////////////////////////////////////////処理関係
	
	// 得点やらライフやら
	function score_life(n, bas, scorepoint, lifepoint) {
		mgcg[bas]++;
		hits += 1;
		ahantei = bas;
		combo += 1;
		onComboUpdated();
		atime = 1;
		if (life < 100)
			life += lifepoint;
		nodes.splice(n, 1);
		n--;

		if (maxCombo < combo) {
			maxCombo = combo;
		}
		score += scorepoint * (1 + Math.floor(combo / 20));
		if (score > hightScore[musicnum * 3])
			hightScore[musicnum * 3] = score;

	}
	function atari(item) {
		for ( var n = 0; n < nodes.length; n++) {
/*			console.log(nodes[n].y); */
			if (nodes[n].num == item) {
				if (Math.floor(nodes[n].y) >= 400 && Math.floor(nodes[n].y) <= 415) {
					// great
					score_life(n, 1, 50, 2);
					hiteff[item - 1] = 1;
					etime = 1;
					break;
				} else if ((Math.floor(nodes[n].y) >= 396) && (Math.floor(nodes[n].y) <= 419)) {
					// cool
					score_life(n, 2, 30, 1);
					hiteff[item - 1] = 1;
					etime = 1;
					break;
				} else if ((Math.floor(nodes[n].y) >= 390) && (Math.floor(nodes[n].y) <= 425)) {
					// good
					score_life(n, 3, 10, 0);
					hiteff[item - 1] = 1;
					etime = 1;
					break;
				}
			}
		}
	}
	
	// ゲーム自体のstart
	function start() {
		loading_view();
		ytplayer.stopVideo();
		ytplayer.seekTo(0);
		ytplayer.playVideo();
		score = 0;
		maxCombo = 0;
		atime = 0;
		combo = 0;
		life = 84;
		mgcg = [ 0, 0, 0, 0 ];
		hits = 0
		nodes = [];
		var otoge_data = JSON.parse(get_otoge_data());
		list = otoge_data.interval;
		keys = otoge_data.key;
		ftime = otoge_data.finish+1;
		var start_flag = false;
		var otoge_start_date;
		var otoge_start_timesatmp;
		var otoge_current_date;
		otoge_current_time = 0;
		onStart();
		var start_id = setInterval(function() {
			if (ytplayer.getCurrentTime() > 0) {
				//start_flag = true;
				start_flag = true;
				clearInterval(start_id);
				otoge_start_date = new Date();
				otoge_start_timesatmp = otoge_start_date.getTime()+1000;
			}
		},1);
		count = true;
		ajust_p = 0;
		ajust_m = 0;
		ajust_p_sum = 0;
		ajust_m_sum = 0;
		ajust_flag = true;
		var id = setInterval(function() {
			if (start_flag) {
				otoge_current_date = new Date();
				otoge_current_time = (otoge_current_date.getTime() - otoge_start_timesatmp)/1000;
				onTimeUpdated();
				ajust_time = otoge_current_time - ytplayer.getCurrentTime();
//				if (ajust_flag) {
//					console.log(ajust_time);
//				}
				if (ajust_time > 0.10) {
					ajust_p++;
					ajust_p_sum += ajust_time*1000;
					if (ajust_p >= 8 && ajust_flag) {
						//otoge_start_timesatmp += 250;
//						console.log('!!'+ajust_p_sum/8);
						otoge_start_timesatmp += ajust_p_sum/8;
						//console.log('ajust+');
						ajust_flag = false;
					}
				} else {
					ajust_p = 0;
					ajust_p_sum = 0;
				}
				if (ajust_time < -0.10) {
					ajust_m++;
					ajust_m_sum += ajust_time*(-1000);
					if (ajust_m >= 8 && ajust_flag) {
						//otoge_start_timesatmp -= 250;
//						console.log('!!'+ajust_m_sum/8);
						otoge_start_timesatmp -= ajust_m_sum/8;
						//console.log('ajust-');
						ajust_flag = false;
					}
				} else {
					ajust_m = 0;
					ajust_m_sum = 0;
				}
//				if (ajust_time < -0.25) {
//					otoge_start_timesatmp += -360;
//					console.log('ajust');
//				}
//				if (count) {
//					console.log(otoge_start_timesatmp);
//					otoge_start_timesatmp = otoge_start_timesatmp + 1000;
//					count = false;
//				}
//				console.log(otoge_start_timesatmp);
//				console.log(otoge_current_time+':'+ytplayer.getCurrentTime());
				if (life == 0) {
					// gameover
					yetstart = 2;
					clear_over(yetstart);
					clearInterval(id);
				} else {
					//console.log(Math.floor(ytplayer.getCurrentTime()) +':'+ ftime);
					if (Math.floor(otoge_current_time) == ftime || ytplayer.getPlayerState() == 0) {
						// clear
						yetstart = 3;
						clear_over(yetstart);
						clearInterval(id);
					} else {
						// 0イカの値の時の対応（今のところは開始3秒程は押せないようにするとか）
						// 落下速度para3500 タイミング合わせpara2828 通常スピード?
						// 落下速度para2500 タイミング合わせpara2028 早めスピード?
						var fall_quick;
						if (get_otoge_speed() == 1) {
							fall_quick = 2828;
						} else if (get_otoge_speed() == 2) {
							fall_quick = 2028;
						} else if (get_otoge_speed() == 3) {
							fall_quick = 1328;
						} else if (get_otoge_speed() == 4) {
							fall_quick = 818;
						}
						//console.log((ytplayer.getCurrentTime()) +':'+ ((list[0]-fall_quick) / 1000));
						// console.log(otoge_current_time/1000);
						if ((otoge_current_time) >= (list[0]-fall_quick) / 1000) {
							nodes.push(new Node());
							list.splice(0, 1);
						}
						move();
						draw(ctx);
						draw2(ctx2);
					}
				}
			}
		}, 5);
	}
});