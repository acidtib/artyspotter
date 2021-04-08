jQuery(function() {
  
  $(".calculate").click(function() {
    const target_distance = parseFloat($(".input-target-distance").val())
    const target_azimuth = parseFloat($(".input-target-azimuth").val())

    const artillery_distance = parseFloat($(".input-artillery-distance").val())
    const artillery_azimuth = parseFloat($(".input-artillery-azimuth").val())

    let data = where_boom(target_distance, target_azimuth, artillery_distance, artillery_azimuth)

    if (data.hasOwnProperty("error")) {
      alert("please fill in the data")
    } else {
      $(".boom-distance").html(data.artillery_target_distance)
      $(".boom-azimuth").html(data.artillery_target_degrees)

      draw_trajectory(data.artillery_coordinate.x, data.artillery_coordinate.y, data.target_coordinate.x, data.target_coordinate.y, data.artillery_target_distance, data.artillery_target_degrees)

      $(".boom-location").show()

      $('html, body').animate({
        scrollTop: $('.boom-location').offset().top
      }, 100);

      $(".clear-buttons").show()
    }
  });


  $(".clear-all").click(function() {
    $("input").val("")

    $(".boom-location").hide()
    $(".clear-buttons").hide()
  });

  $(".clear-target").click(function() {
    $(".input-target-distance").val("")
    $(".input-target-azimuth").val("")

    $(".boom-location").hide()
    $(".clear-buttons-target").hide()
  });

});

function where_boom(target_distance, target_azimuth, artillery_distance, artillery_azimuth) {
  if (isNaN(target_distance) || isNaN(target_azimuth) || isNaN(artillery_distance) || isNaN(artillery_azimuth)) {
    return {error: true}
  }

  const target_coordinate = azimuth_to_cartesian(target_distance, target_azimuth)
  const artillery_coordinate = azimuth_to_cartesian(artillery_distance, artillery_azimuth)
  const artillery_coordinate_x = artillery_coordinate.x
  const artillery_coordinate_y = artillery_coordinate.y
  
  const re_target_coordinate = target_coordinate
  
  let translate_origin = get_translate_matrix(artillery_coordinate);
  apply_translate(target_coordinate, translate_origin);
  apply_translate(artillery_coordinate, translate_origin);

  const artillery_target_distance = Math.sqrt(Math.pow(artillery_coordinate.x - target_coordinate.x, 2) + Math.pow(artillery_coordinate.y - target_coordinate.y, 2));
  let artillery_target_degrees = 0;
  if (artillery_target_distance > 0) {
    artillery_target_degrees = to_degrees(Math.asin(Math.abs(target_coordinate.x) / artillery_target_distance));
  }

  if (target_coordinate.x < 0 && target_coordinate.y >= 0) {
    artillery_target_degrees = 360 - artillery_target_degrees;
  } else if (target_coordinate.x < 0 && target_coordinate.y < 0) {
    artillery_target_degrees = 180 + artillery_target_degrees;
  } else if (target_coordinate.x >= 0 && target_coordinate.y < 0) {
    artillery_target_degrees = 180 - artillery_target_degrees;
  }

  if (isNaN(artillery_target_distance) || isNaN(artillery_target_degrees)) {
    return {error: true};
  }

  return {
    artillery_target_distance: round_to(artillery_target_distance), 
    artillery_target_degrees: round_to(artillery_target_degrees),
    target_coordinate: re_target_coordinate,
    artillery_coordinate: {
      x: artillery_coordinate_x,
      y: artillery_coordinate_y
    }
  }
}

function azimuth_to_cartesian(distance, azimuth) {
  let polar_degrees = to_radians(azimuth_to_polar(azimuth));
  return {x: distance * Math.cos(polar_degrees), y: distance * Math.sin(polar_degrees)};
}

function to_radians(degrees) {
  return degrees * (Math.PI / 180);
}

function to_degrees(radians) {
  return radians * (180 / Math.PI);
}

function azimuth_to_polar(azimuth_degrees) {
  return (azimuth_degrees - 90) * -1;
}

function get_translate_matrix(coords) {
  return {x: -coords.x, y: -coords.y};
}

function apply_translate(coords, matrix) {
  coords.x += matrix.x;
  coords.y += matrix.y;
}

