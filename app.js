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

      $(".boom-location").show()

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

  let target_coordinate = azimuth_to_cartesian(target_distance, target_azimuth)
  let artillery_coordinate = azimuth_to_cartesian(artillery_distance, artillery_azimuth)

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

  return {artillery_target_distance: round_to(artillery_target_distance), artillery_target_degrees: round_to(artillery_target_degrees)};
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