function round_to(value) {
  const ceil = Math.ceil(value / 5) * 5
  const floor = Math.floor(value / 5) * 5

  if (Math.abs(value - ceil) > Math.abs(value - floor)) {
    return floor;
  } else {
    return ceil;
  }
}

function draw_trajectory(artillery_distance, artillery_azimuth, target_distance, target_azimuth, artillery_target_distance, artillery_target_degrees) {
  $("#trajectory").empty()

  const width = 400, height = 400, padding = 40;
	let draw = SVG('trajectory').size(400, 400);
	draw.viewbox(0, 0, width, height);
	draw.rect(width-2, height-2).attr({ x: 1, y: 1, stroke: '#000', fill: '#fff', 'stroke-width': 0.5 });

	let spotter_art = draw.line(0, 0, 100, 150).stroke({ color: '#bbbbbb', width: 1, dasharray: '2,2' }).attr({display:'block'});
	let spotter_target = draw.line(0, 0, 100, 150).stroke({ color: '#bbbbbb', width: 1, dasharray: '2,2' }).attr({display:'block'});
	
  let art_target = draw.line(0, 0, 100, 150).stroke({ color: '#E77C48', width: 2 }).attr({display:'block'});
	let art_target_label = draw.text('Xm Yº').attr({x: 0, y: 0, display:'block'}).font({ fill: '#333', family: 'verdana', size: '10px' });
	
  let target_circle = draw.circle(9).fill('#50100D').center(10, 10).attr({display:'block'});
	
  let source_circle = draw.circle(9).fill('#1A2F4E').center(20, 20).attr({display:'block'});
	
  let spotter_circle = draw.circle(9).fill('#374F2F').center(30, 30).attr({display:'block'});
	
  let target_label = draw.text('Target').attr({ x: 24, y: 240, display:'block' }).font({ fill: '#333', family: 'verdana', size: '10px' });
	let art_label = draw.text('Artillery').attr({ x: 24, y: 260, display:'block' }).font({ fill: '#333', family: 'verdana', size: '10px' });
	let spot_label = draw.text('Spotter').attr({ x: 24, y: 280, display:'block' }).font({ fill: '#333', family: 'verdana', size: '10px' });
			
  let xspot = 0;
	let yspot = 0;
	let xt = target_distance;
	let yt = target_azimuth * -1;
	let xs = artillery_distance;
	let ys = artillery_azimuth * -1;

  const minx = Math.min(xspot, xs, xt);
	const miny = Math.min(yspot, ys, yt);
				
	const maxx = Math.max(xspot, xs, xt);
	const maxy = Math.max(yspot, ys, yt);
				
	const diff = Math.max((maxx-minx), (maxy-miny));
				
	const xcorrection = (width - 50 - 2 * padding) * ((diff-(maxx-minx)) / 2) / diff;
	const ycorrection = (height - 2 * padding) * ((diff-(maxy-miny)) / 2) / diff;
							
	xspot = ((width - 50 - 2 * padding) * (xspot - minx) / diff) + xcorrection;
	yspot = (height - 2 * padding) * (yspot - miny) / diff + ycorrection;
				
	xs = (width - 50 - 2 * padding) * (xs - minx) / diff + xcorrection;
	ys = (height - 2 * padding) * (ys - miny) / diff + ycorrection;
				
	xt = (width - 50 - 2 * padding) * (xt - minx) / diff + xcorrection;
	yt = (height - 2 * padding) * (yt - miny) / diff + ycorrection;

  spotter_circle.center(xspot + padding, yspot + padding);
  target_circle.center(xt + padding, yt + padding);
  source_circle.center(xs + padding, ys + padding);

  target_label.attr({x: xt + padding + 14, y: yt + padding + 2.5});
  art_label.attr({x: xs + padding + 14, y: ys + padding + 2.5});
  spot_label.attr({x: xspot + padding + 14, y: yspot + padding + 2.5});

  spotter_art.plot(xspot + padding, yspot + padding, xs + padding, ys + padding);
  spotter_target.plot(xspot + padding, yspot + padding, xt + padding, yt + padding);
  art_target.plot(xt + padding, yt + padding, xs + padding, ys + padding);
  
  art_target_label.attr({x: (xt + xs) / 2 + padding + 15, y: (yt + ys) / 2 + padding}).plain(Math.round(artillery_target_distance) + 'm ' + Math.round(artillery_target_degrees) + '°');
}

